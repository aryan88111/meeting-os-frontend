import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AuthLayout } from './AuthLayout';
import { FiUser, FiMail, FiLock, FiBriefcase, FiAlertCircle, FiLoader, FiGithub } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

const MicrosoftIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 21 21">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register, loginWithOAuth, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | 'azure' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!name || !email || !password) return;

    try {
      await register(name, email, password, organizationName || undefined);
      navigate('/');
    } catch {
      // Error handled in store
    }
  };

  const handleOAuth = async (provider: 'google' | 'github' | 'azure') => {
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
      title="Create your account"
      subtitle="Start transforming your meetings into structured intelligence"
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={isLoading || oauthLoading !== null}
            onClick={() => handleOAuth('google')}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/60 transition-colors text-xs font-medium disabled:opacity-50"
            title="Sign up with Google"
          >
            {oauthLoading === 'google' ? (
              <FiLoader className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <FcGoogle className="w-4 h-4 shrink-0" />
            )}
            <span>Google</span>
          </button>
          <button
            type="button"
            disabled={isLoading || oauthLoading !== null}
            onClick={() => handleOAuth('azure')}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/60 transition-colors text-xs font-medium disabled:opacity-50"
            title="Sign up with Microsoft"
          >
            {oauthLoading === 'azure' ? (
              <FiLoader className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <MicrosoftIcon className="w-4 h-4 shrink-0" />
            )}
            <span>Microsoft</span>
          </button>
          <button
            type="button"
            disabled={isLoading || oauthLoading !== null}
            onClick={() => handleOAuth('github')}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/60 transition-colors text-xs font-medium disabled:opacity-50"
            title="Sign up with GitHub"
          >
            {oauthLoading === 'github' ? (
              <FiLoader className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <FiGithub className="w-4 h-4 shrink-0" />
            )}
            <span>GitHub</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-border w-full" />
          <span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider font-semibold absolute">
            or sign up with email
          </span>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground/80">Full Name</label>
            <div className="relative">
              <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aryan Gautam"
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground/80">Work Email</label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aryan@company.com"
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground/80">Password (min 8 chars)</label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground/80">
              Workspace Name <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <div className="relative">
              <FiBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Acme Product Team"
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || oauthLoading !== null}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.99] transition shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <FiLoader className="w-4 h-4 animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-1">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
