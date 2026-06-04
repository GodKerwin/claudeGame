import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneStore } from '../../src/store/sceneStore';

describe('sceneStore – foundSynthesisIds', () => {
  beforeEach(() => {
    useSceneStore.getState().reset();
  });

  it('starts empty', () => {
    expect(useSceneStore.getState().foundSynthesisIds).toEqual([]);
  });

  it('adds an id', () => {
    useSceneStore.getState().addFoundSynthesisId('synth_double_kill');
    expect(useSceneStore.getState().foundSynthesisIds).toContain('synth_double_kill');
  });

  it('does not add duplicates', () => {
    useSceneStore.getState().addFoundSynthesisId('synth_double_kill');
    useSceneStore.getState().addFoundSynthesisId('synth_double_kill');
    expect(useSceneStore.getState().foundSynthesisIds.length).toBe(1);
  });

  it('loadState restores foundSynthesisIds', () => {
    useSceneStore.getState().loadState({ foundSynthesisIds: ['synth_innkeeper_role'] });
    expect(useSceneStore.getState().foundSynthesisIds).toEqual(['synth_innkeeper_role']);
  });
});

describe('sceneStore – storyText', () => {
  beforeEach(() => {
    useSceneStore.getState().reset();
  });

  it('strips leading separators after trimming at 50 entries', () => {
    useSceneStore.getState().reset();
    for (let i = 0; i < 3; i++) useSceneStore.getState().addStoryText('---SEPARATOR---');
    for (let i = 0; i < 48; i++) useSceneStore.getState().addStoryText(`text${i}`);
    const st = useSceneStore.getState().storyText;
    expect(st.length).toBeLessThanOrEqual(50);
    expect(st[0]).not.toBe('---SEPARATOR---');
  });
});

describe('sceneStore — initial state', () => {
  beforeEach(() => { useSceneStore.getState().reset(); });

  it('starts in room_203', () => {
    expect(useSceneStore.getState().currentRoomId).toBe('room_203');
  });

  it('questLog starts with quest_main_murder', () => {
    expect(useSceneStore.getState().questLog).toContain('quest_main_murder');
  });

  it('visitedRooms starts with room_203', () => {
    expect(useSceneStore.getState().visitedRooms).toContain('room_203');
  });

  it('timeOfDay starts as morning', () => {
    expect(useSceneStore.getState().timeOfDay).toBe('morning');
  });

  it('flags, clues, storyText start empty', () => {
    const s = useSceneStore.getState();
    expect(s.flags).toHaveLength(0);
    expect(s.clues).toHaveLength(0);
    expect(s.storyText).toHaveLength(0);
  });
});

describe('sceneStore — setRoom', () => {
  beforeEach(() => { useSceneStore.getState().reset(); });

  it('changes currentRoomId', () => {
    useSceneStore.getState().setRoom('lobby');
    expect(useSceneStore.getState().currentRoomId).toBe('lobby');
  });

  it('clears storyText on room change', () => {
    useSceneStore.getState().addStoryText('some text');
    useSceneStore.getState().setRoom('lobby');
    expect(useSceneStore.getState().storyText).toHaveLength(0);
  });

  it('adds new room to visitedRooms', () => {
    useSceneStore.getState().setRoom('lobby');
    expect(useSceneStore.getState().visitedRooms).toContain('lobby');
  });

  it('does not duplicate visitedRooms', () => {
    useSceneStore.getState().setRoom('lobby');
    useSceneStore.getState().setRoom('lobby');
    const visited = useSceneStore.getState().visitedRooms;
    expect(visited.filter((r) => r === 'lobby')).toHaveLength(1);
  });

  it('is a no-op when navigating to current room', () => {
    useSceneStore.getState().addStoryText('keep this');
    useSceneStore.getState().setRoom('room_203'); // already in room_203
    expect(useSceneStore.getState().storyText).toContain('keep this');
  });
});

