# 三职业天赋重设计实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将说书人、游方医、飞贼的天赋从「降低属性门槛+2」重设计为各具独特机制的专属能力（耳报神/望闻断骨/三教九流），并在三章的NPC对话和事件中补充对应的专属内容。

**Architecture:** 分六个独立任务：(1) 核心数据/引擎修改；(2-5) 各章节NPC对话与事件内容；(6) 提示引擎更新。每个任务可独立提交，任务间无代码依赖（只有数据内容依赖：新天赋ID必须先在Task1中写入talents.json）。

**Tech Stack:** TypeScript, Vitest, JSON数据文件（无新依赖）

---

## 文件清单

| 文件 | 操作 |
|------|------|
| `src/data/talents.json` | 替换3个天赋条目 |
| `src/data/templates.json` | 更新3个职业的talent字段 |
| `src/engine/conditionEvaluator.ts` | 删除3个属性加成逻辑 |
| `tests/engine/conditionEvaluator.test.ts` | 更新测试 |
| `src/data/npcs/chapter1.json` | 增加/修改5处专属对话 |
| `src/data/events/chapter1.json` | 增加医者检查行动、更新2处天赋引用 |
| `src/data/npcs/chapter2.json` | 增加3处专属对话 |
| `src/data/events/chapter2.json` | 增加黑市情报事件 |
| `src/data/maps/chapter2.json` | 更新pingkang_hideout的interactables |
| `src/data/npcs/chapter3.json` | 增加3处专属对话 |
| `src/engine/hintEngine.ts` | 替换7处天赋名称+更新对应提示文字 |

---

## Task 1: 核心数据与引擎修改

**Files:**
- Modify: `src/data/talents.json`
- Modify: `src/data/templates.json`
- Modify: `src/engine/conditionEvaluator.ts`
- Modify: `tests/engine/conditionEvaluator.test.ts`

### 背景知识

`talents.json` 的 `id` 字段即天赋的唯一标识符，在 `templates.json`、各章节JSON文件的 `condition.talent` 字段以及 `conditionEvaluator.ts`/`hintEngine.ts` 中被引用。

`conditionEvaluator.ts` 当前为三个旧天赋提供「stat门槛-2」的加成；新天赋无任何stat加成，效果完全通过 `condition.talent` 在JSON数据中实现。

- [ ] **Step 1: 写失败测试**

将 `tests/engine/conditionEvaluator.test.ts` 完整替换为：

