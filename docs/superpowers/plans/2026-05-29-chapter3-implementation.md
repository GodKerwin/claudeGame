# 第三章·鸢归何处 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Chapter 3 of 天机残卷: 4 rooms across Chang'an culminating in a confrontation with 飞爷 (the true identity of「鸢」), plus chapter routing so the game transitions correctly from Chapter 2 into Chapter 3 and ends after Chapter 3.

**Architecture:** Chapter 3 data lives in `src/data/*/chapter3.json` merged into existing exports. Chapter 3 NPCs re-use existing NPC IDs (npc_fei_ye, npc_wujue) by appending new dialogues gated behind `chapter3_started` flag; only `npc_tianji_contact` is a new NPC in chapter3.json. ChapterEnd.tsx and Game.tsx are updated to detect chapter 3 endings and route to the final game-over screen.

**Tech Stack:** React 18 + TypeScript + Vite + TailwindCSS v3 + Zustand v4 + React Router v6; Vitest for tests

---

### Task 1: Chapter 3 map + items + loader update

**Files:**
- Create: `src/data/maps/chapter3.json`
- Create: `src/data/items/chapter3.json`
- Modify: `src/data/loader.ts`
- Create: `tests/data/chapter3Integrity.test.ts` (map + item tests only)

- [ ] **Step 1: Write failing map and item tests**

Create `tests/data/chapter3Integrity.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter3Integrity.test.ts
```
Expected: FAIL — `chapter3 map missing`

- [ ] **Step 3: Create `src/data/maps/chapter3.json`**

```json
[
  {
    "id": "chapter3",
    "name": "第三章·鸢归何处",
    "rooms": [
      {
        "id": "dayan_pagoda",
        "name": "大雁塔下",
        "description": "大雁塔的钟声刚刚散去，塔下的慈恩寺偏院少有行人。老柏树后藏着一块不起眼的石碑，苔痕掩去了大半，但如果凑近，能看出碑文不是寻常经文。灰袍僧人端坐在矮凳上，像是在等什么人。",
        "interactables": ["evt_nameless_stele", "evt_pagoda_shadow", "npc_wujue"],
        "exits": ["feiyes_manor"],
        "requires": null
      },
      {
        "id": "tianji_safehouse",
        "name": "天机安宅",
        "description": "长安城一条不显眼的巷子深处，门面是寻常茶水铺。推开后门，里面却是另一番光景——墙上挂着长安城的堪舆图，密密麻麻标注着数十个点位。一个面容模糊的人坐在图前，听到你进来，缓缓转过身。",
        "interactables": ["evt_mission_orders", "evt_safehouse_wall", "npc_tianji_contact"],
        "exits": ["feiyes_manor"],
        "requires": { "flags": ["chapter2_join_ending"] }
      },
      {
        "id": "feiyes_manor",
        "name": "飞爷故居",
        "description": "院落年久失修，砖缝间长着枯草。正门虽关，却未上锁。屋内陈设简朴，灰尘积了薄薄一层，但有些东西被人动过——桌上的茶杯，书架上的空格，像是有人不久前来过，又刻意抹去了痕迹。",
        "interactables": ["evt_abandoned_room", "evt_portrait_wall", "npc_wujue"],
        "exits": ["dayan_pagoda", "tianji_safehouse", "qujiang_pavilion"],
        "requires": null
      },
      {
        "id": "qujiang_pavilion",
        "name": "曲江亭",
        "description": "曲江池水面映着落日余晖，亭子里有个人背对着你，看着水面，一动不动。你认出了那件洗旧了的白衫，那个四十出头、在街上绝对不会多看一眼的普通男人。飞爷。他开口，没有回头：「坐，等你好久了。」",
        "interactables": ["evt_pavilion_approach", "evt_fei_ye_confrontation", "npc_fei_ye"],
        "exits": ["feiyes_manor"],
        "requires": { "flags": ["fei_ye_identity_confirmed"] }
      }
    ]
  }
]
```

- [ ] **Step 4: Create `src/data/items/chapter3.json`**