describe('sceneStore — addFlag', () => {
  beforeEach(() => { useSceneStore.getState().reset(); });

  it('adds a flag', () => {
    useSceneStore.getState().addFlag('innkeeper_met');
    expect(useSceneStore.getState().flags).toContain('innkeeper_met');
  });

  it('does not add duplicate flags', () => {
    useSceneStore.getState().addFlag('innkeeper_met');
    useSceneStore.getState().addFlag('innkeeper_met');
    expect(useSceneStore.getState().flags.filter((f) => f === 'innkeeper_met')).toHaveLength(1);
  });

  it('chapter2_started resets timeOfDay to morning', () => {
    useSceneStore.getState().advanceTime(3); // → dusk
    useSceneStore.getState().addFlag('chapter2_started');
    expect(useSceneStore.getState().timeOfDay).toBe('morning');
  });

  it('chapter3_started resets timeOfDay to morning', () => {
    useSceneStore.getState().advanceTime(3);
    useSceneStore.getState().addFlag('chapter3_started');
    expect(useSceneStore.getState().timeOfDay).toBe('morning');
  });

  it('other flags do not reset timeOfDay', () => {
    useSceneStore.getState().advanceTime(2); // → afternoon
    useSceneStore.getState().addFlag('innkeeper_met');
    expect(useSceneStore.getState().timeOfDay).toBe('afternoon');
  });
});

describe('sceneStore — addClue and addQuest', () => {
  beforeEach(() => { useSceneStore.getState().reset(); });

  it('addClue adds a clue', () => {
    useSceneStore.getState().addClue('blood_letter');
    expect(useSceneStore.getState().clues).toContain('blood_letter');
  });

  it('addClue does not add duplicates', () => {
    useSceneStore.getState().addClue('blood_letter');
    useSceneStore.getState().addClue('blood_letter');
    expect(useSceneStore.getState().clues.filter((c) => c === 'blood_letter')).toHaveLength(1);
  });

  it('addQuest adds a quest', () => {
    useSceneStore.getState().addQuest('quest_side_1');
    expect(useSceneStore.getState().questLog).toContain('quest_side_1');
  });

  it('addQuest does not add duplicates', () => {
    useSceneStore.getState().addQuest('quest_side_1');
    useSceneStore.getState().addQuest('quest_side_1');
    expect(useSceneStore.getState().questLog.filter((q) => q === 'quest_side_1')).toHaveLength(1);
  });
});

describe('sceneStore — storyText and clearStoryText', () => {
  beforeEach(() => { useSceneStore.getState().reset(); });

  it('clearStoryText empties the array', () => {
    useSceneStore.getState().addStoryText('text1');
    useSceneStore.getState().addStoryText('text2');
    useSceneStore.getState().clearStoryText();
    expect(useSceneStore.getState().storyText).toHaveLength(0);
  });

  it('trims to 50 entries when exceeding limit', () => {
    for (let i = 0; i < 55; i++) {
      useSceneStore.getState().addStoryText(`text${i}`);
    }
    expect(useSceneStore.getState().storyText).toHaveLength(50);
  });

  it('keeps the most recent entries when trimming', () => {
    for (let i = 0; i < 55; i++) {
      useSceneStore.getState().addStoryText(`text${i}`);
    }
    expect(useSceneStore.getState().storyText).toContain('text54');
    expect(useSceneStore.getState().storyText).not.toContain('text0');
  });
});

describe('sceneStore — markDialogueSeen', () => {
  beforeEach(() => { useSceneStore.getState().reset(); });

  it('marks a dialogue as seen', () => {
    useSceneStore.getState().markDialogueSeen('ch1:npc_wujue:first_meet');
    expect(useSceneStore.getState().seenDialogues).toContain('ch1:npc_wujue:first_meet');
  });

  it('does not add duplicate dialogue keys', () => {
    useSceneStore.getState().markDialogueSeen('ch1:npc_wujue:first_meet');
    useSceneStore.getState().markDialogueSeen('ch1:npc_wujue:first_meet');
    expect(useSceneStore.getState().seenDialogues.filter((d) => d === 'ch1:npc_wujue:first_meet')).toHaveLength(1);
  });
});

