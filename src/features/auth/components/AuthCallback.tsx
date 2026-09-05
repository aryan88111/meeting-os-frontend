import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { FiLoader, FiAlertCircle } from 'react-icons/fi';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { syncSupabaseSession } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const processAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (session) {
          await syncSupabaseSession(
            session.access_token,
            session.user.email,
            session.user.user_metadata?.full_name || session.user.user_metadata?.name
          );
          if (isMounted) {
            navigate('/', { replace: true });
          }
          return;
        }

        // Listen for token if session not immediately resolved
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (currentSession && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
            await syncSupabaseSession(
              currentSession.access_token,
              currentSession.user.email,
              currentSession.user.user_metadata?.full_name || currentSession.user.user_metadata?.name
            );
            if (isMounted) {
              navigate('/', { replace: true });
            }
          }
        });

        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to complete OAuth authentication');
        }
      }
    };

    processAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate, syncSupabaseSession]);

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-card border border-border shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <FiAlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">Authentication Error</h2>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
          >
            Back to Sign In
          </button>
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
