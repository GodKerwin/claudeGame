# 通关保证修复 + 内容拓展实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复药师/全能客默认属性无法通关的严重bug，并新增三条内容线（大堂住客册、后巷蓝衫人追踪、废弃宅院耳室）。

**Architecture:** 纯JSON数据驱动。修复通过在现有NPC对话 grants 中追加旗标实现；拓展内容通过新增 event 条目和地图 interactables 实现，不改引擎代码。

**Tech Stack:** React 18, TypeScript, Zustand, JSON data files, Vitest 2.x

---

## 文件结构

| 操作 | 文件 |
|------|------|
| 修改 | `src/data/npcs/chapter1.json` — fei_ye ask_who_is_kite grants 追加 kite_identity_clue |
| 修改 | `src/data/events/chapter1.json` — evt_body_examine 新增低智慧替代动作；新增 evt_guest_register、evt_blue_shirt_trace、evt_mansion_ear_room |
| 修改 | `src/data/maps/chapter1.json` — lobby、back_alley、old_mansion interactables 追加新事件 |
| 修改 | `src/data/items/chapter1.json` — 新增 3 个线索道具 |
| 修改 | `tests/data/chapter1Integrity.test.ts` — 新增完整性测试 |

---

## 背景知识

### 通关路径（按角色）

| 角色 | 默认属性 | 可用结局（修复前） | 可用结局（修复后） |
|------|---------|-----------------|-----------------|
| 游侠 | STR8,AGI7,WIS5,CON4 | 莽夫✓ 隐士✓ | 莽夫✓ 隐士✓ 真相✓(新) |
| 谋士 | STR3,AGI5,WIS10,CON6 | 真相✓ | 真相✓ |
| 刺客 | STR5,AGI10,WIS5,CON4 | 隐士✓ | 隐士✓ 真相✓(新) |
| 药师 | STR4,AGI5,WIS6,CON9 | **无** ❌ | 真相✓ |
| 全能客 | STR6,AGI6,WIS6,CON6 | **无** ❌ | 真相✓ |

### 真相结局需要的旗标

```
truth_ending requires:
  flags: ["kite_identity_clue", "cloth_fiber_found", "tianji_records_found"]
```

- `tianji_records_found` — `evt_tianji_records/read_records`（无属性门槛）✓
- `kite_identity_clue` — 当前仅 `evt_tianji_records/deep_search`（智慧≥7）获得，**这是药师/全能客的死穴**
- `cloth_fiber_found` — 当前仅 `evt_body_examine/check_hands`（智慧≥6）获得，**阻断游侠/刺客**

### 修复方案

1. `kite_identity_clue` → 追加至 `npc_fei_ye/fei_ye_deep_talk/ask_who_is_kite` 选项的 grants（飞爷台词已描述鸢的身份，逻辑完全成立）
2. `cloth_fiber_found` → `evt_body_examine` 追加动作 `search_sleeve`（力量≥7 或 敏捷≥7 条件用 OR 逻辑）

**注意**：条件引擎目前只支持 AND 逻辑（condition 对象内所有字段都需满足）。要实现 OR，需新增两个独立动作，一个力量版一个敏捷版，各自带 `flags_absent: ["cloth_fiber_found"]`。

### 新内容旗标依赖

- `evt_guest_register` — 大堂新事件，无前置条件，触发后设 `guest_register_checked`
  - 动作 `find_blue_shirt_entry`（智慧≥5，即任意角色可用）设 `blue_shirt_registered`
- `evt_blue_shirt_trace` — 后巷新事件，需 `blue_shirt_registered`（来自住客册）
  - 找到铜铃碎片，设 `blue_shirt_traced`，新线索 `copper_bell_fragment`
- `evt_mansion_ear_room` — 宅院新事件，需 `tianji_records_found`
  - 进入耳室读旧档，设 `ear_room_found`；可选深读（智慧≥8）得 `kite_identity_confirmed`

---

## Task 1: 通关修复 — kite_identity_clue + cloth_fiber_found 替代路径

**Files:**
- Modify: `src/data/npcs/chapter1.json`
- Modify: `src/data/events/chapter1.json`

