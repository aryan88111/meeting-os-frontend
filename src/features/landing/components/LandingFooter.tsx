import React from 'react';
import { Link } from 'react-router-dom';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-border py-10 text-xs text-foreground/45">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-2">
          <span className="font-serif italic text-foreground/80">MeetingOS</span>
          <span className="text-foreground/30">© 2026</span>
        </div>

        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            All systems operational
          </span>
          <Link to="/login" className="hover:text-foreground/80 transition-colors">Sign in</Link>
          <Link to="/register" className="hover:text-foreground/80 transition-colors">Create account</Link>
        </div>
      </div>
    </footer>
  );
};
