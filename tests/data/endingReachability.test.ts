import { describe, it, expect } from 'vitest';
import { MAPS, EVENTS } from '../../src/data/loader';

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