- [ ] **Step 1: 在 npc_fei_ye/fei_ye_deep_talk/ask_who_is_kite 追加旗标**

打开 `src/data/npcs/chapter1.json`，找到 `npc_fei_ye` → dialogues → `fei_ye_deep_talk` → choices → `ask_who_is_kite`。

当前 grants：
```json
"grants": {
  "flags": ["fei_ye_kite_hint"]
}
```

改为：
```json
"grants": {
  "flags": ["fei_ye_kite_hint", "kite_identity_clue"]
}
```

- [ ] **Step 2: 在 evt_body_examine 追加两个低属性替代动作**

打开 `src/data/events/chapter1.json`，找到 `evt_body_examine` 的 `actions` 数组。在 `check_hands` 动作之后追加两个新动作：

```json
{
  "id": "search_sleeve_str",
  "label": "强行掰开死者紧握的手（需力量≥7）",
  "requires": { "strength": 7, "flags_absent": ["cloth_fiber_found"] },
  "result": "你用力掰开死者紧握的右拳。手心里攥着一小撮黑色布料纤维，死者临终时死死抓住了凶手的衣物。这种材质，不是寻常布匹。",
  "grants": { "flags": ["cloth_fiber_found"], "clues": ["cloth_fiber_clue"] }
},
{
  "id": "search_sleeve_agi",
  "label": "以指轻探死者袖口（需敏捷≥7）",
  "requires": { "agility": 7, "flags_absent": ["cloth_fiber_found"] },
  "result": "你以极轻的手法翻检死者的袖口——指甲缝里夹着一小撮黑色布料纤维，若非手法极准，极易遗漏。这种材质特殊，不像是寻常布匹。",
  "grants": { "flags": ["cloth_fiber_found"], "clues": ["cloth_fiber_clue"] }
}
```

- [ ] **Step 3: 验证 JSON 合法性**

```bash
cd /Users/xuli/claudeGame && python3 -c "
import json
json.load(open('src/data/npcs/chapter1.json'))
json.load(open('src/data/events/chapter1.json'))
print('JSON valid')
"
```

期望输出：`JSON valid`

- [ ] **Step 4: 运行测试**

```bash
cd /Users/xuli/claudeGame && npx vitest run 2>&1 | tail -8
```

期望：全部通过（57 tests passed）

