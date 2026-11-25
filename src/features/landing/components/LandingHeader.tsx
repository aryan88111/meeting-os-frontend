import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RiArrowRightLine, RiMenuLine, RiCloseLine } from 'react-icons/ri';
import { useAuthStore } from '@/stores/auth.store';

const NAV_LINKS = [
  { href: '#product', label: 'Product' },
  { href: '#features', label: 'Features' },
  { href: '#ask', label: 'Ask MeetingOS' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
];

export const LandingHeader: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/90 border-b border-border">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">

        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <img
            src="/logo.png"
            alt="MeetingOS Logo"
            className="h-7 w-7 rounded-lg object-contain shadow-md shadow-primary/20 group-hover:scale-105 transition-transform"
          />
          <span className="text-base font-bold tracking-tight text-foreground">
            MeetingOS
          </span>
        </Link>


        {/* Center Navigation Links */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-8 text-[13px] text-foreground/60">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-foreground transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-full bg-foreground text-background text-[13px] font-medium transition-opacity hover:opacity-85 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="hidden sm:inline">Open Workspace ({user?.name?.split(' ')[0] || 'App'})</span>
              <span className="sm:hidden">Workspace</span>
              <RiArrowRightLine className="h-3.5 w-3.5" />
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline text-[13px] text-foreground/70 hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-full bg-foreground text-background text-[13px] font-medium transition-opacity hover:opacity-85 cursor-pointer"
              >
                Get started
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="md:hidden h-8 w-8 flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-panel"
          >
            {menuOpen ? <RiCloseLine className="h-5 w-5" /> : <RiMenuLine className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Panel */}
      {menuOpen && (
        <nav
          id="mobile-nav-panel"
          aria-label="Mobile primary"
          className="md:hidden border-t border-border bg-background px-5 py-4 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="px-1 py-2.5 text-sm text-foreground/70 hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
          {!isAuthenticated && (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="px-1 py-2.5 text-sm text-foreground/70 hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
          )}
        </nav>
      )}
    </header>
  );
};