```typescript
import { describe, it, expect } from 'vitest';
import { evaluate } from '../../src/engine/conditionEvaluator';
import type { EvalContext } from '../../src/engine/conditionEvaluator';

const baseCtx: EvalContext = {
  player: { name: '测试者', template: 'test', strength: 6, agility: 6, wisdom: 6, constitution: 6, talent: '' },
  inventory: [],
  flags: [],
};

describe('evaluate', () => {
  it('returns true for null condition', () => {
    expect(evaluate(null, baseCtx)).toBe(true);
  });

  it('returns true for undefined condition', () => {
    expect(evaluate(undefined, baseCtx)).toBe(true);
  });

  it('passes stat threshold when exactly met', () => {
    expect(evaluate({ wisdom: 6 }, baseCtx)).toBe(true);
  });

  it('fails stat threshold when not met', () => {
    expect(evaluate({ wisdom: 7 }, baseCtx)).toBe(false);
  });

  it('耳报神 does not reduce wisdom threshold', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '耳报神' } };
    expect(evaluate({ wisdom: 7 }, ctx)).toBe(false); // 6 < 7, no bonus
  });

  it('望闻断骨 does not reduce constitution threshold', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '望闻断骨' } };
    expect(evaluate({ constitution: 7 }, ctx)).toBe(false); // 6 < 7, no bonus
  });

  it('三教九流 does not reduce agility threshold', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '三教九流' } };
    expect(evaluate({ agility: 7 }, ctx)).toBe(false); // 6 < 7, no bonus
  });

  it('talent check passes when talent matches', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '望闻断骨' } };
    expect(evaluate({ talent: '望闻断骨' }, ctx)).toBe(true);
  });

  it('talent check fails when talent does not match', () => {
    expect(evaluate({ talent: '望闻断骨' }, baseCtx)).toBe(false);
  });

  it('passes item check when item in inventory', () => {
    const ctx = { ...baseCtx, inventory: ['broken_copper_badge'] };
    expect(evaluate({ has: ['broken_copper_badge'] }, ctx)).toBe(true);
  });

  it('fails item check when item missing', () => {
    expect(evaluate({ has: ['broken_copper_badge'] }, baseCtx)).toBe(false);
  });

  it('passes flags check when all flags present', () => {
    const ctx = { ...baseCtx, flags: ['innkeeper_met', 'body_examined'] };
    expect(evaluate({ flags: ['innkeeper_met'] }, ctx)).toBe(true);
  });

  it('fails flags check when flag missing', () => {
    expect(evaluate({ flags: ['innkeeper_met'] }, baseCtx)).toBe(false);
  });

  it('passes flags_absent when flag is not set', () => {
    expect(evaluate({ flags_absent: ['already_done'] }, baseCtx)).toBe(true);
  });

  it('fails flags_absent when flag is set', () => {
    const ctx = { ...baseCtx, flags: ['already_done'] };
    expect(evaluate({ flags_absent: ['already_done'] }, ctx)).toBe(false);
  });

  it('evaluates combined conditions — all must pass', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, wisdom: 8 }, flags: ['innkeeper_met'] };
    expect(evaluate({ wisdom: 8, flags: ['innkeeper_met'] }, ctx)).toBe(true);
    expect(evaluate({ wisdom: 8, flags: ['innkeeper_trusted'] }, ctx)).toBe(false);
  });

  it('constitution check: no talent gives bonus', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, constitution: 7, talent: '官威' } };
    expect(evaluate({ constitution: 8 }, ctx)).toBe(false);
  });

  it('望闻断骨 talent gating works via condition.talent', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, constitution: 8, talent: '望闻断骨' } };
    expect(evaluate({ constitution: 8, talent: '望闻断骨' }, ctx)).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test -- tests/engine/conditionEvaluator.test.ts
```

期望：前三个新测试 FAIL（旧代码仍有talent加成），后续测试也可能失败

- [ ] **Step 3: 替换 `src/data/talents.json`**

```json
[
  {
    "id": "官威",
    "name": "官威",
    "description": "持有官牒，名正言顺，可强令盘问任何人。",
    "effect": "可对NPC发动「审讯」专属选项；可开启官方档案及官员通道"
  },
  {
    "id": "望气观相",
    "name": "望气观相",
    "description": "以道法观天地气数，见微知著，洞悉人心。",
    "effect": "进入场景自动触发隐藏环境线索；与NPC交谈时显示对方情绪提示"
  },
  {
    "id": "耳报神",
    "name": "耳报神",
    "description": "走南闯北，消息比人快半步，各地都有说过书的老相识。",
    "effect": "进入有人场所自动获得一条「流言」；特定NPC见到说书人会主动开口透露信息"
  },
  {
    "id": "望闻断骨",
    "name": "望闻断骨",
    "description": "行医多年，以医者之眼察伤观死——见血知死时，闻气识毒性。",
    "effect": "检查尸体/伤者自动解锁医学专属行动；可为受伤NPC施救换取信任对话"
  },
  {
    "id": "三教九流",
    "name": "三教九流",
    "description": "混迹于江湖底层多年，乞丐认得、帮派摸得、黑市进得——认识所有不该认识的人。",
    "effect": "底层NPC（乞丐、帮派外围、黑市商人）主动提供内幕；可从黑市渠道获取情报物品"
  }
]
```

- [ ] **Step 4: 更新 `src/data/templates.json` 三处 talent 字段**

将 `shuoshuren` 的 `"talent": "三寸不烂之舌"` 改为 `"talent": "耳报神"`

将 `youfangyi` 的 `"talent": "毒经百草"` 改为 `"talent": "望闻断骨"`

将 `feizei` 的 `"talent": "夜行百盗"` 改为 `"talent": "三教九流"`

- [ ] **Step 5: 替换 `src/engine/conditionEvaluator.ts`**

