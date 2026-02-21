import { AuthState } from '@/types/state/auth';
import { create } from 'zustand';

export const useAuthStore = create<AuthState>(set => ({
    user: null,
    isLoading: true,
    setUser: user => set({ user }),
    setLoading: loading => set({ isLoading: loading }),
    clearUser: () => set({ user: null }),
}));