```json
[
  {
    "id": "tianji_founding_scroll",
    "name": "天机创立卷",
    "description": "天机阁立阁时的原始密档，以创立者真名立册，封页以专用蜡封。内页记载建阁缘由、鸢字组成员名册，以及一份被廷尉府追杀者的名单索引。末页自署：飞，代号鸢。",
    "isClue": true
  },
  {
    "id": "target_profile",
    "name": "追查令",
    "description": "天机阁内部追查文书，描述「旧主」特征：四十出头，面容普通，左手一道旧疤，从不先开口说话。每一条，你都在大飞帮时见过。这个旧主，就是飞爷。",
    "isClue": true
  },
  {
    "id": "name_list_fragment",
    "name": "名单残页",
    "description": "宋怀义名单的一页残页，边缘被撕断，关键内容清晰可辨。名单上排列着十余个名字和代号，其中一行：飞，代号鸢，鸢字组创立者，现居长安，大飞帮主。",
    "isClue": true
  },
  {
    "id": "deeper_threat_evidence",
    "name": "上游密函",
    "description": "一封截断的信，盖着廷尉府的印章，措辞逼迫——「你所护之人，已有人知晓……劝你趁早交出名单。」发信人不止知道天机阁的存在，还知道飞爷真实身份和名单下落。这背后的威胁，比天机阁本身更深。",
    "isClue": true
  },
  {
    "id": "qujiang_invitation",
    "name": "曲江约信",
    "description": "一张折叠的字条，字迹简洁：「若来此处，说明你已知晓大半。曲江亭，明日日落前。——飞」纸张新鲜，墨迹未干，应是今日才写的。",
    "isClue": false
  }
]
```

- [ ] **Step 5: Update `src/data/loader.ts`**

Replace the entire file:

```typescript
import type { GameMap, GameEvent, NPC, Item, Talent, CharacterTemplate, Room } from '../types/game';

import chapter1MapsRaw from './maps/chapter1.json';
import chapter1EventsRaw from './events/chapter1.json';
import chapter1NPCsRaw from './npcs/chapter1.json';
import chapter1ItemsRaw from './items/chapter1.json';
import chapter2MapsRaw from './maps/chapter2.json';
import chapter2EventsRaw from './events/chapter2.json';
import chapter2NPCsRaw from './npcs/chapter2.json';
import chapter2ItemsRaw from './items/chapter2.json';
import chapter3MapsRaw from './maps/chapter3.json';
import chapter3EventsRaw from './events/chapter3.json';
import chapter3NPCsRaw from './npcs/chapter3.json';
import chapter3ItemsRaw from './items/chapter3.json';
import talentsRaw from './talents.json';
import templatesRaw from './templates.json';

export const MAPS: GameMap[] = [...chapter1MapsRaw, ...chapter2MapsRaw, ...chapter3MapsRaw] as GameMap[];
export const EVENTS: GameEvent[] = [...chapter1EventsRaw, ...chapter2EventsRaw, ...chapter3EventsRaw] as GameEvent[];
export const NPCS: NPC[] = [...chapter1NPCsRaw, ...chapter2NPCsRaw, ...chapter3NPCsRaw] as NPC[];
export const ITEMS: Item[] = [...chapter1ItemsRaw, ...chapter2ItemsRaw, ...chapter3ItemsRaw] as Item[];
export const TALENTS: Talent[] = talentsRaw as Talent[];
export const TEMPLATES: CharacterTemplate[] = templatesRaw as CharacterTemplate[];

export const ALL_ROOMS: Room[] = MAPS.flatMap((m) => m.rooms);

export const getRoom = (id: string): Room | undefined => ALL_ROOMS.find((r) => r.id === id);
export const getEvent = (id: string): GameEvent | undefined => EVENTS.find((e) => e.id === id);
export const getNPC = (id: string): NPC | undefined => NPCS.find((n) => n.id === id);
export const getItem = (id: string): Item | undefined => ITEMS.find((i) => i.id === id);
export const getTalent = (id: string): Talent | undefined => TALENTS.find((t) => t.id === id);
export const getTemplate = (id: string): CharacterTemplate | undefined => TEMPLATES.find((t) => t.id === id);
```

- [ ] **Step 6: Run tests to verify pass**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter3Integrity.test.ts
```
Expected: PASS (7 tests)

- [ ] **Step 7: Run full suite for no regressions**

```bash
cd /Users/xuli/claudeGame && npx vitest run
```
Expected: All 83 existing tests still pass

- [ ] **Step 8: Commit**

```bash
git add src/data/maps/chapter3.json src/data/items/chapter3.json src/data/loader.ts tests/data/chapter3Integrity.test.ts
git commit -m "feat: add chapter3 map, items and update loader"
```

---

### Task 2: Chapter 3 events JSON

**Files:**
- Create: `src/data/events/chapter3.json`
- Modify: `tests/data/chapter3Integrity.test.ts` (append event tests)

- [ ] **Step 1: Append event tests to `tests/data/chapter3Integrity.test.ts`**

Add at the end of the file (after the closing `});` of the map/item describe block):

```typescript
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
```

- [ ] **Step 2: Run test to verify event assertions fail**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter3Integrity.test.ts
```
Expected: FAIL — events not found

- [ ] **Step 3: Create `src/data/events/chapter3.json`**

