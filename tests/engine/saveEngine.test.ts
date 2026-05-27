import { describe, it, expect, beforeEach } from 'vitest';
import { loadAllSlots, saveToSlot, loadFromSlot, initDefaultSlots } from '../../src/engine/saveEngine';
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
