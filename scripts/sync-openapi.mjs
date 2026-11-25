import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

const swaggerPath = path.join(frontendRoot, 'src', 'api', 'swagger.json');
const generatedSdkPath = path.join(frontendRoot, 'src', 'api', 'generated', 'sdk.gen.ts');

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
 * Execute local @hey-api/openapi-ts binary against src/api/swagger.json.
 */
function generateClientSdk() {
  console.log('[openapi-sync] Generating TypeScript API client via openapi-ts...');
  const binName = process.platform === 'win32' ? 'openapi-ts.cmd' : 'openapi-ts';
  const localBin = path.join(frontendRoot, 'node_modules', '.bin', binName);

  const result = fs.existsSync(localBin)
    ? spawnSync(localBin, [], { cwd: frontendRoot, stdio: 'inherit' })
    : spawnSync('npx', ['--no-install', 'openapi-ts'], { cwd: frontendRoot, stdio: 'inherit' });

  if (result.status !== 0) {
    throw new Error(`openapi-ts exited with status ${result.status ?? 'unknown'}`);
  }
}

async function main() {
  const specUrl = resolveSpecUrl();

  try {
    const spec = await fetchOpenApiSpec(specUrl);
    fs.mkdirSync(path.dirname(swaggerPath), { recursive: true });

    const tmpPath = `${swaggerPath}.tmp`;
    fs.writeFileSync(tmpPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
    fs.renameSync(tmpPath, swaggerPath);

    console.log(
      `[openapi-sync] Saved OpenAPI spec (${Object.keys(spec.paths).length} paths) to src/api/swagger.json`,
    );

    if (runGenerate) {
      generateClientSdk();
    }
  } catch (err) {
    if (allowFallback && fs.existsSync(generatedSdkPath)) {
      console.warn(
        `[openapi-sync] Warning: Could not sync live OpenAPI spec (${err?.message || err}). Falling back to existing src/api/generated/* files.`,
      );
      process.exit(0);
    }

    console.error(`[openapi-sync] Fatal error: ${err?.message || err}`);
    process.exit(1);
  }
}

main();
