import { describe, it, expect } from 'vitest';
import { getAvailableExits, getLockedExits, getRoomInteractables } from '../../src/engine/mapEngine';
import type { Room } from '../../src/types/game';
import type { EvalContext } from '../../src/engine/conditionEvaluator';

const baseCtx: EvalContext = {
  player: { name: '测', template: 't', strength: 6, agility: 6, wisdom: 6, constitution: 6, talent: '' },
  inventory: [],
  flags: [],
  timeOfDay: 'morning',
};

const lobby: Room = {
  id: 'lobby',
  name: '大堂',
  description: '...',
  interactables: ['npc_innkeeper_li_fu', 'evt_notice_board'],
  exits: ['room_203', 'kitchen', 'cellar'],
  requires: null,
};

const kitchen: Room = {
  id: 'kitchen',
  name: '后厨',
  description: '...',
  interactables: ['npc_cook_wang'],
  exits: ['lobby'],
  requires: { flags: ['innkeeper_talked'] },
};

const cellar: Room = {
  id: 'cellar',
  name: '地窖',
  description: '...',
  interactables: [],
  exits: ['lobby'],
  requires: { flags: ['innkeeper_trusted'] },
};

const allRooms: Room[] = [lobby, kitchen, cellar];

describe('getAvailableExits', () => {
  it('returns accessible exits only', () => {
    const exits = getAvailableExits(lobby, baseCtx, allRooms);
    expect(exits.map((r) => r.id)).not.toContain('kitchen');
    expect(exits.map((r) => r.id)).not.toContain('cellar');
  });

  it('returns kitchen after innkeeper_talked flag is set', () => {
    const ctx = { ...baseCtx, flags: ['innkeeper_talked'] };
    const exits = getAvailableExits(lobby, ctx, allRooms);
    expect(exits.map((r) => r.id)).toContain('kitchen');
  });

  it('does not include room_203 because it is not in allRooms', () => {
    const exits = getAvailableExits(lobby, baseCtx, allRooms);
    expect(exits.map((r) => r.id)).not.toContain('room_203');
  });

  it('returns room with no requires as available', () => {
    // lobby itself has requires: null — exits from kitchen include lobby
    const ctx = { ...baseCtx };
    const exits = getAvailableExits(kitchen, ctx, allRooms);
    expect(exits.map((r) => r.id)).toContain('lobby');
  });

  it('returns empty when room has no exits', () => {
    const emptyRoom: Room = { id: 'empty', name: '空房间', description: '...', interactables: [], exits: [], requires: null };
    expect(getAvailableExits(emptyRoom, baseCtx, allRooms)).toHaveLength(0);
  });

  it('locks exit with unmet timeOfDay condition', () => {
    const nightRoom: Room = {
      id: 'night_room', name: '夜间密室', description: '...', interactables: [],
      exits: [], requires: { timeOfDay: ['night', 'dawn'] },
    };
    const roomWithNightExit: Room = {
      id: 'connector', name: '连接间', description: '...', interactables: [],
      exits: ['night_room'], requires: null,
    };
    const rooms = [roomWithNightExit, nightRoom];
    // During morning, night_room should be locked
    const locked = getLockedExits(roomWithNightExit, baseCtx, rooms);
    expect(locked.map((r) => r.id)).toContain('night_room');
    // During night, it should be available
    const nightCtx = { ...baseCtx, timeOfDay: 'night' as const };
    const available = getAvailableExits(roomWithNightExit, nightCtx, rooms);
    expect(available.map((r) => r.id)).toContain('night_room');
  });
});

describe('getRoomInteractables', () => {
  it('returns all interactable IDs in the room', () => {
    const ids = getRoomInteractables(lobby);
    expect(ids).toEqual(['npc_innkeeper_li_fu', 'evt_notice_board']);
  });
});

describe('getLockedExits', () => {
  it('returns rooms with unmet conditions', () => {
    const locked = getLockedExits(lobby, baseCtx, allRooms);
    expect(locked.map((r) => r.id)).toContain('kitchen');
    expect(locked.map((r) => r.id)).toContain('cellar');
  });

  it('does not return rooms that are available', () => {
    const ctx = { ...baseCtx, flags: ['innkeeper_talked', 'innkeeper_trusted'] };
    const locked = getLockedExits(lobby, ctx, allRooms);
    expect(locked).toHaveLength(0);
  });

  it('does not return rooms with null requires', () => {
    // lobby has requires: null, so it is never "locked"
    const locked = getLockedExits(kitchen, baseCtx, allRooms);
    // kitchen exits to lobby which has requires: null — lobby should NOT be in locked
    expect(locked.map((r) => r.id)).not.toContain('lobby');
  });

  it('does not include rooms not in allRooms', () => {
    // lobby exits include room_203 which is not in allRooms
    const locked = getLockedExits(lobby, baseCtx, allRooms);
    expect(locked.map((r) => r.id)).not.toContain('room_203');
  });

  it('returns only the remaining locked room when one condition is met', () => {
    const ctx = { ...baseCtx, flags: ['innkeeper_talked'] };
    const locked = getLockedExits(lobby, ctx, allRooms);
    expect(locked.map((r) => r.id)).not.toContain('kitchen');
    expect(locked.map((r) => r.id)).toContain('cellar');
  });

  it('returns empty when room has no exits', () => {
    const emptyRoom: Room = { id: 'empty', name: '空房间', description: '...', interactables: [], exits: [], requires: null };
    expect(getLockedExits(emptyRoom, baseCtx, allRooms)).toHaveLength(0);
  });
});
