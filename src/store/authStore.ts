import { create } from 'zustand';
import { secureStorage } from '@services/secureStorage';
import { authService, type AuthUser } from '@services/authService';
import { authEvents } from '@services/authEvents';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  setUser: (user: AuthUser) => void;
  reset: () => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  setUser: (user) => set({ user, isAuthenticated: true }),

  // State-only reset — called by 401 interceptor (no API call)
  reset: () => set({ user: null, isAuthenticated: false }),

  // Full logout — calls API then clears local state
  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    const cookie = await secureStorage.getSessionCookie();
    if (!cookie) {
      set({ isHydrated: true });
      return;
    }
    try {
      const user = await authService.me();
      set({ user, isAuthenticated: true, isHydrated: true });
    } catch {
      await secureStorage.clearAll();
      set({ isHydrated: true });
    }
  },
}));

// Wire 401 handler: when the API interceptor fires, reset store state.
// Done at module-init so no component lifecycle dependency.
authEvents.setOnUnauthenticated(() => {
  useAuthStore.getState().reset();
});
