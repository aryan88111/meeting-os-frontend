import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

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
  syncSupabaseSession: (accessToken: string, email?: string, name?: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign in. Please check your credentials.');
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
      set({ error: err.message || 'An unexpected error occurred during login', isLoading: false });
      throw err;
    }
  },

  register: async (name: string, email: string, password: string, organizationName?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, organizationName }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed. Please try again.');
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
      set({ error: err.message || 'An unexpected error occurred during registration', isLoading: false });
      throw err;
    }
  },

  loginWithOAuth: async (provider: 'google' | 'github' | 'azure') => {
    set({ isLoading: true, error: null });
    try {
      const redirectUrl = `${window.location.origin}/oauth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      set({ error: err.message || `Failed to initiate ${provider} sign in`, isLoading: false });
      throw err;
    }
  },

  syncSupabaseSession: async (accessToken: string, email?: string, name?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/supabase-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, email, name }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to sync Supabase authentication session');
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
      set({ error: err.message || 'OAuth session synchronization failed', isLoading: false });
      throw err;
    }
  },

  fetchProfile: async () => {
    const token = get().token || localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          set({ token: null, user: null, isAuthenticated: false });
        }
        return;
      }

      const data = await response.json();
      set({
        user: { id: data.id, email: data.email, name: data.name },
        organizations: data.organizations || [],
        currentOrganization: data.organizations?.[0] || null,
        isAuthenticated: true,
      });
    } catch (err) {
      console.warn('Failed to fetch user profile:', err);
    }
  },

  logout: async () => {
    try {
      const token = get().token;
      if (token) {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
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
