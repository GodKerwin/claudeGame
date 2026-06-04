import { describe, it, expect, beforeEach } from 'vitest';
import { loadAllSlots, saveToSlot, loadFromSlot, initDefaultSlots, migrateSeenDialogues, deleteSlot } from '../../src/engine/saveEngine';
import type { SaveData } from '../../src/types/game';

const mockSaveData: SaveData = {
  player: { name: '侠客', template: '游侠', strength: 8, agility: 7, wisdom: 5, constitution: 4, talent: '天生神力' },
  currentRoomId: 'lobby',
  inventory: ['blood_letter'],
  clues: ['blood_letter'],
  flags: ['innkeeper_met'],
  questLog: ['quest_main_murder'],
  storyText: ['你走进大堂。'],
};

beforeEach(() => {
  localStorage.clear();
});

describe('initDefaultSlots', () => {
  it('returns 4 slots (1 auto + 3 manual)', () => {
    const slots = initDefaultSlots();
    expect(slots).toHaveLength(4);
    expect(slots[0].type).toBe('auto');
    expect(slots.filter((s) => s.type === 'manual')).toHaveLength(3);
  });

  it('all slots start with null data', () => {
    const slots = initDefaultSlots();
    expect(slots.every((s) => s.data === null)).toBe(true);
  });
});

describe('loadAllSlots', () => {
  it('returns default slots when localStorage is empty', () => {
    const slots = loadAllSlots();
    expect(slots).toHaveLength(4);
    expect(slots[0].data).toBeNull();
  });
});

describe('saveToSlot / loadFromSlot', () => {
  it('saves and retrieves data from slot 1', () => {
    saveToSlot(1, mockSaveData);
    const loaded = loadFromSlot(1);
    expect(loaded?.player.name).toBe('侠客');
    expect(loaded?.flags).toContain('innkeeper_met');
  });

  it('auto-save slot 0 works', () => {
    saveToSlot(0, mockSaveData);
    const loaded = loadFromSlot(0);
    expect(loaded?.currentRoomId).toBe('lobby');
  });

  it('returns null for empty slot', () => {
    expect(loadFromSlot(2)).toBeNull();
  });

  it('updates timestamp when saving', () => {
    const before = Date.now();
    const saved = saveToSlot(1, mockSaveData);
    expect(saved.timestamp).toBeGreaterThanOrEqual(before);
  });

  it('overwrites existing data in same slot', () => {
    saveToSlot(1, mockSaveData);
    const newData: SaveData = { ...mockSaveData, currentRoomId: 'cellar' };
    saveToSlot(1, newData);
    const loaded = loadFromSlot(1);
    expect(loaded?.currentRoomId).toBe('cellar');
  });
});

describe('migrateSeenDialogues', () => {
  it('adds ch1 prefix to keys without chapter prefix', () => {
    const old = ['npc_wujue:first_meet', 'npc_lifude:greeting'];
    const migrated = migrateSeenDialogues(old);
    expect(migrated).toEqual(['ch1:npc_wujue:first_meet', 'ch1:npc_lifude:greeting']);
  });

  it('leaves already-prefixed keys unchanged', () => {
    const keys = ['ch2:npc_wujue:stele_reading', 'ch1:npc_lifude:greeting'];
    expect(migrateSeenDialogues(keys)).toEqual(keys);
  });

  it('handles empty array', () => {
    expect(migrateSeenDialogues([])).toEqual([]);
  });
});

