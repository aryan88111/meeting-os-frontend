import React, { useState } from 'react';
import { 
  RiSearch2Line, 
  RiNotification3Line, 
  RiCommandLine, 
  RiArrowDownSLine,
  RiLogoutBoxRLine,
  RiBuildingLine,
  RiUser3Line
} from 'react-icons/ri';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, currentOrganization, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between transition-colors">
      {/* Search trigger with keyboard shortcut */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full group">
          <RiSearch2Line className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search meetings, decisions, topics..."
            className="w-full bg-muted/40 hover:bg-muted/70 focus:bg-background border border-border rounded-lg pl-9 pr-12 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border shadow-xs">
            <RiCommandLine className="h-2.5 w-2.5" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right controls: Theme Toggle, Notifications, Org Switcher */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        <button
          type="button"
          className="h-8 w-8 rounded-lg border border-border hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative"
          title="Notifications"
        >
          <RiNotification3Line className="h-3.5 w-3.5" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Organization / User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-1 cursor-pointer group rounded-lg hover:bg-muted/50 p-1 transition-colors"
          >
            <Avatar className="h-7 w-7 border border-border">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-none">
                {currentOrganization?.name || 'My Workspace'}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {user?.name || user?.email || 'User'}
              </span>
            </div>
            <RiArrowDownSLine className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>

          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setDropdownOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-card border border-border shadow-xl z-50 p-2 space-y-1 text-xs">
                <div className="px-3 py-2 border-b border-border/70">
                  <div className="font-semibold text-foreground truncate">{user?.name || 'User'}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{user?.email}</div>
                </div>

                <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5">
                  <RiBuildingLine className="w-3.5 h-3.5" /> Workspace
                </div>
                <div className="px-3 py-1 text-foreground font-medium truncate">
                  {currentOrganization?.name || 'Default Workspace'}
                </div>

                <div className="border-t border-border/70 my-1 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 font-medium transition-colors"
                  >
                    <RiLogoutBoxRLine className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
