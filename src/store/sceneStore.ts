import { create } from 'zustand';

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
  loadState: (state: Partial<Pick<SceneState,
    'currentRoomId' | 'flags' | 'clues' | 'questLog' | 'storyText' |
    'seenDialogues' | 'visitedRooms' | 'foundSynthesisIds'>>) => void;
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
    set((s) => ({ flags: s.flags.includes(flag) ? s.flags : [...s.flags, flag] })),
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
  loadState: (state) => set(state),
  reset: () => set(defaultState),
}));
