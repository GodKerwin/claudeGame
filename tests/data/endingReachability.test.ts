import { describe, it, expect } from 'vitest';
import { MAPS, EVENTS, NPCS, SYNTHESES } from '../../src/data/loader';

/** 所有可被授予的 flag（含引擎在运行时注入的章节/线索门槛 flag）。 */
function collectGrantableFlags(): Set<string> {
  const granted = new Set<string>();
  EVENTS.forEach((e) => {
    e.grants?.flags?.forEach((f) => granted.add(f));
    e.actions.forEach((a) => a.grants?.flags?.forEach((f) => granted.add(f)));
  });
  NPCS.forEach((n) => n.dialogues.forEach((d) => d.grants?.flags?.forEach((f) => granted.add(f))));
  MAPS.forEach((m) => m.rooms.forEach((r) => {
    r.revisitEvents?.forEach((re) => re.grants?.flags?.forEach((f) => granted.add(f)));
  }));
  SYNTHESES.forEach((s) => s.grants?.flags?.forEach((f) => granted.add(f)));
  // 引擎运行时注入（见 Game.tsx 线索门槛 / ChapterEnd.tsx 章节切换）
  ['chapter1_started', 'chapter2_started', 'chapter3_started', 'chapter4_started', 'chapter5_started',
   'ch1_clues_sufficient', 'ch2_clues_sufficient', 'ch3_clues_sufficient',
   'ch4_clues_sufficient', 'ch5_clues_sufficient'].forEach((f) => granted.add(f));
  return granted;
}

/** 从起点 BFS，遵守 requires.flags（只有当门槛 flag 可被授予时才视为可通行）。 */
function reachableRooms(mapId: string, start: string, grantable: Set<string>): Set<string> {
  const map = MAPS.find((m) => m.id === mapId);
  const rooms = new Map((map?.rooms ?? []).map((r) => [r.id, r]));
  const reach = new Set<string>();
  const queue = [start];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (reach.has(cur)) continue;
    const room = rooms.get(cur);
    if (!room) continue;
    reach.add(cur);
    for (const ex of room.exits) {
      const target = rooms.get(ex);
      if (!target) continue;
      const need = target.requires?.flags ?? [];
      if (need.every((f) => grantable.has(f)) && !reach.has(ex)) queue.push(ex);
    }
  }
  return reach;
}

describe('ending reachability', () => {
  const ch2Map = MAPS.find((m) => m.id === 'chapter2');
  const ch3Map = MAPS.find((m) => m.id === 'chapter3');

  it('all chapter2 room exits form a connected graph from east_market_entrance', () => {
    if (!ch2Map) return;
    const allRoomIds = new Set(ch2Map.rooms.map((r) => r.id));
    const reachable = new Set<string>();
    const queue = ['east_market_entrance'];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (reachable.has(current)) continue;
      reachable.add(current);
      const room = ch2Map.rooms.find((r) => r.id === current);
      if (room) {
        for (const exit of room.exits) {
          if (!reachable.has(exit)) queue.push(exit);
        }
      }
    }
    for (const id of allRoomIds) {
      expect(reachable.has(id), `ch2 room ${id} not reachable from east_market_entrance`).toBe(true);
    }
  });

  it('all chapter3 room exits form a connected graph from dayan_pagoda', () => {
    if (!ch3Map) return;
    const allRoomIds = new Set(ch3Map.rooms.map((r) => r.id));
    const reachable = new Set<string>();
    const queue = ['dayan_pagoda'];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (reachable.has(current)) continue;
      reachable.add(current);
      const room = ch3Map.rooms.find((r) => r.id === current);
      if (room) {
        for (const exit of room.exits) {
          if (!reachable.has(exit)) queue.push(exit);
        }
      }
    }
    for (const id of allRoomIds) {
      expect(reachable.has(id), `ch3 room ${id} not reachable from dayan_pagoda`).toBe(true);
    }
  });

  it('chapter2_arrest_ending flag is grantable via events', () => {
    const allEventFlags = new Set<string>();
    EVENTS.forEach((e) => e.actions.forEach((a) => a.grants?.flags?.forEach((f) => allEventFlags.add(f))));
    expect(allEventFlags.has('chapter2_arrest_ending'), 'chapter2_arrest_ending flag is never granted').toBe(true);
  });

  it('chapter2_release_ending flag is grantable via events', () => {
    const allEventFlags = new Set<string>();
    EVENTS.forEach((e) => e.actions.forEach((a) => a.grants?.flags?.forEach((f) => allEventFlags.add(f))));
    expect(allEventFlags.has('chapter2_release_ending'), 'chapter2_release_ending flag is never granted').toBe(true);
  });

  it('chapter2_join_ending flag is grantable via events', () => {
    const allEventFlags = new Set<string>();
    EVENTS.forEach((e) => e.actions.forEach((a) => a.grants?.flags?.forEach((f) => allEventFlags.add(f))));
    expect(allEventFlags.has('chapter2_join_ending'), 'chapter2_join_ending flag is never granted').toBe(true);
  });

  it('chapter3_truth_ending flag is grantable via events', () => {
    const allEventFlags = new Set<string>();
    EVENTS.forEach((e) => e.actions.forEach((a) => a.grants?.flags?.forEach((f) => allEventFlags.add(f))));
    expect(allEventFlags.has('chapter3_truth_ending'), 'chapter3_truth_ending flag is never granted').toBe(true);
  });

  it('chapter3_standoff_ending flag is grantable via events', () => {
    const allEventFlags = new Set<string>();
    EVENTS.forEach((e) => e.actions.forEach((a) => a.grants?.flags?.forEach((f) => allEventFlags.add(f))));
    expect(allEventFlags.has('chapter3_standoff_ending'), 'chapter3_standoff_ending flag is never granted').toBe(true);
  });

  it('chapter3_join_ending flag is grantable via events', () => {
    const allEventFlags = new Set<string>();
    EVENTS.forEach((e) => e.actions.forEach((a) => a.grants?.flags?.forEach((f) => allEventFlags.add(f))));
    expect(allEventFlags.has('chapter3_join_ending'), 'chapter3_join_ending flag is never granted').toBe(true);
  });

  it('censorate_outer requires chapter3_truth_path which is grantable', () => {
    const allEventFlags = new Set<string>();
    EVENTS.forEach((e) => e.actions.forEach((a) => a.grants?.flags?.forEach((f) => allEventFlags.add(f))));
    expect(allEventFlags.has('chapter3_truth_path'), 'chapter3_truth_path flag is never granted').toBe(true);
    const room = ch3Map?.rooms.find((r) => r.id === 'censorate_outer');
    expect(room?.requires?.flags).toContain('chapter3_truth_path');
  });
});