```json
[
  {
    "id": "evt_nameless_stele",
    "title": "无名碑",
    "description": "大雁塔下，一块不起眼的石碑立在老柏树后。苔痕掩去了大半，但如果凑近，能看出碑文不是寻常经文。",
    "actions": [
      {
        "id": "observe_stele",
        "label": "拂去碑上苔痕细看",
        "requires": null,
        "result": "碑上刻的字密密麻麻，笔迹古朴，读来像是一篇誓言：「护名单，卫名单上之人，不问来路，不计生死。立于天机元年，鸢字组。」鸢字组……你默记这个名字。",
        "grants": { "flags": ["stele_seen"] }
      },
      {
        "id": "decode_tianji",
        "label": "辨析碑文隐语",
        "requires": { "wisdom": 6 },
        "result": "你结合在慈恩寺学到的天机暗语体系，逐字推敲碑文。碑文不只是誓言，还嵌着创立者的名字——以天机阁暗语藏头：飞，单名。碑后夹缝里藏着一卷封蜡的密卷，取出来，正是天机阁立阁时的原始档案。",
        "grants": { "flags": ["stele_decoded"], "items": ["tianji_founding_scroll"] }
      },
      {
        "id": "decode_tianji_signal",
        "label": "以天机暗号册比对碑文",
        "requires": { "flags": ["tianji_signal_known"] },
        "result": "天机阁内部联络暗语，你已烂熟于心。碑文隐语在你眼中一目了然：创立者署名「飞」，碑后夹缝藏有蜡封密卷。取出，正是天机阁的立阁原档。",
        "grants": { "flags": ["stele_decoded"], "items": ["tianji_founding_scroll"] }
      }
    ]
  },
  {
    "id": "evt_pagoda_shadow",
    "title": "塔影踪迹",
    "description": "塔下人迹稀少，但地上有新鲜的脚印——来了又走，像是有人在等，等不到人才离开的。",
    "actions": [
      {
        "id": "look_around",
        "label": "环顾四周",
        "requires": null,
        "result": "你扫了一圈，发现一块矮石上压着一封信。封口没有印章，只写了「阅后自明」。里面是一张字条：「若来此处，说明你已知晓大半。曲江亭，明日日落前。——飞」",
        "grants": { "flags": ["qujiang_location_known"], "items": ["qujiang_invitation"] }
      },
      {
        "id": "track_footprints",
        "label": "追踪脚印来源",
        "requires": { "agility": 7 },
        "result": "脚印从西边来，在石碑前停顿，又朝曲江方向离去。步距均匀，不慌不忙，是一个走了很多年江湖的人留下的。",
        "grants": { "flags": ["fei_ye_sighted"] }
      }
    ]
  },
  {
    "id": "evt_mission_orders",
    "title": "任务令",
    "description": "安宅内的桌上压着一封火漆密函，封口的印记是天机阁的标记。",
    "actions": [
      {
        "id": "read_orders",
        "label": "拆开阅读",
        "requires": null,
        "result": "任务令措辞简短：追回「旧主」带走的名单，必要时清除旧主。随函附有一张画像——画上的人，四十出头，面容平凡，嘴角挂着一丝你熟悉的笑。是飞爷。",
        "grants": { "flags": ["tianji_mission_started"], "items": ["target_profile"] }
      },
      {
        "id": "study_target",
        "label": "仔细核对画像细节",
        "requires": { "wisdom": 7 },
        "result": "你逐一核对任务令上的特征描述：左手旧疤，习惯站于人群之后，说话从不先开口。每一条，你都在大飞帮见过。这个「旧主」，就是飞爷。",
        "grants": { "flags": ["fei_ye_suspect"] }
      }
    ]
  },
  {
    "id": "evt_safehouse_wall",
    "title": "安宅暗壁",
    "description": "安宅内墙上挂着一幅长安城堪舆图，密密麻麻标了数十个点位，旁边的架上摆着一排卷轴。",
    "requires": { "flags": ["tianji_mission_started"] },
    "actions": [
      {
        "id": "examine_wall",
        "label": "细看标注点位",
        "requires": null,
        "result": "标注的点位涵盖长安各坊，每个点背后都有一个代号。你认出几个——往事客栈、回春堂、慈恩寺，全在其中。这张网，布了很多年。",
        "grants": { "flags": ["tianji_network_seen"] }
      },
      {
        "id": "find_archive",
        "label": "逐卷查阅卷轴架",
        "requires": { "wisdom": 8 },
        "result": "你从卷轴架最底层抽出一卷封了蜡的旧档，拆开，是天机阁最初立阁的密档。创立者自署「鸢」，末页附有真名——飞字组，飞，单名。",
        "grants": { "items": ["tianji_founding_scroll"] }
      },
      {
        "id": "find_archive_agi",
        "label": "翻找架后暗格机关",
        "requires": { "agility": 7 },
        "result": "你摸遍架子背面，找到一处暗格的弹簧机关，拨开，里面存着一卷密档——天机阁立阁时的原始记录，创立者的真名藏于其中。",
        "grants": { "items": ["tianji_founding_scroll"] }
      },
      {
        "id": "earn_trust",
        "label": "展示对天机阁内部的了解",
        "requires": { "agility": 8 },
        "result": "你将自己掌握的天机阁暗号、联络方式一一道出。安宅暗处的监视者慢慢放松戒备，在一张纸上写下一行字：「你比预想的更深入。他在等你。」",
        "grants": { "flags": ["tianji_trust_gained"] }
      }
    ]
  },
  {
    "id": "evt_abandoned_room",
    "title": "废弃内室",
    "description": "推开旧居正门，内室空旷，一张旧桌，几把椅子，桌上落着薄灰。但灰下面，有什么东西被压着。",
    "actions": [
      {
        "id": "search_room",
        "label": "翻检桌上物件",
        "requires": null,
        "result": "桌上压着一封没有封口的信，信纸泛黄，字迹工整——「飞：你所护之人，已有人知晓。此信到时，你大约也已料到后续。劝你趁早交出名单，否则……」信就此截断。落款处只有一个印章：廷尉府。",
        "grants": { "flags": ["manor_entered"], "items": ["deeper_threat_evidence"] }
      },
      {
        "id": "find_hidden_access",
        "label": "沿墙拍打寻找暗格",
        "requires": { "agility": 7 },
        "result": "你沿着墙角拍打，找到一处空心隔板。撬开，里面是一条窄缝。里面只剩一张纸条：「文件已转移，见面时我告诉你在哪里。」",
        "grants": { "flags": ["manor_study_found"] }
      },
      {
        "id": "find_hidden_access_str",
        "label": "撬开墙内嵌锁盒",
        "requires": { "strength": 8 },
        "result": "你盯上一块略显突兀的砖，用力一拍，弹出一个铁盒。铁盒空了，夹层里有张纸条：「已转移，见面时给你。」",
        "grants": { "flags": ["manor_study_found"] }
      }
    ]
  },
  {
    "id": "evt_portrait_wall",
    "title": "旧画像壁",
    "description": "内室东墙挂着几幅褪色的画像，画的是不同年龄的同一个人。画像下没有名字，只有一行小字：「鸢，历年记录。」",
    "requires": { "flags": ["manor_entered"] },
    "actions": [
      {
        "id": "examine_portraits",
        "label": "细看画像",
        "requires": null,
        "result": "你盯着最新的那幅画像——四十出头，面容普通，嘴角挂着一丝若有若无的笑。你在某个地方见过这个人，见过很多次。那是飞爷。画像下的台子上放着一本薄薄的册子，夹着几页泛黄的纸——正是宋怀义名单的残页，上面有一个名字：飞，代号鸢。",
        "grants": { "flags": ["feiyes_manor_searched"], "items": ["name_list_fragment"] }
      },
      {
        "id": "match_markings",
        "label": "与无名碑记录比对",
        "requires": { "flags": ["stele_decoded"] },
        "result": "你将无名碑上「鸢字组，飞」的记录与画像对照——年龄、面容吻合。鸢就是飞爷，确凿无疑。",
        "grants": { "flags": ["fei_ye_identity_confirmed"] }
      },
      {
        "id": "match_markings_suspect",
        "label": "对照追查令画像",
        "requires": { "flags": ["fei_ye_suspect"] },
        "result": "你取出任务令上的追查画像，与墙上的画像并排一看——是同一个人。追查令上的「旧主」，就是飞爷，就是鸢。",
        "grants": { "flags": ["fei_ye_identity_confirmed"] }
      }
    ]
  },
  {
    "id": "evt_pavilion_approach",
    "title": "曲江亭外",
    "description": "曲江池水面平静，亭子里有个白衫背影，一动不动地看着水面。",
    "actions": [
      {
        "id": "enter_directly",
        "label": "直接走进亭子",
        "requires": null,
        "result": "你踩着碎石路走过去，脚步声没有掩盖。他没有回头，开口：「来了，坐。」",
        "grants": { "flags": ["entered_pavilion"] }
      },
      {
        "id": "scout_first",
        "label": "先绕亭一圈察看",
        "requires": { "agility": 7 },
        "result": "你绕着亭子走了一圈，确认四周没有埋伏，只有他一个人。他选了一处没有遮蔽的开阔地，像是刻意如此——让你看清楚他没有逃路，也没有援手。",
        "grants": { "flags": ["entered_pavilion", "exit_route_planned"] }
      }
    ]
  },
  {
    "id": "evt_fei_ye_confrontation",
    "title": "终局·飞爷",
    "description": "他转过身，还是那张你在往事客栈见过的普通脸。飞爷，天机阁的创立者，代号鸢。",
    "requires": { "flags": ["entered_pavilion"] },
    "actions": [
      {
        "id": "expose_truth",
        "label": "「证据在此，你逃不了了。」",
        "requires": { "has": ["tianji_founding_scroll"], "flags": ["deeper_threat_revealed"] },
        "result": "你将天机创立卷推到桌上，又说出飞爷那番关于廷尉府的话。\n\n「创立卷加上你自己承认的——名单、廷尉府、天机阁的真正敌人，这些足够让官府拿你，也足够保护名单上的人。」\n\n飞爷看着那卷东西，沉默了很久，最后站起来，从怀里取出一个装订整齐的册子：「你比我以为的更能走到最后。——这是完整的名单，和廷尉府往来的证据。你知道该怎么用。」\n\n长安城的钟声响起，送走了这一天最后的光。",
        "grants": { "flags": ["chapter3_truth_ending"] }
      },
      {
        "id": "demand_answers",
        "label": "「说清楚，然后我们谈。」",
        "requires": { "flags": ["fei_ye_identity_confirmed"] },
        "result": "你坐下，没有立刻出手。\n\n飞爷把一切说了——天机阁的起源，名单的意义，廷尉府追杀那批人的旧案，以及宋怀义出走的真正原因。\n\n你没有足够的物证，他也知道。两个人在曲江亭坐到夜深，最后他站起来：「名单，我不会给你。但我告诉你，它安全。」\n\n他走了。你手里是半段真相，另一半还在他身上。",
        "grants": { "flags": ["chapter3_standoff_ending"] }
      },
      {
        "id": "join_forces",
        "label": "「追查令，我烧了。你打算怎么做？」",
        "requires": { "flags": ["chapter2_join_ending", "tianji_trust_gained"] },
        "result": "你从怀里取出任务令，在茶碗旁的烛火上点燃，看它烧完。\n\n飞爷盯着那一小簇火焰，停了很久才开口：「你不是来执行任务的。」\n\n「不是。」\n\n他从袖中取出一张折叠的纸，推过来：「名单现在藏在这里。廷尉府的人很快就会找过来。你若愿意，我们一起守住它，等新的机会。」\n\n窗外，曲江池的水在月光里静静流淌。这局棋，还没有下完。",
        "grants": { "flags": ["chapter3_join_ending"] }
      }
    ]
  }
]
```

