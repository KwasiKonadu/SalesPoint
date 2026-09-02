import { create } from 'zustand';

export type PageId =
  | 'dashboard'
  | 'sales'
  | 'pos'
  | 'products'
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'expenses'
  | 'reports'
  | 'staff'
  | 'settings'
  | 'login';

interface AppState {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