```typescript
import type { Condition, PlayerStats } from '../types/game';

export interface EvalContext {
  player: PlayerStats;
  inventory: string[];
  flags: string[];
}

export function evaluate(condition: Condition | null | undefined, ctx: EvalContext): boolean {
  if (!condition) return true;
  const { player, inventory, flags } = ctx;

  if (condition.wisdom !== undefined) {
    if (player.wisdom < condition.wisdom) return false;
  }
  if (condition.strength !== undefined) {
    if (player.strength < condition.strength) return false;
  }
  if (condition.agility !== undefined) {
    if (player.agility < condition.agility) return false;
  }
  if (condition.constitution !== undefined) {
    if (player.constitution < condition.constitution) return false;
  }
  if (condition.talent !== undefined) {
    if (player.talent !== condition.talent) return false;
  }
  if (condition.has) {
    for (const itemId of condition.has) {
      if (!inventory.includes(itemId)) return false;
    }
  }
  if (condition.flags) {
    for (const flag of condition.flags) {
      if (!flags.includes(flag)) return false;
    }
  }
  if (condition.flags_absent) {
    for (const flag of condition.flags_absent) {
      if (flags.includes(flag)) return false;
    }
  }
  return true;
}
```

- [ ] **Step 6: 运行测试确认通过**

```bash
npm test -- tests/engine/conditionEvaluator.test.ts
```

期望：19 tests PASS

- [ ] **Step 7: 提交**

```bash
git add src/data/talents.json src/data/templates.json src/engine/conditionEvaluator.ts tests/engine/conditionEvaluator.test.ts
git commit -m "feat: 重设计三职业天赋（耳报神/望闻断骨/三教九流），删除stat加成"
```

---

## Task 2: 第一章 NPC 专属对话

**Files:**
- Modify: `src/data/npcs/chapter1.json`

### 需要做的改动

**npc_innkeeper_li_fu**：
- 将 `hidden_tianji` 对话的 `condition.talent` 从 `"三寸不烂之舌"` 改为 `"耳报神"`，更新文本为契合「流言先知」风格

**npc_drunk_zhang_san**：
- 在 `dialogues` 数组末尾追加两条新对话：`storyteller_rumor`（耳报神）和 `thief_recognition`（三教九流）

**npc_cook_wang**：
- 在 `dialogues` 数组末尾追加一条新对话：`medical_treatment`（望闻断骨）

**npc_old_beggar**：
- 在 `dialogues` 数组末尾追加一条新对话：`thief_underworld_intel`（三教九流）

- [ ] **Step 1: 修改 npc_innkeeper_li_fu 的 hidden_tianji 对话**

找到 `hidden_tianji` 对话（当前 condition 为 `"talent": "三寸不烂之舌"`），替换为：

```json
{
  "id": "hidden_tianji",
  "condition": { "talent": "耳报神", "flags": ["innkeeper_met"] },
  "text": "……您是说书的？走南闯北见多识广。」他左右看了看，压低声音，「其实，宋怀义来之前三日，就有人专门到店里打听他——问他住哪间房、几时到。我当时没在意，现在想来……那人问完就走了，连茶钱都没付。",
  "hidden": true,
  "grants": { "flags": ["innkeeper_tianji_secret"] }
}
```

- [ ] **Step 2: 在 npc_drunk_zhang_san 的 dialogues 末尾追加耳报神专属对话**

```json
{
  "id": "storyteller_rumor",
  "condition": { "talent": "耳报神", "flags_absent": ["drunk_storyteller_talked"] },
  "text": "嗳——你是说书的？我在扬州听过你讲！」张三猛地抬起头，酒意散了一半，「昨夜的事，我早想找人说！那蓝衫汉子，腰里挂着铜铃，子时三刻从二楼急急下来——往城东树林跑了！脚步虚浮，像是出了什么岔子。你这说书人，不用酒我也愿意告诉你！",
  "grants": { "flags": ["drunk_storyteller_talked", "drunk_talked", "found_escape_clue", "blue_shirt_seen_by_innkeeper"] }
}
```

- [ ] **Step 3: 在 npc_drunk_zhang_san 的 dialogues 末尾追加三教九流专属对话**

