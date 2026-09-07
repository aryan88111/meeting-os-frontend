import { create } from 'zustand';

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleMobileOpen: () => void;
  setMobileOpen: (open: boolean) => void;
  closeMobile: () => void;
}

const getInitialCollapsed = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('meetingos_sidebar_collapsed') === 'true';
};

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: getInitialCollapsed(),
  isMobileOpen: false,
  toggleCollapse: () =>
    set((state) => {
      const next = !state.isCollapsed;
      if (typeof window !== 'undefined') {
        localStorage.setItem('meetingos_sidebar_collapsed', String(next));
      }
      return { isCollapsed: next };
    }),
  setCollapsed: (collapsed: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('meetingos_sidebar_collapsed', String(collapsed));
    }
    set({ isCollapsed: collapsed });
  },
  toggleMobileOpen: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
  setMobileOpen: (open: boolean) => set({ isMobileOpen: open }),
  closeMobile: () => set({ isMobileOpen: false }),
}));
