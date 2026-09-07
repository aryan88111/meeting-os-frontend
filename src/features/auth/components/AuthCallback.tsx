import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore, normalizeAuthError } from '@/stores/auth.store';
import { FiLoader, FiAlertCircle, FiRefreshCw, FiArrowLeft, FiServer } from 'react-icons/fi';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { syncSupabaseSession } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isNetworkFailure, setIsNetworkFailure] = useState(false);

  const processAuth = useCallback(async () => {
    setIsRetrying(true);
    setErrorMessage(null);
    setIsNetworkFailure(false);

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (session) {
        await syncSupabaseSession(
          session.access_token,
          session.user.email,
          session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          session.provider_token || undefined,
          session.provider_refresh_token || undefined,
          session.user.app_metadata?.provider || undefined,
        );
        navigate('/', { replace: true });
        return;
      }

      // Listen for token if session not immediately resolved
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (currentSession && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          try {
            await syncSupabaseSession(
              currentSession.access_token,
              currentSession.user.email,
              currentSession.user.user_metadata?.full_name || currentSession.user.user_metadata?.name,
              currentSession.provider_token || undefined,
              currentSession.provider_refresh_token || undefined,
              currentSession.user.app_metadata?.provider || undefined,
            );
            navigate('/', { replace: true });
          } catch (err: any) {
            const raw = err?.message || String(err);
            const isNet =
              raw.includes('Unable to connect') ||
              raw.includes('NetworkError') ||
              raw.includes('Failed to fetch');
            setIsNetworkFailure(isNet);
            setErrorMessage(normalizeAuthError(err));
          }
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch (err: any) {
      const raw = err?.message || String(err);
      const isNet =
        raw.includes('Unable to connect') ||
        raw.includes('NetworkError') ||
        raw.includes('Failed to fetch');
      setIsNetworkFailure(isNet);
      setErrorMessage(normalizeAuthError(err));
    } finally {
      setIsRetrying(false);
    }
  }, [navigate, syncSupabaseSession]);

  useEffect(() => {
    processAuth();
  }, [processAuth]);

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-card border border-border shadow-xl text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            {isNetworkFailure ? <FiServer className="w-6 h-6" /> : <FiAlertCircle className="w-6 h-6" />}
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold">
              {isNetworkFailure ? 'Backend Server Unreachable' : 'Authentication Error'}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{errorMessage}</p>
          </div>

          {isNetworkFailure && (
            <div className="p-3.5 rounded-xl bg-muted/50 border border-border text-left text-xs text-muted-foreground space-y-1.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <FiServer className="w-3.5 h-3.5 text-primary" /> Troubleshooting Checklist:
              </div>
              <ul className="list-disc pl-4 space-y-1">
                <li>Ensure the backend server is running (<code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">npm run start:dev</code>).</li>
                <li>Check that the API server is listening on port 8000.</li>
                <li>Verify your network connection and retry.</li>
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => processAuth()}
              disabled={isRetrying}
              className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FiRefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Retry Connection'}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/60 text-sm font-medium transition flex items-center gap-1.5"
            >
              <FiArrowLeft className="w-4 h-4" />
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center animate-pulse">
        <FiLoader className="w-6 h-6 animate-spin text-primary" />
      </div>
      <h3 className="text-base font-semibold">Completing authentication...</h3>
      <p className="text-xs text-muted-foreground">Synchronizing your workspace and credentials</p>
    </div>
  );
};