```json
{
  "id": "thief_recognition",
  "condition": { "talent": "三教九流", "flags_absent": ["drunk_thief_talked"] },
  "text": "张三猛地直起腰，酒意散了一半，压低声音：「你……是行里人？」他扫了眼四周，凑近，「我认出你了。昨夜那个蓝衫的，腰间铜铃是浪鹏帮外围的记号。他们在盯这客栈不是一天了。你要查？去后巷问老乞丐，他以前给浪鹏帮跑过腿。」",
  "grants": { "flags": ["drunk_thief_talked", "drunk_talked", "found_escape_clue", "langpeng_discovered"] }
}
```

- [ ] **Step 4: 在 npc_cook_wang 的 dialogues 末尾追加望闻断骨专属对话**

```json
{
  "id": "medical_treatment",
  "condition": { "talent": "望闻断骨", "flags": ["cook_talked"], "flags_absent": ["cook_treated"] },
  "text": "你注意到王氏右手微颤、嘴唇发白——轻度吸入了药粉。你为她把了脉，从药囊取出安神散递过去：「服下，一柱香内缓解。」\n\n王氏接过，眼眶红了：「谢谢您，您是第一个问我怎么了的人。」她小声说，「那人昨夜在灶台里放了什么……我瞧见了——她把砒霜溶进温酒里，搅匀了，拿出去了。是用来毒人的，不是用来撒的。」",
  "grants": { "flags": ["cook_treated", "cook_poison_wine_revealed"], "clues": ["poison_wine_method"] }
}
```

- [ ] **Step 5: 在 npc_old_beggar 的 dialogues 末尾追加三教九流专属对话**

```json
{
  "id": "thief_underworld_intel",
  "condition": { "talent": "三教九流", "flags_absent": ["beggar_thief_talked"] },
  "text": "老人抬眼，目光在你身上某处停了一下，嘴角动了动。\n\n「行里人啊。」他没有废话，「昨夜二更，浪鹏帮的眼线在这条巷里守了整夜。蓝衫、铜铃，是他们外围的记号。雇主是个白衣文人，昨天下午在客栈里喝过茶——气质不像江湖人，倒像是官场上的。」\n\n他闭上眼，「说完了，你自己掂量。」",
  "grants": { "flags": ["beggar_thief_talked", "beggar_first_talked", "beggar_told_langpeng", "langpeng_discovered"] }
}
```

- [ ] **Step 6: 运行数据完整性测试**

```bash
npm test -- tests/data/chapter1Integrity.test.ts
```

期望：PASS

- [ ] **Step 7: 提交**

```bash
git add src/data/npcs/chapter1.json
git commit -m "feat: 第一章NPC增加耳报神/望闻断骨/三教九流专属对话"
```

---

## Task 3: 第一章事件修改

**Files:**
- Modify: `src/data/events/chapter1.json`

### 需要做的三处修改

1. `evt_body_examine`：在 `actions` 数组末尾追加医者专属行动（望闻断骨）
2. `evt_notice_board` → action `recognize_gang_code`：`talent` 从 `三寸不烂之舌` 改为 `耳报神`
3. `evt_arsenic_trace`（毒烟穿行 action `through_poison`）：移除 `talent` 条件，仅保留 `constitution` 门槛

- [ ] **Step 1: 在 evt_body_examine 的 actions 末尾追加医者行动**

找到 `"id": "evt_body_examine"` 事件的 `actions` 数组，在最后一个 action 对象之后追加：

```json
{
  "id": "medical_examination",
  "label": "以医者之眼检查（望闻断骨）",
  "requires": { "talent": "望闻断骨", "flags_absent": ["medical_exam_done"] },
  "result": "你系统检查尸体：颈部勒痕深三分，力道均匀，是惯用绳索的人；左腕内关穴针孔，入针精准，非江湖莽夫所为；面色青紫夹淡黄，是砒霜毒发的典型色相。结论清晰：亥时前后毒茶致昏，再以绳勒毙，行凶者熟悉穴位，手法干净利落。",
  "grants": {
    "flags": ["medical_exam_done", "body_examined", "wound_examined", "cloth_fiber_found", "poison_tea_confirmed", "murder_sequence_deduced"],
    "clues": ["medical_report"]
  }
}
```

