import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RiLoader4Line, RiErrorWarningLine, RiCheckboxCircleLine } from 'react-icons/ri';
import { integrationsControllerHandleGoogleCallback } from '@/api';

export const GoogleCallbackView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting your Google Calendar...');

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam || !code) {
      setStatus('error');
      setMessage(errorParam || 'Google authorization was cancelled or no authorization code was returned.');
      return;
    }

    const exchangeCode = async () => {
      try {
        const response = await integrationsControllerHandleGoogleCallback({
          body: {
            code,
            redirectUri: `${window.location.origin}/integrations/google/callback`,
          },
        });

        if (response.error) {
          const errData = response.error as any;
          throw new Error(errData?.message || 'Failed to connect Google Calendar');
        }

        setStatus('success');
        setMessage('Google Calendar and Google Meet successfully linked!');
        setTimeout(() => {
          navigate('/calendar');
        }, 1500);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Failed to exchange authorization tokens with Google');
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full p-8 rounded-2xl bg-card border border-border shadow-2xl text-center space-y-4">
        {status === 'loading' && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto animate-pulse">
              <RiLoader4Line className="w-6 h-6 animate-spin" />
            </div>
            <h3 className="font-bold text-base text-foreground">Syncing Google Calendar</h3>
            <p className="text-xs text-muted-foreground">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <RiCheckboxCircleLine className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-foreground">Connected Successfully</h3>
            <p className="text-xs text-muted-foreground">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <RiErrorWarningLine className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-foreground">Connection Error</h3>
            <p className="text-xs text-muted-foreground">{message}</p>
            <button
              onClick={() => navigate('/calendar')}
              className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition"
            >
              Return to Calendar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
