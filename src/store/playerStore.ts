import { create } from 'zustand';
import type { PlayerStats } from '../types/game';

interface PlayerState extends PlayerStats {
  setPlayer: (player: PlayerStats) => void;
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
  reset: () => set(defaultPlayer),
}));
