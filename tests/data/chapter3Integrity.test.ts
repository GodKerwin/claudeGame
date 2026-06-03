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

  it('tianji_safehouse is accessible to all paths (requires is null)', () => {
    const room = ch3Map?.rooms.find((r) => r.id === 'tianji_safehouse');
    expect(room?.requires).toBeNull();
  });

  it('all 10 chapter3 items exist', () => {
    const expected = [
      'tianji_founding_scroll',
      'target_profile',
      'name_list_fragment',
      'deeper_threat_evidence',
      'qujiang_invitation',
      'wujue_confession',
      'qi_trace_clue',
      'orders_kite_mark',
      'manor_medical_evidence',
      'unsent_letter',
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

  it('dayan_pagoda has at least 1 revisitEvent with sentinel flag', () => {
    const room = ch3Map?.rooms.find((r) => r.id === 'dayan_pagoda');
    expect(room?.revisitEvents?.length).toBeGreaterThanOrEqual(1);
    expect(room?.revisitEvents?.[0]?.grants?.flags).toBeDefined();
  });

  it('tianji_safehouse has at least 1 revisitEvent with sentinel flag', () => {
    const room = ch3Map?.rooms.find((r) => r.id === 'tianji_safehouse');
    expect(room?.revisitEvents?.length).toBeGreaterThanOrEqual(1);
    expect(room?.revisitEvents?.[0]?.grants?.flags).toBeDefined();
  });

  it('feiyes_manor has at least 1 revisitEvent with sentinel flag', () => {
    const room = ch3Map?.rooms.find((r) => r.id === 'feiyes_manor');
    expect(room?.revisitEvents?.length).toBeGreaterThanOrEqual(1);
    expect(room?.revisitEvents?.[0]?.grants?.flags).toBeDefined();
  });

  it('qujiang_pavilion has at least 1 revisitEvent with sentinel flag', () => {
    const room = ch3Map?.rooms.find((r) => r.id === 'qujiang_pavilion');
    expect(room?.revisitEvents?.length).toBeGreaterThanOrEqual(1);
    expect(room?.revisitEvents?.[0]?.grants?.flags).toBeDefined();
  });
});

describe('chapter3 event integrity', () => {
  const allEventIds = new Set(EVENTS.map((e) => e.id));
  const allItemIds = new Set(ITEMS.map((i) => i.id));
  const allNpcIds = new Set(NPCS.map((n) => n.id));
  const ch3Map = MAPS.find((m) => m.id === 'chapter3');

  it('all 10 chapter3 events exist', () => {
    const expected = [
      'evt_nameless_stele', 'evt_pagoda_shadow',
      'evt_mission_orders', 'evt_safehouse_wall',
      'evt_abandoned_room', 'evt_portrait_wall',
      'evt_pavilion_approach', 'evt_fei_ye_confrontation',
      'evt_hidden_letter', 'evt_pavilion_final_choice',
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

describe('chapter3 npc integrity', () => {
  const allItemIds = new Set(ITEMS.map((i) => i.id));

  it('npc_tianji_contact exists with all 3 dialogues', () => {
    const npc = NPCS.find((n) => n.id === 'npc_tianji_contact');
    expect(npc, 'npc_tianji_contact missing').toBeDefined();
    expect(npc?.dialogues.some((d) => d.id === 'mission_briefing')).toBe(true);
    expect(npc?.dialogues.some((d) => d.id === 'target_details')).toBe(true);
    expect(npc?.dialogues.some((d) => d.id === 'insider_warning')).toBe(true);
  });

  it('npc_tianji_contact.insider_warning grants fei_ye_identity_confirmed', () => {
    const npc = NPCS.find((n) => n.id === 'npc_tianji_contact');
    const d = npc?.dialogues.find((d) => d.id === 'insider_warning');
    expect(d?.grants?.flags).toContain('fei_ye_identity_confirmed');
  });

  it('npc_wujue has chapter3 dialogues: stele_reading and final_testimony', () => {
    const npc = NPCS.find((n) => n.id === 'npc_wujue');
    expect(npc, 'npc_wujue missing').toBeDefined();
    expect(npc?.dialogues.some((d) => d.id === 'stele_reading')).toBe(true);
    expect(npc?.dialogues.some((d) => d.id === 'final_testimony')).toBe(true);
  });

  it('npc_wujue.stele_reading grants stele_decoded and tianji_founding_scroll', () => {
    const npc = NPCS.find((n) => n.id === 'npc_wujue');
    const d = npc?.dialogues.find((d) => d.id === 'stele_reading');
    expect(d?.grants?.flags).toContain('stele_decoded');
    expect(d?.grants?.items).toContain('tianji_founding_scroll');
  });

  it('npc_wujue.final_testimony grants fei_ye_identity_confirmed', () => {
    const npc = NPCS.find((n) => n.id === 'npc_wujue');
    const d = npc?.dialogues.find((d) => d.id === 'final_testimony');
    expect(d?.grants?.flags).toContain('fei_ye_identity_confirmed');
  });

  it('npc_fei_ye has chapter3 dialogues', () => {
    const npc = NPCS.find((n) => n.id === 'npc_fei_ye');
    expect(npc, 'npc_fei_ye missing').toBeDefined();
    expect(npc?.dialogues.some((d) => d.id === 'pavilion_opening')).toBe(true);
    expect(npc?.dialogues.some((d) => d.id === 'identity_admitted')).toBe(true);
    expect(npc?.dialogues.some((d) => d.id === 'list_confrontation')).toBe(true);
    expect(npc?.dialogues.some((d) => d.id === 'undercover_bond')).toBe(true);
  });

  it('npc_fei_ye.list_confrontation grants deeper_threat_revealed', () => {
    const npc = NPCS.find((n) => n.id === 'npc_fei_ye');
    const d = npc?.dialogues.find((d) => d.id === 'list_confrontation');
    expect(d?.grants?.flags).toContain('deeper_threat_revealed');
  });

  it('all chapter3 npc dialogue grants reference valid items', () => {
    const ch3DialogueIds = [
      'stele_reading', 'fei_ye_origin', 'fei_ye_origin_wise', 'final_testimony',
      'pavilion_opening', 'identity_admitted', 'list_confrontation', 'undercover_bond',
      'mission_briefing', 'target_details', 'insider_warning',
    ];
    for (const npc of NPCS) {
      for (const d of npc.dialogues.filter((d) => ch3DialogueIds.includes(d.id))) {
        for (const itemId of (d.grants?.items ?? [])) {
          expect(
            allItemIds.has(itemId),
            `npc ${npc.id} dialogue ${d.id} grants unknown item: ${itemId}`
          ).toBe(true);
        }
      }
    }
  });

  it('npc_temple_novice exists with fei_ye_sighting dialogue', () => {
    const npc = NPCS.find((n) => n.id === 'npc_temple_novice');
    expect(npc, 'npc_temple_novice missing').toBeDefined();
    const d = npc?.dialogues.find((d) => d.id === 'fei_ye_sighting_novice');
    expect(d).toBeDefined();
    expect(d?.grants?.flags).toContain('fei_ye_sighted');
  });

  it('npc_fei_ye has three ending closure dialogues', () => {
    const npc = NPCS.find((n) => n.id === 'npc_fei_ye');
    expect(npc?.dialogues.find((d) => d.id === 'truth_ending_dialogue')).toBeDefined();
    expect(npc?.dialogues.find((d) => d.id === 'standoff_ending_dialogue')).toBeDefined();
    expect(npc?.dialogues.find((d) => d.id === 'join_ending_dialogue')).toBeDefined();
  });

  it('evt_hidden_letter exists and grants unsent_letter', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_hidden_letter');
    expect(evt, 'evt_hidden_letter missing').toBeDefined();
    const action = evt?.actions.find((a) => a.id === 'find_unsent_letter');
    expect(action?.grants?.items).toContain('unsent_letter');
  });

  it('completion guarantee: npc_wujue.final_testimony has no stat condition', () => {
    const npc = NPCS.find((n) => n.id === 'npc_wujue');
    const d = npc?.dialogues.find((d) => d.id === 'final_testimony');
    expect(d).toBeDefined();
    expect((d?.condition as Record<string, unknown>)?.strength).toBeUndefined();
    expect((d?.condition as Record<string, unknown>)?.agility).toBeUndefined();
    expect((d?.condition as Record<string, unknown>)?.wisdom).toBeUndefined();
  });

  it('npc_temple_novice has at least 6 dialogues', () => {
    const npc = NPCS.find((n) => n.id === 'npc_temple_novice');
    expect(npc?.dialogues.length).toBeGreaterThanOrEqual(6);
  });

  it('npc_temple_novice has novice_kite_seen dialogue gated on fei_ye_identity_confirmed', () => {
    const npc = NPCS.find((n) => n.id === 'npc_temple_novice');
    const d = npc?.dialogues.find((d) => d.id === 'novice_kite_seen');
    expect(d, 'novice_kite_seen dialogue missing').toBeDefined();
    expect(d?.condition?.flags).toContain('fei_ye_identity_confirmed');
  });

  it('npc_temple_novice has novice_scroll_wonder dialogue requiring tianji_founding_scroll', () => {
    const npc = NPCS.find((n) => n.id === 'npc_temple_novice');
    const d = npc?.dialogues.find((d) => d.id === 'novice_scroll_wonder');
    expect(d, 'novice_scroll_wonder dialogue missing').toBeDefined();
    expect(d?.condition?.has).toContain('tianji_founding_scroll');
  });

  it('npc_wujue has wujue_deepest_secret dialogue gated on wisdom 8', () => {
    const wujue = NPCS.find((n) => n.id === 'npc_wujue');
    expect(wujue).toBeDefined();
    const deepSecret = wujue?.dialogues.find((d) => d.id === 'wujue_deepest_secret');
    expect(deepSecret, 'wujue_deepest_secret dialogue missing').toBeDefined();
    expect(deepSecret?.condition?.wisdom).toBe(8);
  });

  it('npc_fei_ye has fei_ye_upper_truth dialogue gated on wisdom 8 + leyou_inscription', () => {
    const feiYe = NPCS.find((n) => n.id === 'npc_fei_ye');
    expect(feiYe).toBeDefined();
    const upperTruth = feiYe?.dialogues.find((d) => d.id === 'fei_ye_upper_truth');
    expect(upperTruth, 'fei_ye_upper_truth dialogue missing').toBeDefined();
    expect(upperTruth?.condition?.wisdom).toBe(8);
    expect(upperTruth?.condition?.has).toContain('leyou_inscription');
  });

  it('chapter3_truth_path flag is granted by an event action', () => {
    const truthPathEvent = EVENTS.find((e) =>
      e.actions.some((a) => a.grants?.flags?.includes('chapter3_truth_path'))
    );
    expect(truthPathEvent, 'no event grants chapter3_truth_path flag').toBeDefined();
  });
});
