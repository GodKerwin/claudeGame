import { create } from 'zustand';

interface InventoryState {
  items: string[];
  addItem: (itemId: string) => void;
  removeItem: (itemId: string) => void;
  hasItem: (itemId: string) => boolean;
  loadItems: (items: string[]) => void;
  reset: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  addItem: (itemId) =>
    set((s) => ({ items: s.items.includes(itemId) ? s.items : [...s.items, itemId] })),
  removeItem: (itemId) =>
    set((s) => ({ items: s.items.filter((i) => i !== itemId) })),
  hasItem: (itemId) => get().items.includes(itemId),
  loadItems: (items) => set({ items }),
  reset: () => set({ items: [] }),
}));
