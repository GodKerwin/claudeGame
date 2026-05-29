# 第二章·暗渡陈仓 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Chapter 2 of 天机残卷: 6 rooms across Chang'an, 4 NPCs, 12 events, 10 items, a chapter-break transition screen, and chapter-ending detection in Game.tsx.

**Architecture:** Chapter 2 data lives in parallel JSON files (`src/data/*/chapter2.json`), merged into existing exports in `loader.ts` so all existing `getRoom`/`getEvent`/`getNPC` lookups work transparently. Chapter 1 ending flags (`chapter1_*_ending`) trigger navigation to a new `/chapter-end` route; a `chapter2_started` flag distinguishes Ch1→Ch2 from Ch2→done transitions.

**Tech Stack:** React 18 + TypeScript + Vite + TailwindCSS v3 + Zustand v4 + React Router v6; Vitest for tests

---

### Task 1: Chapter 2 map + items JSON + loader update

**Files:**
- Create: `src/data/maps/chapter2.json`
- Create: `src/data/items/chapter2.json`
- Modify: `src/data/loader.ts`
- Create: `tests/data/chapter2Integrity.test.ts` (map + item tests only)

- [ ] **Step 1: Write failing tests for map and items**

Create `tests/data/chapter2Integrity.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { MAPS, ITEMS, EVENTS, NPCS } from '../../src/data/loader';

describe('chapter2 map and item integrity', () => {
  const ch2Map = MAPS.find((m) => m.id === 'chapter2');
  const allRoomIds = new Set(ch2Map?.rooms.map((r) => r.id) ?? []);
  const allItemIds = new Set(ITEMS.map((i) => i.id));

  it('chapter2 map exists with 6 rooms', () => {
    expect(ch2Map, 'chapter2 map missing').toBeDefined();
    expect(ch2Map?.rooms.length).toBe(6);
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

  it('all 10 chapter2 items exist', () => {
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter2Integrity.test.ts`
Expected: FAIL — `chapter2 map missing`, items missing

- [ ] **Step 3: Create `src/data/maps/chapter2.json`**

```json
[
  {
    "id": "chapter2",
    "name": "第二章·暗渡陈仓",
    "rooms": [
      {
        "id": "east_market_entrance",
        "name": "东市入口",
        "description": "晨雾未散，东市外的长街已经嘈杂起来。货车辚辚，叫卖声此起彼伏，却有一种与往常不同的紧张气息在人群中流淌。官府的悬赏令贴在坊墙上，白纸黑字，触目惊心。",
        "interactables": ["evt_market_notice", "evt_merchant_gossip"],
        "exits": ["huichuntang", "antique_shop", "cien_temple"]
      },
      {
        "id": "huichuntang",
        "name": "回春堂药铺",
        "description": "药香弥漫的铺子，架上摆满了各色草药。老板娘在柜台后低头捣药，不多言语。一个身着灰色僧袍的和尚盘坐在角落，神情沉静，手中转着一串佛珠。",
        "interactables": ["evt_medicine_shelf", "evt_prescription_book", "npc_wujue"],
        "exits": ["east_market_entrance", "cien_temple"]
      },
      {
        "id": "antique_shop",
        "name": "西市古玩铺",
        "description": "铺子不大，却摆满了奇珍异玩。掌柜是个面白无须的中年人，眼神灵活，见你进来，微微一笑，不动声色地打量着你。柜台角落摆着一只天青色瓷瓶，底部刻有隐约的纹饰。",
        "interactables": ["evt_appraise_token", "evt_buyer_ledger", "npc_buyer_contact"],
        "exits": ["east_market_entrance"]
      },
      {
        "id": "cien_temple",
        "name": "慈恩寺偏院",
        "description": "大雁塔的影子落在偏院的青砖上，几株老柏遮住了大半天光。院中少有香客，只有鸟鸣和偶尔传来的诵经声。一间僧房的门虚掩着，隐约飘出草药气息。",
        "interactables": ["evt_monk_cell", "evt_temple_mural", "npc_wujue"],
        "exits": ["east_market_entrance", "pingkang_hideout"]
      },
      {
        "id": "pingkang_hideout",
        "name": "平康坊据点",
        "description": "平康坊深处一栋不起眼的院落，白日里大门紧闭，偶有人影出入，神情警惕。墙角的青苔上有一行新踩的脚印，还未干透。院内隐约可闻压低的交谈声。",
        "interactables": ["evt_hideout_search", "evt_captive_note", "npc_langpeng_scout"],
        "exits": ["cien_temple", "imperial_teahouse"],
        "requires": null
      },
      {
        "id": "imperial_teahouse",
        "name": "皇城茶馆",
        "description": "皇城外一家看似普通的茶馆，雅间深处灯火昏黄。茶香中隐有肃杀气。那个你一直在追寻的白色身影，正端坐在最里间，等着你。",
        "interactables": ["evt_teahouse_ambush", "evt_li_mao_encounter", "npc_li_mao"],
        "exits": ["pingkang_hideout"],
        "requires": {
          "flags": ["langpeng_trail"]
        }
      }
    ]
  }
]
```

- [ ] **Step 4: Create `src/data/items/chapter2.json`**

