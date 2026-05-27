import { create } from 'zustand';

interface SceneState {
  currentRoomId: string;
  flags: string[];
  clues: string[];
  questLog: string[];
  storyText: string[];
  setRoom: (roomId: string) => void;
  addFlag: (flag: string) => void;
  addClue: (clueId: string) => void;
  addQuest: (questId: string) => void;
  addStoryText: (text: string) => void;
  clearStoryText: () => void;
  loadState: (state: Partial<Pick<SceneState, 'currentRoomId' | 'flags' | 'clues' | 'questLog' | 'storyText'>>) => void;
  reset: () => void;
}

const defaultState = {
  currentRoomId: 'room_203',
  flags: [] as string[],
  clues: [] as string[],
  questLog: ['quest_main_murder'] as string[],
  storyText: [] as string[],
};

export const useSceneStore = create<SceneState>((set) => ({
  ...defaultState,
  setRoom: (roomId) =>
    set((s) => s.currentRoomId === roomId ? s : { currentRoomId: roomId, storyText: [] }),
  addFlag: (flag) =>
    set((s) => ({ flags: s.flags.includes(flag) ? s.flags : [...s.flags, flag] })),
  addClue: (clueId) =>
    set((s) => ({ clues: s.clues.includes(clueId) ? s.clues : [...s.clues, clueId] })),
  addQuest: (questId) =>
    set((s) => ({ questLog: s.questLog.includes(questId) ? s.questLog : [...s.questLog, questId] })),
  addStoryText: (text) =>
    set((s) => ({ storyText: [...s.storyText, text] })),
  clearStoryText: () => set({ storyText: [] }),
  loadState: (state) => set(state),
  reset: () => set(defaultState),
}));