- [ ] **Step 2: 更新 evt_notice_board 中 recognize_gang_code 的天赋条件**

找到 action `"id": "recognize_gang_code"`，将其 `requires` 中的 `"talent": "三寸不烂之舌"` 改为 `"talent": "耳报神"`：

```json
"requires": {
  "talent": "耳报神",
  "flags": ["notice_read"],
  "flags_absent": ["dafei_notice_found"]
}
```

- [ ] **Step 3: 更新 through_poison 行动，移除天赋条件**

找到 action `"id": "through_poison"`，将其 `requires` 从：

```json
"requires": { "constitution": 8, "talent": "毒经百草", "flags_absent": ["secret_room_opened"] }
```

改为：

```json
"requires": { "constitution": 8, "flags_absent": ["secret_room_opened"] }
```

同时将该 action 的 `label` 从 `"屏息疾穿毒烟（需毒体）"` 改为 `"屏息疾穿毒烟（需根骨≥8）"`

- [ ] **Step 4: 运行数据完整性测试**

```bash
npm test -- tests/data/chapter1Integrity.test.ts
```

期望：PASS

- [ ] **Step 5: 提交**

```bash
git add src/data/events/chapter1.json
git commit -m "feat: 第一章事件增加医者专属行动，更新天赋引用"
```

---

## Task 4: 第二章 NPC 对话 + 黑市事件

**Files:**
- Modify: `src/data/npcs/chapter2.json`
- Modify: `src/data/events/chapter2.json`
- Modify: `src/data/maps/chapter2.json`

### 修改说明

**npc_wujue**（chapter2）：追加耳报神专属对话 + 望闻断骨专属对话

**npc_langpeng_scout**：追加三教九流专属对话

**events/chapter2.json**：末尾追加 `evt_ch2_blackmarket_intel` 事件

**maps/chapter2.json**：在 `pingkang_hideout` 的 `interactables` 数组中追加 `"evt_ch2_blackmarket_intel"`

- [ ] **Step 1: 在 npc_wujue(chapter2) 的 dialogues 末尾追加耳报神专属对话**

```json
{
  "id": "storyteller_rumor",
  "condition": { "talent": "耳报神", "flags": ["wujue_met"], "flags_absent": ["wujue_storyteller_told"] },
  "text": "说书人……贫僧在扬州渡口听人讲过《天机残卷》，那故事编得真真假假，只有内里的人才知道哪些是真的。」他合掌，「施主既然走南闯北，该知道坊间对「鸢」的传说——一只不会落地的鸢。那不是民间故事，是天机阁里真实存在的代号。动用那个代号的人，如今就在长安城里。",
  "grants": { "flags": ["wujue_storyteller_told", "kite_identity_clue"] }
}
```

- [ ] **Step 2: 在 npc_wujue(chapter2) 的 dialogues 末尾追加望闻断骨专属对话**

```json
{
  "id": "medical_healing",
  "condition": { "talent": "望闻断骨", "flags": ["wujue_met"], "flags_absent": ["wujue_treated"] },
  "text": "你注意到和尚持珠时右手有轻微不自然——旧伤未愈，腕骨处有陈年损伤。你开口：「右手的伤，是当年的？」\n\n无迹和尚停住了，沉默片刻，缓缓伸出右手。\n\n你为他诊治时，他低声说：「天机阁风字组，二十年前押运一批货，出了事故，伤了骨头。那批货是砒霜，配着曼陀罗的那种——是有人专门调制的毒，不是寻常药材。」",
  "grants": { "flags": ["wujue_treated", "poison_source_known"], "clues": ["wujue_testimony"] }
}
```

- [ ] **Step 3: 在 npc_langpeng_scout 的 dialogues 末尾追加三教九流专属对话**

