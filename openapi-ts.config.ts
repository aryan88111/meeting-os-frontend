import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './src/api/swagger.json',
  output: './src/api/generated',
  plugins: [
    '@hey-api/client-fetch',
    '@hey-api/typescript',
    '@hey-api/sdk',
  ],
});
