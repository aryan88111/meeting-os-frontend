import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

const swaggerPath = path.join(frontendRoot, 'src', 'api', 'swagger.json');
const generatedDir = path.join(frontendRoot, 'src', 'api', 'generated');
const generatedSdkPath = path.join(generatedDir, 'sdk.gen.ts');

const args = new Set(process.argv.slice(2));
const allowFallback = args.has('--allow-fallback') && process.env.OPENAPI_STRICT !== 'true';
const runGenerate = args.has('--run-generate');

const DEFAULT_BACKEND_URL = 'https://meeting-os-backend.onrender.com';

/**
 * Resolve OpenAPI JSON URL from build/runtime environment overrides.
 */
function resolveSpecUrl() {
  const explicitSpecUrl = (process.env.OPENAPI_SPEC_URL || '').trim();
  if (explicitSpecUrl) {
    return explicitSpecUrl;
  }

  const base = (process.env.VITE_API_URL || process.env.BACKEND_URL || DEFAULT_BACKEND_URL)
    .trim()
    .replace(/\/+$/, '');
  return `${base}/api/docs-json`;
}

/**
 * Fetch and validate OpenAPI spec with retries for Render cold starts.
 */
async function fetchOpenApiSpec(specUrl, maxAttempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[openapi-sync] Fetching OpenAPI spec (attempt ${attempt}/${maxAttempts}): ${specUrl}`);
      const res = await fetch(specUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(45_000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const rawText = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        throw new Error('Response body is not valid JSON (possible upstream HTML error/wake-up page)');
      }

      if ((!parsed.openapi && !parsed.swagger) || !parsed.paths || typeof parsed.paths !== 'object') {
        throw new Error('JSON response is missing required OpenAPI fields (openapi/swagger, paths)');
      }

      return parsed;
    } catch (err) {
      lastError = err;
      console.warn(`[openapi-sync] Attempt ${attempt} failed: ${err?.message || err}`);
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
    }
  }

  throw lastError;
}

/**
 * Resolve a local node_modules/.bin executable or fall back to npx.
 */
function runLocalBin(binName, binArgs, options = {}) {
  const exeName = process.platform === 'win32' ? `${binName}.cmd` : binName;
  const localBin = path.join(frontendRoot, 'node_modules', '.bin', exeName);

  return fs.existsSync(localBin)
    ? spawnSync(localBin, binArgs, { cwd: frontendRoot, stdio: 'inherit', ...options })
    : spawnSync('npx', ['--no-install', binName, ...binArgs], {
        cwd: frontendRoot,
        stdio: 'inherit',
        ...options,
      });
}

function generateClientSdk() {
  console.log('[openapi-sync] Generating TypeScript API client via openapi-ts...');
  const result = runLocalBin('openapi-ts', []);
  if (result.status !== 0) {
    throw new Error(`openapi-ts exited with status ${result.status ?? 'unknown'}`);
  }
}

function verifyTypeScriptCompiles() {
  console.log('[openapi-sync] Verifying TypeScript compatibility against generated SDK...');
  const result = runLocalBin('tsc', ['--noEmit'], { stdio: 'pipe' });
  return result.status === 0;
}

function createBackup() {
  if (!fs.existsSync(generatedSdkPath)) {
    return null;
  }
  const backupRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'meetingos-openapi-'));
  const backupGenDir = path.join(backupRoot, 'generated');
  fs.cpSync(generatedDir, backupGenDir, { recursive: true });
  const backupSwagger = path.join(backupRoot, 'swagger.json');
  if (fs.existsSync(swaggerPath)) {
    fs.copyFileSync(swaggerPath, backupSwagger);
  }
  return { backupRoot, backupGenDir, backupSwagger };
}

function restoreBackup(backup) {
  if (!backup) return;
  fs.rmSync(generatedDir, { recursive: true, force: true });
  fs.cpSync(backup.backupGenDir, generatedDir, { recursive: true });
  if (fs.existsSync(backup.backupSwagger)) {
    fs.copyFileSync(backup.backupSwagger, swaggerPath);
  }
}

async function main() {
  const specUrl = resolveSpecUrl();
  const backup = allowFallback && runGenerate ? createBackup() : null;

  try {
    const spec = await fetchOpenApiSpec(specUrl);
    const pathCount = Object.keys(spec.paths).length;
    fs.mkdirSync(path.dirname(swaggerPath), { recursive: true });

    const tmpPath = `${swaggerPath}.tmp`;
    fs.writeFileSync(tmpPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
    fs.renameSync(tmpPath, swaggerPath);

    console.log(`[openapi-sync] Saved OpenAPI spec (${pathCount} paths) to src/api/swagger.json`);

    if (runGenerate) {
      generateClientSdk();

      if (allowFallback && backup && !verifyTypeScriptCompiles()) {
        console.warn(
          `[openapi-sync] Warning: Remote OpenAPI spec (${pathCount} paths) is behind or incompatible with the current frontend code. Restoring committed src/api/generated/* so build can proceed. Redeploy backend to sync live API.`,
        );
        restoreBackup(backup);
      }
    }
  } catch (err) {
    if (allowFallback && fs.existsSync(generatedSdkPath)) {
      if (backup) {
        restoreBackup(backup);
      }
      console.warn(
        `[openapi-sync] Warning: Could not sync live OpenAPI spec (${err?.message || err}). Falling back to existing src/api/generated/* files.`,
      );
      process.exit(0);
    }

    console.error(`[openapi-sync] Fatal error: ${err?.message || err}`);
    process.exit(1);
  } finally {
    if (backup?.backupRoot) {
      fs.rmSync(backup.backupRoot, { recursive: true, force: true });
    }
  }
}

main();
