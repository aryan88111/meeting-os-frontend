import React from 'react';
import { FiCpu, FiShield, FiZap } from 'react-icons/fi';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex bg-background text-foreground selection:bg-primary/20">
      {/* Left branding banner (hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-card border-r border-border flex-col justify-between p-12 overflow-hidden">
        {/* Glow backdrop effects */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/25">
            <FiCpu className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            MeetingOS
          </span>
        </div>

        {/* Core Value Props */}
        <div className="space-y-8 z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <FiZap className="w-3.5 h-3.5" /> Next-Gen AI Meeting Intelligence
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Turn every conversation into structured, searchable execution.
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Automated transcripts, executive summaries, decision trackers, and pgvector semantic search across all your enterprise meetings.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-background/60 border border-border/50 backdrop-blur-sm">
              <FiShield className="w-5 h-5 text-primary mb-2" />
              <div className="font-semibold text-sm">Enterprise Security</div>
              <div className="text-xs text-muted-foreground mt-1">Multi-tenant isolation & RBAC</div>
            </div>
            <div className="p-4 rounded-xl bg-background/60 border border-border/50 backdrop-blur-sm">
              <FiCpu className="w-5 h-5 text-purple-400 mb-2" />
              <div className="font-semibold text-sm">Gemini AI Engine</div>
              <div className="text-xs text-muted-foreground mt-1">Vector search & real-time RAG</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-muted-foreground z-10">
          &copy; {new Date().getFullYear()} MeetingOS. All rights reserved.
        </div>
      </div>

      {/* Right form container */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                <FiCpu className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg">MeetingOS</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
