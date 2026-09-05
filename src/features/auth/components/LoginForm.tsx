import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AuthLayout } from './AuthLayout';
import { FiMail, FiLock, FiAlertCircle, FiLoader, FiGithub } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithOAuth, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!email || !password) return;

    try {
      await login(email, password);
      navigate('/');
    } catch {
      // Error handled in store
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    clearError();
    setOauthLoading(provider);
    try {
      await loginWithOAuth(provider);
    } catch {
      setOauthLoading(null);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your MeetingOS workspace to continue"
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={isLoading || oauthLoading !== null}
            onClick={() => handleOAuth('google')}
            className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/60 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {oauthLoading === 'google' ? (
              <FiLoader className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <FcGoogle className="w-4 h-4" />
            )}
            Google
          </button>
          <button
            type="button"
            disabled={isLoading || oauthLoading !== null}
            onClick={() => handleOAuth('github')}
            className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/60 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {oauthLoading === 'github' ? (
              <FiLoader className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <FiGithub className="w-4 h-4" />
            )}
            GitHub
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-border w-full" />
          <span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider font-semibold absolute">
            or continue with
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80">Email address</label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground/80">Password</label>
            </div>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || oauthLoading !== null}
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.99] transition shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <FiLoader className="w-4 h-4 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-2">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
