import { describe, it, expect } from 'vitest';
import { getAvailableExits, getRoomInteractables } from '../../src/engine/mapEngine';
import type { Room } from '../../src/types/game';
import type { EvalContext } from '../../src/engine/conditionEvaluator';

const baseCtx: EvalContext = {
  player: { name: '测', template: 't', strength: 6, agility: 6, wisdom: 6, constitution: 6, talent: '' },
  inventory: [],
  flags: [],
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
});

describe('getRoomInteractables', () => {
  it('returns all interactable IDs in the room', () => {
    const ids = getRoomInteractables(lobby);
    expect(ids).toEqual(['npc_innkeeper_li_fu', 'evt_notice_board']);
  });
});
