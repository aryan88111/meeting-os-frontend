import React, { useState, useEffect, useRef } from 'react';
import { 
  RiSearch2Line, 
  RiNotification3Line, 
  RiCommandLine, 
  RiArrowDownSLine,
  RiLogoutBoxRLine,
  RiBuildingLine,
  RiUser3Line,
  RiLoader4Line,
  RiVideoChatLine,
  RiArrowRightUpLine,
  RiCloseLine
} from 'react-icons/ri';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate, Link } from 'react-router-dom';
import { searchControllerSearchMeetings } from '@/api';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, currentOrganization, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Quick Search & Cmd+K
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchControllerSearchMeetings({
          query: { q: searchQuery.trim() },
        });
        if (res.data) {
          setSearchResults(res.data as any[]);
        }
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="w-full bg-muted/40 hover:bg-muted/70 focus:bg-background border border-border rounded-lg pl-9 pr-12 py-1.5 text-xs text-muted-foreground hover:text-foreground text-left transition-all relative flex items-center cursor-pointer"
        >
          <RiSearch2Line className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Search meetings, decisions, topics...</span>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border shadow-xs">
            <RiCommandLine className="h-2.5 w-2.5" />
            <span>K</span>
          </div>
        </button>
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

                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Active Organization
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 text-foreground bg-accent/40 rounded-lg">
                    <RiBuildingLine className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium truncate">{currentOrganization?.name || 'Default Org'}</span>
                  </div>
                </div>

                <div className="pt-1 border-t border-border">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-left"
                  >
                    <RiLogoutBoxRLine className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Global Cmd+K Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsSearchOpen(false)} 
          />
          <div className="relative w-full max-w-xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col z-10">
            {/* Input Header */}
            <div className="flex items-center px-4 py-3 border-b border-border bg-muted/20">
              <RiSearch2Line className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all meetings, decisions, action items..."
                className="w-full bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {isSearching && <RiLoader4Line className="w-4 h-4 text-primary animate-spin mr-2 shrink-0" />}
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                <RiCloseLine className="w-4 h-4" />
              </button>
            </div>

            {/* Results */}
            <div className="p-2 max-h-80 overflow-y-auto space-y-1">
              {searchQuery.trim() === '' ? (
                <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Type to search anything in your workspace</p>
                  <p className="text-[11px]">Meetings, transcripts, decisions, and action items</p>
                </div>
              ) : searchResults.length === 0 && !isSearching ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No matching meetings or decisions found.
                </div>
              ) : (
                searchResults.map((item) => (
                  <Link
                    key={item.id}
                    to={`/meetings/${item.id}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl hover:bg-muted/40 transition group"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <RiVideoChatLine className="h-3.5 w-3.5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {item.title}
                        </div>
                        {item.summaries?.[0]?.executiveSummary && (
                          <div className="text-[11px] text-muted-foreground line-clamp-1">
                            {item.summaries[0].executiveSummary}
                          </div>
                        )}
                        {item.decisions?.length > 0 && (
                          <div className="text-[10px] text-muted-foreground/80">
                            Key decision: &ldquo;{item.decisions[0].decision}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>
                    <RiArrowRightUpLine className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                  </Link>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground flex items-center justify-between">
              <span>Press <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">ESC</kbd> to close</span>
              <span>Ask deeper in <Link to="/knowledge" onClick={() => setIsSearchOpen(false)} className="text-primary hover:underline font-semibold">Ask My Meetings (RAG)</Link></span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
