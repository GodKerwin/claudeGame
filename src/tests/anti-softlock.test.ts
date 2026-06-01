/**
 * 防卡关测试
 * 模拟每个职业的最短通关路径，验证没有不可突破的死局
 * 运行：npx vitest run src/tests/anti-softlock.test.ts
 */

import { describe, it, expect } from 'vitest';
import chapter1Maps from '../data/maps/chapter1.json';
import chapter1Events from '../data/events/chapter1.json';
import chapter2Events from '../data/events/chapter2.json';
import chapter1NPCs from '../data/npcs/chapter1.json';
import chapter2NPCs from '../data/npcs/chapter2.json';
import chapter1Items from '../data/items/chapter1.json';
import chapter2Items from '../data/items/chapter2.json';
import templates from '../data/templates.json';

// ---------- 模拟引擎 ----------

interface State {
  flags: Set<string>;
  items: Set<string>;
  strength: number;
  agility: number;
  wisdom: number;
  constitution: number;
  talent: string;
}

function meetsCondition(cond: any, s: State): boolean {
  if (!cond) return true;
  if (cond.strength !== undefined && s.strength < cond.strength) return false;
  if (cond.agility !== undefined && s.agility < cond.agility) return false;
  if (cond.wisdom !== undefined && s.wisdom < cond.wisdom) return false;
  if (cond.constitution !== undefined && s.constitution < cond.constitution) return false;
  if (cond.talent !== undefined && s.talent !== cond.talent) return false;
  if (cond.has) {
    for (const i of cond.has) if (!s.items.has(i)) return false;
  }
  if (cond.flags) {
    for (const f of cond.flags) if (!s.flags.has(f)) return false;
  }
  if (cond.flags_absent) {
    for (const f of cond.flags_absent) if (s.flags.has(f)) return false;
  }
  return true;
}

function applyGrants(grants: any, s: State): void {
  if (!grants) return;
  grants.flags?.forEach((f: string) => s.flags.add(f));
  grants.items?.forEach((i: string) => s.items.add(i));
  if (grants.strength) s.strength += grants.strength;
  if (grants.agility) s.agility += grants.agility;
  if (grants.wisdom) s.wisdom += grants.wisdom;
  if (grants.constitution) s.constitution += grants.constitution;
}

/** 在事件列表中执行所有当前满足条件的 action（贪心） */
function runAvailableActions(events: any[], s: State, roomIds?: Set<string>): number {
  let applied = 0;
  for (const evt of events) {
    // 检查事件本身是否在允许的房间内（可选）
    if (roomIds && !roomIds.has(evt.id)) continue;
    if (!meetsCondition(evt.requires, s)) continue;
    for (const action of evt.actions ?? []) {
      if (meetsCondition(action.requires, s)) {
        applyGrants(action.grants, s);
        applied++;
      }
    }
  }
  return applied;
}

/** 运行 NPC 对话中所有满足条件的 dialogue（及其 choices 的第一个选项） */
function runAvailableDialogues(npcs: any[], s: State): number {
  let applied = 0;
  for (const npc of npcs) {
    for (const d of npc.dialogues ?? []) {
      if (meetsCondition(d.condition, s)) {
        applyGrants(d.grants, s);
        // 自动选第一个可用 choice（贪心）
        if (d.choices) {
          for (const c of d.choices) {
            if (meetsCondition(c.condition, s)) {
              applyGrants(c.grants, s);
              break;
            }
          }
        }
        applied++;
      }
    }
  }
  return applied;
}

/** 迭代收敛：反复执行直到没有新增状态变化 */
function saturate(events: any[], npcs: any[], s: State, maxRounds = 20): void {
  for (let i = 0; i < maxRounds; i++) {
    const before = s.flags.size + s.items.size + s.strength + s.agility + s.wisdom + s.constitution;
    runAvailableActions(events, s);
    runAvailableDialogues(npcs, s);
    const after = s.flags.size + s.items.size + s.strength + s.agility + s.wisdom + s.constitution;
    if (after === before) break;
  }
}

function makeState(templateId: string): State {
  const tpl = (templates as any[]).find((t) => t.id === templateId)!;
  return {
    flags: new Set<string>(),
    items: new Set<string>(),
    strength: tpl.stats.strength,
    agility: tpl.stats.agility,
    wisdom: tpl.stats.wisdom,
    constitution: tpl.stats.constitution,
    talent: tpl.talent,
  };
}

// ---------- 通用辅助 ----------

