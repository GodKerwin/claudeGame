import { describe, it, expect } from 'vitest';
import { MAPS, ITEMS, EVENTS, NPCS } from '../../src/data/loader';

describe('chapter2 map and item integrity', () => {
  const ch2Map = MAPS.find((m) => m.id === 'chapter2');
  const allRoomIds = new Set(ch2Map?.rooms.map((r) => r.id) ?? []);
  const allItemIds = new Set(ITEMS.map((i) => i.id));

  it('chapter2 map exists with 6 rooms', () => {
    expect(ch2Map, 'chapter2 map missing').toBeDefined();
    expect(ch2Map?.rooms.length).toBe(6);
  });

  it('all 6 chapter2 rooms exist', () => {
    const expected = [
      'east_market_entrance',
      'huichuntang',
      'antique_shop',
      'cien_temple',
      'pingkang_hideout',
      'imperial_teahouse',
    ];
    for (const id of expected) {
      expect(allRoomIds.has(id), `missing room: ${id}`).toBe(true);
    }
  });

  it('all chapter2 room exits reference valid rooms', () => {
    if (!ch2Map) return;
    for (const room of ch2Map.rooms) {
      for (const exit of room.exits) {
        expect(allRoomIds.has(exit), `room ${room.id} has invalid exit: ${exit}`).toBe(true);
      }
    }
  });

  it('imperial_teahouse requires langpeng_trail flag', () => {
    const room = ch2Map?.rooms.find((r) => r.id === 'imperial_teahouse');
    expect(room?.requires?.flags).toContain('langpeng_trail');
  });

  it('all 10 chapter2 items exist', () => {
    const expected = [
      'poison_residue_sample',
      'wujue_prescription',
      'monk_identity_scroll',
      'langpeng_dispatch_order',
      'buyer_transaction_record',
      'tianji_signal_record',
      'captive_letter',
      'second_killer_evidence',
      'reward_notice',
      'teahouse_token',
    ];
    for (const id of expected) {
      expect(allItemIds.has(id), `missing item: ${id}`).toBe(true);
    }
  });

  it('clue items have isClue true', () => {
    const clueIds = [
      'poison_residue_sample', 'wujue_prescription', 'monk_identity_scroll',
      'langpeng_dispatch_order', 'buyer_transaction_record', 'tianji_signal_record',
      'captive_letter', 'second_killer_evidence',
    ];
    for (const id of clueIds) {
      const item = ITEMS.find((i) => i.id === id);
      expect(item?.isClue, `${id} should be a clue`).toBe(true);
    }
  });
});
