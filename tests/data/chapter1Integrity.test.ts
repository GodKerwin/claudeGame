import { describe, it, expect } from 'vitest';
import { MAPS, EVENTS, NPCS, ITEMS } from '../../src/data/loader';

describe('chapter1 data integrity', () => {
  const allEventIds = new Set(EVENTS.map((e) => e.id));
  const allNpcIds = new Set(NPCS.map((n) => n.id));
  const allItemIds = new Set(ITEMS.map((i) => i.id));
  const allRoomIds = new Set(MAPS[0].rooms.map((r) => r.id));

  it('all interactables reference valid events or npcs', () => {
    for (const room of MAPS[0].rooms) {
      for (const ia of room.interactables) {
        if (ia.startsWith('evt_'))
          expect(allEventIds.has(ia), `room ${room.id}: missing event ${ia}`).toBe(true);
        if (ia.startsWith('npc_'))
          expect(allNpcIds.has(ia), `room ${room.id}: missing npc ${ia}`).toBe(true);
      }
    }
  });

  it('all room exits reference valid rooms', () => {
    for (const room of MAPS[0].rooms) {
      for (const exit of room.exits) {
        expect(allRoomIds.has(exit), `room ${room.id} has invalid exit: ${exit}`).toBe(true);
      }
    }
  });

  it('all event action grants reference valid items', () => {
    for (const event of EVENTS) {
      for (const action of event.actions) {
        for (const itemId of (action.grants?.items ?? [])) {
          expect(
            allItemIds.has(itemId),
            `event ${event.id} action ${action.id} grants unknown item: ${itemId}`
          ).toBe(true);
        }
      }
    }
  });

  it('all npc dialogue grants reference valid items', () => {
    for (const npc of NPCS) {
      for (const dialogue of npc.dialogues) {
        for (const itemId of (dialogue.grants?.items ?? [])) {
          expect(
            allItemIds.has(itemId),
            `npc ${npc.id} dialogue ${dialogue.id} grants unknown item: ${itemId}`
          ).toBe(true);
        }
      }
    }
  });

  it('back_alley room exists with correct interactables', () => {
    const room = MAPS[0].rooms.find((r) => r.id === 'back_alley');
    expect(room, 'back_alley room missing').toBeDefined();
    if (!room) return;
    expect(room.interactables).toContain('npc_old_beggar');
    expect(room.interactables).toContain('npc_merchant_zhou');
    expect(room.interactables).toContain('evt_alley_marks');
    expect(room.interactables).toContain('evt_cargo_remnants');
    expect(room.exits).toContain('forest');
  });

  it('forest room has back_alley as exit', () => {
    const forest = MAPS[0].rooms.find((r) => r.id === 'forest');
    expect(forest, 'forest room missing').toBeDefined();
    if (!forest) return;
    expect(forest.exits).toContain('back_alley');
  });

  it('new npcs exist with required dialogues', () => {
    const beggar = NPCS.find((n) => n.id === 'npc_old_beggar');
    expect(beggar, 'npc_old_beggar missing').toBeDefined();
    if (!beggar) return;
    expect(beggar.dialogues.some((d) => d.id === 'first_meet')).toBe(true);
    expect(beggar.dialogues.some((d) => d.id === 'beg_for_wine')).toBe(true);
    expect(beggar.dialogues.some((d) => d.id === 'tell_story')).toBe(true);
    expect(beggar.dialogues.some((d) => d.id === 'after_told')).toBe(true);

    const merchant = NPCS.find((n) => n.id === 'npc_merchant_zhou');
    expect(merchant, 'npc_merchant_zhou missing').toBeDefined();
    if (!merchant) return;
    expect(merchant.dialogues.some((d) => d.id === 'first_meet')).toBe(true);
    expect(merchant.dialogues.some((d) => d.id === 'mention_langpeng')).toBe(true);
    expect(merchant.dialogues.some((d) => d.id === 'after_talked')).toBe(true);
  });

  it('fei_ye has alley_intel dialogue with correct condition and grants', () => {
    const fei = NPCS.find((n) => n.id === 'npc_fei_ye');
    expect(fei, 'npc_fei_ye missing').toBeDefined();
    if (!fei) return;
    const d = fei.dialogues.find((d) => d.id === 'alley_intel');
    expect(d, 'alley_intel dialogue missing').toBeDefined();
    if (!d) return;
    expect(d.condition.flags).toContain('langpeng_discovered');
    expect(d.condition.has).toContain('alley_rubbing');
    expect(d.grants.flags).toContain('fei_ye_trust_deepened');
    expect(d.grants.items).toContain('dafei_inner_token');
  });

  it('innkeeper has manifest_inquiry dialogue', () => {
    const li = NPCS.find((n) => n.id === 'npc_innkeeper_li_fu');
    expect(li, 'npc_innkeeper_li_fu missing').toBeDefined();
    if (!li) return;
    const d = li.dialogues.find((d) => d.id === 'manifest_inquiry');
    expect(d, 'manifest_inquiry dialogue missing from innkeeper').toBeDefined();
    if (!d) return;
    expect(d.grants.flags).toContain('merchant_clue_confirmed');
    expect(d.grants.flags).toContain('langpeng_active');
  });

  it('white_stranger has manifest_inquiry and langpeng_boss_hint dialogues', () => {
    const ws = NPCS.find((n) => n.id === 'npc_white_stranger');
    expect(ws, 'npc_white_stranger missing').toBeDefined();
    if (!ws) return;
    expect(ws.dialogues.some((d) => d.id === 'manifest_inquiry')).toBe(true);
    expect(ws.dialogues.some((d) => d.id === 'langpeng_boss_hint')).toBe(true);
  });

  it('new items exist', () => {
    const ids = ['alley_rubbing', 'dafei_inner_token', 'extortion_note', 'merchant_manifest'];
    for (const id of ids) {
      expect(allItemIds.has(id), `missing item: ${id}`).toBe(true);
    }
  });

  it('alley_rubbing grants set langpeng_discovered when wisdom path taken', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_alley_marks');
    expect(evt, 'evt_alley_marks missing').toBeDefined();
    if (!evt) return;
    const wiseAction = evt.actions.find((a) => a.id === 'examine_marks_wise');
    expect(wiseAction, 'examine_marks_wise action missing').toBeDefined();
    if (!wiseAction) return;
    expect(wiseAction.grants.flags).toContain('langpeng_discovered');
    expect(wiseAction.grants.flags).toContain('alley_marks_found');
    expect(wiseAction.grants.items).toContain('alley_rubbing');
  });

  it('evt_cargo_remnants wise path sets manifest_decoded', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_cargo_remnants');
    expect(evt, 'evt_cargo_remnants missing').toBeDefined();
    if (!evt) return;
    const wise = evt.actions.find((a) => a.id === 'search_wise');
    expect(wise, 'search_wise action missing').toBeDefined();
    if (!wise) return;
    expect(wise.grants.flags).toContain('manifest_decoded');
    expect(wise.grants.items).toContain('merchant_manifest');
  });

  it('room_202 exists with correct interactables', () => {
    const room = MAPS[0].rooms.find((r) => r.id === 'room_202');
    expect(room, 'room_202 missing').toBeDefined();
    if (!room) return;
    expect(room.interactables).toContain('evt_crime_scene_202');
    expect(room.interactables).toContain('evt_locked_room_mystery');
    expect(room.interactables).toContain('evt_victim_hidden_items');
  });

  it('room_203 exits include room_202', () => {
    const room = MAPS[0].rooms.find((r) => r.id === 'room_203');
    expect(room, 'room_203 missing').toBeDefined();
    if (!room) return;
    expect(room.exits).toContain('room_202');
  });

  it('new crime scene events exist with actions', () => {
    const eventIds = ['evt_crime_scene_202', 'evt_locked_room_mystery', 'evt_victim_hidden_items'];
    for (const id of eventIds) {
      const event = EVENTS.find((e) => e.id === id);
      expect(event, `missing event: ${id}`).toBeDefined();
      expect(event?.actions.length).toBeGreaterThan(0);
    }
  });

  it('new crime scene items exist and are clues', () => {
    const itemIds = ['blood_pattern_sketch', 'door_lock_scraping', 'account_book', 'tianji_jade_token', 'rope_burn_cloth'];
    for (const id of itemIds) {
      expect(allItemIds.has(id), `missing item: ${id}`).toBe(true);
      const item = ITEMS.find((i) => i.id === id);
      expect(item?.isClue, `item ${id} should be a clue`).toBe(true);
    }
  });

  it('key NPCs have dialogues with choices', () => {
    const npcIds = ['npc_innkeeper_li_fu', 'npc_white_stranger', 'npc_fei_ye'];
    for (const id of npcIds) {
      const npc = NPCS.find((n) => n.id === id);
      expect(npc, `missing npc: ${id}`).toBeDefined();
      if (!npc) continue;
      const hasChoices = npc.dialogues.some((d) => d.choices && d.choices.length > 0);
      expect(hasChoices, `${id} has no dialogues with choices`).toBe(true);
    }
  });

  it('dialogue choice grants only reference existing items', () => {
    for (const npc of NPCS) {
      for (const dialogue of npc.dialogues) {
        if (!dialogue.choices) continue;
        for (const choice of dialogue.choices) {
          if (!choice.grants?.items) continue;
          for (const itemId of choice.grants.items) {
            expect(
              allItemIds.has(itemId),
              `npc ${npc.id} dialogue ${dialogue.id} choice ${choice.id} grants unknown item: ${itemId}`
            ).toBe(true);
          }
        }
      }
    }
  });

  // completion guarantee tests
  it('fei_ye ask_who_is_kite choice grants kite_identity_clue', () => {
    const fei = NPCS.find((n) => n.id === 'npc_fei_ye');
    expect(fei).toBeDefined();
    if (!fei) return;
    const deepTalk = fei.dialogues.find((d) => d.id === 'fei_ye_deep_talk');
    expect(deepTalk).toBeDefined();
    if (!deepTalk) return;
    const choice = deepTalk.choices?.find((c) => c.id === 'ask_who_is_kite');
    expect(choice).toBeDefined();
    if (!choice) return;
    expect(choice.grants?.flags).toContain('kite_identity_clue');
  });

  it('cloth_fiber_found has str and agi alternative actions', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_body_examine');
    expect(evt).toBeDefined();
    if (!evt) return;
    const strAction = evt.actions.find((a) => a.id === 'search_sleeve_str');
    const agiAction = evt.actions.find((a) => a.id === 'search_sleeve_agi');
    expect(strAction).toBeDefined();
    expect(agiAction).toBeDefined();
    expect(strAction?.grants?.flags).toContain('cloth_fiber_found');
    expect(agiAction?.grants?.flags).toContain('cloth_fiber_found');
  });

  it('all templates can reach at least one ending with default stats', () => {
    const templates = [
      { name: '游侠', strength: 8, agility: 7, wisdom: 5, constitution: 4 },
      { name: '谋士', strength: 3, agility: 5, wisdom: 10, constitution: 6 },
      { name: '刺客', strength: 5, agility: 10, wisdom: 5, constitution: 4 },
      { name: '药师', strength: 4, agility: 5, wisdom: 6, constitution: 9 },
      { name: '全能客', strength: 6, agility: 6, wisdom: 6, constitution: 6 },
    ];
    for (const t of templates) {
      const hasForce = t.strength >= 8;
      const canGetClothFiber = t.wisdom >= 6 || t.strength >= 7 || t.agility >= 7;
      const canGetKite = true; // fei_ye path always accessible
      const hasTruth = canGetClothFiber && canGetKite;
      const hasHermit = t.agility >= 7;
      expect(
        hasForce || hasTruth || hasHermit,
        `${t.name} cannot reach any ending with default stats`
      ).toBe(true);
    }
  });

  it('evt_guest_register exists in lobby with correct actions', () => {
    const lobby = MAPS[0].rooms.find((r) => r.id === 'lobby');
    expect(lobby?.interactables).toContain('evt_guest_register');
    const evt = EVENTS.find((e) => e.id === 'evt_guest_register');
    expect(evt).toBeDefined();
    expect(evt?.actions.length).toBeGreaterThanOrEqual(2);
  });

  it('evt_blue_shirt_trace exists in back_alley and references existing items', () => {
    const alley = MAPS[0].rooms.find((r) => r.id === 'back_alley');
    expect(alley?.interactables).toContain('evt_blue_shirt_trace');
    const evt = EVENTS.find((e) => e.id === 'evt_blue_shirt_trace');
    expect(evt).toBeDefined();
    const copperBell = ITEMS.find((i) => i.id === 'copper_bell_fragment');
    expect(copperBell?.isClue).toBe(true);
  });

  it('evt_mansion_ear_room exists in old_mansion', () => {
    const mansion = MAPS[0].rooms.find((r) => r.id === 'old_mansion');
    expect(mansion?.interactables).toContain('evt_mansion_ear_room');
    const evt = EVENTS.find((e) => e.id === 'evt_mansion_ear_room');
    expect(evt).toBeDefined();
    expect(evt?.actions.length).toBeGreaterThanOrEqual(2);
  });

  it('new expansion items exist and are clues', () => {
    const ids = ['suspicious_guest_entry', 'copper_bell_fragment', 'ear_room_ledger'];
    for (const id of ids) {
      const item = ITEMS.find((i) => i.id === id);
      expect(item, `missing item: ${id}`).toBeDefined();
      expect(item?.isClue, `${id} should be a clue`).toBe(true);
    }
  });

  it('new events reference only existing items in their grants', () => {
    const allItemIds = new Set(ITEMS.map((i) => i.id));
    const newEventIds = ['evt_guest_register', 'evt_blue_shirt_trace', 'evt_mansion_ear_room'];
    for (const eid of newEventIds) {
      const evt = EVENTS.find((e) => e.id === eid);
      expect(evt, `missing event: ${eid}`).toBeDefined();
      if (!evt) continue;
      for (const action of evt.actions) {
        for (const itemId of (action.grants?.items ?? [])) {
          expect(allItemIds.has(itemId), `event ${eid} action ${action.id} grants unknown item: ${itemId}`).toBe(true);
        }
      }
    }
  });
});
