import { client } from './generated/client.gen';

/**
 * Resolve API base URL.
 * - Uses VITE_API_URL if explicitly configured (normalized without trailing slash).
 * - Otherwise returns '' so both Vite dev proxy and Nginx production reverse proxy
 *   route `/api/...` cleanly via same-origin without CORS issues.
 */
const resolveBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  return '';
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

// Microsoft Teams & Graph API Endpoints
export const integrationsControllerSyncMicrosoftCalendar = async () => {
  return client.post({ url: '/api/v1/integrations/microsoft/sync' });
};

export const integrationsControllerSyncMicrosoftTeamsTranscript = async (data: { path: { meetingId: string } }) => {
  return client.post({ url: `/api/v1/integrations/microsoft/sync-transcript/${data.path.meetingId}` });
};

export const integrationsControllerScanRecentMicrosoftTranscripts = async () => {
  return client.post({ url: '/api/v1/integrations/microsoft/scan-transcripts' });
};

