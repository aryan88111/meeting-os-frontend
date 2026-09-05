import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  const savedTheme = localStorage.getItem('meetingos_theme') as Theme | null;
  if (savedTheme) return savedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme: Theme) => {
    localStorage.setItem('meetingos_theme', theme);
    set({ theme });
    applyTheme(theme);
  },
}));

export const applyTheme = (theme: Theme) => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  
  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', isDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
};

// Initialize theme on script load
if (typeof window !== 'undefined') {
  applyTheme(getInitialTheme());
}