describe('sceneStore — setInterrogationLevel', () => {
  beforeEach(() => { useSceneStore.getState().reset(); });

  it('sets interrogation level for an NPC', () => {
    useSceneStore.getState().setInterrogationLevel('npc_wujue', 2);
    expect(useSceneStore.getState().interrogationLevels['npc_wujue']).toBe(2);
  });

  it('updates existing interrogation level', () => {
    useSceneStore.getState().setInterrogationLevel('npc_wujue', 1);
    useSceneStore.getState().setInterrogationLevel('npc_wujue', 3);
    expect(useSceneStore.getState().interrogationLevels['npc_wujue']).toBe(3);
  });

  it('sets levels for multiple NPCs independently', () => {
    useSceneStore.getState().setInterrogationLevel('npc_a', 1);
    useSceneStore.getState().setInterrogationLevel('npc_b', 2);
    expect(useSceneStore.getState().interrogationLevels['npc_a']).toBe(1);
    expect(useSceneStore.getState().interrogationLevels['npc_b']).toBe(2);
  });
});

describe('sceneStore — advanceTime', () => {
  beforeEach(() => { useSceneStore.getState().reset(); });

  it('advances by 1 step (morning → noon)', () => {
    useSceneStore.getState().advanceTime(1);
    expect(useSceneStore.getState().timeOfDay).toBe('noon');
  });

  it('advances by default (1 step)', () => {
    useSceneStore.getState().advanceTime();
    expect(useSceneStore.getState().timeOfDay).toBe('noon');
  });

  it('advances by 2 steps (morning → afternoon)', () => {
    useSceneStore.getState().advanceTime(2);
    expect(useSceneStore.getState().timeOfDay).toBe('afternoon');
  });

  it('wraps around from night to dawn', () => {
    useSceneStore.getState().advanceTime(4); // morning → night
    useSceneStore.getState().advanceTime(1); // night → dawn
    expect(useSceneStore.getState().timeOfDay).toBe('dawn');
  });

  it('large step wraps correctly', () => {
    useSceneStore.getState().advanceTime(7); // (1+7)%6=2 = noon
    expect(useSceneStore.getState().timeOfDay).toBe('noon');
  });
});

describe('sceneStore — reset', () => {
  it('resets all state to defaults', () => {
    const s = useSceneStore.getState();
    s.addFlag('some_flag');
    s.addClue('some_clue');
    s.setRoom('lobby');
    s.advanceTime(3);
    s.reset();
    const after = useSceneStore.getState();
    expect(after.flags).toHaveLength(0);
    expect(after.clues).toHaveLength(0);
    expect(after.currentRoomId).toBe('room_203');
    expect(after.timeOfDay).toBe('morning');
    expect(after.questLog).toContain('quest_main_murder');
  });
});

describe('sceneStore — loadState', () => {
  beforeEach(() => { useSceneStore.getState().reset(); });

  it('loads partial state', () => {
    useSceneStore.getState().loadState({ currentRoomId: 'kitchen', flags: ['innkeeper_met'] });
    const s = useSceneStore.getState();
    expect(s.currentRoomId).toBe('kitchen');
    expect(s.flags).toContain('innkeeper_met');
  });

  it('loads timeOfDay', () => {
    useSceneStore.getState().loadState({ timeOfDay: 'dusk' });
    expect(useSceneStore.getState().timeOfDay).toBe('dusk');
  });

  it('preserves unloaded fields', () => {
    useSceneStore.getState().addClue('existing_clue');
    useSceneStore.getState().loadState({ currentRoomId: 'kitchen' });
    expect(useSceneStore.getState().clues).toContain('existing_clue');
  });
});
