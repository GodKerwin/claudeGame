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

describe('chapter2 event integrity', () => {
  const allEventIds = new Set(EVENTS.map((e) => e.id));
  const allItemIds = new Set(ITEMS.map((i) => i.id));
  const allNpcIds = new Set(NPCS.map((n) => n.id));
  const ch2Map = MAPS.find((m) => m.id === 'chapter2');

  it('all 12 chapter2 events exist', () => {
    const expected = [
      'evt_market_notice', 'evt_merchant_gossip',
      'evt_medicine_shelf', 'evt_prescription_book',
      'evt_appraise_token', 'evt_buyer_ledger',
      'evt_monk_cell', 'evt_temple_mural',
      'evt_hideout_search', 'evt_captive_note',
      'evt_teahouse_ambush', 'evt_li_mao_encounter',
    ];
    for (const id of expected) {
      expect(allEventIds.has(id), `missing event: ${id}`).toBe(true);
    }
  });

  it('all chapter2 room interactables reference valid events or npcs', () => {
    if (!ch2Map) return;
    for (const room of ch2Map.rooms) {
      for (const ia of room.interactables) {
        if (ia.startsWith('evt_'))
          expect(allEventIds.has(ia), `room ${room.id}: missing event ${ia}`).toBe(true);
        if (ia.startsWith('npc_'))
          expect(allNpcIds.has(ia), `room ${room.id}: missing npc ${ia}`).toBe(true);
      }
    }
  });

  it('evt_li_mao_encounter has 3 ending actions', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_li_mao_encounter');
    expect(evt).toBeDefined();
    expect(evt?.actions.find((a) => a.id === 'arrest_ending')).toBeDefined();
    expect(evt?.actions.find((a) => a.id === 'release_ending')).toBeDefined();
    expect(evt?.actions.find((a) => a.id === 'join_ending')).toBeDefined();
  });

  it('chapter2 ending actions grant correct flags', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_li_mao_encounter');
    expect(evt?.actions.find((a) => a.id === 'arrest_ending')?.grants?.flags).toContain('chapter2_arrest_ending');
    expect(evt?.actions.find((a) => a.id === 'release_ending')?.grants?.flags).toContain('chapter2_release_ending');
    expect(evt?.actions.find((a) => a.id === 'join_ending')?.grants?.flags).toContain('chapter2_join_ending');
  });

  it('evt_captive_note read_note has null requires and grants langpeng_trail (completion guarantee)', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_captive_note');
    expect(evt).toBeDefined();
    const action = evt?.actions.find((a) => a.id === 'read_note');
    expect(action).toBeDefined();
    expect(action?.requires).toBeNull();
    expect(action?.grants?.flags).toContain('langpeng_trail');
  });

  it('all chapter2 event action grants reference valid items', () => {
    const ch2EventIds = [
      'evt_market_notice', 'evt_merchant_gossip', 'evt_medicine_shelf',
      'evt_prescription_book', 'evt_appraise_token', 'evt_buyer_ledger',
      'evt_monk_cell', 'evt_temple_mural', 'evt_hideout_search',
      'evt_captive_note', 'evt_teahouse_ambush', 'evt_li_mao_encounter',
    ];
    for (const eid of ch2EventIds) {
      const evt = EVENTS.find((e) => e.id === eid);
      if (!evt) continue;
      for (const action of evt.actions) {
        for (const itemId of (action.grants?.items ?? [])) {
          expect(allItemIds.has(itemId), `event ${eid} action ${action.id} grants unknown item: ${itemId}`).toBe(true);
        }
      }
    }
  });
});
