import { create } from 'zustand';
import type { TimeOfDay } from '../types/game';

interface SceneState {
  currentRoomId: string;
  flags: string[];
  clues: string[];
  questLog: string[];
  storyText: string[];
  seenDialogues: string[];
  visitedRooms: string[];
  foundSynthesisIds: string[];
  setRoom: (roomId: string) => void;
  addFlag: (flag: string) => void;
  addClue: (clueId: string) => void;
  addQuest: (questId: string) => void;
  addStoryText: (text: string) => void;
  clearStoryText: () => void;
  markDialogueSeen: (key: string) => void;
  addFoundSynthesisId: (id: string) => void;
  interrogationLevels: Record<string, number>;
  setInterrogationLevel: (npcId: string, level: number) => void;
  timeOfDay: TimeOfDay;
  advanceTime: (steps?: number) => void;
  loadState: (state: Partial<Pick<SceneState,
    'currentRoomId' | 'flags' | 'clues' | 'questLog' | 'storyText' |
    'seenDialogues' | 'visitedRooms' | 'foundSynthesisIds' | 'interrogationLevels' | 'timeOfDay'>>) => void;
  reset: () => void;
}

const defaultState = {
  currentRoomId: 'room_203',
  flags: [] as string[],
  clues: [] as string[],
  questLog: ['quest_main_murder'] as string[],
  storyText: [] as string[],
  seenDialogues: [] as string[],
  visitedRooms: ['room_203'] as string[],
  foundSynthesisIds: [] as string[],
  interrogationLevels: {} as Record<string, number>,
  timeOfDay: 'morning' as TimeOfDay,
};

export const useSceneStore = create<SceneState>((set) => ({
  ...defaultState,
  setRoom: (roomId) =>
    set((s) => {
      if (s.currentRoomId === roomId) return s;
      const visitedRooms = s.visitedRooms.includes(roomId)
        ? s.visitedRooms
        : [...s.visitedRooms, roomId];
      return { currentRoomId: roomId, storyText: [], visitedRooms };
    }),
  addFlag: (flag) =>
    set((s) => {
      if (s.flags.includes(flag)) return s;
      const isChapterStart =
        flag === 'chapter2_started' ||
        flag === 'chapter3_started' ||
        flag === 'chapter4_started' ||
        flag === 'chapter5_started';
      return {
        flags: [...s.flags, flag],
        ...(isChapterStart ? { timeOfDay: 'morning' as TimeOfDay } : {}),
      };
    }),
  addClue: (clueId) =>
    set((s) => ({ clues: s.clues.includes(clueId) ? s.clues : [...s.clues, clueId] })),
  addQuest: (questId) =>
    set((s) => ({ questLog: s.questLog.includes(questId) ? s.questLog : [...s.questLog, questId] })),
  addStoryText: (text) =>
    set((s) => {
      const next = [...s.storyText, text];
      let trimmed = next.length > 50 ? next.slice(-50) : next;
      while (trimmed.length > 0 && trimmed[0] === '---SEPARATOR---') trimmed = trimmed.slice(1);
      return { storyText: trimmed };
    }),
  clearStoryText: () => set({ storyText: [] }),
  markDialogueSeen: (key) =>
    set((s) => ({
      seenDialogues: s.seenDialogues.includes(key) ? s.seenDialogues : [...s.seenDialogues, key],
    })),
  addFoundSynthesisId: (id) =>
    set((s) => ({
      foundSynthesisIds: s.foundSynthesisIds.includes(id) ? s.foundSynthesisIds : [...s.foundSynthesisIds, id],
    })),
  setInterrogationLevel: (npcId, level) =>
    set((s) => ({
      interrogationLevels: { ...s.interrogationLevels, [npcId]: level },
    })),
  advanceTime: (steps = 1) =>
    set((s) => {
      const ORDER: TimeOfDay[] = ['dawn', 'morning', 'noon', 'afternoon', 'dusk', 'night'];
      const idx = ORDER.indexOf(s.timeOfDay);
      return { timeOfDay: ORDER[(idx + steps) % ORDER.length] };
    }),
  loadState: (state) => set(state),
  reset: () => set(defaultState),
}));