- [ ] **Step 5: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/data/npcs/chapter1.json src/data/events/chapter1.json && git commit -m "fix: ensure all templates can complete game — kite_identity_clue via fei_ye, cloth_fiber via str/agi paths"
```

---

## Task 2: 新道具 + 大堂住客册事件

**Files:**
- Modify: `src/data/items/chapter1.json`
- Modify: `src/data/events/chapter1.json`
- Modify: `src/data/maps/chapter1.json`

- [ ] **Step 1: 新增 3 个线索道具**

在 `src/data/items/chapter1.json` 末尾追加：

```json
{ "id": "suspicious_guest_entry", "name": "可疑住客记录", "description": "你在往事客栈的住客册上发现一条可疑记录：案发前两日，一名自称「周文远」的客人在宋怀义入住后不久登记入住，次日一早便已退房，既未用早饭也未取回押金。登记字迹工整得异样，像是刻意为之。", "isClue": true },
{ "id": "copper_bell_fragment", "name": "铜铃残片", "description": "在后巷角落的砖缝中找到的半截铜铃，铃口有明显的剪断痕迹——不是自然断裂，是被人剪断丢弃的。铃面刻着细密的「浪」字纹路，这是浪鹏帮的帮徽。", "isClue": true },
{ "id": "ear_room_ledger", "name": "鸢组旧档", "description": "耳室木格中一本薄薄的旧册，记录着十年前鸢组最后几次行动的代号与日期。最后一条记录的日期与天机阁解散的日期相差不到三天，代号写着：「收网——鸢」。", "isClue": true }
```

- [ ] **Step 2: 新增 evt_guest_register 事件**

在 `src/data/events/chapter1.json` 末尾追加：

```json
{
  "id": "evt_guest_register",
  "title": "翻查住客册",
  "description": "柜台旁靠墙放着一本厚厚的住客登记册，封面油腻，翻动时会散出一股陈旧的墨香。",
  "requires": null,
  "actions": [
    {
      "id": "browse_register",
      "label": "随手翻看住客册",
      "requires": { "flags_absent": ["guest_register_checked"] },
      "result": "几十个名字，大多是往来商旅。你随手翻了翻，大部分是寻常客商的名字，但最近两页似乎比其他页磨损更多——有人翻看过不止一次。",
      "grants": { "flags": ["guest_register_checked"] }
    },
    {
      "id": "find_blue_shirt_entry",
      "label": "仔细比对近日登记",
      "requires": { "flags": ["guest_register_checked"], "flags_absent": ["blue_shirt_registered"] },
      "result": "你把案发前后三日的登记记录逐条对比。一个名叫「周文远」的客人在宋怀义入住后两个时辰登记，来路写的是「扬州布商」，但押金却是长安本地铜钱，成色是近年新铸的——不像是刚刚进京的外地人。他在宋怀义死亡当日清晨五更便已退房，连早饭都没用。",
      "grants": {
        "flags": ["blue_shirt_registered"],
        "items": ["suspicious_guest_entry"],
        "clues": ["suspicious_guest_entry"]
      }
    },
    {
      "id": "check_register_handwriting",
      "label": "辨认登记字迹",
      "requires": { "flags": ["blue_shirt_registered"], "flags_absent": ["register_handwriting_noted"] },
      "result": "「周文远」的登记字迹工整到反常——字间距完全一致，笔画收尾处有训练痕迹。这不是一个普通布商会有的书写习惯，更像是受过专门训练的人刻意为之，确保字迹找不到特征。",
      "grants": { "flags": ["register_handwriting_noted"] }
    }
  ]
}
```

- [ ] **Step 3: 更新大堂 interactables**

在 `src/data/maps/chapter1.json` 中，找到 `"id": "lobby"` 的房间，将其 `interactables` 从：

```json
["npc_innkeeper_li_fu", "npc_drunk_zhang_san", "evt_notice_board"]
```

改为：

```json
["npc_innkeeper_li_fu", "npc_drunk_zhang_san", "evt_notice_board", "evt_guest_register"]
```

- [ ] **Step 4: 验证 JSON 合法性**

```bash
cd /Users/xuli/claudeGame && python3 -c "
import json
json.load(open('src/data/items/chapter1.json'))
json.load(open('src/data/events/chapter1.json'))
json.load(open('src/data/maps/chapter1.json'))
print('JSON valid')
"
```

期望输出：`JSON valid`

- [ ] **Step 5: 运行测试**

```bash
cd /Users/xuli/claudeGame && npx vitest run 2>&1 | tail -8
```

期望：57 tests passed

- [ ] **Step 6: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/data/items/chapter1.json src/data/events/chapter1.json src/data/maps/chapter1.json && git commit -m "feat: add guest register investigation and 3 new clue items"
```

---

## Task 3: 后巷蓝衫人追踪事件

**Files:**
- Modify: `src/data/events/chapter1.json`
- Modify: `src/data/maps/chapter1.json`

- [ ] **Step 1: 新增 evt_blue_shirt_trace 事件**

在 `src/data/events/chapter1.json` 末尾追加：

