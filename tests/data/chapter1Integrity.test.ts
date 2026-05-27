import { describe, it, expect } from 'vitest';
import maps from '../../src/data/maps/chapter1.json';
import events from '../../src/data/events/chapter1.json';
import npcs from '../../src/data/npcs/chapter1.json';
import items from '../../src/data/items/chapter1.json';

describe('chapter1 data integrity', () => {
  const allEventIds = new Set(events.map((e: { id: string }) => e.id));
  const allNpcIds = new Set(npcs.map((n: { id: string }) => n.id));
  const allItemIds = new Set(items.map((i: { id: string }) => i.id));
  const allRoomIds = new Set((maps[0] as { rooms: { id: string }[] }).rooms.map((r) => r.id));

  it('all interactables reference valid events or npcs', () => {
    for (const room of (maps[0] as any).rooms) {
      for (const ia of room.interactables as string[]) {
        if (ia.startsWith('evt_'))
          expect(allEventIds.has(ia), `room ${room.id}: missing event ${ia}`).toBe(true);
        if (ia.startsWith('npc_'))
          expect(allNpcIds.has(ia), `room ${room.id}: missing npc ${ia}`).toBe(true);
      }
    }
  });

  it('all room exits reference valid rooms', () => {
    for (const room of (maps[0] as any).rooms) {
      for (const exit of room.exits as string[]) {
        expect(allRoomIds.has(exit), `room ${room.id} has invalid exit: ${exit}`).toBe(true);
      }
    }
  });

  it('all event action grants reference valid items', () => {
    for (const event of events as any[]) {
      for (const action of event.actions) {
        for (const itemId of (action.grants?.items ?? []) as string[]) {
          expect(
            allItemIds.has(itemId),
            `event ${event.id} action ${action.id} grants unknown item: ${itemId}`
          ).toBe(true);
        }
      }
    }
  });

  it('all npc dialogue grants reference valid items', () => {
    for (const npc of npcs as any[]) {
      for (const dialogue of npc.dialogues) {
        for (const itemId of (dialogue.grants?.items ?? []) as string[]) {
          expect(
            allItemIds.has(itemId),
            `npc ${npc.id} dialogue ${dialogue.id} grants unknown item: ${itemId}`
          ).toBe(true);
        }
      }
    }
  });

  it('back_alley room exists with correct interactables', () => {
    const room = (maps[0] as any).rooms.find((r: any) => r.id === 'back_alley');
    expect(room, 'back_alley room missing').toBeDefined();
    expect(room.interactables).toContain('npc_old_beggar');
    expect(room.interactables).toContain('npc_merchant_zhou');
    expect(room.interactables).toContain('evt_alley_marks');
    expect(room.interactables).toContain('evt_cargo_remnants');
    expect(room.exits).toContain('forest');
  });

  it('forest room has back_alley as exit', () => {
    const forest = (maps[0] as any).rooms.find((r: any) => r.id === 'forest');
    expect(forest.exits).toContain('back_alley');
  });

  it('new npcs exist with required dialogues', () => {
    const beggar = (npcs as any[]).find((n) => n.id === 'npc_old_beggar');
    expect(beggar, 'npc_old_beggar missing').toBeDefined();
    expect(beggar.dialogues.some((d: any) => d.id === 'first_meet')).toBe(true);
    expect(beggar.dialogues.some((d: any) => d.id === 'beg_for_wine')).toBe(true);
    expect(beggar.dialogues.some((d: any) => d.id === 'tell_story')).toBe(true);
    expect(beggar.dialogues.some((d: any) => d.id === 'after_told')).toBe(true);

    const merchant = (npcs as any[]).find((n) => n.id === 'npc_merchant_zhou');
    expect(merchant, 'npc_merchant_zhou missing').toBeDefined();
    expect(merchant.dialogues.some((d: any) => d.id === 'first_meet')).toBe(true);
    expect(merchant.dialogues.some((d: any) => d.id === 'mention_langpeng')).toBe(true);
    expect(merchant.dialogues.some((d: any) => d.id === 'after_talked')).toBe(true);
  });

  it('fei_ye has alley_intel dialogue with correct condition and grants', () => {
    const fei = (npcs as any[]).find((n) => n.id === 'npc_fei_ye');
    const d = fei.dialogues.find((d: any) => d.id === 'alley_intel');
    expect(d, 'alley_intel dialogue missing').toBeDefined();
    expect(d.condition.flags).toContain('langpeng_discovered');
    expect(d.condition.has).toContain('alley_rubbing');
    expect(d.grants.flags).toContain('fei_ye_trust_deepened');
    expect(d.grants.items).toContain('dafei_inner_token');
  });

  it('innkeeper has manifest_inquiry dialogue', () => {
    const li = (npcs as any[]).find((n) => n.id === 'npc_innkeeper_li_fu');
    const d = li.dialogues.find((d: any) => d.id === 'manifest_inquiry');
    expect(d, 'manifest_inquiry dialogue missing from innkeeper').toBeDefined();
    expect(d.grants.flags).toContain('merchant_clue_confirmed');
    expect(d.grants.flags).toContain('langpeng_active');
  });

  it('white_stranger has manifest_inquiry and langpeng_boss_hint dialogues', () => {
    const ws = (npcs as any[]).find((n) => n.id === 'npc_white_stranger');
    expect(ws.dialogues.some((d: any) => d.id === 'manifest_inquiry')).toBe(true);
    expect(ws.dialogues.some((d: any) => d.id === 'langpeng_boss_hint')).toBe(true);
  });

  it('new items exist', () => {
    const ids = ['alley_rubbing', 'dafei_inner_token', 'extortion_note', 'merchant_manifest'];
    for (const id of ids) {
      expect(allItemIds.has(id), `missing item: ${id}`).toBe(true);
    }
  });

  it('alley_rubbing grants set langpeng_discovered when wisdom path taken', () => {
    const evt = (events as any[]).find((e) => e.id === 'evt_alley_marks');
    expect(evt, 'evt_alley_marks missing').toBeDefined();
    const wiseAction = evt.actions.find((a: any) => a.id === 'examine_marks_wise');
    expect(wiseAction.grants.flags).toContain('langpeng_discovered');
    expect(wiseAction.grants.flags).toContain('alley_marks_found');
    expect(wiseAction.grants.items).toContain('alley_rubbing');
  });

  it('evt_cargo_remnants wise path sets manifest_decoded', () => {
    const evt = (events as any[]).find((e) => e.id === 'evt_cargo_remnants');
    expect(evt, 'evt_cargo_remnants missing').toBeDefined();
    const wise = evt.actions.find((a: any) => a.id === 'search_wise');
    expect(wise.grants.flags).toContain('manifest_decoded');
    expect(wise.grants.items).toContain('merchant_manifest');
  });
});