```json
{
  "id": "thief_exchange",
  "condition": { "talent": "三教九流", "flags_absent": ["langpeng_thief_exchange"] },
  "text": "探子打量了你一眼，眼神里出现了不同的东西。「你……是行里人？」他放低了声音，「行，那就说明白话。我们接的活儿是李爷的，监视宋怀义，截他带的东西。」他顿了顿，「你若有消息跟我换，我告诉你李爷在哪落脚。」",
  "grants": { "flags": ["langpeng_thief_exchange", "langpeng_trail"] }
}
```

- [ ] **Step 4: 在 events/chapter2.json 末尾追加黑市情报事件**

在最后一个事件对象的 `}` 后，`]` 之前，追加：

```json
,
{
  "id": "evt_ch2_blackmarket_intel",
  "title": "黑市情报",
  "description": "平康坊据点深处有一处专门流通非正规情报的渠道，认识路子的人才进得去。",
  "requires": { "talent": "三教九流", "flags": ["langpeng_discovered"] },
  "actions": [
    {
      "id": "buy_langpeng_intel",
      "label": "向黑市线人换取李邈情报（三教九流）",
      "requires": { "flags_absent": ["blackmarket_intel_bought"] },
      "result": "线人摆出一沓字条：宋怀义死后第三日，李邈在皇城茶馆订了一间雅座，预付三日茶资——他在等人。线人又压低声音：「他带着一份调令，盖的是浪鹏帮的私印，不是官府的——这是雇佣关系，不是奉命。」你拿走了那份调令的抄件。",
      "grants": { "flags": ["blackmarket_intel_bought", "langpeng_trail"], "items": ["langpeng_dispatch_order"] }
    }
  ]
}
```

- [ ] **Step 5: 在 maps/chapter2.json 的 pingkang_hideout 中追加新事件ID**

找到 `"id": "pingkang_hideout"` 的 `interactables` 数组，将：

```json
"interactables": ["evt_hideout_search", "evt_captive_note", "npc_langpeng_scout", "evt_ch2_agility_growth"]
```

改为：

```json
"interactables": ["evt_hideout_search", "evt_captive_note", "npc_langpeng_scout", "evt_ch2_agility_growth", "evt_ch2_blackmarket_intel"]
```

- [ ] **Step 6: 运行数据完整性测试**

```bash
npm test -- tests/data/chapter2Integrity.test.ts
```

期望：PASS

- [ ] **Step 7: 提交**

```bash
git add src/data/npcs/chapter2.json src/data/events/chapter2.json src/data/maps/chapter2.json
git commit -m "feat: 第二章增加耳报神/望闻断骨/三教九流专属内容及黑市事件"
```

---

## Task 5: 第三章 NPC 专属对话

**Files:**
- Modify: `src/data/npcs/chapter3.json`

### 修改说明

**npc_wujue**（chapter3）：追加望闻断骨专属对话（施救换取终局证词）

**npc_tianji_contact**：追加耳报神专属对话 + 三教九流专属对话（两条对话都能解锁 `tianji_trust_gained`）

- [ ] **Step 1: 在 chapter3 的 npc_wujue dialogues 末尾追加望闻断骨专属对话**

```json
{
  "id": "healing_final_testimony",
  "condition": {
    "talent": "望闻断骨",
    "flags": ["chapter3_started", "feiyes_manor_searched"],
    "flags_absent": ["wujue_healed_ch3"]
  },
  "text": "你见到和尚时，他面色灰白，呼吸急促——旧伤恶化，肺里有积液的迹象。你为他诊了脉，从药囊取出几味药。\n\n「施主……」和尚握住你的手腕，「贫僧已经不多时了，有一句话要说。」他断断续续，「飞爷当年建天机阁，是为了保护一群人——名单上的人，每一个他都亲口答应过。他没有背叛他们，是宋怀义没等到约定的时间就跑了——」\n\n他闭上眼，「现在你知道了。去找他，让他亲口说完剩下的。」",
  "grants": { "flags": ["wujue_healed_ch3", "fei_ye_identity_confirmed"] }
}
```

- [ ] **Step 2: 在 npc_tianji_contact 的 dialogues 末尾追加耳报神专属对话**

