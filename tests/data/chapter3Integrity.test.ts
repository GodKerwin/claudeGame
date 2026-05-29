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

describe('chapter3 event integrity', () => {
  const allEventIds = new Set(EVENTS.map((e) => e.id));
  const allItemIds = new Set(ITEMS.map((i) => i.id));
  const allNpcIds = new Set(NPCS.map((n) => n.id));
  const ch3Map = MAPS.find((m) => m.id === 'chapter3');

  it('all 8 chapter3 events exist', () => {
    const expected = [
      'evt_nameless_stele', 'evt_pagoda_shadow',
      'evt_mission_orders', 'evt_safehouse_wall',
      'evt_abandoned_room', 'evt_portrait_wall',
      'evt_pavilion_approach', 'evt_fei_ye_confrontation',
    ];
    for (const id of expected) {
      expect(allEventIds.has(id), `missing event: ${id}`).toBe(true);
    }
  });

  it('all chapter3 room interactables reference valid events or npcs', () => {
    if (!ch3Map) return;
    for (const room of ch3Map.rooms) {
      for (const ia of room.interactables) {
        if (ia.startsWith('evt_'))
          expect(allEventIds.has(ia), `room ${room.id}: missing event ${ia}`).toBe(true);
        if (ia.startsWith('npc_'))
          expect(allNpcIds.has(ia), `room ${room.id}: missing npc ${ia}`).toBe(true);
      }
    }
  });

  it('evt_fei_ye_confrontation has 3 ending actions', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_fei_ye_confrontation');
    expect(evt).toBeDefined();
    expect(evt?.actions.find((a) => a.id === 'expose_truth')).toBeDefined();
    expect(evt?.actions.find((a) => a.id === 'demand_answers')).toBeDefined();
    expect(evt?.actions.find((a) => a.id === 'join_forces')).toBeDefined();
  });

  it('chapter3 ending actions grant correct flags', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_fei_ye_confrontation');
    expect(evt?.actions.find((a) => a.id === 'expose_truth')?.grants?.flags).toContain('chapter3_truth_ending');
    expect(evt?.actions.find((a) => a.id === 'demand_answers')?.grants?.flags).toContain('chapter3_standoff_ending');
    expect(evt?.actions.find((a) => a.id === 'join_forces')?.grants?.flags).toContain('chapter3_join_ending');
  });

  it('demand_answers requires only fei_ye_identity_confirmed (completion guarantee)', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_fei_ye_confrontation');
    const action = evt?.actions.find((a) => a.id === 'demand_answers');
    expect(action?.requires?.flags).toContain('fei_ye_identity_confirmed');
    expect(action?.requires?.has).toBeUndefined();
    expect(action?.requires?.strength).toBeUndefined();
    expect(action?.requires?.agility).toBeUndefined();
    expect(action?.requires?.wisdom).toBeUndefined();
  });

  it('all chapter3 event action grants reference valid items', () => {
    const ch3EventIds = [
      'evt_nameless_stele', 'evt_pagoda_shadow', 'evt_mission_orders', 'evt_safehouse_wall',
      'evt_abandoned_room', 'evt_portrait_wall', 'evt_pavilion_approach', 'evt_fei_ye_confrontation',
    ];
    for (const eid of ch3EventIds) {
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
