import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * The trip tray: experiences a guest has picked but not yet paid for.
 *
 * Phase 1 sells experiences only with a stay, so the tray is a holding area —
 * picked from the shelf, carried to a stay page, and attached to the booking
 * when it is made. Items carry a small snapshot of the experience so the tray
 * renders without refetching; the server re-prices and re-checks seats when
 * the booking is created, so a stale snapshot can never be charged.
 */

export const tripKey = (item) => `${item.experience.id}:${item.session_id || item.date}`;

const useTripStore = create(
  persist(
    (set, get) => ({
      items: [],
      open: false,

      add: (item) => {
        const key = tripKey(item);
        set({ items: [...get().items.filter(i => tripKey(i) !== key), { ...item, key }] });
      },
      remove: (key) => set({ items: get().items.filter(i => i.key !== key) }),
      removeMany: (keys) => set({ items: get().items.filter(i => !keys.includes(i.key)) }),
      clear: () => set({ items: [] }),
      has: (experienceId) => get().items.some(i => i.experience.id === experienceId),
      setOpen: (open) => set({ open }),
      // Drop anything whose date has passed — a tray kept for weeks should not
      // offer yesterday's hike.
      prune: () => {
        const today = new Date().toLocaleDateString('en-CA');
        const items = get().items.filter(i => i.date >= today);
        if (items.length !== get().items.length) set({ items });
      },
    }),
    { name: 'rentstay-trip', partialize: (s) => ({ items: s.items }) },
  ),
);

export default useTripStore;