const allChapter1Events = chapter1Events as any[];
const allChapter2Events = chapter2Events as any[];
const allChapter1NPCs = chapter1NPCs as any[];
const allChapter2NPCs = chapter2NPCs as any[];

const TEMPLATES = ['bukai', 'daoshi', 'shuoshuren', 'youfangyi', 'feizei'];

// ---------- 数据完整性测试 ----------

describe('数据完整性', () => {
  it('evt_copper_badge_examine 必须挂载在大堂 (lobby) interactables 内', () => {
    const lobby = (chapter1Maps as any[])[0].rooms.find((r: any) => r.id === 'lobby');
    expect(lobby).toBeDefined();
    expect(lobby.interactables).toContain('evt_copper_badge_examine');
  });

  it('evt_copper_badge_examine 的 read_hold_breath 根骨要求 ≤ 4（所有职业可用）', () => {
    const evt = allChapter1Events.find((e) => e.id === 'evt_copper_badge_examine');
    const action = evt.actions.find((a: any) => a.id === 'read_hold_breath');
    expect(action.requires.constitution).toBeLessThanOrEqual(4);
  });

  it('gang_code_insight 必须同时授予 dafei_contact_made 和 dafei_address_obtained', () => {
    const board = allChapter1Events.find((e) => e.id === 'evt_notice_board');
    const action = board.actions.find((a: any) => a.id === 'gang_code_insight');
    expect(action.grants.flags).toContain('dafei_contact_made');
    expect(action.grants.flags).toContain('dafei_address_obtained');
  });

  it('evt_cellar_mechanism.break_door 力量要求 ≤ 8（捕快可用）', () => {
    const evt = allChapter1Events.find((e) => e.id === 'evt_cellar_mechanism');
    const action = evt.actions.find((a: any) => a.id === 'break_door');
    expect(action.requires.strength).toBeLessThanOrEqual(8);
  });

  it('evt_hideout_search.decode_records 智慧要求 ≤ 6（游方医可用）', () => {
    const evt = allChapter2Events.find((e) => e.id === 'evt_hideout_search');
    const action = evt.actions.find((a: any) => a.id === 'decode_records');
    expect(action.requires.wisdom).toBeLessThanOrEqual(6);
  });

  it('npc_li_mao.tianji_accusation 使用 flags 而非 has 条件', () => {
    const npc = allChapter2NPCs.find((n: any) => n.id === 'npc_li_mao');
    const d = npc.dialogues.find((d: any) => d.id === 'tianji_accusation');
    expect(d.condition.flags).toContain('kite_identity_clue');
    expect(d.condition.has).toBeUndefined();
  });

  it('所有 grants.items 引用的 id 必须在 items 定义中存在', () => {
    const allItemIds = new Set([
      ...(chapter1Items as any[]).map((i: any) => i.id),
      ...(chapter2Items as any[]).map((i: any) => i.id),
    ]);
    const missingItems: string[] = [];

    const checkGrants = (grants: any, context: string) => {
      grants?.items?.forEach((id: string) => {
        if (!allItemIds.has(id)) missingItems.push(`${context}: ${id}`);
      });
    };

    allChapter1Events.forEach((evt: any) => {
      evt.actions?.forEach((a: any) => checkGrants(a.grants, `ch1/${evt.id}/${a.id}`));
    });
    allChapter1NPCs.forEach((npc: any) => {
      npc.dialogues?.forEach((d: any) => {
        checkGrants(d.grants, `npc/${npc.id}/${d.id}`);
        d.choices?.forEach((c: any) => checkGrants(c.grants, `npc/${npc.id}/${d.id}/choice`));
      });
    });

    expect(missingItems).toEqual([]);
  });

  it('所有地图的 interactables 引用的事件/NPC 必须存在', () => {
    const allEventIds = new Set(allChapter1Events.map((e: any) => e.id));
    const allNpcIds = new Set(allChapter1NPCs.map((n: any) => n.id));
    const missing: string[] = [];

    (chapter1Maps as any[])[0].rooms.forEach((room: any) => {
      room.interactables.forEach((id: string) => {
        if (id.startsWith('evt_') && !allEventIds.has(id)) missing.push(`room/${room.id}: ${id}`);
        if (id.startsWith('npc_') && !allNpcIds.has(id)) missing.push(`room/${room.id}: ${id}`);
      });
    });

    expect(missing).toEqual([]);
  });
});

// ---------- 职业通关路径测试 ----------

