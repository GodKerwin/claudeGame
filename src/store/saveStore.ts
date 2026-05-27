import { create } from 'zustand';
import type { SaveSlot } from '../types/game';

interface SaveState {
  slots: SaveSlot[];
  setSlots: (slots: SaveSlot[]) => void;
  updateSlot: (slot: SaveSlot) => void;
}

export const useSaveStore = create<SaveState>((set) => ({
  slots: [],
  setSlots: (slots) => set({ slots }),
  updateSlot: (slot) =>
    set((s) => ({
      slots: s.slots.some((sl) => sl.id === slot.id)
        ? s.slots.map((sl) => (sl.id === slot.id ? slot : sl))
        : [...s.slots, slot],
    })),
}));
