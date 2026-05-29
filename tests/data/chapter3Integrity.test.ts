import { describe, it, expect } from 'vitest';
import { MAPS, ITEMS, EVENTS, NPCS } from '../../src/data/loader';

describe('chapter3 map and item integrity', () => {
  const ch3Map = MAPS.find((m) => m.id === 'chapter3');
  const allRoomIds = new Set(ch3Map?.rooms.map((r) => r.id) ?? []);
  const allItemIds = new Set(ITEMS.map((i) => i.id));

  it('chapter3 map exists with 4 rooms', () => {
    expect(ch3Map, 'chapter3 map missing').toBeDefined();
    expect(ch3Map?.rooms.length).toBe(4);
  });

  it('all 4 chapter3 rooms exist', () => {
    const expected = ['dayan_pagoda', 'tianji_safehouse', 'feiyes_manor', 'qujiang_pavilion'];
    for (const id of expected) {
      expect(allRoomIds.has(id), `missing room: ${id}`).toBe(true);
    }
  });

  it('all chapter3 room exits reference valid rooms', () => {
    if (!ch3Map) return;
    for (const room of ch3Map.rooms) {
      for (const exit of room.exits) {
        expect(allRoomIds.has(exit), `room ${room.id} has invalid exit: ${exit}`).toBe(true);
      }
    }
  });

  it('qujiang_pavilion requires fei_ye_identity_confirmed flag', () => {
    const room = ch3Map?.rooms.find((r) => r.id === 'qujiang_pavilion');
    expect(room?.requires?.flags).toContain('fei_ye_identity_confirmed');
  });

  it('tianji_safehouse requires chapter2_join_ending flag', () => {
    const room = ch3Map?.rooms.find((r) => r.id === 'tianji_safehouse');
    expect(room?.requires?.flags).toContain('chapter2_join_ending');
  });

  it('all 5 chapter3 items exist', () => {
    const expected = [
      'tianji_founding_scroll',
      'target_profile',
      'name_list_fragment',
      'deeper_threat_evidence',
      'qujiang_invitation',
    ];
    for (const id of expected) {
      expect(allItemIds.has(id), `missing item: ${id}`).toBe(true);
    }
  });

  it('clue items have isClue true', () => {
    const clueIds = [
      'tianji_founding_scroll', 'target_profile',
      'name_list_fragment', 'deeper_threat_evidence',
    ];
    for (const id of clueIds) {
      const item = ITEMS.find((i) => i.id === id);
      expect(item?.isClue, `${id} should be a clue`).toBe(true);
    }
  });
});