describe('第一章通关路径', () => {
  /** 进入 old_mansion 的前提：3个关键flag */
  function canEnterMansion(s: State): boolean {
    return s.flags.has('clue_blood_letter_found') && s.flags.has('clue_arsenic_found') && s.flags.has('cellar_fragment_obtained');
  }

  /** 三种结局检测 */
  function ch1Endings(s: State) {
    return {
      truth: s.flags.has('kite_identity_clue') && s.flags.has('cloth_fiber_found') && s.flags.has('tianji_records_found'),
      force: s.strength >= 8,
      hermit: s.flags.has('white_stranger_trust') && s.flags.has('learned_wuhen_bu'),
    };
  }

  for (const templateId of TEMPLATES) {
    it(`${templateId} 可进入废弃宅院（3个前置flag）`, () => {
      const s = makeState(templateId);
      saturate(allChapter1Events, allChapter1NPCs, s);
      expect(canEnterMansion(s)).toBe(true);
    });

    it(`${templateId} 至少有一条第一章结局路径`, () => {
      const s = makeState(templateId);
      saturate(allChapter1Events, allChapter1NPCs, s);
      const e = ch1Endings(s);
      const anyEnding = e.truth || e.force || e.hermit;
      expect(anyEnding).toBe(true);
    });
  }
});

describe('第二章通关路径', () => {
  /** 模拟从第一章结束后的初始状态（带基础flag） */
  function makeChapter2State(templateId: string, seedFlags: string[] = []): State {
    const s = makeState(templateId);
    // 模拟第一章完成后的基础状态
    saturate(allChapter1Events, allChapter1NPCs, s);
    // 进入第二章
    s.flags.add('chapter2_started');
    // 可选额外初始flag
    seedFlags.forEach((f) => s.flags.add(f));
    return s;
  }

  /** 第二章结局检测 */
  function ch2Endings(s: State, allItems: Set<string>) {
    return {
      arrest: allItems.has('poison_residue_sample') && allItems.has('monk_identity_scroll') && allItems.has('langpeng_dispatch_order'),
      release: s.flags.has('langpeng_trail') && allItems.has('langpeng_dispatch_order'),
      join: s.flags.has('tianji_recruit_offered') && s.agility >= 8,
    };
  }

  for (const templateId of TEMPLATES) {
    it(`${templateId} 可获得 langpeng_trail（进茶馆的前提）`, () => {
      const s = makeChapter2State(templateId);
      saturate(allChapter2Events, allChapter2NPCs, s);
      expect(s.flags.has('langpeng_trail')).toBe(true);
    });

    it(`${templateId} 至少有一条第二章结局路径`, () => {
      const s = makeChapter2State(templateId);
      saturate(allChapter2Events, allChapter2NPCs, s);
      const e = ch2Endings(s, s.items);
      const anyEnding = e.arrest || e.release || e.join;
      expect(anyEnding).toBe(true);
    });
  }
});

describe('关键 flag 可达性', () => {
  it('捕快(bukai) 可获得 dafei_password_known（read_hold_breath 根骨4）', () => {
    const s = makeState('bukai');
    // 给铜牌
    s.items.add('broken_copper_badge');
    saturate(allChapter1Events, [], s);
    expect(s.flags.has('dafei_password_known')).toBe(true);
  });

  it('说书人(shuoshuren) gang_code_insight 后可获得 dafei_address_obtained', () => {
    const s = makeState('shuoshuren');
    // 触发耳报神路径：先拿到公告板
    s.flags.add('gang_culture_known');
    s.flags.add('dafei_notice_found');
    s.items.add('broken_copper_badge');
    saturate(allChapter1Events, [], s);
    expect(s.flags.has('dafei_contact_made')).toBe(true);
    expect(s.flags.has('dafei_address_obtained')).toBe(true);
  });

  it('捕快(bukai) 可打开地窖密室（break_door 力量8）', () => {
    const s = makeState('bukai');
    s.flags.add('innkeeper_trusted');
    saturate(allChapter1Events, [], s);
    expect(s.flags.has('secret_room_opened')).toBe(true);
  });

  it('游方医(youfangyi) 可获得 langpeng_dispatch_order（decode_records 智慧6）', () => {
    const s = makeState('youfangyi');
    s.flags.add('chapter2_started');
    s.flags.add('hideout_entered'); // 已进据点
    saturate(allChapter2Events, [], s);
    expect(s.items.has('langpeng_dispatch_order')).toBe(true);
  });

  it('飞贼(feizei) 可完成隐士结局（hermit ending）', () => {
    const s = makeState('feizei');
    saturate(allChapter1Events, allChapter1NPCs, s);
    const hermit = s.flags.has('white_stranger_trust') && s.flags.has('learned_wuhen_bu');
    expect(hermit).toBe(true);
  });
});
