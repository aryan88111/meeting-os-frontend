import React from 'react';
import { RiSunLine, RiMoonLine, RiComputerLine } from 'react-icons/ri';
import { useThemeStore } from '@/stores/theme.store';
import { cn } from '@/lib/utils';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div
      className={cn(
        'flex items-center p-0.5 rounded-lg border border-border bg-muted/40 backdrop-blur text-muted-foreground',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={cn(
          'p-1.5 rounded-md transition-all text-xs font-medium flex items-center justify-center',
          theme === 'light'
            ? 'bg-background text-foreground shadow-xs'
            : 'hover:text-foreground'
        )}
        title="Light Mode"
      >
        <RiSunLine className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={cn(
          'p-1.5 rounded-md transition-all text-xs font-medium flex items-center justify-center',
          theme === 'dark'
            ? 'bg-background text-foreground shadow-xs'
            : 'hover:text-foreground'
        )}
        title="Dark Mode"
      >
        <RiMoonLine className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        className={cn(
          'p-1.5 rounded-md transition-all text-xs font-medium flex items-center justify-center',
          theme === 'system'
            ? 'bg-background text-foreground shadow-xs'
            : 'hover:text-foreground'
        )}
        title="System Preference"
      >
        <RiComputerLine className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
