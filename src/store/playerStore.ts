import { create } from 'zustand';
import type { PlayerStats } from '../types/game';

type StatKey = 'strength' | 'agility' | 'wisdom' | 'constitution';

interface PlayerState extends PlayerStats {
  setPlayer: (player: PlayerStats) => void;
  incrementStat: (stat: StatKey, amount: number) => void;
  reset: () => void;
}

const defaultPlayer: PlayerStats = {
  name: '',
  template: '',
  strength: 6,
  agility: 6,
  wisdom: 6,
  constitution: 6,
  talent: '',
};

export const usePlayerStore = create<PlayerState>((set) => ({
  ...defaultPlayer,
  setPlayer: (player) => set(player),
  incrementStat: (stat, amount) =>
    set((s) => ({ [stat]: Math.min(12, s[stat] + amount) })),
  reset: () => set(defaultPlayer),
}));