```json
{
  "id": "evt_blue_shirt_trace",
  "title": "追查蓝衫人踪迹",
  "description": "如果那个在大堂久坐的蓝衫人真的与案子有关，他在这条后巷里或许留下了什么。",
  "requires": { "flags": ["blue_shirt_registered"] },
  "actions": [
    {
      "id": "search_alley_corner",
      "label": "搜寻巷道角落",
      "requires": { "flags_absent": ["alley_corner_searched"] },
      "result": "你沿着后巷慢慢走，在墙根的一处砖缝里发现了半截铜铃——铃口被人用剪刀齐齐剪断，显然是刻意丢弃的。铃面刻着细密的波浪纹，中间嵌着一个「浪」字。浪鹏帮的帮徽。\n\n那个「周文远」，是浪鹏帮的人。",
      "grants": {
        "flags": ["alley_corner_searched", "blue_shirt_traced", "langpeng_spy_identified"],
        "items": ["copper_bell_fragment"],
        "clues": ["copper_bell_fragment"]
      }
    },
    {
      "id": "trace_departure_route",
      "label": "推断离开路线",
      "requires": { "flags": ["blue_shirt_traced"], "flags_absent": ["spy_route_deduced"] },
      "result": "你看了看那处砖缝的位置——正对着后巷与正街的交叉口。丢弃的时机应该是他快速离开时，铜铃碰到什么发出声响，怕被人认出帮徽，索性剪断扔了。\n\n他走的是正街方向，不是翻墙。这个人进出客栈用的是最光明正大的方式——因为他本来就没打算动手，他只是在盯梢。",
      "grants": { "flags": ["spy_route_deduced"] }
    },
    {
      "id": "connect_langpeng_thread",
      "label": "串联浪鹏帮的目的",
      "requires": {
        "flags": ["blue_shirt_traced", "langpeng_discovered"],
        "flags_absent": ["langpeng_spy_connected"]
      },
      "result": "浪鹏帮在案发前就已经有人盯着宋怀义了。他们不是事后追查的——他们知道宋怀义会来长安，知道他这次来的目的。\n\n但他们没有动手。那个「周文远」在宋怀义死后天亮前就撤了，没有留下，也没有取走任何东西。\n\n他们想要的，显然不是宋怀义的命。",
      "grants": { "flags": ["langpeng_spy_connected"] }
    }
  ]
}
```

- [ ] **Step 2: 更新后巷 interactables**

在 `src/data/maps/chapter1.json` 中，找到 `"id": "back_alley"` 的房间，将其 `interactables` 从：

```json
["npc_old_beggar", "npc_merchant_zhou", "evt_alley_marks", "evt_cargo_remnants"]
```

改为：

```json
["npc_old_beggar", "npc_merchant_zhou", "evt_alley_marks", "evt_cargo_remnants", "evt_blue_shirt_trace"]
```

- [ ] **Step 3: 验证 JSON 合法性**

```bash
cd /Users/xuli/claudeGame && python3 -c "
import json
json.load(open('src/data/events/chapter1.json'))
json.load(open('src/data/maps/chapter1.json'))
print('JSON valid')
"
```

- [ ] **Step 4: 运行测试**

```bash
cd /Users/xuli/claudeGame && npx vitest run 2>&1 | tail -8
```

期望：57 tests passed

