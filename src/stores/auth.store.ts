import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import {
  authControllerLogin,
  authControllerRegister,
  authControllerSyncSupabaseSession,
  authControllerGetMe,
  authControllerLogout,
} from '@/api';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
}

export interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface AuthState {
  user: UserProfile | null;
  currentOrganization: OrganizationInfo | null;
  organizations: OrganizationInfo[];
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, organizationName?: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'github' | 'azure') => Promise<void>;
  syncSupabaseSession: (
    accessToken: string,
    email?: string,
    name?: string,
    providerToken?: string,
    providerRefreshToken?: string,
    provider?: string,
  ) => Promise<void>;
  fetchProfile: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export function normalizeAuthError(err: any): string {
  if (!err) return 'An unexpected error occurred';

  const message = typeof err === 'string' ? err : err.message || '';
  const isNetworkFailure =
    err.name === 'TypeError' ||
    message.includes('NetworkError') ||
    message.includes('Failed to fetch') ||
    message.includes('fetch failed') ||
    message.includes('Network request failed') ||
    message.includes('ERR_CONNECTION_REFUSED');

  if (isNetworkFailure) {
    return 'Unable to connect to the MeetingOS API server. Please check your network connection or verify that the backend server is running on port 8000.';
  }

  return message || 'An unexpected error occurred';
}

const TOKEN_KEY = 'meetingos_auth_token';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  currentOrganization: null,
  organizations: [],
  token: typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  isAuthenticated: !!(typeof window !== 'undefined' && localStorage.getItem(TOKEN_KEY)),
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authControllerLogin({
        body: { email, password },
      });

      if (response.error) {
        const errData = response.error as any;
        throw new Error(errData?.message || 'Failed to sign in. Please check your credentials.');
      }

      const data = response.data as any;
      if (!data?.token) {
        throw new Error('No authentication token returned by the server.');
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      set({
        token: data.token,
        user: data.user,
        currentOrganization: data.currentOrganization,
        organizations: data.organizations || (data.currentOrganization ? [data.currentOrganization] : []),
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const friendlyMessage = normalizeAuthError(err);
      set({ error: friendlyMessage, isLoading: false });
      throw new Error(friendlyMessage);
    }
  },

  register: async (name: string, email: string, password: string, organizationName?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authControllerRegister({
        body: { name, email, password, organizationName },
      });

      if (response.error) {
        const errData = response.error as any;
        throw new Error(errData?.message || 'Registration failed. Please try again.');
      }

      const data = response.data as any;
      if (!data?.token) {
        throw new Error('No authentication token returned by the server.');
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      set({
        token: data.token,
        user: data.user,
        currentOrganization: data.currentOrganization,
        organizations: data.currentOrganization ? [data.currentOrganization] : [],
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const friendlyMessage = normalizeAuthError(err);
      set({ error: friendlyMessage, isLoading: false });
      throw new Error(friendlyMessage);
    }
  },

  loginWithOAuth: async (provider: 'google' | 'github' | 'azure') => {
    set({ isLoading: true, error: null });
    try {
      const redirectUrl = `${window.location.origin}/oauth/callback`;
      const scopes =
        provider === 'google'
          ? 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          scopes,
          queryParams:
            provider === 'google'
              ? {
                  access_type: 'offline',
                  prompt: 'consent',
                }
              : undefined,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      const friendlyMessage = normalizeAuthError(err);
      set({ error: friendlyMessage, isLoading: false });
      throw new Error(friendlyMessage);
    }
  },

  syncSupabaseSession: async (
    accessToken: string,
    email?: string,
    name?: string,
    providerToken?: string,
    providerRefreshToken?: string,
    provider?: string,
  ) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authControllerSyncSupabaseSession({
        body: {
          accessToken,
          email,
          name,
          providerToken,
          providerRefreshToken,
          provider,
        },
      });

      if (response.error) {
        const errData = response.error as any;
        throw new Error(errData?.message || 'Failed to sync Supabase authentication session');
      }

      const data = response.data as any;
      if (!data?.token) {
        throw new Error('Invalid response from session synchronization endpoint.');
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      set({
        token: data.token,
        user: data.user,
        currentOrganization: data.currentOrganization,
        organizations: data.organizations || (data.currentOrganization ? [data.currentOrganization] : []),
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const friendlyMessage = normalizeAuthError(err);
      set({ error: friendlyMessage, isLoading: false });
      throw new Error(friendlyMessage);
    }
  },

  fetchProfile: async () => {
    const token = get().token || localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      const response = await authControllerGetMe();

      if (response.error) {
        const res = response.response as Response;
        if (res && res.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          set({ token: null, user: null, isAuthenticated: false });
        }
        return;
      }

      const data = response.data as any;
      if (data) {
        set({
          user: { id: data.id, email: data.email, name: data.name },
          organizations: data.organizations || [],
          currentOrganization: data.organizations?.[0] || null,
          isAuthenticated: true,
        });
      }
    } catch (err) {
      console.warn('Failed to fetch user profile:', err);
    }
  },

  logout: async () => {
    try {
      const token = get().token;
      if (token) {
        await authControllerLogout().catch(() => {});
      }
      await supabase.auth.signOut().catch(() => {});
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      set({
        user: null,
        currentOrganization: null,
        organizations: [],
        token: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },
}));
