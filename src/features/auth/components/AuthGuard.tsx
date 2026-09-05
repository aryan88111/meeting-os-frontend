import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { FiLoader } from 'react-icons/fi';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, token, user, fetchProfile, isLoading } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      fetchProfile();
    }
  }, [token, user, fetchProfile]);

  if (isLoading && !user && token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-medium">Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