```json
{
  "id": "storyteller_trusted",
  "condition": { "talent": "耳报神", "flags_absent": ["tianji_trust_gained"] },
  "text": "……说书人？」他的警惕松弛了一瞬，「天机阁有个旧规矩：说书人进门，比别人多三成信任——因为说书人本来就在讲故事，不需要另外撒谎。」\n\n他将茶盏推过来：「坐。你想知道这里的人在等什么，我告诉你。」",
  "grants": { "flags": ["tianji_trust_gained"] }
}
```

- [ ] **Step 3: 在 npc_tianji_contact 的 dialogues 末尾追加三教九流专属对话**

```json
{
  "id": "thief_old_acquaintance",
  "condition": { "talent": "三教九流", "flags_absent": ["tianji_trust_gained"] },
  "text": "联络人端详你片刻，眼神里出现了认出的神色。「十一年前，天机阁曾雇一个飞贼传递过一件物件——扬州到长安，七天，完璧。」他停顿，「你就是那个人？还是……你认识那个人？」\n\n不管你如何回答，他都点了点头：「进来吧，知道这件事的人，不会是敌人。」",
  "grants": { "flags": ["tianji_trust_gained"] }
}
```

- [ ] **Step 4: 运行数据完整性测试**

```bash
npm test -- tests/data/chapter3Integrity.test.ts
```

期望：PASS

- [ ] **Step 5: 提交**

```bash
git add src/data/npcs/chapter3.json
git commit -m "feat: 第三章增加望闻断骨/耳报神/三教九流专属NPC对话"
```

---

## Task 6: 更新 hintEngine.ts

**Files:**
- Modify: `src/engine/hintEngine.ts`

### 修改说明

将所有旧天赋名称替换为新名称，并更新对应提示文字以匹配新机制。共7处修改：

**Chapter1规则（2处）：**
- `毒经百草` → `望闻断骨`，提示改为医者检查视角
- `夜行百盗` → `三教九流`，提示改为黑道人脉视角

**Chapter2规则（3处）：**
- `三寸不烂之舌` → `耳报神`，提示改为坊间流言视角
- `毒经百草` → `望闻断骨`，提示改为为和尚施救
- `夜行百盗` → `三教九流`，提示改为黑市渠道

**Chapter3规则（2处）：**
- `三寸不烂之舌` → `耳报神`，提示改为说书人身份
- `夜行百盗` → `三教九流`，提示改为底层人脉

- [ ] **Step 1: 替换 Chapter1 中的 `毒经百草` 规则（约第64行）**

将：
```typescript
{
  when: (ctx) =>
    ctx.talent === '毒经百草' &&
    has(ctx, 'body_examined'),
  hint: '你的医术告诉你，死者身上的症状不像外伤所致。寻找毒物相关线索，从案发房间的角落入手。',
},
```

改为：
```typescript
{
  when: (ctx) =>
    ctx.talent === '望闻断骨' &&
    has(ctx, 'innkeeper_met') &&
    !has(ctx, 'medical_exam_done'),
  hint: '你是医者。前往命案房间，使用「以医者之眼检查」一次性得出死因、毒物和时间——比其他人快得多。',
},
```

- [ ] **Step 2: 替换 Chapter1 中的 `夜行百盗` 规则（约第70行）**

将：
```typescript
{
  when: (ctx) =>
    ctx.talent === '夜行百盗' &&
    !has(ctx, 'secret_room_opened'),
  hint: '你注意到客栈有些门上了锁，但锁对你来说不过是摆设。夜间行事，客栈二楼有可疑之处。',
},
```

改为：
```typescript
{
  when: (ctx) =>
    ctx.talent === '三教九流' &&
    !has(ctx, 'langpeng_discovered'),
  hint: '大堂的醉汉和后巷老乞丐认识你这种人——他们会主动告诉你昨夜发生了什么，不需要你追问。',
},
```

- [ ] **Step 3: 替换 Chapter2 中的 `三寸不烂之舌` 规则（约第131行）**

将：
```typescript
{
  when: (ctx) =>
    ctx.talent === '三寸不烂之舌' &&
    !has(ctx, 'langpeng_discovered'),
  hint: '你在茶馆与说书摊混迹多年，消息灵通。找几个东市的老摊贩闲聊，浪鹏帮的风声自然会来。',
},
```

