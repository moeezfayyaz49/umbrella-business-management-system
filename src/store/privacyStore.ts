import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PrivacyState {
  hideFinancialData: boolean;
  toggleHideFinancialData: () => void;
  setHideFinancialData: (hidden: boolean) => void;
}

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      hideFinancialData: false,
      toggleHideFinancialData: () =>
        set((state) => ({ hideFinancialData: !state.hideFinancialData })),
      setHideFinancialData: (hidden) => set({ hideFinancialData: hidden }),
    }),
    {
      name: 'privacy-storage',
    }
  )
);
