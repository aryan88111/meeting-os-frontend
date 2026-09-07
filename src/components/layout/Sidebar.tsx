import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  RiSparklingFill, 
  RiDashboard3Line, 
  RiCalendarEventLine, 
  RiCalendar2Line,
  RiCheckboxCircleLine, 
  RiBrainLine, 
  RiFileTextLine, 
  RiSettings3Line, 
  RiApps2Line,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiCloseLine
} from 'react-icons/ri';
import { cn } from '@/lib/utils';
import { useMeetingsQuery } from '@/features/meetings/hooks/useMeetings';
import { useSidebarStore } from '@/stores/sidebar.store';

export const Sidebar: React.FC = () => {
  const { isCollapsed, toggleCollapse, isMobileOpen, closeMobile } = useSidebarStore();
  const { data: meetingsData } = useMeetingsQuery({ limit: 100 });

  const totalMeetings = meetingsData?.total ?? meetingsData?.items?.length ?? 0;
  const pendingActionsCount = meetingsData?.items?.reduce(
    (acc, m) => acc + (m.pendingActionsCount ?? m.actionItems?.filter((a) => a.status === 'PENDING' || a.status === 'IN_PROGRESS').length ?? 0),
    0
  ) ?? 0;

  const mainNav = [
    { label: 'Dashboard', icon: RiDashboard3Line, href: '/' },
    { 
      label: 'Meetings', 
      icon: RiCalendarEventLine, 
      href: '/meetings', 
      badge: totalMeetings > 0 ? String(totalMeetings) : undefined 
    },
    { label: 'Calendar & To-Do', icon: RiCalendar2Line, href: '/calendar' },
    { 
      label: 'Action Items', 
      icon: RiCheckboxCircleLine, 
      href: '/action-items', 
      badge: pendingActionsCount > 0 ? String(pendingActionsCount) : undefined 
    },
  ];

  const knowledgeNav = [
    { label: 'Ask My Meetings', icon: RiBrainLine, href: '/knowledge' },
    { label: 'Exported Reports', icon: RiFileTextLine, href: '/documents' },
    { label: 'Integrations', icon: RiApps2Line, href: '/integrations' },
  ];

  // Render navigation links list (used in both desktop & mobile drawer)
  const renderNavSection = (
    items: typeof mainNav,
    sectionTitle: string,
    collapsed: boolean
  ) => (
    <div className="space-y-1">
      {!collapsed && (
        <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase transition-opacity duration-200">
          {sectionTitle}
        </div>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={() => closeMobile()}
            title={collapsed ? `${item.label}${item.badge ? ` (${item.badge})` : ''}` : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center rounded-md text-xs font-medium transition-all',
                collapsed ? 'justify-center p-2.5 my-1' : 'justify-between px-2.5 py-1.5',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
              )
            }
          >
            <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
              {!collapsed && <span>{item.label}</span>}
            </div>

            {/* Badge */}
            {item.badge ? (
              collapsed ? (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary ring-2 ring-sidebar-background" />
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground border border-border">
                  {item.badge}
                </span>
              )
            ) : null}
          </NavLink>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close sidebar overlay"
          onClick={closeMobile}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              closeMobile();
            }
          }}
          className="fixed inset-0 bg-background/80 backdrop-blur-xs z-40 md:hidden animate-in fade-in-0 duration-200 cursor-pointer"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 md:hidden shadow-2xl flex flex-col justify-between p-3.5 bg-sidebar-background border-r border-border transition-transform duration-300 ease-in-out select-none',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="space-y-5">
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between px-2.5 py-2">
            <div className="flex items-center gap-2.5">
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
            <button
              type="button"
              onClick={closeMobile}
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 flex items-center justify-center transition-colors cursor-pointer"
              title="Close drawer"
            >
              <RiCloseLine className="h-4 w-4" />
            </button>
          </div>

          {/* Nav Sections */}
          {renderNavSection(mainNav, 'Platform', false)}
          {renderNavSection(knowledgeNav, 'Knowledge Base', false)}
        </div>

        {/* Footer */}
        <div className="space-y-2 pt-3 border-t border-border">
          <NavLink
            to="/settings"
            onClick={closeMobile}
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

      {/* Desktop Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col justify-between border-r border-border bg-sidebar-background transition-[width] duration-300 ease-in-out select-none',
          isCollapsed ? 'w-16 p-2' : 'w-60 p-3.5'
        )}
      >
        <div className="space-y-5">
          {/* Brand Header & Toggle */}
          <div
            className={cn(
              'flex items-center py-2 transition-all',
              isCollapsed ? 'flex-col gap-2 items-center justify-center' : 'justify-between px-2.5'
            )}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/25 cursor-pointer shrink-0"
                onClick={toggleCollapse}
                title={isCollapsed ? 'Expand sidebar' : 'MeetingOS'}
              >
                <RiSparklingFill className="h-4 w-4 text-primary-foreground" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="font-semibold text-sm tracking-tight text-foreground leading-none">
                    MeetingOS
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 font-medium tracking-wide uppercase">
                    Intelligence OS
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleCollapse}
              className={cn(
                'rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 flex items-center justify-center transition-colors cursor-pointer',
                isCollapsed ? 'h-6 w-6 mt-1' : 'h-7 w-7'
              )}
              title={isCollapsed ? 'Expand sidebar (Ctrl/Cmd + B)' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <RiMenuUnfoldLine className="h-4 w-4" />
              ) : (
                <RiMenuFoldLine className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Nav Sections */}
          {renderNavSection(mainNav, 'Platform', isCollapsed)}
          {renderNavSection(knowledgeNav, 'Knowledge Base', isCollapsed)}
        </div>

        {/* Desktop Footer */}
        <div className={cn('space-y-2 pt-3 border-t border-border', isCollapsed && 'items-center flex flex-col')}>
          <NavLink
            to="/settings"
            title={isCollapsed ? 'Settings & API' : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md text-xs font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50',
                isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-2.5 py-1.5',
                isActive && 'bg-sidebar-accent text-foreground'
              )
            }
          >
            <RiSettings3Line className="h-4 w-4" />
            {!isCollapsed && <span>Settings & API</span>}
          </NavLink>

          {isCollapsed ? (
            <div
              className="h-8 w-8 rounded-lg border border-border bg-card/60 flex items-center justify-center"
              title="AI Pipeline Ready (v1.0)"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            </div>
          ) : (
            <div className="p-2.5 rounded-lg border border-border bg-card/60 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                <span className="font-medium text-foreground">AI Pipeline Ready</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">v1.0</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