```json
[
  {
    "id": "poison_residue_sample",
    "name": "毒药残样",
    "description": "从回春堂药架比对所得，与宋怀义尸身所中之毒吻合——一种以砒霜为基、掺以他物的特殊配方。",
    "isClue": true
  },
  {
    "id": "wujue_prescription",
    "name": "无迹方笺",
    "description": "无迹和尚亲笔所写，记有一味特殊的配毒之法，笔迹与回春堂药架上的标签吻合。",
    "isClue": true
  },
  {
    "id": "monk_identity_scroll",
    "name": "僧籍密卷",
    "description": "藏于僧房隔板之后，载明无迹和尚真实身份：天机阁旧部，风字组成员，法名之前名叫韩朔。",
    "isClue": true
  },
  {
    "id": "langpeng_dispatch_order",
    "name": "浪鹏调令",
    "description": "一纸手书，以李邈笔迹写就，命令浪鹏帮在往事客栈外布置眼线，伺机取走宋怀义携带的名单。",
    "isClue": true
  },
  {
    "id": "buyer_transaction_record",
    "name": "买家往来账",
    "description": "古玩铺的暗账，记录天机令牌数次易手的轨迹，最终流向一个没有名字的「委托人」。",
    "isClue": true
  },
  {
    "id": "tianji_signal_record",
    "name": "天机暗号册",
    "description": "壁画后的夹层中取出，记有天机阁内部一套联络暗语，部分页面已被撕去，留下的恰好够拼出一个字：鸢。",
    "isClue": true
  },
  {
    "id": "captive_letter",
    "name": "被俘信函",
    "description": "平康坊据点搜出的密信，证明浪鹏帮在李邈授意下行事，并提及「鸢已入局，名单不可落入旁人之手」。",
    "isClue": true
  },
  {
    "id": "second_killer_evidence",
    "name": "第二凶手证据",
    "description": "综合毒药来源、浪鹏调令与天机暗号，证据指向宋怀义案中那只真正动手的幕后黑手——并非顾凌霜一人所为。",
    "isClue": true
  },
  {
    "id": "reward_notice",
    "name": "东市悬赏令",
    "description": "官府张贴的通缉令，含模糊的画像和五十两赏银，所描述的特征——白衣、高颧骨、左手有旧伤——隐约与白衣人相符。",
    "isClue": false
  },
  {
    "id": "teahouse_token",
    "name": "皇城茶馆入场牌",
    "description": "一枚素色木牌，背面刻有隐约的天机纹，是进入茶馆内室的凭证。",
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
import talentsRaw from './talents.json';
import templatesRaw from './templates.json';

export const MAPS: GameMap[] = [...chapter1MapsRaw, ...chapter2MapsRaw] as GameMap[];
export const EVENTS: GameEvent[] = [...chapter1EventsRaw, ...chapter2EventsRaw] as GameEvent[];
export const NPCS: NPC[] = [...chapter1NPCsRaw, ...chapter2NPCsRaw] as NPC[];
export const ITEMS: Item[] = [...chapter1ItemsRaw, ...chapter2ItemsRaw] as Item[];
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

Note: this also fixes a pre-existing bug in `getTalent` (`t.id === t.id` → `t.id === id`).

- [ ] **Step 6: Run tests to verify pass**

Run: `cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter2Integrity.test.ts`
Expected: PASS (map and item describe blocks pass; event/NPC describes will show "0 tests" until Tasks 2–3 add them)

- [ ] **Step 7: Run all existing tests for no regressions**

Run: `cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter1Integrity.test.ts`
Expected: all chapter1 tests still pass

- [ ] **Step 8: Commit**

```bash
git add src/data/maps/chapter2.json src/data/items/chapter2.json src/data/loader.ts tests/data/chapter2Integrity.test.ts
git commit -m "feat: add chapter2 map, items and update loader"
```

---

### Task 2: Chapter 2 events JSON

**Files:**
- Create: `src/data/events/chapter2.json`
- Modify: `tests/data/chapter2Integrity.test.ts` (append event assertions)

- [ ] **Step 1: Append event assertions to `tests/data/chapter2Integrity.test.ts`**

Add at the end of the file (after the closing `});` of the existing describe block):

```typescript
describe('chapter2 event integrity', () => {
  const allEventIds = new Set(EVENTS.map((e) => e.id));
  const allItemIds = new Set(ITEMS.map((i) => i.id));
  const allNpcIds = new Set(NPCS.map((n) => n.id));
  const ch2Map = MAPS.find((m) => m.id === 'chapter2');

  it('all 12 chapter2 events exist', () => {
    const expected = [
      'evt_market_notice', 'evt_merchant_gossip',
      'evt_medicine_shelf', 'evt_prescription_book',
      'evt_appraise_token', 'evt_buyer_ledger',
      'evt_monk_cell', 'evt_temple_mural',
      'evt_hideout_search', 'evt_captive_note',
      'evt_teahouse_ambush', 'evt_li_mao_encounter',
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
```

- [ ] **Step 2: Run test to verify new assertions fail**

Run: `cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter2Integrity.test.ts`
Expected: FAIL — events not found

- [ ] **Step 3: Create `src/data/events/chapter2.json`**

```json
[
  {
    "id": "evt_market_notice",
    "title": "东市告示墙",
    "description": "一面贴满告示的坊墙。最显眼的是一张新贴的通缉令，墨迹未干，围观者指指点点。",
    "actions": [
      {
        "id": "read_notice",
        "label": "细看告示内容",
        "requires": null,
        "result": "通缉令上的画像模糊，但描述清晰：白衣、高颧骨、左手旧伤。你将这些特征默记于心。赏银五十两，捉拿归案。",
        "grants": { "flags": ["market_entry"], "items": ["reward_notice"] }
      },
      {
        "id": "examine_carefully",
        "label": "仔细辨认画像特征",
        "requires": { "wisdom": 6 },
        "result": "你仔细辨认告示上的描述，忽然想起往事客栈那个白衣人——左手确实有一道旧伤疤，不深，却显眼。画像画的，正是他。",
        "grants": { "flags": ["market_entry", "li_mao_description_known"], "items": ["reward_notice"] }
      }
    ]
  },
  {
    "id": "evt_merchant_gossip",
    "title": "茶摊消息",
    "description": "茶摊旁几个商贩聚在一起，压低声音说着什么。提到「昨夜平康坊有动静」。",
    "actions": [
      {
        "id": "listen_gossip",
        "label": "凑近旁听",
        "requires": null,
        "result": "断断续续听到几句：「昨夜平康坊院子里出进了好几个人……」「不知道是哪路帮派……」「跟那个白衣爷有关系吧……」",
        "grants": { "flags": ["east_market_rumor"] }
      },
      {
        "id": "buy_information",
        "label": "出钱打听详情",
        "requires": { "wisdom": 7 },
        "result": "你摸出几枚铜钱，茶摊掌柜会意，凑近低声道：「那帮人昨夜急着撤，说是平康坊西头有人盯着……浪鹏帮的，这几日在城里走动频繁。」",
        "grants": { "flags": ["east_market_rumor", "langpeng_sighting"] }
      }
    ]
  },
  {
    "id": "evt_medicine_shelf",
    "title": "药架检查",
    "description": "回春堂的药架整整齐齐，各色草药按性状分类。有几格药格里的药材新旧混杂，像是近日有人动过。",
    "actions": [
      {
        "id": "browse_shelf",
        "label": "随手翻看",
        "requires": null,
        "result": "药架上的品类繁多，你认出几味常见草药，其余的不甚了解。架子背后有个小抽屉，用铜锁锁着。",
        "grants": { "flags": ["medicine_browsed"] }
      },
      {
        "id": "compare_poison",
        "label": "以账本记录比对药架",
        "requires": { "has": ["account_book"] },
        "result": "你翻出账本上的记载，与药架上的药材逐一比对。其中一格放着混合砒霜与他物的特殊配方——账本中记载的正是此毒，与宋怀义的死因吻合。",
        "grants": { "flags": ["poison_matched"], "items": ["poison_residue_sample"] }
      },
      {
        "id": "deep_analysis",
        "label": "凭医理推断毒药来源",
        "requires": { "wisdom": 8 },
        "result": "你以精深的医理辨析药架中的可疑药材，很快锁定其中一格：砒霜与曼陀罗花合制，能令人先昏迷再窒息，恰与宋怀义的死状相符。",
        "grants": { "flags": ["poison_matched", "poison_source_known"], "items": ["poison_residue_sample"] }
      }
    ]
  },
  {
    "id": "evt_prescription_book",
    "title": "方剂簿",
    "description": "柜台下压着一本破旧的方剂簿，封面磨损，内页有多处涂改。",
    "actions": [
      {
        "id": "flip_through",
        "label": "随手翻阅",
        "requires": null,
        "result": "方剂簿上密密麻麻写着各类药方，笔迹潦草。你翻了几页，看不出什么特别之处。",
        "grants": { "flags": ["prescription_seen"] }
      },
      {
        "id": "recognize_handwriting",
        "label": "辨认笔迹来源",
        "requires": { "wisdom": 7 },
        "result": "你仔细辨认方剂簿上的笔迹，发现部分方子是后来补写的，字迹与你在慈恩寺见过的无迹和尚写字时的运笔习惯如出一辙。",
        "grants": { "items": ["wujue_prescription"] }
      },
      {
        "id": "recognize_handwriting_met",
        "label": "对照已知笔迹辨认",
        "requires": { "flags": ["wujue_met"] },
        "result": "你仔细辨认方剂簿上某几页的笔迹，认出正是无迹和尚的手迹。这位和尚在此铺子留下了痕迹，而且是关于配毒的方子。",
        "grants": { "items": ["wujue_prescription"] }
      }
    ]
  },
  {
    "id": "evt_appraise_token",
    "title": "鉴定天机令牌",
    "description": "古玩铺掌柜见到你手中的天机玉令，目光一凝，随即若无其事地移开。",
    "requires": { "has": ["tianji_jade_token"] },
    "actions": [
      {
        "id": "casual_appraisal",
        "label": "随口询问此令价值",
        "requires": null,
        "result": "掌柜不动声色地看了一眼，道：「寻常玉牌，值不了几个钱。」你见他眼神躲闪，知道他在撒谎。",
        "grants": { "flags": ["token_appraised"] }
      },
      {
        "id": "expert_appraisal",
        "label": "说出令牌来历逼其表态",
        "requires": { "wisdom": 7 },
        "result": "你将令牌的纹饰特征一一道来，掌柜的脸色变了变，终于道：「你既知此物来历……」他从柜台下取出一册账本，翻到某一页，指给你看。",
        "grants": { "flags": ["tianji_seal_read"], "items": ["buyer_transaction_record"] }
      }
    ]
  },
  {
    "id": "evt_buyer_ledger",
    "title": "交易账本",
    "description": "古玩铺深处的暗格里压着一册账本，纸页微微泛黄，字迹极小。",
    "actions": [
      {
        "id": "skim_ledger",
        "label": "草草翻阅",
        "requires": null,
        "result": "账本上密密麻麻记着交易记录，品类繁杂。你粗粗一扫，发现几笔异常大额的交易，日期是近半月内。",
        "grants": { "flags": ["ledger_seen"] }
      },
      {
        "id": "trace_entries",
        "label": "逐条追溯来源",
        "requires": { "wisdom": 6 },
        "result": "你逐条核查账目，理出一条线索：数件「古玉」辗转易手，最终流向一个仅以「李」字记录的买家。交易时间恰在宋怀义死前数日。",
        "grants": { "flags": ["ledger_seen"], "items": ["buyer_transaction_record"] }
      },
      {
        "id": "trace_entries_agi",
        "label": "悄悄拓印关键页",
        "requires": { "agility": 7 },
        "result": "趁掌柜不备，你迅速将几页关键账目拓下。记录显示，天机令牌曾在此铺三度易手，最后一次的买家写的是「委托人，李，长安城」。",
        "grants": { "flags": ["ledger_seen"], "items": ["buyer_transaction_record"] }
      }
    ]
  },
  {
    "id": "evt_monk_cell",
    "title": "僧房搜查",
    "description": "僧房不大，一张草席，一只书箱，别无他物。然而草席下的地板有轻微隆起，书箱背面隐约有划痕。",
    "actions": [
      {
        "id": "search_cell",
        "label": "粗略搜查",
        "requires": null,
        "result": "你翻了翻书箱，只有几卷经文和一块磨光的砚台。地板下的隆起是一块松动的砖，撬开只有一个空洞。",
        "grants": { "flags": ["cell_searched"] }
      },
      {
        "id": "find_hidden_compartment",
        "label": "细查书箱隔板",
        "requires": { "agility": 7 },
        "result": "你拆开书箱底板，发现一层夹层，内藏一卷密封的卷轴。卷轴上的内容令你屏住了呼吸——那是一份天机阁成员的身份记录，署名处写着：无迹，俗名韩朔，天机阁风字组。",
        "grants": { "items": ["monk_identity_scroll"] }
      },
      {
        "id": "find_hidden_compartment_wis",
        "label": "以医理推断夹层位置",
        "requires": { "wisdom": 8 },
        "result": "药材存放处必有防潮夹层——你凭这个逻辑，很快在书箱的第三格背板找到了机关。内藏一卷密封的卷轴，载明无迹和尚真实身份。",
        "grants": { "items": ["monk_identity_scroll"] }
      },
      {
        "id": "force_open",
        "label": "硬撬书箱底板",
        "requires": { "strength": 8 },
        "result": "你用力撬开书箱底板，木头嘎吱一声裂开，露出一层夹层。内藏一卷密封卷轴，记载着无迹和尚的真实身份与天机阁旧案始末。",
        "grants": { "items": ["monk_identity_scroll"] }
      }
    ]
  },
  {
    "id": "evt_temple_mural",
    "title": "偏院壁画",
    "description": "偏院墙上有一幅褪色的壁画，绘的是飞天图案，线条繁复，层层叠叠。画面边缘有几处修补的痕迹，修补的灰泥颜色与原墙不符。",
    "actions": [
      {
        "id": "observe_mural",
        "label": "观赏壁画",
        "requires": null,
        "result": "壁画笔法粗劣，并非名家手迹。修补处的灰泥新旧不一，像是近年才补的。你总觉得其中有什么不对劲，却说不清。",
        "grants": { "flags": ["mural_seen"] }
      },
      {
        "id": "decode_pattern",
        "label": "辨析壁画暗语",
        "requires": { "wisdom": 7 },
        "result": "你仔细比对壁画中飞天的姿态——共九种，每种对应天机阁联络系统中的一个方位暗号。你剥开一处修补的灰泥，后面藏着一册薄薄的小册子，正是天机阁的内部暗号记录。",
        "grants": { "flags": ["mural_seen", "tianji_signal_known"], "items": ["tianji_signal_record"] }
      },
      {
        "id": "decode_pattern_tianji",
        "label": "凭天机线索解读壁画",
        "requires": { "flags": ["wujue_tianji_revealed"] },
        "result": "无迹已告知你天机阁的暗语体系。你对照壁画，很快找到藏于修补处的暗号册，取出后装入怀中。",
        "grants": { "flags": ["mural_seen", "tianji_signal_known"], "items": ["tianji_signal_record"] }
      }
    ]
  },
  {
    "id": "evt_hideout_search",
    "title": "据点搜查",
    "description": "院落内散落着几只草绳和一些包裹残余，像是仓皇撤离后留下的。正堂的桌上还有半杯凉茶，地上有被拖拽过的痕迹。",
    "actions": [
      {
        "id": "quick_search",
        "label": "快速扫视",
        "requires": null,
        "result": "你粗粗扫了一圈，发现这里确实是个临时据点，但大部分有用的东西已被带走。地上有几片撕碎的纸屑，拼不出完整内容。",
        "grants": { "flags": ["hideout_entered"] }
      },
      {
        "id": "thorough_search",
        "label": "搜查暗格隐匿处",
        "requires": { "agility": 7 },
        "result": "你轻手轻脚地排查各处，在墙根的砖缝里摸出一个油纸包，内有一纸折叠整齐的调令——李邈的笔迹，命浪鹏帮监视往事客栈、截取宋怀义的密件。",
        "grants": { "flags": ["hideout_entered"], "items": ["langpeng_dispatch_order"] }
      },
      {
        "id": "break_through",
        "label": "破门强搜",
        "requires": { "strength": 8 },
        "result": "你踹开内室的门，吓退几名残留的浪鹏帮小喽啰。众人仓皇逃散，你在混乱中翻出一个木匣——内有李邈亲笔调令，命令浪鹏帮在往事客栈布置眼线。",
        "grants": { "flags": ["hideout_entered"], "items": ["langpeng_dispatch_order"] }
      },
      {
        "id": "decode_records",
        "label": "辨析残留文书",
        "requires": { "wisdom": 8 },
        "result": "你把地上的纸屑一片片拼合，凭着过人的辨析能力，将残缺文字填补完整——是一份调令，李邈手书，命浪鹏帮监视往事客栈，伺机取走宋怀义的随身密件。",
        "grants": { "flags": ["hideout_entered"], "items": ["langpeng_dispatch_order"] }
      }
    ]
  },
  {
    "id": "evt_captive_note",
    "title": "被俘信函",
    "description": "正堂角落里，一个被捆绑过的人已经逃走，地上留下捆绳和一封没来得及带走的信函。",
    "actions": [
      {
        "id": "read_note",
        "label": "捡起信函阅读",
        "requires": null,
        "result": "信函字迹潦草，像是急就而成。内容是浪鹏帮探子向上头汇报：「鸢已入局，名单不可落入旁人之手，李爷有令，跟紧那人的脚步。」这「李爷」，便是李邈。",
        "grants": { "flags": ["langpeng_trail"], "items": ["captive_letter"] }
      },
      {
        "id": "analyze_seal",
        "label": "辨析信函封印笔迹",
        "requires": { "wisdom": 7 },
        "result": "你不仅读了信的内容，更仔细辨认封印上的字迹。那笔「李」字与你之前见过的李邈手书如出一辙——这是他亲自下令的铁证。",
        "grants": { "flags": ["langpeng_trail", "li_mao_handwriting_known"], "items": ["captive_letter"] }
      }
    ]
  },
  {
    "id": "evt_teahouse_ambush",
    "title": "茶馆戒备",
    "description": "皇城茶馆的门半开着，内里灯火朦胧。你在门口停顿片刻，感觉有什么眼神扫过你的背脊。",
    "actions": [
      {
        "id": "enter_carefully",
        "label": "推门而入",
        "requires": null,
        "result": "你推开茶馆的门，伙计侧目，茶客们的交谈声低了一瞬。最里间的雅座有人端坐，白衣，背对着门，正是你要找的人。",
        "grants": { "flags": ["entered_teahouse"] }
      },
      {
        "id": "scout_first",
        "label": "先行查探四周",
        "requires": { "agility": 7 },
        "result": "你绕到茶馆侧面，发现后巷站着两个便衣武人，刀柄露出半截。正门旁的茶客神情警觉，不像真正的茶客。你暗记位置，从容推门而入。",
        "grants": { "flags": ["entered_teahouse", "ambush_detected"] }
      }
    ]
  },
  {
    "id": "evt_li_mao_encounter",
    "title": "终局·李邈",
    "description": "他转过身来，正是往事客栈那个白衣人。李邈。他看着你，神色平静，像是等了你很久。「坐。」他说，「该说的，我们慢慢说。」",
    "requires": { "flags": ["entered_teahouse"] },
    "actions": [
      {
        "id": "arrest_ending",
        "label": "「证据确凿，你走不了。」（出示铁证）",
        "requires": { "has": ["poison_residue_sample", "monk_identity_scroll", "langpeng_dispatch_order"] },
        "result": "你将三件证物逐一推到桌上。\n\n毒药残样——证明宋怀义的死与回春堂有关。僧籍密卷——证明无迹和尚是天机阁旧部，受人指使。浪鹏调令——上面写着李邈的名字，写着对宋怀义的监视令。\n\n李邈盯着那三件东西，沉默了很久，最后轻轻笑了笑：「你比我预料的聪明。」\n\n门外脚步声响起。你提前联络的衙门捕快踹开了门。\n\n李邈站起来，整了整衣袍，没有逃跑，只是看了你最后一眼：「天机阁不会因为我一个人倒下的。」\n\n他被带走了。长安的风吹过茶馆，带来一丝说不清道不明的凉意。宋怀义的案子，算是有了一个答案。但那个叫「鸢」的人，还在某个你看不见的地方，等待着下一步棋。",
        "grants": { "flags": ["chapter2_arrest_ending"] }
      },
      {
        "id": "release_ending",
        "label": "「说清楚你知道的，然后滚。」（逼问情报）",
        "requires": { "flags": ["langpeng_trail"] },
        "result": "你没有足够的证据将他拿下，但你手里有的，已经足够让他坐下来好好谈一谈。\n\n李邈没有否认浪鹏帮的事。他只是说：「你想要什么？」\n\n你要的是真相。他给了你一部分——宋怀义确实是天机阁的叛逃者，名单上的人命悬一线，而「鸢」只是一个代号，真正的主使另有其人。\n\n作为交换，他从容离开了茶馆。你坐在原地，看着他的背影消失在长安的街道里。\n\n手里多了一枚皇城茶馆的入场牌，和一句话：「若想知道鸢是谁，去找东市回春堂的账目，再去问大雁塔下的无名碑。」",
        "grants": { "flags": ["chapter2_release_ending"], "items": ["teahouse_token"] }
      },
      {
        "id": "join_ending",
        "label": "「天机阁……说来听听。」（考虑招募）",
        "requires": { "flags": ["tianji_recruit_offered"], "agility": 8 },
        "result": "你靠在椅背上，神情懒散，语气漫不经心。\n\n李邈看了你片刻，似乎在衡量什么。然后他开口，将天机阁的真实面目徐徐道来——那不是一个帮派，而是一张网，覆盖长安城三十七处要津，每一处都有人在守。\n\n「宋怀义带走的名单，是这张网上的每一个节点。」他说，「若名单落入错误的人手里，整张网都会被摧毁。」\n\n「而你，」他顿了顿，「有能力帮我找回它。」\n\n你没有立刻答应，但你没有离开。窗外，长安城的灯火一盏一盏亮起来，像一张正在收紧的网。",
        "grants": { "flags": ["chapter2_join_ending"] }
      }
    ]
  }
]
```

- [ ] **Step 4: Run test to verify event assertions pass**

Run: `cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter2Integrity.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/events/chapter2.json tests/data/chapter2Integrity.test.ts
git commit -m "feat: add chapter2 events JSON"
```

---

### Task 3: Chapter 2 NPCs JSON

**Files:**
- Create: `src/data/npcs/chapter2.json`
- Modify: `tests/data/chapter2Integrity.test.ts` (append NPC assertions)

- [ ] **Step 1: Append NPC assertions to `tests/data/chapter2Integrity.test.ts`**

Add at the end of the file:

```typescript
describe('chapter2 npc integrity', () => {
  const allNpcIds = new Set(NPCS.map((n) => n.id));
  const allItemIds = new Set(ITEMS.map((i) => i.id));

  it('all 4 chapter2 npcs exist', () => {
    const expected = ['npc_wujue', 'npc_langpeng_scout', 'npc_buyer_contact', 'npc_li_mao'];
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

  it('completion guarantee: all templates reach at least chapter2_release_ending via langpeng_trail', () => {
    // evt_captive_note read_note (no condition) grants langpeng_trail
    // imperial_teahouse requires langpeng_trail
    // evt_li_mao_encounter release_ending requires flag langpeng_trail
    // All templates can reach pingkang_hideout (no requires on room) and read the note
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
```

- [ ] **Step 2: Run test to verify NPC assertions fail**

Run: `cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter2Integrity.test.ts`
Expected: FAIL — NPCs not found

- [ ] **Step 3: Create `src/data/npcs/chapter2.json`**

```json
[
  {
    "id": "npc_wujue",
    "name": "无迹和尚",
    "description": "一个约莫五十岁的灰袍僧人，眼神深邃，说话慢条斯理，总像是在权衡每一个字。",
    "dialogues": [
      {
        "id": "first_meet",
        "condition": null,
        "text": "你从何处而来？……往事客栈。那地方出了人命，听说了。施主若无事，贫僧还有药要捡。",
        "grants": { "flags": ["wujue_met"] }
      },
      {
        "id": "poison_knowledge",
        "condition": { "flags": ["wujue_met"] },
        "text": "砒霜配曼陀罗？这是极罕见的配法，坊间少有人知。贫僧……略知一二。施主为何问这个？",
        "grants": { "flags": ["poison_source_known"] }
      },
      {
        "id": "token_inquiry",
        "condition": { "has": ["dafei_inner_token"] },
        "text": "这枚令……贫僧已多年未见此物。施主从何处得来？大飞帮？……那帮人还在。罢了，施主若有疑问，贫僧可以说几句。",
        "grants": { "flags": ["wujue_met"] }
      },
      {
        "id": "alley_drug_origin",
        "condition": { "has": ["alley_rubbing"] },
        "text": "这拓片……是天机阁的货运标记。贫僧认得。当年风字组押运过不少这样的货。你想知道毒从何来？回春堂，贫僧的药架，第七格，左侧第三瓶。",
        "grants": { "items": ["wujue_prescription"] }
      },
      {
        "id": "true_identity",
        "condition": { "has": ["monk_identity_scroll"] },
        "text": "你找到了那卷东西。……贫僧知道你想说什么。韩朔，天机阁风字组。那是二十年前的事了。贫僧早已不是那个人，但有些事，终究是躲不掉的。",
        "grants": { "flags": ["wujue_tianji_revealed"] }
      }
    ]
  },
  {
    "id": "npc_langpeng_scout",
    "name": "浪鹏帮探子",
    "description": "一个神情警惕的年轻人，手边放着一柄短刀，见你进来就往后退了一步。",
    "dialogues": [
      {
        "id": "first_meet",
        "condition": null,
        "text": "你是谁？这里不欢迎生人。有什么事快说，说完就走。"
      },
      {
        "id": "intimidate",
        "condition": { "strength": 8 },
        "text": "你……你想干什么！行行好，别动手……我说，我都说！李爷确实让我们盯那个客栈，盯一个叫宋怀义的商人。我们只是盯着，没有动手，真的没有动手！",
        "grants": { "flags": ["langpeng_trail"] }
      },
      {
        "id": "tail",
        "condition": { "agility": 8 },
        "text": "你……你一直跟着我？从据点到这里？……好，好吧。说就说。李爷下令，要我们跟紧那个宋怀义，他一旦取出藏起来的东西，立刻上报。我们只是跑腿的，真正知道内情的，是李爷自己。",
        "grants": { "flags": ["langpeng_trail"] }
      },
      {
        "id": "probe",
        "condition": { "wisdom": 7 },
        "text": "你知道浪鹏帮最近的动向……你也知道平康坊的事……你到底是什么人？……罢了，跟你说也无妨。是李邈，长安城里那位「李爷」，雇了我们帮他盯梢，监视往事客栈。那个宋怀义，他们早就盯上了。",
        "grants": { "flags": ["langpeng_trail"] }
      }
    ]
  },
  {
    "id": "npc_buyer_contact",
    "name": "古玩掌柜",
    "description": "一个面白无须的中年人，笑容可掬，但眼神总是飘忽，像在打量每一个进门的客人。",
    "dialogues": [
      {
        "id": "first_meet",
        "condition": null,
        "text": "客官请进，随便看，随便看。本店古玩字画，一应俱全，价钱公道，童叟无欺。"
      },
      {
        "id": "token_inquiry",
        "condition": { "has": ["tianji_jade_token"] },
        "text": "这块玉……在下见过几次，但每次见到它，后面都跟着麻烦。您既然知道这块玉的来历，在下不妨直说——这是天机阁的信物。在下只是个中间人，买家委托在下收集此类物品，从不问原因。",
        "grants": { "flags": ["tianji_seal_read"], "items": ["buyer_transaction_record"] }
      },
      {
        "id": "hidden_client",
        "condition": { "flags": ["tianji_seal_read"], "wisdom": 8 },
        "text": "委托人是谁？……在下只见过一次，白衣，高颧骨，左手有旧伤。留下的字条上只写了一个字：李。再多的，在下真的不知道了。",
        "grants": { "flags": ["buyer_identity_hinted"] }
      }
    ]
  },
  {
    "id": "npc_li_mao",
    "name": "李邈",
    "description": "一个约莫四十岁的白衣男人，气质清冷，举止从容。你在往事客栈见过他，那时他叫自己「白衣人」。",
    "dialogues": [
      {
        "id": "first_meet",
        "condition": { "flags": ["entered_teahouse"] },
        "text": "你终于来了。我在这里等了两天。……坐，先喝杯茶。有些话，站着不好说。"
      },
      {
        "id": "tianji_accusation",
        "condition": { "has": ["kite_identity_clue"] },
        "text": "「鸢」……你知道这个字？那你已经比我想象的走得更远了。好，我不否认。我是天机阁的人。但宋怀义的死，不全是我的安排。",
        "grants": { "flags": ["li_mao_exposed"] }
      },
      {
        "id": "langpeng_evidence",
        "condition": { "has": ["langpeng_dispatch_order"] },
        "text": "这是我的手书，我认。浪鹏帮是我雇的，任务是盯梢和截件，不是杀人。宋怀义死的那一夜，我的人还在客栈外守着，根本没有机会进去。杀他的，另有其人。",
        "grants": { "flags": ["li_mao_cornered"] }
      },
      {
        "id": "recruitment_offer",
        "condition": { "flags": ["li_mao_exposed"] },
        "text": "你这样的人，在江湖上白白耗着可惜了。天机阁需要像你这样的人——能查案，能走暗路，还能在危局中活下来。……你考虑一下。",
        "grants": { "flags": ["tianji_recruit_offered"] }
      }
    ]
  }
]
```

- [ ] **Step 4: Run test to verify all assertions pass**

Run: `cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter2Integrity.test.ts`
Expected: PASS — all describe blocks green

- [ ] **Step 5: Run full test suite for no regressions**

Run: `cd /Users/xuli/claudeGame && npx vitest run`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/data/npcs/chapter2.json tests/data/chapter2Integrity.test.ts
git commit -m "feat: add chapter2 NPCs JSON"
```

---

### Task 4: ChapterEnd page + routing + Game.tsx detection

**Files:**
- Create: `src/pages/ChapterEnd/ChapterEnd.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/Game/Game.tsx`

Flow: Chapter 1 ending flags → Game.tsx useEffect → navigate `/chapter-end` → ChapterEnd shows summary → click → sets `chapter2_started` + room `east_market_entrance` → navigate `/game`. Chapter 2 endings → same detection → ChapterEnd shows "第二章·完" → click → navigate `/`.

- [ ] **Step 1: Create `src/pages/ChapterEnd/ChapterEnd.tsx`**

```tsx
import { useState, useEffect } from 'react';
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

export default function ChapterEnd() {
  const navigate = useNavigate();
  const scene = useSceneStore();
  const { items } = useInventoryStore();
  const [visibleCount, setVisibleCount] = useState(0);
  const [showButton, setShowButton] = useState(false);

  const isChapter2 = scene.flags.includes('chapter2_started');
  const endingFlag = isChapter2
    ? Object.keys(CHAPTER2_ENDINGS).find((f) => scene.flags.includes(f))
    : Object.keys(CHAPTER1_ENDINGS).find((f) => scene.flags.includes(f));

  const endingText = endingFlag
    ? (isChapter2 ? CHAPTER2_ENDINGS[endingFlag] : CHAPTER1_ENDINGS[endingFlag])
    : '';

  const chapterTitle = isChapter2 ? '第二章·完' : '第一章·完';

  const clueItems = isChapter2
    ? []
    : items.filter((id) => getItem(id)?.isClue).map((id) => getItem(id)!);

  const lines = [
    chapterTitle,
    endingText,
    ...(clueItems.length > 0 ? ['【你所掌握的线索】'] : []),
    ...clueItems.map((item) => `· ${item.name}`),
  ].filter(Boolean);

  useEffect(() => {
    if (visibleCount < lines.length) {
      const t = setTimeout(() => setVisibleCount((c) => c + 1), visibleCount === 0 ? 300 : 1800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShowButton(true), 600);
    return () => clearTimeout(t);
  }, [visibleCount, lines.length]);

  const handleContinue = () => {
    if (isChapter2) {
      navigate('/');
    } else {
      scene.addFlag('chapter2_started');
      scene.setRoom('east_market_entrance');
      navigate('/game');
    }
  };

  const buttonLabel = isChapter2 ? '回到主菜单' : '踏入第二章';

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

- [ ] **Step 2: Add `/chapter-end` route to `src/App.tsx`**

Replace the file:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainMenu from './pages/MainMenu/MainMenu';
import CharacterCreate from './pages/CharacterCreate/CharacterCreate';
import Prologue from './pages/Prologue/Prologue';
import Game from './pages/Game/Game';
import ChapterEnd from './pages/ChapterEnd/ChapterEnd';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/create" element={<CharacterCreate />} />
        <Route path="/prologue" element={<Prologue />} />
        <Route path="/game" element={<Game />} />
        <Route path="/chapter-end" element={<ChapterEnd />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 3: Add chapter-end detection to `src/pages/Game/Game.tsx`**

**Edit 1** — add `useEffect` to the import (line 1):

Find:
```tsx
import { useState, useRef } from 'react';
```
Replace with:
```tsx
import { useState, useRef, useEffect } from 'react';
```

**Edit 2** — add module-level constants just before `export default function Game()` (line 29).

Find:
```tsx
export default function Game() {
```
Replace with:
```tsx
const CHAPTER1_ENDINGS = ['chapter1_truth_ending', 'chapter1_force_ending', 'chapter1_hermit_ending'];
const CHAPTER2_ENDINGS = ['chapter2_arrest_ending', 'chapter2_release_ending', 'chapter2_join_ending'];

export default function Game() {
```

**Edit 3** — add useEffect after the `useSettings()` call (line 39) and before the `if (!player.name)` guard.

Find:
```tsx
  useAutoSave();
  useSettings();

  if (!player.name) {
    navigate('/');
    return null;
  }
```
Replace with:
```tsx
  useAutoSave();
  useSettings();

  useEffect(() => {
    const inChapter2 = scene.flags.includes('chapter2_started');
    const endings = inChapter2 ? CHAPTER2_ENDINGS : CHAPTER1_ENDINGS;
    if (endings.some((f) => scene.flags.includes(f))) {
      navigate('/chapter-end');
    }
  }, [scene.flags, navigate]);

  if (!player.name) {
    navigate('/');
    return null;
  }
```

The constants are module-level so they are stable references and do not need to appear in the dependency array. The `useEffect` is called unconditionally before any early returns, which satisfies React hooks rules.

- [ ] **Step 4: Build to verify TypeScript compiles**

Run: `cd /Users/xuli/claudeGame && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Run all tests**

Run: `cd /Users/xuli/claudeGame && npx vitest run`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/pages/ChapterEnd/ChapterEnd.tsx src/App.tsx src/pages/Game/Game.tsx
git commit -m "feat: add ChapterEnd page, routing and chapter-end detection"
```
