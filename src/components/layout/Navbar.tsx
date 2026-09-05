import React from 'react';
import { 
  RiSearch2Line, 
  RiNotification3Line, 
  RiCommandLine, 
  RiArrowDownSLine 
} from 'react-icons/ri';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const Navbar: React.FC = () => {
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

        {/* Organization / User Profile */}
        <div className="flex items-center gap-2.5 pl-1 cursor-pointer group">
          <Avatar className="h-7 w-7 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
              AG
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-none">
              Acme Engineering
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Enterprise Plan</span>
          </div>
          <RiArrowDownSLine className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </header>
  );
};