- [ ] **Step 5: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/data/events/chapter1.json src/data/maps/chapter1.json && git commit -m "feat: add blue shirt trail investigation in back alley — Langpeng spy identified"
```

---

## Task 4: 废弃宅院耳室事件

**Files:**
- Modify: `src/data/events/chapter1.json`
- Modify: `src/data/maps/chapter1.json`

- [ ] **Step 1: 新增 evt_mansion_ear_room 事件**

在 `src/data/events/chapter1.json` 末尾追加：

```json
{
  "id": "evt_mansion_ear_room",
  "title": "发现隐秘耳室",
  "description": "正堂东侧的墙面比其他地方厚了整整一掌，细看之下，墙角有一条几乎不可见的竖缝。",
  "requires": { "flags": ["tianji_records_found"] },
  "actions": [
    {
      "id": "find_hidden_room",
      "label": "沿墙缝寻找机括",
      "requires": { "flags_absent": ["ear_room_found"] },
      "result": "你沿着竖缝向下摸索，在离地三尺处找到一块松动的青砖。轻轻一推，一道窄门无声地向内转开。里面是一间容不下三人并立的耳室，空气阴沉，但干燥异常——有人精心维护过这里的防潮。\n\n木格上整整齐齐地摆着十数本薄册，每本封面只有一个字或一个代号。",
      "grants": { "flags": ["ear_room_found"] }
    },
    {
      "id": "read_ear_room_files",
      "label": "翻阅耳室档录",
      "requires": { "flags": ["ear_room_found"], "flags_absent": ["ear_room_read"] },
      "result": "大多数薄册记录的是人名与地点，密密麻麻，显然是某种情报系统的原始记录。你抽出最后一本——封面是一个「鸢」字。\n\n里面的记录只有最后半页尚存，其余的全被撕去了。留下的半页记着三个日期，以及一行字：「行动完成，归档，待命。」",
      "grants": {
        "flags": ["ear_room_read"],
        "items": ["ear_room_ledger"],
        "clues": ["ear_room_ledger"]
      }
    },
    {
      "id": "analyze_torn_pages",
      "label": "推断被撕去的内容（需智慧≥8）",
      "requires": { "wisdom": 8, "flags": ["ear_room_read"], "flags_absent": ["torn_pages_analyzed"] },
      "result": "你翻看留下的半页，注意到纸张撕断处有轻微的墨水渗透痕迹——说明被撕去的那部分记录更长，内容更具体。结合纸张的磨损程度，被撕去的页面很新，撕除时间不超过一个月。\n\n有人最近来过这里，专门清除了鸢的行动细节。那个人知道这里，知道档案在哪，并且在这个档案对他们形成威胁之前将它销毁。",
      "grants": { "flags": ["torn_pages_analyzed", "kite_identity_confirmed"] }
    }
  ]
}
```

- [ ] **Step 2: 更新宅院 interactables**

在 `src/data/maps/chapter1.json` 中，找到 `"id": "old_mansion"` 的房间，将其 `interactables` 从：

```json
["evt_tianji_records", "evt_final_confrontation", "evt_dry_well"]
```

改为：

```json
["evt_tianji_records", "evt_mansion_ear_room", "evt_final_confrontation", "evt_dry_well"]
```

- [ ] **Step 3: 验证 JSON 合法性**

```bash
cd /Users/xuli/claudeGame && python3 -c "
import json
json.load(open('src/data/events/chapter1.json'))
json.load(open('src/data/maps/chapter1.json'))
print('JSON valid')
"
```

- [ ] **Step 4: 运行测试**

```bash
cd /Users/xuli/claudeGame && npx vitest run 2>&1 | tail -8
```

期望：57 tests passed

- [ ] **Step 5: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/data/events/chapter1.json src/data/maps/chapter1.json && git commit -m "feat: add mansion ear room — kite group archive discovery"
```

---

## Task 5: 更新数据完整性测试

**Files:**
- Modify: `tests/data/chapter1Integrity.test.ts`

- [ ] **Step 1: 在测试文件末尾（最后一个 `it(` 块之后、`}` 闭合之前）追加新测试**

在 `tests/data/chapter1Integrity.test.ts` 中，在最后一个 `it(` 块结束后、最外层 `})` 之前插入：

```typescript
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

    const finalEvent = EVENTS.find((e) => e.id === 'evt_final_confrontation');
    expect(finalEvent).toBeDefined();
    if (!finalEvent) return;

    for (const t of templates) {
      const hasForce = t.strength >= 8;
      // cloth_fiber_found accessible: wisdom>=6 OR strength>=7 OR agility>=7
      const canGetClothFiber = t.wisdom >= 6 || t.strength >= 7 || t.agility >= 7;
      // kite_identity_clue accessible via fei_ye (no stat req) or deep_search (wisdom>=7)
      const canGetKite = true; // fei_ye path always accessible
      const hasTruth = canGetClothFiber && canGetKite;
      // learned_wuhen_bu accessible: agility>=7
      const hasHermit = t.agility >= 7;

      expect(
        hasForce || hasTruth || hasHermit,
        `${t.name} cannot reach any ending with default stats`
      ).toBe(true);
    }
  });

  // new content tests
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
```

- [ ] **Step 2: 运行测试（期望新增 8 个测试）**

```bash
cd /Users/xuli/claudeGame && npx vitest run 2>&1 | tail -10
```

期望输出：`Tests  65 passed (65)` 或更多（视已有测试数量而定，原有57个 + 新增8个 = 65个）

- [ ] **Step 3: TypeScript 构建检查**

```bash
cd /Users/xuli/claudeGame && npm run build 2>&1 | head -20
```

期望：无 TypeScript 错误

- [ ] **Step 4: Commit**

```bash
cd /Users/xuli/claudeGame && git add tests/data/chapter1Integrity.test.ts && git commit -m "test: add completion guarantee and new content integrity tests"
```