describe('chapter4 & chapter5 reachability', () => {
  const grantable = collectGrantableFlags();

  it('all chapter4 rooms reachable from guinian_teahouse', () => {
    const reach = reachableRooms('chapter4', 'guinian_teahouse', grantable);
    const map = MAPS.find((m) => m.id === 'chapter4');
    for (const r of map?.rooms ?? [])
      expect(reach.has(r.id), `ch4 room ${r.id} not reachable from guinian_teahouse`).toBe(true);
  });

  it('all chapter5 rooms reachable from wangshi_secret_room', () => {
    const reach = reachableRooms('chapter5', 'wangshi_secret_room', grantable);
    const map = MAPS.find((m) => m.id === 'chapter5');
    for (const r of map?.rooms ?? [])
      expect(reach.has(r.id), `ch5 room ${r.id} not reachable from wangshi_secret_room`).toBe(true);
  });

  it('all chapter4 ending flags are grantable', () => {
    for (const f of ['chapter4_expose_ending', 'chapter4_gather_ending', 'chapter4_shadow_ending'])
      expect(grantable.has(f), `${f} is never granted`).toBe(true);
  });

  it('all chapter5 ending flags are grantable', () => {
    for (const f of ['chapter5_burn_ending', 'chapter5_entrust_ending', 'chapter5_reveal_ending', 'chapter5_tianji_ending'])
      expect(grantable.has(f), `${f} is never granted`).toBe(true);
  });

  it('chapter4 has at least one ending whose prerequisites are all grantable (completion guarantee)', () => {
    const verdict = EVENTS.find((e) => e.id === 'evt_ch4_final_deduction');
    expect(verdict, 'evt_ch4_final_deduction missing').toBeDefined();
    const endingActions = verdict!.actions.filter((a) =>
      a.grants?.flags?.some((f) => f.includes('ending')));
    expect(endingActions.length).toBeGreaterThan(0);
    const anyReachable = endingActions.some((a) =>
      (a.requires?.flags ?? []).every((f) => grantable.has(f)));
    expect(anyReachable, 'no chapter4 ending path has all prerequisites grantable').toBe(true);
  });

  it('chapter5 has at least one ending whose prerequisites are all grantable (completion guarantee)', () => {
    const verdict = EVENTS.find((e) => e.id === 'evt_final_choice');
    expect(verdict, 'evt_final_choice missing').toBeDefined();
    const endingActions = verdict!.actions.filter((a) =>
      a.grants?.flags?.some((f) => f.includes('ending')));
    expect(endingActions.length).toBeGreaterThan(0);
    const anyReachable = endingActions.some((a) =>
      (a.requires?.flags ?? []).every((f) => grantable.has(f)));
    expect(anyReachable, 'no chapter5 ending path has all prerequisites grantable').toBe(true);
  });
});