- [ ] **Step 4: Run tests to verify event assertions pass**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter3Integrity.test.ts
```
Expected: PASS (all map + event describe blocks green)

- [ ] **Step 5: Commit**

```bash
git add src/data/events/chapter3.json tests/data/chapter3Integrity.test.ts
git commit -m "feat: add chapter3 events JSON and append event tests"
```

---

### Task 3: Chapter 3 NPCs

**Files:**
- Create: `src/data/npcs/chapter3.json` (new NPC: `npc_tianji_contact` only)
- Modify: `src/data/npcs/chapter2.json` (append ch3 dialogues to `npc_wujue`; add `flags_absent: ["chapter3_started"]` to prevent ch2 dialogues leaking into ch3)
- Modify: `src/data/npcs/chapter1.json` (append ch3 dialogues to `npc_fei_ye`; add `flags_absent: ["chapter3_started"]` to `gang_intel` and `after_mission`)
- Modify: `tests/data/chapter3Integrity.test.ts` (append NPC assertions)

**Architecture note:** `getNPC(id)` returns the first match in the merged array. Chapter 1 NPCs appear before chapter 2, chapter 2 before chapter 3. For `npc_fei_ye` (chapter1) and `npc_wujue` (chapter2), chapter 3 dialogues must be appended to those existing entries — new entries in chapter3.json for these IDs would never be found. Only `npc_tianji_contact` is a genuinely new NPC and goes in chapter3.json.

- [ ] **Step 1: Append NPC tests to `tests/data/chapter3Integrity.test.ts`**

Add at the end of the file:

```typescript
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

  it('completion guarantee: npc_wujue.final_testimony has no stat condition', () => {
    const npc = NPCS.find((n) => n.id === 'npc_wujue');
    const d = npc?.dialogues.find((d) => d.id === 'final_testimony');
    expect(d).toBeDefined();
    expect((d?.condition as Record<string, unknown>)?.strength).toBeUndefined();
    expect((d?.condition as Record<string, unknown>)?.agility).toBeUndefined();
    expect((d?.condition as Record<string, unknown>)?.wisdom).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify NPC assertions fail**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter3Integrity.test.ts
```
Expected: FAIL — NPC dialogues not found

- [ ] **Step 3: Create `src/data/npcs/chapter3.json`**

```json
[
  {
    "id": "npc_tianji_contact",
    "name": "天机联络人",
    "description": "一个面容模糊的人，说话声音刻意压低，从不正视你，像是这辈子都在警惕背后的动静。",
    "dialogues": [
      {
        "id": "mission_briefing",
        "condition": { "flags": ["chapter2_join_ending"] },
        "text": "你来了。任务令已经在桌上。旧主带走了名单，这是我们不能容忍的。找到他，取回名单。任务完成时，你就是天机阁的正式成员。",
        "grants": { "flags": ["tianji_mission_started"], "items": ["target_profile"] }
      },
      {
        "id": "target_details",
        "condition": { "flags": ["tianji_mission_started"] },
        "text": "旧主的特征——四十出头，面容普通到在街上不会多看一眼。左手一道旧疤。从不先开口说话。建阁之人，也是离阁之人。",
        "grants": { "flags": ["fei_ye_suspect"] }
      },
      {
        "id": "insider_warning",
        "condition": { "flags": ["fei_ye_suspect"], "wisdom": 7 },
        "text": "你想知道的太多了。……好，告诉你也无妨：他不只是「离阁者」，他是建阁者。整个天机阁，包括我，都是他当年一手招募的。名单上的人，是他当年拼命保下来的。至于他为什么离开……我不知道，也不想知道。",
        "grants": { "flags": ["fei_ye_identity_confirmed"] }
      }
    ]
  }
]
```

- [ ] **Step 4: Append chapter 3 dialogues to `npc_wujue` in `src/data/npcs/chapter2.json`**

Read the file first. Find the `npc_wujue` entry. Its `dialogues` array currently ends after `true_identity`. Append these 4 dialogues to the end of that array:

```json
{
  "id": "stele_reading",
  "condition": { "flags": ["chapter3_started"] },
  "text": "那块碑，贫僧守了二十年了。上头刻的是天机阁立阁时的誓言，和立誓者的名字。他叫飞，代号鸢，是天机阁的创始之人。",
  "grants": { "flags": ["stele_decoded"], "items": ["tianji_founding_scroll"] }
},
{
  "id": "fei_ye_origin",
  "condition": { "flags": ["chapter3_started", "wujue_tianji_revealed"] },
  "text": "飞爷……他给贫僧改了法名，说名字是囚笼。他自己，也用了代号二十年。建天机阁，是为了护那份名单，护名单上被廷尉府追杀的人。宋怀义也在其中。",
  "grants": { "flags": ["fei_ye_tianji_origin_known"] }
},
{
  "id": "fei_ye_origin_wise",
  "condition": { "flags": ["chapter3_started"], "wisdom": 7 },
  "text": "你问飞爷的来历？……贫僧见过他最初建阁时的样子，那时他年轻些，眼里还有火气。他建天机阁，是为了一群被廷尉府追杀的人——名单上的那些人，每一个都是他答应过要护的。",
  "grants": { "flags": ["fei_ye_tianji_origin_known"] }
},
{
  "id": "final_testimony",
  "condition": { "flags": ["chapter3_started", "feiyes_manor_searched"] },
  "text": "你在旧居里找到那些东西了。……贫僧只再说一句：他没有走，因为他在等一个他信得过的人来找他。你来了，就说明你已经知道该怎么做了。去曲江亭吧，他在那里。",
  "grants": { "flags": ["fei_ye_identity_confirmed"] }
}
```

Also add `"flags_absent": ["chapter3_started"]` to `npc_wujue`'s existing `first_meet` dialogue condition:

Find:
```json
{
  "id": "first_meet",
  "condition": null,
  "text": "你从何处而来？……往事客栈。那地方出了人命，听说了。施主若无事，贫僧还有药要捡。",
  "grants": { "flags": ["wujue_met"] }
}
```

Replace:
```json
{
  "id": "first_meet",
  "condition": { "flags_absent": ["chapter3_started"] },
  "text": "你从何处而来？……往事客栈。那地方出了人命，听说了。施主若无事，贫僧还有药要捡。",
  "grants": { "flags": ["wujue_met"] }
}
```

- [ ] **Step 5: Append chapter 3 dialogues to `npc_fei_ye` in `src/data/npcs/chapter1.json`**

Read the file first. Find the `npc_fei_ye` entry. Its `dialogues` array has: `first_appear`, `alley_intel`, `fei_ye_deep_talk`, `gang_intel`, `after_mission`. Append these 4 dialogues to the end of that array:

```json
{
  "id": "pavilion_opening",
  "condition": { "flags": ["chapter3_started", "entered_pavilion"] },
  "text": "坐。等你好久了。……不用问我怎么知道你来，我建了这张网，网里有什么动静，我比你清楚。",
  "grants": {}
},
{
  "id": "identity_admitted",
  "condition": { "flags": ["chapter3_started", "fei_ye_identity_confirmed"] },
  "text": "鸢，对，是我。二十年前给自己起的代号，现在要拿来跟你解释了。……你想听实话，还是想先拿住我？",
  "grants": { "flags": ["fei_ye_admitted"] }
},
{
  "id": "list_confrontation",
  "condition": { "flags": ["chapter3_started"], "has": ["tianji_founding_scroll"] },
  "text": "你找到那卷档案了。……好，那我直说：名单上那些人，是当年廷尉府旧案的证人，被人追了二十年。我建天机阁，就是为了藏他们。宋怀义带走名单，是因为他不信任我了。名单，现在在我这里。",
  "grants": { "flags": ["deeper_threat_revealed"] }
},
{
  "id": "undercover_bond",
  "condition": { "flags": ["chapter3_started", "chapter2_join_ending", "tianji_trust_gained"] },
  "text": "你把追查令烧了。……我看见了。那就是你的回答。不用再说什么，我知道你的选择。名单藏在——你把手给我，我写在你掌心里。",
  "grants": { "flags": ["final_choice_unlocked"] }
}
```

Also add `"flags_absent": ["chapter3_started"]` to `gang_intel` and `after_mission` dialogues in `npc_fei_ye`. Find each one and add it to their existing `condition` object (or create a condition object if null). These are chapter 1 mission-context dialogues that should not show in chapter 3.

- [ ] **Step 6: Run tests to verify all NPC assertions pass**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter3Integrity.test.ts
```
Expected: PASS (all 3 describe blocks green)

- [ ] **Step 7: Run full test suite for no regressions**

```bash
cd /Users/xuli/claudeGame && npx vitest run
```
Expected: All tests pass

- [ ] **Step 8: Commit**

```bash
git add src/data/npcs/chapter3.json src/data/npcs/chapter2.json src/data/npcs/chapter1.json tests/data/chapter3Integrity.test.ts
git commit -m "feat: add chapter3 NPCs and append ch3 dialogues to existing NPCs"
```

---

### Task 4: ChapterEnd.tsx + Game.tsx chapter 3 routing

**Files:**
- Modify: `src/pages/ChapterEnd/ChapterEnd.tsx`
- Modify: `src/pages/Game/Game.tsx`

**What changes:**
- `ChapterEnd.tsx`: Add `CHAPTER3_ENDINGS` map; update chapter detection to handle 3 chapters; update `handleContinue` to route from ch2→ch3 (with conditional starting room based on ch2 ending) and from ch3→home
- `Game.tsx`: Add `CHAPTER3_ENDINGS` constant; update the ending detection `useEffect` to check chapter 3 endings when `chapter3_started` flag is set

- [ ] **Step 1: Replace `src/pages/ChapterEnd/ChapterEnd.tsx`**

```tsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { getItem } from '../../data/loader';

const CHAPTER1_ENDINGS: Record<string, string> = {
  chapter1_truth_ending: '你以智慧解开了这道局，真相已在掌中。但棋局远未终止。',
  chapter1_force_ending: '你以力破局，真相却仍藏于刀锋之后。长安城，还有更深的秘密等着你。',
  chapter1_hermit_ending: '你选择了另一条路，却发现路的尽头仍是同一扇门。',
};

const CHAPTER2_ENDINGS: Record<string, string> = {
  chapter2_arrest_ending: '铁证如山，李邈被捕。然而「鸢」这个名字，仍悬而未决。',
  chapter2_release_ending: '真相只得一半，而那个知道另一半的人，已经消失在长安的人海里。',
  chapter2_join_ending: '你踏入了那张网。是猎人，还是猎物，此刻还说不清。',
};

const CHAPTER3_ENDINGS: Record<string, string> = {
  chapter3_truth_ending: '天机创立卷公诸于众，廷尉府的旧案重见天日。名单上的人，终于可以不再躲藏。飞爷被带走了。这张网，由你来收。',
  chapter3_standoff_ending: '飞爷走了，名单还在他手里。你手里，是半段真相。另一半，在某个你看不见的地方等着你。',
  chapter3_join_ending: '你烧了追查令，他告诉了你名单的下落。两个人，一张网，对抗同一个还没有名字的敌人。这局棋，还没有下完。',
};

export default function ChapterEnd() {
  const navigate = useNavigate();
  const scene = useSceneStore();
  const { items } = useInventoryStore();
  const [visibleCount, setVisibleCount] = useState(0);
  const [showButton, setShowButton] = useState(false);

  const isChapter3 = scene.flags.includes('chapter3_started');
  const isChapter2 = scene.flags.includes('chapter2_started');

  const endingFlag = isChapter3
    ? Object.keys(CHAPTER3_ENDINGS).find((f) => scene.flags.includes(f))
    : isChapter2
    ? Object.keys(CHAPTER2_ENDINGS).find((f) => scene.flags.includes(f))
    : Object.keys(CHAPTER1_ENDINGS).find((f) => scene.flags.includes(f));

  const endingText = endingFlag
    ? isChapter3
      ? CHAPTER3_ENDINGS[endingFlag]
      : isChapter2
      ? CHAPTER2_ENDINGS[endingFlag]
      : CHAPTER1_ENDINGS[endingFlag]
    : '';

  const chapterTitle = isChapter3 ? '第三章·完' : isChapter2 ? '第二章·完' : '第一章·完';

  const clueItems = isChapter3 || isChapter2
    ? []
    : items.flatMap((id) => { const item = getItem(id); return item?.isClue ? [item] : []; });

  const lines = useMemo(
    () =>
      [
        chapterTitle,
        endingText,
        ...(clueItems.length > 0 ? ['【你所掌握的线索】'] : []),
        ...clueItems.map((item) => `· ${item.name}`),
      ].filter(Boolean),
    [chapterTitle, endingText, clueItems]
  );

  useEffect(() => {
    if (visibleCount < lines.length) {
      const t = setTimeout(() => setVisibleCount((c) => c + 1), visibleCount === 0 ? 300 : 1800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShowButton(true), 600);
    return () => clearTimeout(t);
  }, [visibleCount, lines.length]);

  const handleContinue = () => {
    if (isChapter3) {
      navigate('/');
    } else if (isChapter2) {
      scene.addFlag('chapter3_started');
      const startRoom = scene.flags.includes('chapter2_join_ending')
        ? 'tianji_safehouse'
        : 'dayan_pagoda';
      scene.setRoom(startRoom);
      navigate('/game');
    } else {
      scene.addFlag('chapter2_started');
      scene.setRoom('east_market_entrance');
      navigate('/game');
    }
  };

  const buttonLabel = isChapter3 ? '回到主菜单' : isChapter2 ? '踏入第三章' : '踏入第二章';

  return (
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center p-12">
      <div className="max-w-xl w-full space-y-5">
        {lines.map((line, i) => (
          <p
            key={i}
            className={`leading-loose transition-opacity duration-1000 ${
              i === 0
                ? 'text-gold text-2xl tracking-widest text-center'
                : line.startsWith('【')
                ? 'text-gold/60 text-xs tracking-widest mt-6'
                : line.startsWith('·')
                ? 'text-ink/60 text-sm pl-2'
                : 'text-base text-ink/80'
            } ${i < visibleCount ? 'opacity-100' : 'opacity-0'}`}
          >
            {line}
          </p>
        ))}
        <div
          className={`pt-8 text-center transition-opacity duration-700 ${
            showButton ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={handleContinue}
            className={`border border-gold text-gold px-8 py-2 text-sm tracking-widest hover:shadow-[0_0_16px_rgba(201,168,76,0.4)] transition-all ${
              showButton ? 'cursor-pointer' : 'pointer-events-none'
            }`}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `src/pages/Game/Game.tsx`**

**Edit 1** — add `CHAPTER3_ENDINGS` constant after line 30. Find:
```tsx
const CHAPTER1_ENDINGS = ['chapter1_truth_ending', 'chapter1_force_ending', 'chapter1_hermit_ending'];
const CHAPTER2_ENDINGS = ['chapter2_arrest_ending', 'chapter2_release_ending', 'chapter2_join_ending'];
```
Replace with:
```tsx
const CHAPTER1_ENDINGS = ['chapter1_truth_ending', 'chapter1_force_ending', 'chapter1_hermit_ending'];
const CHAPTER2_ENDINGS = ['chapter2_arrest_ending', 'chapter2_release_ending', 'chapter2_join_ending'];
const CHAPTER3_ENDINGS = ['chapter3_truth_ending', 'chapter3_standoff_ending', 'chapter3_join_ending'];
```

**Edit 2** — update the ending detection `useEffect` (lines 44–50). Find:
```tsx
  useEffect(() => {
    const inChapter2 = scene.flags.includes('chapter2_started');
    const endings = inChapter2 ? CHAPTER2_ENDINGS : CHAPTER1_ENDINGS;
    if (endings.some((f) => scene.flags.includes(f))) {
      navigate('/chapter-end');
    }
  }, [scene.flags, navigate]);
```
Replace with:
```tsx
  useEffect(() => {
    const inChapter3 = scene.flags.includes('chapter3_started');
    const inChapter2 = scene.flags.includes('chapter2_started');
    const endings = inChapter3 ? CHAPTER3_ENDINGS : inChapter2 ? CHAPTER2_ENDINGS : CHAPTER1_ENDINGS;
    if (endings.some((f) => scene.flags.includes(f))) {
      navigate('/chapter-end');
    }
  }, [scene.flags, navigate]);
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/xuli/claudeGame && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Run full test suite**

```bash
cd /Users/xuli/claudeGame && npx vitest run
```
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/pages/ChapterEnd/ChapterEnd.tsx src/pages/Game/Game.tsx
git commit -m "feat: update ChapterEnd and Game.tsx for chapter 3 routing"
```
