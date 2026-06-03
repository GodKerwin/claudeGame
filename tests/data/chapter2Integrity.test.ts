import { describe, it, expect } from 'vitest';
import { MAPS, ITEMS, EVENTS, NPCS } from '../../src/data/loader';

describe('chapter2 map and item integrity', () => {
  const ch2Map = MAPS.find((m) => m.id === 'chapter2');
  const allRoomIds = new Set(ch2Map?.rooms.map((r) => r.id) ?? []);
  const allItemIds = new Set(ITEMS.map((i) => i.id));

  it('chapter2 map exists with correct room count', () => {
    expect(ch2Map, 'chapter2 map missing').toBeDefined();
    expect(ch2Map?.rooms.length).toBeGreaterThanOrEqual(7);
  });

  it('yongning_nightmarket room exists with correct structure', () => {
    const room = ch2Map?.rooms.find((r) => r.id === 'yongning_nightmarket');
    expect(room, 'yongning_nightmarket missing').toBeDefined();
    expect(room?.requires?.flags).toContain('langpeng_discovered');
    expect(room?.exits).toContain('east_market_entrance');
    expect(room?.revisitEvents?.length).toBeGreaterThanOrEqual(1);
  });

  it('nightmarket items exist', () => {
    const ids = ['nightmarket_ledger', 'concealed_dagger', 'black_channel_intel'];
    for (const id of ids) {
      expect(allItemIds.has(id), `missing item: ${id}`).toBe(true);
    }
  });

  it('east_market_entrance exits include yongning_nightmarket', () => {
    const room = ch2Map?.rooms.find((r) => r.id === 'east_market_entrance');
    expect(room?.exits).toContain('yongning_nightmarket');
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

  it('all 11 chapter2 items exist', () => {
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
      'owner_testimony',
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

  it('east_market_entrance has at least 1 revisitEvent with sentinel flag', () => {
    const room = ch2Map?.rooms.find((r) => r.id === 'east_market_entrance');
    expect(room?.revisitEvents?.length).toBeGreaterThanOrEqual(1);
    const rev = room?.revisitEvents?.[0];
    expect(rev?.grants?.flags).toBeDefined();
    expect(rev?.requires?.flags_absent).toBeDefined();
  });

  it('antique_shop has at least 1 revisitEvent with sentinel flag', () => {
    const room = ch2Map?.rooms.find((r) => r.id === 'antique_shop');
    expect(room?.revisitEvents?.length).toBeGreaterThanOrEqual(1);
    const rev = room?.revisitEvents?.[0];
    expect(rev?.grants?.flags).toBeDefined();
  });

  it('imperial_teahouse has at least 1 revisitEvent with sentinel flag', () => {
    const room = ch2Map?.rooms.find((r) => r.id === 'imperial_teahouse');
    expect(room?.revisitEvents?.length).toBeGreaterThanOrEqual(1);
    const rev = room?.revisitEvents?.[0];
    expect(rev?.grants?.flags).toBeDefined();
  });
});

describe('chapter2 event integrity', () => {
  const allEventIds = new Set(EVENTS.map((e) => e.id));
  const allItemIds = new Set(ITEMS.map((i) => i.id));
  const allNpcIds = new Set(NPCS.map((n) => n.id));
  const ch2Map = MAPS.find((m) => m.id === 'chapter2');

  it('all 15 chapter2 events exist', () => {
    const expected = [
      'evt_market_notice', 'evt_merchant_gossip',
      'evt_medicine_shelf', 'evt_prescription_book',
      'evt_appraise_token', 'evt_buyer_ledger',
      'evt_monk_cell', 'evt_temple_mural',
      'evt_hideout_search', 'evt_captive_note',
      'evt_teahouse_ambush', 'evt_li_mao_encounter',
      'evt_bounty_investigation', 'evt_hidden_safe', 'evt_prisoner_testimony',
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

describe('chapter2 npc integrity', () => {
  const allNpcIds = new Set(NPCS.map((n) => n.id));
  const allItemIds = new Set(ITEMS.map((i) => i.id));

  it('all 5 chapter2 npcs exist', () => {
    const expected = ['npc_wujue', 'npc_langpeng_scout', 'npc_buyer_contact', 'npc_li_mao', 'npc_huichuntang_owner'];
    for (const id of expected) {
      expect(allNpcIds.has(id), `missing npc: ${id}`).toBe(true);
    }
  });

  it('npc_langpeng_scout has 3 stat-gated dialogues all granting langpeng_trail', () => {
    const npc = NPCS.find((n) => n.id === 'npc_langpeng_scout');
    expect(npc).toBeDefined();
    const intimidate = npc?.dialogues.find((d) => d.id === 'intimidate');
    const tail = npc?.dialogues.find((d) => d.id === 'tail');
    const probe = npc?.dialogues.find((d) => d.id === 'probe');
    expect(intimidate?.grants?.flags).toContain('langpeng_trail');
    expect(tail?.grants?.flags).toContain('langpeng_trail');
    expect(probe?.grants?.flags).toContain('langpeng_trail');
  });

  it('npc_li_mao has recruitment_offer dialogue granting tianji_recruit_offered', () => {
    const npc = NPCS.find((n) => n.id === 'npc_li_mao');
    expect(npc).toBeDefined();
    const d = npc?.dialogues.find((d) => d.id === 'recruitment_offer');
    expect(d).toBeDefined();
    expect(d?.grants?.flags).toContain('tianji_recruit_offered');
  });

  it('npc_wujue has true_identity dialogue granting wujue_tianji_revealed', () => {
    const npc = NPCS.find((n) => n.id === 'npc_wujue');
    expect(npc).toBeDefined();
    const d = npc?.dialogues.find((d) => d.id === 'true_identity');
    expect(d).toBeDefined();
    expect(d?.grants?.flags).toContain('wujue_tianji_revealed');
  });

  it('all chapter2 npc dialogue grants reference valid items', () => {
    const ch2NpcIds = ['npc_wujue', 'npc_langpeng_scout', 'npc_buyer_contact', 'npc_li_mao'];
    for (const npcId of ch2NpcIds) {
      const npc = NPCS.find((n) => n.id === npcId);
      if (!npc) continue;
      for (const d of npc.dialogues) {
        for (const itemId of (d.grants?.items ?? [])) {
          expect(allItemIds.has(itemId), `npc ${npcId} dialogue ${d.id} grants unknown item: ${itemId}`).toBe(true);
        }
        if (!d.choices) continue;
        for (const c of d.choices) {
          for (const itemId of (c.grants?.items ?? [])) {
            expect(allItemIds.has(itemId), `npc ${npcId} dialogue ${d.id} choice ${c.id} grants unknown item: ${itemId}`).toBe(true);
          }
        }
      }
    }
  });

  it('reachability: kite_identity_clue available to 三教九流 via evt_buyer_ledger', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_buyer_ledger');
    const action = evt?.actions.find((a) => a.id === 'decode_kite_mark');
    expect(action, 'decode_kite_mark action missing from evt_buyer_ledger').toBeDefined();
    expect(action?.requires?.talent).toBe('三教九流');
    expect(action?.grants?.flags).toContain('kite_identity_clue');
  });

  it('reachability: kite_identity_clue available via trust-based scout dialogue', () => {
    const npc = NPCS.find((n) => n.id === 'npc_langpeng_scout');
    const d = npc?.dialogues.find((d) => d.id === 'kite_clue_exchange');
    expect(d, 'kite_clue_exchange dialogue missing').toBeDefined();
    expect(d?.grants?.flags).toContain('kite_identity_clue');
  });

  it('reachability: poison_residue_sample available via constitution>=6', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_medicine_shelf');
    const action = evt?.actions.find((a) => a.id === 'constitution_smell');
    expect(action, 'constitution_smell action missing').toBeDefined();
    expect(action?.requires?.constitution).toBeLessThanOrEqual(6);
    expect(action?.grants?.items).toContain('poison_residue_sample');
  });

  it('reachability: poison_residue_sample available via 三教九流', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_medicine_shelf');
    const action = evt?.actions.find((a) => a.id === 'thief_poison_sniff');
    expect(action, 'thief_poison_sniff action missing').toBeDefined();
    expect(action?.requires?.talent).toBe('三教九流');
    expect(action?.grants?.items).toContain('poison_residue_sample');
  });

  it('completion guarantee: all templates reach at least chapter2_release_ending via langpeng_trail', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_captive_note');
    const readNote = evt?.actions.find((a) => a.id === 'read_note');
    expect(readNote?.requires).toBeNull();
    expect(readNote?.grants?.flags).toContain('langpeng_trail');

    const teahouse = MAPS.find((m) => m.id === 'chapter2')
      ?.rooms.find((r) => r.id === 'imperial_teahouse');
    expect(teahouse?.requires?.flags).toContain('langpeng_trail');

    const release = EVENTS.find((e) => e.id === 'evt_li_mao_encounter')
      ?.actions.find((a) => a.id === 'release_ending');
    expect(release?.requires?.flags).toContain('langpeng_trail');
  });
});