describe('deleteSlot', () => {
  it('clears data and resets timestamp to 0', () => {
    const mockData: SaveData = {
      player: { name: '侠客', template: '游侠', strength: 8, agility: 7, wisdom: 5, constitution: 4, talent: '天生神力' },
      currentRoomId: 'lobby', inventory: [], clues: [], flags: [], questLog: [], storyText: [],
      seenDialogues: [], visitedRooms: ['lobby'], foundSynthesisIds: [],
    };
    saveToSlot(1, mockData);
    deleteSlot(1);
    expect(loadFromSlot(1)).toBeNull();
    const slots = loadAllSlots();
    expect(slots[1].timestamp).toBe(0);
  });

  it('does nothing for non-existent slot id', () => {
    // Should not throw
    expect(() => deleteSlot(99)).not.toThrow();
  });

  it('preserves other slots when one is deleted', () => {
    const mockData: SaveData = {
      player: { name: '侠客', template: '游侠', strength: 8, agility: 7, wisdom: 5, constitution: 4, talent: '天生神力' },
      currentRoomId: 'lobby', inventory: [], clues: [], flags: [], questLog: [], storyText: [],
      seenDialogues: [], visitedRooms: ['lobby'], foundSynthesisIds: [],
    };
    saveToSlot(1, mockData);
    saveToSlot(2, { ...mockData, currentRoomId: 'cellar' });
    deleteSlot(1);
    expect(loadFromSlot(1)).toBeNull();
    expect(loadFromSlot(2)?.currentRoomId).toBe('cellar');
  });

  it('can delete auto-save slot 0', () => {
    const mockData: SaveData = {
      player: { name: '侠客', template: '游侠', strength: 8, agility: 7, wisdom: 5, constitution: 4, talent: '天生神力' },
      currentRoomId: 'lobby', inventory: [], clues: [], flags: [], questLog: [], storyText: [],
      seenDialogues: [], visitedRooms: ['lobby'], foundSynthesisIds: [],
    };
    saveToSlot(0, mockData);
    deleteSlot(0);
    expect(loadFromSlot(0)).toBeNull();
  });
});

describe('saveToSlot — edge cases', () => {
  it('throws when slot id does not exist', () => {
    const mockData: SaveData = {
      player: { name: '侠客', template: '游侠', strength: 8, agility: 7, wisdom: 5, constitution: 4, talent: '天生神力' },
      currentRoomId: 'lobby', inventory: [], clues: [], flags: [], questLog: [], storyText: [],
      seenDialogues: [], visitedRooms: ['lobby'], foundSynthesisIds: [],
    };
    expect(() => saveToSlot(99, mockData)).toThrow();
  });

  it('uses custom label when provided', () => {
    const mockData: SaveData = {
      player: { name: '侠客', template: '游侠', strength: 8, agility: 7, wisdom: 5, constitution: 4, talent: '天生神力' },
      currentRoomId: 'lobby', inventory: [], clues: [], flags: [], questLog: [], storyText: [],
      seenDialogues: [], visitedRooms: ['lobby'], foundSynthesisIds: [],
    };
    const saved = saveToSlot(1, mockData, '自定义存档');
    expect(saved.label).toBe('自定义存档');
    const slots = loadAllSlots();
    expect(slots[1].label).toBe('自定义存档');
  });

  it('keeps existing label when no custom label given', () => {
    const mockData: SaveData = {
      player: { name: '侠客', template: '游侠', strength: 8, agility: 7, wisdom: 5, constitution: 4, talent: '天生神力' },
      currentRoomId: 'lobby', inventory: [], clues: [], flags: [], questLog: [], storyText: [],
      seenDialogues: [], visitedRooms: ['lobby'], foundSynthesisIds: [],
    };
    const saved = saveToSlot(1, mockData);
    expect(saved.label).toBe('存档槽一');
  });
});

describe('loadAllSlots — edge cases', () => {
  it('returns defaults when localStorage has corrupted JSON', () => {
    localStorage.setItem('tianji_saves', 'INVALID_JSON{{{');
    const slots = loadAllSlots();
    expect(slots).toHaveLength(4);
    expect(slots[0].data).toBeNull();
  });

  it('returns defaults when localStorage has wrong array length', () => {
    localStorage.setItem('tianji_saves', JSON.stringify([{ id: 0 }, { id: 1 }]));
    const slots = loadAllSlots();
    expect(slots).toHaveLength(4);
    expect(slots[0].type).toBe('auto');
  });
});
