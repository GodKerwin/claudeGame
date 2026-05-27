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
});
