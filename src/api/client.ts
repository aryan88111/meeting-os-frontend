import { client } from './generated/client.gen';

/**
 * Configure default Hey API Fetch client instance.
 * Automatically injects authentication bearer token from localStorage.
 */
client.setConfig({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

// Configure auth interceptors
client.interceptors.request.use((request) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('meetingos_auth_token') : null;
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

export { client as apiClient };
export * from './generated';