改为：
```typescript
{
  when: (ctx) =>
    ctx.talent === '耳报神' &&
    !has(ctx, 'langpeng_discovered'),
  hint: '你走南闯北，消息比别人快。东市的摊贩和回春堂的和尚都听说过你，去找他们——不用套话，他们会主动说。',
},
```

- [ ] **Step 4: 替换 Chapter2 中的 `毒经百草` 规则（约第137行）**

将：
```typescript
{
  when: (ctx) =>
    ctx.talent === '毒经百草' &&
    !hasItem(ctx, 'poison_residue_sample'),
  hint: '你闻到了空气中若有若无的气味——那是某种特殊植物提炼的毒素。追着这气味走，能找到毒物来源。',
},
```

改为：
```typescript
{
  when: (ctx) =>
    ctx.talent === '望闻断骨' &&
    !has(ctx, 'wujue_treated'),
  hint: '回春堂的无迹和尚右手有旧伤。你可以为他施治——医者仁心换来的，往往是最诚实的话。',
},
```

- [ ] **Step 5: 替换 Chapter2 中的 `夜行百盗` 规则（约第143行）**

将：
```typescript
{
  when: (ctx) =>
    ctx.talent === '夜行百盗' &&
    has(ctx, 'langpeng_discovered') &&
    !hasItem(ctx, 'langpeng_dispatch_order'),
  hint: '浪鹏帮的据点你已摸清。夜间潜入，文书就在帮主的内室，锁对你而言不是问题。',
},
```

改为：
```typescript
{
  when: (ctx) =>
    ctx.talent === '三教九流' &&
    has(ctx, 'langpeng_discovered') &&
    !hasItem(ctx, 'langpeng_dispatch_order'),
  hint: '浪鹏帮据点里的探子认出你了。你也可以走黑市渠道——平康坊深处，有人专门倒卖这种情报。',
},
```

- [ ] **Step 6: 替换 Chapter3 中的 `三寸不烂之舌` 规则（约第189行）**

将：
```typescript
{
  when: (ctx) =>
    ctx.talent === '三寸不烂之舌' &&
    !has(ctx, 'tianji_trust_gained'),
  hint: '天机安宅的联络人是个谨慎的人。讲一个关于「鸢」的故事给他听——人都爱听故事。',
},
```

改为：
```typescript
{
  when: (ctx) =>
    ctx.talent === '耳报神' &&
    !has(ctx, 'tianji_trust_gained'),
  hint: '天机阁有个旧规矩：说书人进门多三成信任。直接报你的身份——联络人会让你进去的。',
},
```

- [ ] **Step 7: 替换 Chapter3 中的 `夜行百盗` 规则（约第195行）**

将：
```typescript
{
  when: (ctx) =>
    ctx.talent === '夜行百盗' &&
    !has(ctx, 'feiyes_manor_searched'),
  hint: '飞爷故居戒备森严，但屋顶对你来说就是平地。夜里翻进去，画像壁就在正厅。',
},
```

改为：
```typescript
{
  when: (ctx) =>
    ctx.talent === '三教九流' &&
    !has(ctx, 'tianji_trust_gained'),
  hint: '天机安宅的联络人听说过你传递那件物件的旧事。直接说你认识那个飞贼——他会明白的。',
},
```

- [ ] **Step 8: 运行 hintEngine 测试**

```bash
npm test -- tests/engine/hintEngine.test.ts
```

期望：6 tests PASS（测试不直接检查旧天赋名，应全部通过）

- [ ] **Step 9: 运行全量测试**

```bash
npm test
```

期望：全部通过，无回归

- [ ] **Step 10: 类型检查**

```bash
npx tsc --noEmit
```

期望：零错误

- [ ] **Step 11: 提交**

```bash
git add src/engine/hintEngine.ts
git commit -m "feat: 更新提示引擎，适配三个新天赋的专属指引"
```

---

## 快速参考：天赋ID映射表

| 旧ID | 新ID | 职业 |
|------|------|------|
| 三寸不烂之舌 | 耳报神 | 说书人 |
| 毒经百草 | 望闻断骨 | 游方医 |
| 夜行百盗 | 三教九流 | 飞贼 |
