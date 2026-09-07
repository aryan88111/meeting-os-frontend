import { client } from './generated/client.gen';

/**
 * Resolve API base URL.
 * - In production: uses VITE_API_URL or defaults to backend server.
 * - In development: uses VITE_API_URL if explicitly set, otherwise defaults to ''
 *   so requests route seamlessly through Vite's dev server proxy to http://localhost:8000,
 *   avoiding CORS and port mismatch issues.
 */
const resolveBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.DEV) {
    return '';
  }
  return 'http://localhost:8000';
};

/**
 * Configure default Hey API Fetch client instance.
 * Automatically injects authentication bearer token from localStorage.
 */
client.setConfig({
  baseUrl: resolveBaseUrl(),
});

// Configure auth interceptors
client.interceptors.request.use((request) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('meetingos_auth_token') : null;
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

export { client as apiClient, resolveBaseUrl };
export * from './generated';

