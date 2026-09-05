import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  RiSparklingFill, 
  RiDashboard3Line, 
  RiCalendarEventLine, 
  RiCheckboxCircleLine, 
  RiBrainLine, 
  RiFileTextLine, 
  RiSettings3Line, 
  RiUploadCloud2Line, 
  RiApps2Line 
} from 'react-icons/ri';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const Sidebar: React.FC = () => {
  const mainNav = [
    { label: 'Dashboard', icon: RiDashboard3Line, href: '/' },
    { label: 'Meetings', icon: RiCalendarEventLine, href: '/meetings', badge: '3' },
    { label: 'Action Items', icon: RiCheckboxCircleLine, href: '/action-items', badge: '12' },
  ];

  const knowledgeNav = [
    { label: 'Ask My Meetings', icon: RiBrainLine, href: '/knowledge' },
    { label: 'Exported Reports', icon: RiFileTextLine, href: '/documents' },
    { label: 'Integrations', icon: RiApps2Line, href: '/integrations' },
  ];

  return (
    <aside className="w-60 border-r border-border bg-sidebar-background flex flex-col justify-between p-3.5 transition-colors select-none">
      <div className="space-y-5">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/25">
            <RiSparklingFill className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-foreground leading-none">
              MeetingOS
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5 font-medium tracking-wide uppercase">
              Intelligence OS
            </span>
          </div>
        </div>

        {/* Quick Ingestion Action */}
        <Button 
          className="w-full h-8 text-xs font-medium justify-center shadow-xs"
          variant="default"
        >
          <RiUploadCloud2Line className="h-3.5 w-3.5 mr-1.5" />
          <span>Upload Transcript</span>
        </Button>

        {/* Navigation Section 1: Core */}
        <div className="space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Platform
          </div>
          {mainNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                  )
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground border border-border">
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </div>

        {/* Navigation Section 2: Knowledge & RAG */}
        <div className="space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Knowledge Base
          </div>
          {knowledgeNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                  )
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                  <span>{item.label}</span>
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Footer System Status Badge */}
      <div className="space-y-2 pt-3 border-t border-border">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50',
              isActive && 'bg-sidebar-accent text-foreground'
            )
          }
        >
          <RiSettings3Line className="h-4 w-4" />
          <span>Settings & API</span>
        </NavLink>

        <div className="p-2.5 rounded-lg border border-border bg-card/60 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            <span className="font-medium text-foreground">AI Pipeline Ready</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">v1.0</span>
        </div>
      </div>
    </aside>
  );
};
