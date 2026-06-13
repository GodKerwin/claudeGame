import { describe, it, expect } from 'vitest';
import {
  MAPS, EVENTS, NPCS, ITEMS, SYNTHESES, SUSPECT_PROFILES,
} from '../../src/data/loader';

/**
 * 全章节通用交叉引用完整性测试。
 * 不针对具体剧情，而是确保任何章节（含未来新增）的数据引用都不会断裂。
 * 这是为了拦截「profile npcId 写错」「房间出口指向不存在的房间」这类
 * 在单章节硬编码测试中容易遗漏的引用错误。
 */
describe('cross-reference integrity (all chapters)', () => {
  const roomIds = new Set(MAPS.flatMap((m) => m.rooms.map((r) => r.id)));
  const eventIds = new Set(EVENTS.map((e) => e.id));
  const npcIds = new Set(NPCS.map((n) => n.id));
  const itemIds = new Set(ITEMS.map((i) => i.id));

  it('every room exit references an existing room', () => {
    for (const m of MAPS) {
      for (const r of m.rooms) {
        for (const ex of r.exits ?? []) {
          expect(roomIds.has(ex), `room ${r.id} -> invalid exit ${ex}`).toBe(true);
        }
      }
    }
  });

  it('every room interactable references an existing event or npc', () => {
    for (const m of MAPS) {
      for (const r of m.rooms) {
        for (const ia of r.interactables ?? []) {
          if (ia.startsWith('evt_'))
            expect(eventIds.has(ia), `room ${r.id} -> missing event ${ia}`).toBe(true);
          if (ia.startsWith('npc_'))
            expect(npcIds.has(ia), `room ${r.id} -> missing npc ${ia}`).toBe(true);
        }
      }
    }
  });

  it('every event action grant/require references existing items', () => {
    for (const e of EVENTS) {
      for (const a of e.actions ?? []) {
        for (const it of a.grants?.items ?? [])
          expect(itemIds.has(it), `event ${e.id}/${a.id} grants missing item ${it}`).toBe(true);
        for (const it of a.requires?.has ?? [])
          expect(itemIds.has(it), `event ${e.id}/${a.id} requires missing item ${it}`).toBe(true);
      }
    }
  });

  it('every npc dialogue grant/require references existing items', () => {
    for (const n of NPCS) {
      for (const d of n.dialogues ?? []) {
        for (const it of d.grants?.items ?? [])
          expect(itemIds.has(it), `npc ${n.id}/${d.id} grants missing item ${it}`).toBe(true);
        for (const it of d.condition?.has ?? [])
          expect(itemIds.has(it), `npc ${n.id}/${d.id} requires missing item ${it}`).toBe(true);
      }
    }
  });

  it('every synthesis references existing input items', () => {
    for (const s of SYNTHESES) {
      expect(itemIds.has(s.itemA), `synthesis ${s.id} itemA missing ${s.itemA}`).toBe(true);
      expect(itemIds.has(s.itemB), `synthesis ${s.id} itemB missing ${s.itemB}`).toBe(true);
    }
  });

  it('every suspect profile references an existing npc', () => {
    for (const p of SUSPECT_PROFILES) {
      expect(npcIds.has(p.npcId), `profile npcId ${p.npcId} not found in NPCS`).toBe(true);
    }
  });

  it('no duplicate ids within each entity collection', () => {
    const dupes = (ids: string[]) =>
      ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes(MAPS.flatMap((m) => m.rooms.map((r) => r.id))), 'duplicate room ids').toEqual([]);
    expect(dupes(EVENTS.map((e) => e.id)), 'duplicate event ids').toEqual([]);
    expect(dupes(NPCS.map((n) => n.id)), 'duplicate npc ids').toEqual([]);
    expect(dupes(ITEMS.map((i) => i.id)), 'duplicate item ids').toEqual([]);
  });
});
