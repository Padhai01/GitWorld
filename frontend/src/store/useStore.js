import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, leaderboardApi } from '../utils/api';

export const useStore = create(
    persist(
        (set, get) => ({
            // ── Auth ─────────────────────────────────────────────
            user: null,
            token: null,
            setUser: (user) => set({ user }),
            setToken: (token) => {
                localStorage.setItem('gw_token', token);
                set({ token });
            },
            logout: () => {
                localStorage.removeItem('gw_token');
                set({ user: null, token: null });
            },
            refreshUser: async () => {
                try {
                    const res = await authApi.me();
                    set({ user: res.data.user });
                } catch { }
            },

            // ── Globe ────────────────────────────────────────────
            globeUsers: [],
            setGlobeUsers: (u) => set({ globeUsers: u }),
            selectedUser: null,
            setSelectedUser: (u) => set({ selectedUser: u }),

            // ── Wars ─────────────────────────────────────────────
            activeWar: null,
            setActiveWar: (w) => set({ activeWar: w }),
            battleResult: null,
            setBattleResult: (r) => set({ battleResult: r }),

            // ── UI ───────────────────────────────────────────────
            notifications: [],
            unreadCount: 0,
            setNotifications: (n, u) => set({ notifications: n, unreadCount: u }),

            // ── Globe events feed ────────────────────────────────
            globeEvents: [],
            setGlobeEvents: (e) => set({ globeEvents: e }),
        }),
        {
            name: 'gitworld-store',
            partialize: (s) => ({ token: s.token, user: s.user }),
        }
    )
);