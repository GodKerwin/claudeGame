# 三章内容扩容实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为全三章新增 6 个地点、完整属性成长系统、清理第一章孤儿道具，并确保所有结局路径可达。

**Architecture:** 纯数据层扩容为主（JSON 文件），引擎仅需两处最小改动：ActionGrant 新增 storyText 字段、CenterPanel 新增成长文字渲染样式。revisitEvents grants 处理升级为全量 applyGrants。

**Tech Stack:** React 18 + TypeScript + Zustand + Vitest，数据层 JSON，`src/types/game.ts` 类型，`src/pages/Game/Game.tsx` 引擎，`src/components/layout/CenterPanel.tsx` 渲染

---

## 文件结构

**修改：**
- `src/types/game.ts` — ActionGrant 新增 `storyText?: string`
- `src/pages/Game/Game.tsx` — applyGrants 处理 storyText；revisitEvents handler 改用 applyGrants
- `src/components/layout/CenterPanel.tsx` — 新增 `isGrowthText` 渲染分支（`〖…〗` 格式）
- `src/data/items/chapter1.json` — 删除 3 个孤儿道具
- `src/data/syntheses/chapter1.json` — 新增 3 个合成
- `src/data/events/chapter1.json` — 新增武学秘籍阅读事件；新增成长 revisitEvent 触发事件
- `src/data/maps/chapter1.json` — 大堂和废弃宅院新增成长 revisitEvents；新增武学书籍 interactables
- `src/data/maps/chapter2.json` — 新增 3 个房间；更新现有房间出口
- `src/data/items/chapter2.json` — 新增 9 个道具
- `src/data/npcs/chapter2.json` — 新增 3 个 NPC
- `src/data/events/chapter2.json` — 新增 7 个 event
- `src/data/maps/chapter3.json` — 新增 3 个房间；更新现有房间出口；更新现有 NPC 对话
- `src/data/items/chapter3.json` — 新增 8 个道具
- `src/data/npcs/chapter3.json` — 现有 npc_wujue / npc_fei_ye 新增对话；新增 2 个 NPC
- `src/data/events/chapter3.json` — 新增 6 个 event
- `tests/data/chapter1Integrity.test.ts` — 扩展测试
- `tests/data/chapter2Integrity.test.ts` — 扩展测试
- `tests/data/chapter3Integrity.test.ts` — 扩展测试

**新建：**
- `tests/data/endingReachability.test.ts`
- `tests/engine/statGrowth.test.ts`

---

## Task 1：引擎扩展 — storyText grant + 属性成长渲染

**Files:**
- Modify: `src/types/game.ts`
- Modify: `src/pages/Game/Game.tsx`
- Modify: `src/components/layout/CenterPanel.tsx`
- Create: `tests/engine/statGrowth.test.ts`

- [ ] **Step 1: 写失败测试**

新建 `tests/engine/statGrowth.test.ts`：

```typescript
import { describe, it, expect, vi } from 'vitest';
import { evaluate } from '../../src/engine/conditionEvaluator';
import type { EvalContext } from '../../src/engine/conditionEvaluator';

describe('stat growth gates', () => {
  const baseCtx = (wisdom: number): EvalContext => ({
    player: { name: '', template: '', strength: 6, agility: 6, wisdom, constitution: 6, talent: '' },
    inventory: [],
    flags: [],
  });

  it('wisdom >= 7 gate passes when wisdom is 7', () => {
    expect(evaluate({ wisdom: 7 }, baseCtx(7))).toBe(true);
  });

  it('wisdom >= 7 gate fails when wisdom is 6', () => {
    expect(evaluate({ wisdom: 7 }, baseCtx(6))).toBe(false);
  });

  it('wisdom >= 8 gate passes when wisdom is 8', () => {
    expect(evaluate({ wisdom: 8 }, baseCtx(8))).toBe(true);
  });

  it('wisdom >= 8 gate fails when wisdom is 7', () => {
    expect(evaluate({ wisdom: 8 }, baseCtx(7))).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试确认通过**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/engine/statGrowth.test.ts
```

期望：全部 PASS（conditionEvaluator 已支持，测试即通过）

- [ ] **Step 3: 更新 ActionGrant 类型**

**同时注意：** 现有 `src/data/events/chapter3.json` 中的 `evt_ch3_wisdom_growth` 使用旧格式 `"【智慧 +1】"` 在 result 文字里标注成长。完成 Task 1 引擎更新后，在 Task 6 中需同步更新此 event：将 result 中的 `【智慧 +1】` 字样删除，并在 grants 中添加 `"storyText": "〖推理之道，如同武功，愈练愈精。你感到思路又清晰了一分。〗"`。

编辑 `src/types/game.ts`，在 `ActionGrant` 接口末尾新增 `storyText` 字段：

```typescript
export interface ActionGrant {
  flags?: string[];
  clues?: string[];
  items?: string[];
  remove_items?: string[];
  quests?: string[];
  strength?: number;
  agility?: number;
  wisdom?: number;
  constitution?: number;
  storyText?: string;
}
```

- [ ] **Step 4: 更新 applyGrants 处理 storyText**

编辑 `src/pages/Game/Game.tsx`，在 `applyGrants` 函数末尾（constitution 处理之后）新增：

```typescript
  if (grants.storyText) scene.addStoryText(grants.storyText);
```

完整函数变为：

```typescript
function applyGrants(
  grants: Grants | undefined,
  scene: SceneOps,
  addItem: (id: string) => void,
  removeItem: (id: string) => void,
  player: PlayerOps,
) {
  if (!grants) return;
  grants.flags?.forEach((f) => scene.addFlag(f));
  grants.clues?.forEach((c) => scene.addClue(c));
  grants.items?.forEach((i) => addItem(i));
  grants.remove_items?.forEach((i) => removeItem(i));
  grants.quests?.forEach((q) => {
    if (!scene.questLog.includes(q)) {
      const name = QUEST_NOTIFICATION[q] ?? q;
      scene.addStoryText(`（新任务已开启：【${name}】）`);
      audioEngine.playSFX('discover');
    }
    scene.addQuest(q);
  });
  if (grants.strength != null) player.incrementStat('strength', grants.strength);
  if (grants.agility != null) player.incrementStat('agility', grants.agility);
  if (grants.wisdom != null) player.incrementStat('wisdom', grants.wisdom);
  if (grants.constitution != null) player.incrementStat('constitution', grants.constitution);
  if (grants.storyText) scene.addStoryText(grants.storyText);
}
```

- [ ] **Step 5: 更新 revisitEvents handler 使用 applyGrants**

在 `src/pages/Game/Game.tsx` 中找到 revisitEvents 处理代码（约第 183-195 行），将：

```typescript
        scene.addStoryText(rev.text);
        audioEngine.playSFX('hint');
        rev.grants?.flags?.forEach((f) => scene.addFlag(f));
```

替换为：

```typescript
        scene.addStoryText(rev.text);
        audioEngine.playSFX('hint');
        applyGrants(rev.grants, scene, addItem, removeItem, player);
```

注意：需确认 `addItem`、`removeItem`、`player` 在此 useEffect 的作用域内可访问。

- [ ] **Step 6: CenterPanel 新增成长文字渲染**

编辑 `src/components/layout/CenterPanel.tsx`，在 storyTexts.map 内的判断块中，在 `isPsychHint` 判断之后新增 `isGrowthText`：

找到这段代码：
```typescript
          const isNpcSpeech = text.startsWith('【') && text.includes('】');
          const isPlaceholder = text.startsWith('（') && text.endsWith('。）');
          const isPsychHint = text.startsWith('〔') && text.endsWith('〕');
```

改为：
```typescript
          const isNpcSpeech = text.startsWith('【') && text.includes('】');
          const isPlaceholder = text.startsWith('（') && text.endsWith('。）');
          const isPsychHint = text.startsWith('〔') && text.endsWith('〕');
          const isGrowthText = text.startsWith('〖') && text.endsWith('〗');
```

找到：
```typescript
          const borderColor = isNpcSpeech
            ? 'border-jade/40'
            : isPsychHint
            ? 'border-gold/22'
            : isPlaceholder
            ? 'border-gold/10'
            : 'border-gold/30';
          const textClass = isPsychHint
            ? 'text-gold/38 italic text-[13px]'
            : `${opacity} text-sm`;
```

改为：
```typescript
          const borderColor = isNpcSpeech
            ? 'border-jade/40'
            : isPsychHint
            ? 'border-gold/22'
            : isGrowthText
            ? 'border-gold/35'
            : isPlaceholder
            ? 'border-gold/10'
            : 'border-gold/30';
          const textClass = isPsychHint
            ? 'text-gold/38 italic text-[13px]'
            : isGrowthText
            ? 'text-gold/55 italic text-[12px] tracking-wide'
            : `${opacity} text-sm`;
```

- [ ] **Step 7: 构建验证无类型错误**

```bash
cd /Users/xuli/claudeGame && npx tsc --noEmit
```

期望：0 errors

- [ ] **Step 8: 运行全量测试**

```bash
cd /Users/xuli/claudeGame && npx vitest run
```

期望：全部 PASS

- [ ] **Step 9: 提交**

```bash
cd /Users/xuli/claudeGame && git add src/types/game.ts src/pages/Game/Game.tsx src/components/layout/CenterPanel.tsx tests/engine/statGrowth.test.ts && git commit -m "feat: add storyText grant field, upgrade revisitEvent applyGrants, add growth text rendering"
```

---

## Task 2：第一章孤儿道具清理

**Files:**
- Modify: `src/data/items/chapter1.json`
- Modify: `src/data/syntheses/chapter1.json`
- Modify: `src/data/events/chapter1.json`
- Modify: `src/data/maps/chapter1.json`
- Modify: `tests/data/chapter1Integrity.test.ts`

- [ ] **Step 1: 写失败测试**

在 `tests/data/chapter1Integrity.test.ts` 末尾新增：

```typescript
  it('deleted orphan items no longer exist', () => {
    const deleted = ['wine_jar_iron_plate', 'forest_direction_mark', 'killer_footprint_analysis'];
    for (const id of deleted) {
      expect(allItemIds.has(id), `${id} should be deleted`).toBe(false);
    }
  });

  it('3 new chapter1 syntheses exist', () => {
    const ch1Synths = SYNTHESES.filter((s) => s.chapter === 1 || (!s.chapter && ITEMS.find(i => i.id === s.itemA)));
    const newSynthIds = ['synth_scroll_fragments', 'synth_crime_scene_full', 'synth_medical_premeditation'];
    const synthIds = new Set(SYNTHESES.map((s) => s.id));
    for (const id of newSynthIds) {
      expect(synthIds.has(id), `missing synthesis: ${id}`).toBe(true);
    }
  });

  it('synth_scroll_fragments uses existing items', () => {
    const s = SYNTHESES.find((s) => s.id === 'synth_scroll_fragments');
    expect(s).toBeDefined();
    expect(allItemIds.has(s!.itemA)).toBe(true);
    expect(allItemIds.has(s!.itemB)).toBe(true);
  });

  it('martial arts books trigger growth events', () => {
    const ch1Events = EVENTS.filter((e) => {
      const allCh1ItemIds = ITEMS.filter(i => ['wuxue_wuhen_bu','wuxue_gui_bu_lianhuan'].includes(i.id));
      return e.id === 'evt_read_wuhen_bu' || e.id === 'evt_read_gui_bu';
    });
    expect(ch1Events.length).toBe(2);
  });
```

注意：需要在文件顶部引入 `SYNTHESES` 和 `EVENTS`（若未引入）：
```typescript
import { MAPS, ITEMS, EVENTS, NPCS, SYNTHESES } from '../../src/data/loader';
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter1Integrity.test.ts
```

期望：新增测试 FAIL

- [ ] **Step 3: 删除 3 个孤儿道具**

编辑 `src/data/items/chapter1.json`，删除以下三个对象（按 id 找到删除整个 `{...}` 对象）：
- `"id": "wine_jar_iron_plate"`
- `"id": "forest_direction_mark"`
- `"id": "killer_footprint_analysis"`

- [ ] **Step 4: 新增 3 个合成**

编辑 `src/data/syntheses/chapter1.json`，在数组末尾新增：

```json
,
  {
    "id": "synth_scroll_fragments",
    "itemA": "cellar_fragment",
    "itemB": "forest_fragment",
    "result": "地窖与树林的残卷碎片拼合，还原宋怀义此行携带的完整情报——他带来的不止名单，还有天机阁建阁档案节选。这份内容，正是「鸢」此行真正要销毁的东西。宋怀义的死，从一开始就有双重目标：取走档案，灭口知情人。",
    "hint": "密室碎片 × 树林碎片",
    "grants": { "flags": ["synth_scroll_fragments"] },
    "pivotal": false,
    "chapter": 1
  },
  {
    "id": "synth_crime_scene_full",
    "itemA": "footprint_clue",
    "itemB": "blood_pattern_sketch",
    "result": "脚印走向与血迹分布完整重建凶案动线：凶手从门口进入，宋怀义先向后退跌倒，随后被制住。整个过程不超过一刻钟。与双重作案手法互补，这是完整的现场还原：先毒倒，后跌倒，最后勒毙。",
    "hint": "脚印分析 × 血迹手绘",
    "grants": { "flags": ["synth_crime_scene_full"] },
    "pivotal": false,
    "chapter": 1
  },
  {
    "id": "synth_medical_premeditation",
    "itemA": "medical_report",
    "itemB": "fiber_match_evidence",
    "result": "验尸报告与纤维比对交叉印证：宋怀义挣扎时间极短，凶手体型壮硕且受过专业训练，不是普通帮派打手。结合浪鹏帮探子的胆怯表现——真正动手的那个人，来自比浪鹏帮更深处的地方。",
    "hint": "验尸报告 × 纤维比对",
    "grants": { "flags": ["synth_medical_premeditation"] },
    "pivotal": false,
    "chapter": 1
  }
```

- [ ] **Step 5: 新增武学秘籍阅读 events**

编辑 `src/data/events/chapter1.json`，在数组末尾新增：

```json
,
  {
    "id": "evt_read_wuhen_bu",
    "title": "《无痕步》残本",
    "description": "一本残破的武学手册，封皮已脱落，内页却字迹清晰。步法图示精妙，以「无」字为诀，讲究先消形再消声。",
    "actions": [
      {
        "id": "read_wuhen",
        "label": "细读步法图示",
        "requires": { "has": ["wuxue_wuhen_bu"] },
        "result": "你将书中的步法反复揣摩，在脑海中走了一遍又一遍。步法无痕，在于心先于足——这句话，你将记在身体里。",
        "grants": {
          "flags": ["wuhen_bu_read"],
          "agility": 1,
          "storyText": "〖步法无痕，在于心先于足。你感到脚步比昨日更轻了一分。〗"
        }
      }
    ]
  },
  {
    "id": "evt_read_gui_bu",
    "title": "《鬼步连环》秘籍",
    "description": "秘籍以连环桩步为核心，图示繁复，却有一种奇异的节律感。每一步都借力于前一步，周而复始，以不动应万动。",
    "actions": [
      {
        "id": "read_gui_bu",
        "label": "研习连环桩步",
        "requires": { "has": ["wuxue_gui_bu_lianhuan"] },
        "result": "你按图示站了几遍桩步，感到骨骼与呼吸之间多了一分从容。连环之势，以不动应万动——这句话，你将记在骨骼里。",
        "grants": {
          "flags": ["gui_bu_read"],
          "constitution": 1,
          "storyText": "〖连环之势，以不动应万动。你感到身体多了一分承受的从容。〗"
        }
      }
    ]
  }
```

- [ ] **Step 6: 更新 chapter1 地图 — 大堂和废弃宅院成长 revisitEvents**

编辑 `src/data/maps/chapter1.json`，找到 `lobby` 房间，在其 `revisitEvents` 数组末尾新增：

```json
,
    {
      "id": "rev_lobby_wisdom_double_kill",
      "requires": {
        "flags": ["synth_double_kill"],
        "flags_absent": ["rev_lobby_wisdom_shown"]
      },
      "text": "再次站在大堂，你脑海中忽然清晰起来——那双重作案手法，不只是一次犯罪的细节，而是一个习惯的印记。死亡的真相往往藏在两件事的交叠处。你开始习惯这种目光。",
      "grants": {
        "flags": ["rev_lobby_wisdom_shown"],
        "wisdom": 1,
        "storyText": "〖死亡的真相往往藏在两件事的交叠处。你开始习惯这种目光。〗"
      }
    }
```

找到 `old_mansion` 房间，在其 `revisitEvents` 数组末尾新增（若无 revisitEvents 则新建数组）：

```json
"revisitEvents": [
    {
      "id": "rev_mansion_wisdom_tianji",
      "requires": {
        "flags": ["synth_tianji_motive"],
        "flags_absent": ["rev_mansion_wisdom_shown"]
      },
      "text": "再次站在天机阁旧址，那块匾额的字迹忽然多了一层意味。十年前的棋局，今日才露出轮廓。你意识到，这种看见旧事深处的目光，将在日后派上用场。",
      "grants": {
        "flags": ["rev_mansion_wisdom_shown"],
        "wisdom": 1,
        "storyText": "〖十年前的棋局，今日才露出轮廓。这种感知，将在日后派上用场。〗"
      }
    }
  ]
```

找到 `lobby` 房间，在 `interactables` 数组中确认有 `evt_read_wuhen_bu` 和 `evt_read_gui_bu`（或在 `cellar` 房间中添加，取决于秘籍在哪里获得）。

检查哪个房间会触发这两本书：在 events 中搜索 `wuxue_wuhen_bu`、`wuxue_gui_bu_lianhuan` 的 grants，找到对应房间，在该房间的 `interactables` 里添加 `evt_read_wuhen_bu` 和 `evt_read_gui_bu`。

- [ ] **Step 7: 运行测试确认通过**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter1Integrity.test.ts
```

期望：全部 PASS

- [ ] **Step 8: 运行全量测试**

```bash
cd /Users/xuli/claudeGame && npx vitest run
```

期望：全部 PASS

- [ ] **Step 9: 提交**

```bash
cd /Users/xuli/claudeGame && git add src/data/items/chapter1.json src/data/syntheses/chapter1.json src/data/events/chapter1.json src/data/maps/chapter1.json tests/data/chapter1Integrity.test.ts && git commit -m "feat: ch1 orphan item cleanup - delete 3, add 3 syntheses, add martial arts book growth events"
```

---

## Task 3：第二章 — 永宁坊夜市

**Files:**
- Modify: `src/data/maps/chapter2.json`
- Modify: `src/data/items/chapter2.json`
- Modify: `src/data/npcs/chapter2.json`
- Modify: `src/data/events/chapter2.json`
- Modify: `tests/data/chapter2Integrity.test.ts`

- [ ] **Step 1: 写失败测试**

在 `tests/data/chapter2Integrity.test.ts` 末尾新增（先更新房间数量断言，再加新测试）：

将 `expect(ch2Map?.rooms.length).toBe(6)` 改为 `expect(ch2Map?.rooms.length).toBe(9)`

```typescript
  it('yongning_nightmarket room exists with correct structure', () => {
    const room = ch2Map?.rooms.find((r) => r.id === 'yongning_nightmarket');
    expect(room, 'yongning_nightmarket missing').toBeDefined();
    expect(room?.requires?.flags).toContain('langpeng_discovered');
    expect(room?.exits).toContain('east_market_entrance');
    expect(room?.revisitEvents?.length).toBeGreaterThanOrEqual(1);
    const rev = room?.revisitEvents?.[0];
    expect(rev?.grants?.flags).toBeDefined();
    expect(rev?.requires?.flags_absent).toBeDefined();
  });

  it('nightmarket items exist', () => {
    const ids = ['nightmarket_ledger', 'concealed_dagger'];
    for (const id of ids) {
      expect(allItemIds.has(id), `missing item: ${id}`).toBe(true);
    }
  });

  it('east_market_entrance exits include yongning_nightmarket', () => {
    const room = ch2Map?.rooms.find((r) => r.id === 'east_market_entrance');
    expect(room?.exits).toContain('yongning_nightmarket');
  });
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter2Integrity.test.ts
```

期望：新增测试 FAIL

- [ ] **Step 3: 新增道具**

编辑 `src/data/items/chapter2.json`，末尾新增：

```json
,
  {
    "id": "nightmarket_ledger",
    "name": "夜市暗账",
    "description": "浪鹏帮近期销赃记录，其中出现天机令牌数次易手的流转痕迹，最终买家以「李」字落款。",
    "isClue": true
  },
  {
    "id": "concealed_dagger",
    "name": "袖中短刃",
    "description": "制作精良的隐藏短刃，可藏于袖中不露形迹。出自惯走江湖之人的手艺。",
    "isClue": false
  },
  {
    "id": "black_channel_intel",
    "name": "黑道内幕",
    "description": "销赃掌柜透露的消息：李邈背后有更大的委托人，那个人不止雇用浪鹏帮，还在长安城内布置了多条互不相知的线。",
    "isClue": true
  }
```

- [ ] **Step 4: 新增 NPC**

编辑 `src/data/npcs/chapter2.json`，末尾新增：

```json
,
  {
    "id": "npc_nightmarket_fence",
    "name": "销赃掌柜",
    "description": "一个四十出头的男人，眼神警惕，货摊后有一道挂帘，不知藏着什么。见生人进来，手放在摊沿上，不动声色地观察。",
    "dialogues": [
      {
        "id": "fence_first_meet",
        "condition": null,
        "text": "这里不接待不认识的人。你走错地方了。"
      },
      {
        "id": "fence_thief_open",
        "condition": { "talent": "三教九流" },
        "text": "你低声说出一句接头用语，掌柜的眼神变了。「自己人？……行，你想知道什么。」他往四周扫了一眼，压低声音，「问吧，但别太久。」",
        "grants": { "flags": ["fence_talk_opened"] }
      },
      {
        "id": "fence_extortion_open",
        "condition": { "has": ["extortion_note"] },
        "text": "你将勒索纸条递过去，掌柜看了一眼，神情微变。「这是浪鹏帮的字迹……你从哪里弄来的？」他顿了顿，「罢了，你既然能拿到这个，不是普通人。说吧，想知道什么。」",
        "grants": { "flags": ["fence_talk_opened"] }
      },
      {
        "id": "fence_ledger_trade",
        "condition": { "flags": ["fence_talk_opened"] },
        "text": "「浪鹏帮最近销赃的东西里，有几块玉令——天机阁的信物，我认得。买家每次都是同一个中间人来，落款都是个「李」字。」他从帘后取出一本册子，「这个你拿去，我不想留着。」",
        "grants": {
          "flags": ["nightmarket_ledger_obtained"],
          "items": ["nightmarket_ledger"],
          "clues": ["nightmarket_ledger"]
        }
      },
      {
        "id": "fence_black_channel",
        "condition": { "talent": "三教九流", "flags": ["nightmarket_ledger_obtained"] },
        "text": "掌柜压低声音：「告诉你个更大的事。那个「李」字买家，不只雇了浪鹏帮。据我所知，他在城里还有几条互不相知的线——每条线都只知道自己那一段，不知道全局。这种布置，不是普通官员能想出来的。」",
        "grants": {
          "flags": ["black_channel_intel_obtained"],
          "items": ["black_channel_intel"],
          "clues": ["black_channel_intel"]
        }
      }
    ]
  }
```

- [ ] **Step 5: 新增 events**

编辑 `src/data/events/chapter2.json`，末尾新增：

```json
,
  {
    "id": "evt_nightmarket_tail",
    "title": "永宁坊夜市入口",
    "description": "坊间一条不起眼的窄巷，傍晚才有人影进出。你循着浪鹏帮探子的去向追来，巷口有人把守，并不对外人开放。",
    "actions": [
      {
        "id": "tail_default",
        "label": "贴墙跟进，混入人群",
        "requires": null,
        "result": "你趁把守的人转身，混入一批进来的货商，成功进入夜市。销赃掌柜正在整理货架，见你进来，眯起眼打量。",
        "grants": { "flags": ["fence_talk_opened"] }
      },
      {
        "id": "tail_precise",
        "label": "精准尾随探子，不被察觉（需敏捷 7 或已有探子供词）",
        "requires": {
          "agility": 7
        },
        "result": "你以极精准的步伐跟在探子身后，连他的影子都没有察觉。进入夜市后，探子向掌柜说了什么，掌柜抬头看向你，竟主动点了头——你的身手，让他认为你是自己人。",
        "grants": {
          "flags": ["fence_talk_opened", "agility_growth_nightmarket"],
          "agility": 1,
          "storyText": "〖暗处跟人，靠的不是速度，是对方的节奏。你已学会听那个节奏。〗"
        }
      },
      {
        "id": "tail_intel",
        "label": "以探子供词为依据，直接亮明来意",
        "requires": { "has": ["langpeng_hideout_intel"] },
        "result": "你将探子供词递给把守，他认出了浪鹏帮内部的字迹格式，侧身让路。掌柜见你拿着这个进来，沉默片刻后说：「进来吧。」",
        "grants": { "flags": ["fence_talk_opened"] }
      }
    ]
  },
  {
    "id": "evt_nightmarket_goods",
    "title": "夜市货摊",
    "description": "摊子上摆着各色不便言说的货物。短刃、染血绸布、封蜡信件……每一样都有来历，每一样都不太干净。",
    "actions": [
      {
        "id": "buy_dagger",
        "label": "购入袖中短刃",
        "requires": { "talent": "三教九流" },
        "result": "掌柜从帘后取出一柄包裹严实的短刃，递给你，没有多说话。这种东西，懂的人自然懂。",
        "grants": {
          "items": ["concealed_dagger"],
          "flags": ["has_concealed_dagger"]
        }
      }
    ]
  }
```

- [ ] **Step 6: 新增房间并更新出口**

编辑 `src/data/maps/chapter2.json`，在 `rooms` 数组末尾新增：

```json
,
    {
      "id": "yongning_nightmarket",
      "name": "永宁坊夜市",
      "description": "坊间深处一条灯火昏黄的窄巷，夜色遮住了货物的真实面目。销赃、换信、买消息——这里的交易没有白纸黑字，只有眼神和分寸。",
      "interactables": ["evt_nightmarket_tail", "evt_nightmarket_goods"],
      "exits": ["east_market_entrance"],
      "requires": { "flags": ["langpeng_discovered"] },
      "talentViews": [
        {
          "talent": "三教九流",
          "text": "〔江湖本能：夜市里有三类人——卖东西的、买东西的、盯着前两类人的。你一眼扫过去，已经数出了两个盯梢的。他们不是为你来的，是在等另一个人。〕"
        }
      ],
      "revisitEvents": [
        {
          "id": "rev_nightmarket_langpeng_retreat",
          "requires": {
            "flags": ["langpeng_trail"],
            "flags_absent": ["rev_nightmarket_retreat_shown"]
          },
          "text": "〔再来夜市，气氛变了——货摊减少了一半，几个熟悉的面孔不见了。销赃掌柜收摊的动作比平时快了三倍。浪鹏帮正在撤人。〕",
          "grants": { "flags": ["rev_nightmarket_retreat_shown", "langpeng_retreating"] }
        }
      ]
    }
```

在 `east_market_entrance` 的 `exits` 数组中添加 `"yongning_nightmarket"`：

找到 `east_market_entrance` 房间，将：
```json
"exits": ["huichuntang", "antique_shop", "cien_temple"]
```
改为：
```json
"exits": ["huichuntang", "antique_shop", "cien_temple", "yongning_nightmarket", "zhuque_teahouse_st"]
```

（同时加入朱雀大街茶肆，Task 5 会新增该房间）

- [ ] **Step 7: 运行测试确认通过**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter2Integrity.test.ts
```

期望：全部 PASS

- [ ] **Step 8: 提交**

```bash
cd /Users/xuli/claudeGame && git add src/data/maps/chapter2.json src/data/items/chapter2.json src/data/npcs/chapter2.json src/data/events/chapter2.json tests/data/chapter2Integrity.test.ts && git commit -m "feat: add ch2 yongning nightmarket room, NPC, items, events"
```

---

## Task 4：第二章 — 御史台外街

**Files:**
- Modify: `src/data/maps/chapter2.json`
- Modify: `src/data/items/chapter2.json`
- Modify: `src/data/npcs/chapter2.json`
- Modify: `src/data/events/chapter2.json`
- Modify: `tests/data/chapter2Integrity.test.ts`

- [ ] **Step 1: 写失败测试**

在 `tests/data/chapter2Integrity.test.ts` 末尾新增：

```typescript
  it('censorate_street room exists with correct structure', () => {
    const room = ch2Map?.rooms.find((r) => r.id === 'censorate_street');
    expect(room, 'censorate_street missing').toBeDefined();
    expect(room?.requires?.flags).toContain('li_mao_background');
    expect(room?.exits).toContain('imperial_teahouse');
  });

  it('censorate_street items exist', () => {
    const ids = ['censorate_old_file', 'imperial_pursuit_order'];
    for (const id of ids) {
      expect(allItemIds.has(id), `missing item: ${id}`).toBe(true);
    }
  });

  it('imperial_teahouse exits include censorate_street', () => {
    const room = ch2Map?.rooms.find((r) => r.id === 'imperial_teahouse');
    expect(room?.exits).toContain('censorate_street');
  });
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter2Integrity.test.ts
```

期望：新增测试 FAIL

- [ ] **Step 3: 新增道具**

编辑 `src/data/items/chapter2.json`，末尾新增：

```json
,
  {
    "id": "censorate_old_file",
    "name": "廷尉旧档",
    "description": "二十年前天机阁旧案的官方记录，被刻意归档遗忘。内页详细记录了廷尉府当年如何以「危及社稷」为由追查天机成员，以及数位成员的下落——均以「畏罪潜逃」结案。",
    "isClue": true
  },
  {
    "id": "imperial_pursuit_order",
    "name": "追查令副本",
    "description": "廷尉府当年颁布的内部追查令，加盖官印。证明廷尉府不只是旁观者——他们主动追杀天机成员，且从未公开此事。",
    "isClue": true
  }
```

- [ ] **Step 4: 新增 NPC**

编辑 `src/data/npcs/chapter2.json`，末尾新增：

```json
,
  {
    "id": "npc_archive_clerk",
    "name": "档案小吏",
    "description": "廷尉府外街上的一个小吏，年约三十，面容普通，穿着整洁但不起眼。神情习惯性地警觉，见陌生人走近会微微侧身。",
    "dialogues": [
      {
        "id": "clerk_first_meet",
        "condition": null,
        "text": "「这里是廷尉府档案外署，闲人勿近。有事去前堂递状纸。」他转过身，不再搭理你。"
      },
      {
        "id": "clerk_intimidate",
        "condition": { "talent": "官威" },
        "text": "你亮出身份，小吏的背脊立刻挺直了。「大……大人，请进。」他侧身让路，额头微微冒汗，「您要查哪一年的档案，小的这就去取。」",
        "grants": { "flags": ["censorate_access_granted"] }
      },
      {
        "id": "clerk_qi_warning",
        "condition": { "talent": "望气观相" },
        "text": "你以望气之法细看，发现档案室窗口有一抹暗沉的气机——不是档案本身，是有人长期在此监视，留下了观察者特有的气场印记。这里有人在盯着某些档案，或者盯着来取档案的人。",
        "grants": { "flags": ["surveillance_detected"] }
      },
      {
        "id": "clerk_bribe",
        "condition": { "flags_absent": ["censorate_access_granted"] },
        "text": "你摸出几枚银锞，小吏犹豫片刻，接了过去。「我只能给你看外层档案，里面的……不在我权限之内。」他从外柜取出薄薄一叠，「只有这些了。」",
        "grants": {
          "flags": ["censorate_partial_access"],
          "items": ["censorate_old_file"],
          "clues": ["censorate_old_file"]
        }
      },
      {
        "id": "clerk_full_access",
        "condition": { "flags": ["censorate_access_granted"] },
        "text": "档案室内，你翻出了二十年前那批被封存的卷宗。廷尉府的追查令赫然在列，落款是当年的廷尉正——一个已故多年的名字。这不是一份遗忘的档案，是一份被刻意埋藏的档案。",
        "grants": {
          "flags": ["full_censorate_file_read"],
          "items": ["censorate_old_file", "imperial_pursuit_order"],
          "clues": ["censorate_old_file", "imperial_pursuit_order"],
          "wisdom": 1,
          "storyText": "〖那些被刻意遗忘的名字，此刻在你脑海中清晰起来。〗"
        }
      }
    ]
  }
```

- [ ] **Step 5: 新增 events**

编辑 `src/data/events/chapter2.json`，末尾新增：

```json
,
  {
    "id": "evt_censorate_exterior",
    "title": "廷尉府外街",
    "description": "廷尉府的外围街道，两侧是低矮的官署附属建筑。行人稀少，偶有小吏匆匆经过。档案外署的牌子挂在一扇半掩的门旁。",
    "actions": [
      {
        "id": "observe_street",
        "label": "观察廷尉府外围布置",
        "requires": null,
        "result": "廷尉府外街比你预料的冷清。几名守卫站在不显眼的位置，其中一人的目光不断扫向档案外署的门口——好像在等什么人来取档案。",
        "grants": { "flags": ["censorate_observed"] }
      }
    ]
  }
```

- [ ] **Step 6: 新增房间并更新出口**

编辑 `src/data/maps/chapter2.json`，在 `rooms` 数组末尾新增：

```json
,
    {
      "id": "censorate_street",
      "name": "廷尉府外街",
      "description": "廷尉府的外围街道，低矮的官署建筑排列两侧，空气中有一股陈年卷宗特有的霉味。档案外署的牌子半遮在枯藤之后，不刻意留心就会错过。",
      "interactables": ["evt_censorate_exterior"],
      "exits": ["imperial_teahouse"],
      "requires": { "flags": ["li_mao_background"] },
      "talentViews": [
        {
          "talent": "官威",
          "text": "〔公务直觉：廷尉府档案外署对持有公文的官员开放，但需出示品阶凭证。以你的身份进入不难——难的是，里面的档案有没有被动过手脚。〕"
        },
        {
          "talent": "望气观相",
          "text": "〔望气所感：档案外署的气场有些不对。那里积累着一种特殊的观察者气机——有人长期在此守候，等着看谁来翻这批旧档。〕"
        }
      ],
      "revisitEvents": [
        {
          "id": "rev_censorate_after_access",
          "requires": {
            "flags": ["full_censorate_file_read"],
            "flags_absent": ["rev_censorate_after_shown"]
          },
          "text": "〔再次经过廷尉府外街，你注意到档案室的门被关紧了，窗帘也拉上了——有人知道你来过。〕",
          "grants": { "flags": ["rev_censorate_after_shown", "censorate_aware_of_you"] }
        }
      ]
    }
```

在 `imperial_teahouse` 房间的 `exits` 末尾添加 `"censorate_street"`：

找到 `imperial_teahouse` 房间，将其 `exits` 更新为包含 `"censorate_street"`。

- [ ] **Step 7: 运行测试确认通过**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter2Integrity.test.ts
```

期望：全部 PASS

- [ ] **Step 8: 提交**

```bash
cd /Users/xuli/claudeGame && git add src/data/maps/chapter2.json src/data/items/chapter2.json src/data/npcs/chapter2.json src/data/events/chapter2.json tests/data/chapter2Integrity.test.ts && git commit -m "feat: add ch2 censorate_street room, NPC, items, wisdom growth gate"
```

---

## Task 5：第二章 — 朱雀大街茶肆

**Files:**
- Modify: `src/data/maps/chapter2.json`
- Modify: `src/data/items/chapter2.json`
- Modify: `src/data/npcs/chapter2.json`
- Modify: `src/data/events/chapter2.json`
- Modify: `tests/data/chapter2Integrity.test.ts`

- [ ] **Step 1: 写失败测试**

在 `tests/data/chapter2Integrity.test.ts` 末尾新增：

```typescript
  it('zhuque_teahouse_st room exists with no prerequisite', () => {
    const room = ch2Map?.rooms.find((r) => r.id === 'zhuque_teahouse_st');
    expect(room, 'zhuque_teahouse_st missing').toBeDefined();
    expect(room?.requires == null || Object.keys(room.requires).length === 0).toBe(true);
    expect(room?.exits).toContain('east_market_entrance');
  });

  it('zhuque teahouse items exist', () => {
    const ids = ['li_mao_rumor_record', 'missing_persons_notice'];
    for (const id of ids) {
      expect(allItemIds.has(id), `missing item: ${id}`).toBe(true);
    }
  });

  it('ch2 wisdom growth synthesis event exists', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_zhuque_synthesis');
    expect(evt, 'evt_zhuque_synthesis missing').toBeDefined();
    const growthAction = evt?.actions.find((a) => a.grants?.wisdom === 1);
    expect(growthAction, 'wisdom growth action missing').toBeDefined();
  });
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter2Integrity.test.ts
```

期望：新增测试 FAIL

- [ ] **Step 3: 新增道具**

编辑 `src/data/items/chapter2.json`，末尾新增：

```json
,
  {
    "id": "li_mao_rumor_record",
    "name": "李邈风评录",
    "description": "坊间传言拼凑出的李邈人脉网络：在长安城内经营多年，表面是闲散官员，实则与各方势力均有往来。据说他手下有人专门「处理麻烦」。",
    "isClue": true
  },
  {
    "id": "missing_persons_notice",
    "name": "失踪告示",
    "description": "近期数人失踪的告示，拼凑后发现失踪者特征与天机旧部高度吻合：中年男性，行事低调，多为医者或说书人出身。",
    "isClue": true
  }
```

- [ ] **Step 4: 新增 NPC**

编辑 `src/data/npcs/chapter2.json`，末尾新增：

```json
,
  {
    "id": "npc_street_storyteller",
    "name": "街头说书人",
    "description": "一个嗓音洪亮的中年男子，围着一圈闲散茶客说书。停顿之间，他的眼神扫过在场每一个人，那是江湖老手特有的习惯。",
    "dialogues": [
      {
        "id": "storyteller_first_meet",
        "condition": null,
        "text": "「客官，听书就坐，不听书也可以喝茶。」他冲你一点头，「您是外地来的？长安最近不太平，多个耳朵多条路，这话不是白说的。」"
      },
      {
        "id": "storyteller_peer",
        "condition": { "talent": "耳报神" },
        "text": "他看见你的某个不经意的手势，眼神一亮。「同行？」他压低声音，「行，说个真事儿给你听。那个李邈，最近在城里清人——专找那些老面孔，一个一个地「请」走。为什么清，我猜是怕他们开口说某些旧事。」",
        "grants": {
          "flags": ["li_mao_cleansing_intel"],
          "items": ["li_mao_rumor_record"],
          "clues": ["li_mao_rumor_record"]
        }
      },
      {
        "id": "storyteller_drunk_ref",
        "condition": { "has": ["drunk_testimony"] },
        "text": "你提起往事客栈的醉汉，说书人眼中闪过一丝认出的神情。「那个张三啊，老熟人了。他在往事客栈喝了多少年酒，我都数不清了。」他顿了顿，「他说的话，你不能全信，但也不能不信——他在那里见过的人，比你以为的多得多。」",
        "grants": { "flags": ["drunk_testimony_verified"] }
      },
      {
        "id": "storyteller_missing",
        "condition": null,
        "text": "「最近有几个人不见了，」他漫不经心地说，「你知道长安城多大，少几个人本来不稀奇。但这几个人……都是老人了，在各处低调地活着，突然就没了消息。有人在清扫某种痕迹。」",
        "grants": {
          "items": ["missing_persons_notice"],
          "clues": ["missing_persons_notice"]
        }
      },
      {
        "id": "storyteller_synthesis",
        "condition": { "has": ["li_mao_rumor_record", "missing_persons_notice"] },
        "text": "你将两件事一对照，说书人看着你点点头。「你看出来了——失踪的那几个，跟李邈清的名单，是同一批人。他在把知道旧事的人一个个从长安除掉。为什么，你想清楚了吗？」"
      }
    ]
  }
```

- [ ] **Step 5: 新增 events**

编辑 `src/data/events/chapter2.json`，末尾新增：

```json
,
  {
    "id": "evt_zhuque_atmosphere",
    "title": "朱雀大街茶肆",
    "description": "大街边的普通茶肆，人来人往，消息最是灵通。墙角贴着数张告示，其中几张是手写的失踪启事，字迹歪斜，一看就是家属自己写的。",
    "actions": [
      {
        "id": "read_notices",
        "label": "细看墙角告示",
        "requires": null,
        "result": "失踪启事上描述的人：中年男性，行事低调，有些是游方医，有些是说书人，有些职业不详。你将特征默记，感到这批失踪者之间有某种说不清的相似之处。",
        "grants": { "flags": ["missing_pattern_noticed"] }
      }
    ]
  },
  {
    "id": "evt_zhuque_synthesis",
    "title": "线索拼合",
    "description": "你手上同时有李邈风评录和失踪告示。两件事放在一起，隐隐指向同一个结论。",
    "actions": [
      {
        "id": "connect_clues",
        "label": "将李邈人脉网络与失踪名单对照",
        "requires": { "has": ["li_mao_rumor_record", "missing_persons_notice"] },
        "result": "失踪者的特征与天机旧部高度吻合，而李邈最近在城内的动作——联系起来，他在系统性地清除知道某件旧事的人。这张网比你以为的大得多，而你站在它的边缘。",
        "grants": {
          "flags": ["li_mao_cleansing_confirmed"],
          "wisdom": 1,
          "storyText": "〖碎片开始成形，你看见了那张网更大的轮廓。〗"
        }
      }
    ]
  }
```

- [ ] **Step 6: 新增房间**

编辑 `src/data/maps/chapter2.json`，在 `rooms` 数组末尾新增：

```json
,
    {
      "id": "zhuque_teahouse_st",
      "name": "朱雀大街茶肆",
      "description": "朱雀大街旁一家普通茶肆，人来人往，嘈杂而生机勃勃。角落里有一个说书人正在讲什么，茶客们听得似乎入神，又似乎各有心事。",
      "interactables": ["evt_zhuque_atmosphere", "evt_zhuque_synthesis"],
      "exits": ["east_market_entrance"],
      "requires": null,
      "talentViews": [
        {
          "talent": "耳报神",
          "text": "〔同行所感：那个说书人的停顿位置不对——他不只是在讲故事，他在观察听众的反应。这是用来收集情报的说书，你以前也做过一样的事。〕"
        }
      ],
      "revisitEvents": [
        {
          "id": "rev_zhuque_after_limao",
          "requires": {
            "flags": ["li_mao_cleansing_confirmed"],
            "flags_absent": ["rev_zhuque_limao_shown"]
          },
          "text": "〔再来茶肆，说书人正在讲一个关于「长安城里消失的人」的故事，茶客们听得入神。他的眼神扫过来，微微点了一下头。〕",
          "grants": { "flags": ["rev_zhuque_limao_shown"] }
        }
      ]
    }
```

（east_market_entrance 的出口已在 Task 3 中更新，包含了 `zhuque_teahouse_st`）

- [ ] **Step 7: 运行测试确认通过**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter2Integrity.test.ts
```

期望：全部 PASS

- [ ] **Step 8: 运行全量测试**

```bash
cd /Users/xuli/claudeGame && npx vitest run
```

期望：全部 PASS

- [ ] **Step 9: 提交**

```bash
cd /Users/xuli/claudeGame && git add src/data/maps/chapter2.json src/data/items/chapter2.json src/data/npcs/chapter2.json src/data/events/chapter2.json tests/data/chapter2Integrity.test.ts && git commit -m "feat: add ch2 zhuque_teahouse_st room, storyteller NPC, rumor items, wisdom growth synthesis"
```

---

## Task 6：第三章现有 NPC 补充对话 + 章节 truth_path flag

**Files:**
- Modify: `src/data/npcs/chapter3.json`
- Modify: `src/data/events/chapter3.json`
- Modify: `tests/data/chapter3Integrity.test.ts`

- [ ] **Step 1: 写失败测试**

在 `tests/data/chapter3Integrity.test.ts` 末尾新增：

```typescript
  it('npc_wujue has wujue_deepest_secret dialogue', () => {
    const ch3Npcs = NPCS.filter((n) => ['npc_wujue', 'npc_tianji_contact', 'npc_temple_novice'].includes(n.id));
    const wujue = ch3Npcs.find((n) => n.id === 'npc_wujue');
    expect(wujue).toBeDefined();
    const deepSecret = wujue?.dialogues.find((d) => d.id === 'wujue_deepest_secret');
    expect(deepSecret, 'wujue_deepest_secret dialogue missing').toBeDefined();
    expect(deepSecret?.condition?.wisdom).toBe(8);
  });

  it('npc_fei_ye has fei_ye_upper_truth dialogue', () => {
    const feiYe = NPCS.find((n) => n.id === 'npc_fei_ye');
    expect(feiYe).toBeDefined();
    const upperTruth = feiYe?.dialogues.find((d) => d.id === 'fei_ye_upper_truth');
    expect(upperTruth, 'fei_ye_upper_truth dialogue missing').toBeDefined();
    expect(upperTruth?.condition?.wisdom).toBe(8);
    expect(upperTruth?.condition?.has).toContain('leyou_inscription');
  });

  it('chapter3_truth_path flag is granted by an event action', () => {
    const truthPathEvent = EVENTS.find((e) =>
      e.actions.some((a) => a.grants?.flags?.includes('chapter3_truth_path'))
    );
    expect(truthPathEvent, 'no event grants chapter3_truth_path flag').toBeDefined();
  });
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter3Integrity.test.ts
```

期望：新增测试 FAIL

- [ ] **Step 3: 查找飞爷 NPC 所在文件**

飞爷 `npc_fei_ye` 在第一章就出现了，第三章对话需要确认在哪个文件。运行：

```bash
grep -r "npc_fei_ye" /Users/xuli/claudeGame/src/data/npcs/ -l
```

若在 `chapter1.json`，则第三章新对话需追加到 `chapter1.json` 中的 `npc_fei_ye`。若在 `chapter3.json`，则追加到 `chapter3.json`。

- [ ] **Step 4: 为 npc_wujue 新增对话**

编辑包含 `npc_wujue` 的 npcs 文件（`src/data/npcs/chapter3.json`），在其 `dialogues` 数组末尾新增：

```json
,
      {
        "id": "wujue_deepest_secret",
        "condition": { "wisdom": 8 },
        "text": "无迹看了你很久，才开口：「二十年前那次事故……不是事故。」他的声音很平静，「那批货在路上出了问题，不是因为疏失，是因为有人故意安排的。那个人知道那批货的内容，知道运送的时间，知道每一个经手人的名字。」\n\n他停顿了一下：「那个人，至今还在长安。」",
        "grants": { "flags": ["wujue_accident_truth_known"] }
      }
```

- [ ] **Step 5: 为 npc_fei_ye 新增对话**

`npc_fei_ye` 在 `src/data/npcs/chapter1.json`（飞爷第一章引入，对话跨章复用）。在其 `dialogues` 数组末尾新增：

```json
,
      {
        "id": "fei_ye_upper_truth",
        "condition": { "wisdom": 8, "has": ["leyou_inscription"] },
        "text": "飞爷看见你手中的石刻拓印，沉默了一会儿。\n\n「那块碑是他立的，」他说，声音里第一次多了一种不同的东西，「那个「更上层的人」——我知道他是谁。」\n\n他抬起头，用一种奇怪的平静看着你：「我选择不说出来，不是因为怕，是因为他也在保护一些人。那些人，和名单上的人，是同一批人。」\n\n「有些秘密，说出来会死更多人。」",
        "grants": { "flags": ["fei_ye_upper_truth_known"] }
      }
```

- [ ] **Step 6: 为 chapter3_truth_path 添加 grant**

在 `src/data/events/chapter3.json` 中，找到 `evt_safehouse_wall`，将 `find_archive` 和 `find_archive_agi` 两个 action 的 `grants.flags` 各加入 `"chapter3_truth_path"`：

`find_archive` 的 grants 从：
```json
"grants": { "items": ["tianji_founding_scroll"] }
```
改为：
```json
"grants": { "items": ["tianji_founding_scroll"], "flags": ["chapter3_truth_path"] }
```

`find_archive_agi` 的 grants 同样处理：
```json
"grants": { "items": ["tianji_founding_scroll"], "flags": ["chapter3_truth_path"] }
```

**同时**更新 `evt_ch3_wisdom_growth` 的 `decode_cipher` action：
- 将 `result` 中的 `「……愈练愈精。【智慧 +1】」` 末尾的 `【智慧 +1】` 删除
- 在 `grants` 中新增 `"storyText": "〖推理之道，如同武功，愈练愈精。你感到思路又清晰了一分。〗"`

- [ ] **Step 7: 运行测试确认通过**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter3Integrity.test.ts
```

期望：全部 PASS

- [ ] **Step 8: 提交**

```bash
cd /Users/xuli/claudeGame && git add src/data/npcs/ src/data/events/chapter3.json tests/data/chapter3Integrity.test.ts && git commit -m "feat: add wujue deepest secret + fei_ye upper truth wisdom-gated dialogues, add chapter3_truth_path flag"
```

---

## Task 7：第三章 — 乐游原

**Files:**
- Modify: `src/data/maps/chapter3.json`
- Modify: `src/data/items/chapter3.json`
- Modify: `src/data/npcs/chapter3.json`
- Modify: `src/data/events/chapter3.json`
- Modify: `tests/data/chapter3Integrity.test.ts`

- [ ] **Step 1: 写失败测试**

在 `tests/data/chapter3Integrity.test.ts` 末尾新增：

```typescript
  it('leyou_plain room exists with correct exits', () => {
    const ch3Map = MAPS.find((m) => m.id === 'chapter3');
    const room = ch3Map?.rooms.find((r) => r.id === 'leyou_plain');
    expect(room, 'leyou_plain missing').toBeDefined();
    expect(room?.exits).toContain('feiyes_manor');
  });

  it('leyou_plain items exist', () => {
    const ids = ['leyou_inscription', 'leyou_vista_note'];
    for (const id of ids) {
      expect(allItemIds.has(id), `missing item: ${id}`).toBe(true);
    }
  });

  it('leyou_plain has wisdom growth action', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_stone_inscription');
    expect(evt, 'evt_stone_inscription missing').toBeDefined();
    const growthAction = evt?.actions.find((a) => a.grants?.wisdom === 1);
    expect(growthAction, 'wisdom growth action missing in leyou').toBeDefined();
  });

  it('feiyes_manor exits include leyou_plain', () => {
    const ch3Map = MAPS.find((m) => m.id === 'chapter3');
    const room = ch3Map?.rooms.find((r) => r.id === 'feiyes_manor');
    expect(room?.exits).toContain('leyou_plain');
  });
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter3Integrity.test.ts
```

期望：新增测试 FAIL

- [ ] **Step 3: 新增道具**

编辑 `src/data/items/chapter3.json`，末尾新增：

```json
,
  {
    "id": "leyou_inscription",
    "name": "乐游石刻拓印",
    "description": "天机阁某位创立者亲笔刻于乐游原高地的碑文拓印。碑文只有一句：「吾辈所护，非权非财，乃不该死之人。」笔力遒劲，是一个已经不在人世的人留下的最后话语。",
    "isClue": true
  },
  {
    "id": "leyou_vista_note",
    "name": "望城手记",
    "description": "以道家望气之法俯瞰长安城所得的感知记录：城中有一处气机异常聚集，方位指向廷尉府方向。那里有某种长期积累的观察者气场，不是普通官署应有的气质。",
    "isClue": true
  }
```

- [ ] **Step 4: 新增 NPC**

编辑 `src/data/npcs/chapter3.json`，末尾新增：

```json
,
  {
    "id": "npc_leyou_wanderer",
    "name": "过路隐者",
    "description": "一个头发花白的老人，正在高地上远望长安。见你走来，转身看了你一眼，什么也没说。",
    "dialogues": [
      {
        "id": "wanderer_brief",
        "condition": null,
        "text": "老人看了你一眼，轻声说了一句话：「走到这里的人，都是因为看见了什么，又放不下。」他转身离去，很快消失在高地另一侧的林间。此后无论你再来几次，这里都只剩下风声。",
        "grants": { "flags": ["leyou_wanderer_met"] }
      }
    ]
  }
```

- [ ] **Step 5: 新增 events**

编辑 `src/data/events/chapter3.json`，末尾新增：

```json
,
  {
    "id": "evt_stone_inscription",
    "title": "乐游原石碑",
    "description": "一块不起眼的石碑，半藏在枯草后。苔痕掩去了大半，凑近才能辨认字迹。只有一句话，字体苍劲，是一个习惯独自承担事情的人写出来的字。",
    "actions": [
      {
        "id": "copy_inscription",
        "label": "拓印碑文",
        "requires": null,
        "result": "「吾辈所护，非权非财，乃不该死之人。」你将这句话拓印下来，收好。站在高地上，长安城在眼前展开，你第一次感到自己看见了这件事的全貌——不是一桩命案，是一代人的选择。",
        "grants": {
          "flags": ["leyou_inscription_obtained"],
          "items": ["leyou_inscription"],
          "clues": ["leyou_inscription"],
          "wisdom": 1,
          "storyText": "〖站在高处，你第一次看见了这件事的全貌——不是一桩命案，是一代人的选择。〗"
        }
      },
      {
        "id": "qi_observation",
        "label": "以望气之法感应高地气场（道士）",
        "requires": { "talent": "望气观相" },
        "result": "你以道家望气之法俯瞰长安，感知到城中气机的流动。绝大部分是日常生息之气，但有一处异常——廷尉府方向有一团沉厚的观察者气机，像是有什么事长期被人压着，无法散去。",
        "grants": {
          "items": ["leyou_vista_note"],
          "clues": ["leyou_vista_note"],
          "flags": ["leyou_qi_observed"]
        }
      }
    ]
  },
  {
    "id": "evt_leyou_overlook",
    "title": "俯瞰长安",
    "description": "从乐游原高地向下望去，长安城的格局清晰可辨：朱雀大街笔直延伸，坊市整齐，皇城居北。一切都显得有条不紊，但你知道，那些街道之下，藏着多少无人知晓的事。",
    "actions": [
      {
        "id": "observe_city",
        "label": "静静俯瞰",
        "requires": null,
        "result": "你在高地上站了很久，什么也没做，只是看。有些事情，需要这样的距离才能看清楚。",
        "grants": { "flags": ["leyou_overlooked"] }
      }
    ]
  }
```

- [ ] **Step 6: 新增房间并更新 feiyes_manor 出口**

编辑 `src/data/maps/chapter3.json`，在 `rooms` 数组末尾新增：

```json
,
    {
      "id": "leyou_plain",
      "name": "乐游原",
      "description": "长安城东南的高地，视野开阔，可俯瞰全城。春秋时节常有文人登临，如今却少有人来。高地一角，有一块被枯草半掩的石碑，若不是刻意走近，很难发现。",
      "interactables": ["evt_stone_inscription", "evt_leyou_overlook"],
      "exits": ["feiyes_manor"],
      "requires": null,
      "talentViews": [
        {
          "talent": "望气观相",
          "text": "〔望气感知：乐游原的气场轻盈，是一种历经沉淀的静气。这里曾有人在此久坐，带着一种「已经放下了一切」的气质。他来这里，是来告别的。〕"
        }
      ],
      "revisitEvents": [
        {
          "id": "rev_leyou_after_truth",
          "requires": {
            "flags": ["wujue_accident_truth_known"],
            "flags_absent": ["rev_leyou_after_truth_shown"]
          },
          "text": "〔再来高地，风依然，碑依然。你想起无迹说的那句话：「那个人，至今还在长安。」碑文和这句话叠在一起，有一种令人不安的清晰。〕",
          "grants": { "flags": ["rev_leyou_after_truth_shown"] }
        }
      ]
    }
```

在 `feiyes_manor` 房间的 `exits` 中添加 `"leyou_plain"` 和 `"tianji_ruins_ch3"`（Task 9 会用到）：

找到 `feiyes_manor`，更新 `exits` 包含：`"leyou_plain"`, `"tianji_ruins_ch3"`.

- [ ] **Step 7: 运行测试确认通过**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter3Integrity.test.ts
```

期望：全部 PASS

- [ ] **Step 8: 提交**

```bash
cd /Users/xuli/claudeGame && git add src/data/maps/chapter3.json src/data/items/chapter3.json src/data/npcs/chapter3.json src/data/events/chapter3.json tests/data/chapter3Integrity.test.ts && git commit -m "feat: add ch3 leyou_plain room, stone inscription, wanderer NPC, wisdom growth"
```

---

## Task 8：第三章 — 廷尉府外院

**Files:**
- Modify: `src/data/maps/chapter3.json`
- Modify: `src/data/items/chapter3.json`
- Modify: `src/data/npcs/chapter3.json`
- Modify: `src/data/events/chapter3.json`
- Modify: `tests/data/chapter3Integrity.test.ts`

- [ ] **Step 1: 写失败测试**

在 `tests/data/chapter3Integrity.test.ts` 末尾新增：

```typescript
  it('censorate_outer room exists behind truth_path flag', () => {
    const ch3Map = MAPS.find((m) => m.id === 'chapter3');
    const room = ch3Map?.rooms.find((r) => r.id === 'censorate_outer');
    expect(room, 'censorate_outer missing').toBeDefined();
    expect(room?.requires?.flags).toContain('chapter3_truth_path');
    expect(room?.exits).toContain('tianji_safehouse');
  });

  it('censorate_outer items exist', () => {
    expect(allItemIds.has('case_reopened_receipt')).toBe(true);
  });

  it('censorate_outer has constitution growth action', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_censorate_ambush');
    expect(evt, 'evt_censorate_ambush missing').toBeDefined();
    const growthAction = evt?.actions.find((a) => a.grants?.constitution === 1);
    expect(growthAction, 'constitution growth action missing').toBeDefined();
  });
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter3Integrity.test.ts
```

期望：新增测试 FAIL

- [ ] **Step 3: 新增道具**

编辑 `src/data/items/chapter3.json`，末尾新增：

```json
,
  {
    "id": "case_reopened_receipt",
    "name": "重启案件凭证",
    "description": "廷尉府收案的凭证，证明天机旧案已进入官方重新调查程序。盖有廷尉主事的私印，不可伪造。",
    "isClue": true
  }
```

- [ ] **Step 4: 新增 NPC**

编辑 `src/data/npcs/chapter3.json`，末尾新增：

```json
,
  {
    "id": "npc_censorate_senior",
    "name": "廷尉主事",
    "description": "一个五十出头的官员，头发花白，神情老练，说话前总要停一停，好像在考量每一个字的分量。",
    "dialogues": [
      {
        "id": "senior_first_meet",
        "condition": null,
        "text": "「你带来了什么？」他没有寒暄，直接看向你手中。「这种地方，没有证据的人来了也没用。」"
      },
      {
        "id": "senior_official_channel",
        "condition": { "talent": "官威" },
        "text": "你将身份与证据一并呈上。廷尉主事沉默地翻看，没有表情，但你注意到他翻到追查令副本时，手微微停了一下。\n\n「这件事，」他合上卷宗，「我会亲自过问。你放心，此案绝不会再被压下。」\n\n他亲手写下收案凭证，盖上私印。",
        "grants": {
          "flags": ["case_officially_reopened"],
          "items": ["case_reopened_receipt"],
          "clues": ["case_reopened_receipt"]
        }
      },
      {
        "id": "senior_submit",
        "condition": { "flags_absent": ["case_officially_reopened"] },
        "text": "你通过中间人递交了材料。廷尉主事看完，沉吟片刻，发给你一张收案凭证。「材料已收，按程序走。」\n\n他没有承诺更多，但凭证上的印章是真的。案子进了官方程序，接下来会怎样，不在你的掌控之内了。",
        "grants": {
          "flags": ["case_officially_reopened"],
          "items": ["case_reopened_receipt"],
          "clues": ["case_reopened_receipt"]
        }
      }
    ]
  }
```

- [ ] **Step 5: 新增 events**

编辑 `src/data/events/chapter3.json`，末尾新增：

```json
,
  {
    "id": "evt_censorate_outer_approach",
    "title": "廷尉府外院",
    "description": "廷尉府外院，比第二章见过的外街更深入一些。守卫有序，气氛肃穆。你到这里是来提交证据的——这一步走出去，就再也退不回来了。",
    "actions": [
      {
        "id": "prepare_submission",
        "label": "整理手中证据，准备提交",
        "requires": { "has": ["tianji_founding_scroll"] },
        "result": "你将天机创立卷和手中所有相关证据整理好。这一份证据，足以让二十年前的旧案重见天日。提交之后，名单上的人不必再躲了——但你也会进入廷尉府的视野。",
        "grants": { "flags": ["ready_to_submit"] }
      }
    ]
  },
  {
    "id": "evt_censorate_ambush",
    "title": "廷尉府附近遭遇跟踪",
    "description": "离开廷尉府时，你察觉到有人跟在身后。脚步轻，跟得稳，是受过训练的人。",
    "actions": [
      {
        "id": "evade_tail",
        "label": "甩脱跟踪",
        "requires": { "constitution": 7 },
        "result": "你察觉到那双眼睛的瞬间，身体已经先于思维做出了反应。几个转角之后，身后没有了动静。你全身而退，没有留下任何破绽。",
        "grants": {
          "flags": ["tail_evaded"],
          "constitution": 1,
          "storyText": "〖你察觉到那双眼睛的瞬间，身体已经先于思维做出了反应。〗"
        }
      },
      {
        "id": "evade_agile",
        "label": "以敏捷身法甩脱",
        "requires": { "agility": 7 },
        "result": "你以灵活的步法在人流中穿行，那个跟踪者找不到你的踪迹，只能放弃。你全身而退。",
        "grants": {
          "flags": ["tail_evaded"],
          "constitution": 1,
          "storyText": "〖你察觉到那双眼睛的瞬间，身体已经先于思维做出了反应。〗"
        }
      },
      {
        "id": "detour",
        "label": "迂回绕路，耗掉对方",
        "requires": null,
        "result": "你在长安城里走了一个大圈，对方虽然没有放弃，但最终失去了耐心。你全身而退，但付出了时间代价——有些事，可能因此比预期晚了一步。",
        "grants": { "flags": ["tail_noticed", "tail_evaded_slow"] }
      }
    ]
  }
```

- [ ] **Step 6: 新增房间并更新 tianji_safehouse 出口**

编辑 `src/data/maps/chapter3.json`，在 `rooms` 数组末尾新增：

```json
,
    {
      "id": "censorate_outer",
      "name": "廷尉府外院",
      "description": "廷尉府的外院，比外街更深入，更安静，空气里有一种肃穆的压迫感。这里每天走进来的人，都带着某种必须解决的问题。你今天来的理由，比大多数人的都更沉重。",
      "interactables": ["evt_censorate_outer_approach", "evt_censorate_ambush"],
      "exits": ["tianji_safehouse"],
      "requires": { "flags": ["chapter3_truth_path"] },
      "talentViews": [
        {
          "talent": "官威",
          "text": "〔公务直觉：廷尉主事是个老狐狸，但不是坏人。他知道有些事被压了多年，只是一直在等一个足够有分量的人来推它一把。今天，那个人是你。〕"
        }
      ],
      "revisitEvents": [
        {
          "id": "rev_censorate_outer_after",
          "requires": {
            "flags": ["case_officially_reopened"],
            "flags_absent": ["rev_censorate_outer_after_shown"]
          },
          "text": "〔再来廷尉府外院，守卫的眼神变了——他们认出你了。案子进了官方程序，这意味着你在某些人的名单上，也会变得更显眼。〕",
          "grants": { "flags": ["rev_censorate_outer_after_shown"] }
        }
      ]
    }
```

在 `tianji_safehouse` 房间的 `exits` 中添加 `"censorate_outer"`。

- [ ] **Step 7: 运行测试确认通过**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter3Integrity.test.ts
```

期望：全部 PASS

- [ ] **Step 8: 提交**

```bash
cd /Users/xuli/claudeGame && git add src/data/maps/chapter3.json src/data/items/chapter3.json src/data/npcs/chapter3.json src/data/events/chapter3.json tests/data/chapter3Integrity.test.ts && git commit -m "feat: add ch3 censorate_outer room, senior official NPC, ambush event, constitution growth"
```

---

## Task 9：第三章 — 天机旧宅·复归

**Files:**
- Modify: `src/data/maps/chapter3.json`
- Modify: `src/data/items/chapter3.json`
- Modify: `src/data/events/chapter3.json`
- Modify: `tests/data/chapter3Integrity.test.ts`

- [ ] **Step 1: 写失败测试**

在 `tests/data/chapter3Integrity.test.ts` 末尾新增：

```typescript
  it('tianji_ruins_ch3 room exists behind identity_confirmed flag', () => {
    const ch3Map = MAPS.find((m) => m.id === 'chapter3');
    const room = ch3Map?.rooms.find((r) => r.id === 'tianji_ruins_ch3');
    expect(room, 'tianji_ruins_ch3 missing').toBeDefined();
    expect(room?.requires?.flags).toContain('fei_ye_identity_confirmed');
    expect(room?.exits).toContain('feiyes_manor');
  });

  it('tianji_ruins_ch3 items exist', () => {
    const ids = ['fei_ye_letter_ch3', 'old_mansion_revisit_clue'];
    for (const id of ids) {
      expect(allItemIds.has(id), `missing item: ${id}`).toBe(true);
    }
  });

  it('feiyes_manor exits include tianji_ruins_ch3', () => {
    const ch3Map = MAPS.find((m) => m.id === 'chapter3');
    const room = ch3Map?.rooms.find((r) => r.id === 'feiyes_manor');
    expect(room?.exits).toContain('tianji_ruins_ch3');
  });

  it('tianji_ruins_ch3 has wisdom growth event', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_fei_ye_letter_found');
    expect(evt, 'evt_fei_ye_letter_found missing').toBeDefined();
    const growthAction = evt?.actions.find((a) => a.grants?.wisdom === 1);
    expect(growthAction, 'wisdom growth action missing in ruins').toBeDefined();
  });
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter3Integrity.test.ts
```

期望：新增测试 FAIL

- [ ] **Step 3: 新增道具**

编辑 `src/data/items/chapter3.json`，末尾新增：

```json
,
  {
    "id": "fei_ye_letter_ch3",
    "name": "飞爷未寄出的信（旧）",
    "description": "收信人处只写了「韩朔」两字。正文只有一句：「若你看到此信，说明我已不在，名单交予来人。」与韩朔后来写给自己的那封信相比，这封更早——飞爷从很久以前就知道，有一天他会不在了。",
    "isClue": true
  },
  {
    "id": "old_mansion_revisit_clue",
    "name": "旧宅残留气机",
    "description": "以道家望气之法感知旧宅留存的气场：二十年前，这里曾发生一次极度紧张的聚集——不是危险，是一群人在做一个重要的决定。那个决定的气机，至今还残存在砖缝之间。",
    "isClue": true
  }
```

- [ ] **Step 4: 新增 events**

编辑 `src/data/events/chapter3.json`，末尾新增：

```json
,
  {
    "id": "evt_fei_ye_letter_found",
    "title": "书桌底部的信",
    "description": "旧宅书桌的最底层抽屉，有一个被压在最底下的纸封。封口的蜡已经干裂，但信纸保存完好。收信人的名字，是「韩朔」——无迹和尚从前的名字。",
    "actions": [
      {
        "id": "read_letter",
        "label": "取出阅读",
        "requires": null,
        "result": "「若你看到此信，说明我已不在，名单交予来人。」只有这一句话。你站在旧宅的寂静中，忽然明白了飞爷为什么二十年来从不解释任何事——他从一开始就知道，解释的机会不一定会来。他只是把事情安排好，然后等待。\n\n二十年。他一直在等一个足够聪明的人，走到这里来。",
        "grants": {
          "flags": ["fei_ye_letter_ch3_found"],
          "items": ["fei_ye_letter_ch3"],
          "clues": ["fei_ye_letter_ch3"],
          "wisdom": 1,
          "storyText": "〖二十年。他一直在等一个足够聪明的人，走到这里来。〗"
        }
      },
      {
        "id": "qi_read_ruins",
        "label": "以望气之法感知旧宅气场（道士）",
        "requires": { "talent": "望气观相" },
        "result": "你以望气之法静立，感知旧宅留存的气机。砖缝之间，有一种二十年前聚集的决定之气——不是危险，是一群人在这里做了某件事，带着沉重与坚定。他们知道自己在做什么，也知道可能的代价。",
        "grants": {
          "items": ["old_mansion_revisit_clue"],
          "clues": ["old_mansion_revisit_clue"],
          "flags": ["ruins_qi_read"]
        }
      }
    ]
  },
  {
    "id": "evt_ruins_atmosphere",
    "title": "废弃宅院·故地",
    "description": "你上一次来这里，还不知道「鸢」是谁，不知道天机阁的全貌，不知道飞爷的名字。如今再看这幅景象——荒草、朱漆大门、那块匾额——一切都带上了不同的分量。",
    "actions": [
      {
        "id": "stand_quietly",
        "label": "在此默立片刻",
        "requires": null,
        "result": "你站在院子中间，什么也不做。有些时候，安静本身就是最好的回答。",
        "grants": { "flags": ["ruins_stood_quietly"] }
      }
    ]
  }
```

- [ ] **Step 5: 新增房间**

编辑 `src/data/maps/chapter3.json`，在 `rooms` 数组末尾新增：

```json
,
    {
      "id": "tianji_ruins_ch3",
      "name": "天机旧宅·故地",
      "description": "你第一次来这里时，这里是一条线索的终点。如今再来，带着三章以来所有的答案，这里变成了另一种东西——一个人的心愿的落脚处。荒草依然，青砖依然，「天机阁」三字依然在尘埃下若隐若现。",
      "interactables": ["evt_fei_ye_letter_found", "evt_ruins_atmosphere"],
      "exits": ["feiyes_manor"],
      "requires": { "flags": ["fei_ye_identity_confirmed"] },
      "talentViews": [
        {
          "talent": "望气观相",
          "text": "〔望气感知：旧宅的气场与二十年前有人在此做重大决定时留下的印记高度吻合。这里不只是一座废弃的建筑，它是一个承诺的物质外壳。那个承诺，至今未散。〕"
        },
        {
          "talent": "耳报神",
          "text": "〔往昔回响：这种地方，说书人最懂——每一块砖都记着事，只要你懂得听。你在这里感到一种奇特的安静，像是所有该说的话，都已经说完了。〕"
        }
      ],
      "revisitEvents": [
        {
          "id": "rev_ruins_after_ending",
          "requires": {
            "flags": ["fei_ye_letter_ch3_found", "fei_ye_upper_truth_known"],
            "flags_absent": ["rev_ruins_full_circle_shown"]
          },
          "text": "〔带着飞爷信件和他最后的秘密，再次站在这里，你感到某种完整——不是答案都有了，而是该知道的事你已经知道了，该做的事你正在做。那种感觉，叫做「够了」。〕",
          "grants": { "flags": ["rev_ruins_full_circle_shown"] }
        }
      ]
    }
```

（feiyes_manor 的出口在 Task 7 中已更新，包含了 `tianji_ruins_ch3`）

- [ ] **Step 6: 运行测试确认通过**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter3Integrity.test.ts
```

期望：全部 PASS

- [ ] **Step 7: 运行全量测试**

```bash
cd /Users/xuli/claudeGame && npx vitest run
```

期望：全部 PASS

- [ ] **Step 8: 提交**

```bash
cd /Users/xuli/claudeGame && git add src/data/maps/chapter3.json src/data/items/chapter3.json src/data/events/chapter3.json tests/data/chapter3Integrity.test.ts && git commit -m "feat: add ch3 tianji_ruins_ch3 emotional return room, Fei Ye letter, wisdom growth"
```

---

## Task 10：可达性测试 + 最终验证

**Files:**
- Create: `tests/data/endingReachability.test.ts`
- Modify: `tests/data/chapter2Integrity.test.ts`（最终房间数量断言）
- Modify: `tests/data/chapter3Integrity.test.ts`（最终房间数量断言）

- [ ] **Step 1: 写可达性测试**

新建 `tests/data/endingReachability.test.ts`：

```typescript
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
```

- [ ] **Step 2: 运行可达性测试**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/endingReachability.test.ts
```

期望：全部 PASS（若有失败，需追踪对应出口或 flag 授予问题并修复）

- [ ] **Step 3: 更新房间数量断言**

`tests/data/chapter2Integrity.test.ts`：将 `expect(ch2Map?.rooms.length).toBe(9)` 确认正确（已在 Task 3 中更新）

`tests/data/chapter3Integrity.test.ts`：找到房间数量断言，将其更新为 7：

```typescript
  it('chapter3 map exists with 7 rooms', () => {
    expect(ch3Map?.rooms.length).toBe(7);
  });
```

- [ ] **Step 4: 运行全量测试**

```bash
cd /Users/xuli/claudeGame && npx vitest run
```

期望：全部 PASS

- [ ] **Step 5: 构建验证**

```bash
cd /Users/xuli/claudeGame && npm run build
```

期望：Build successful，无错误

- [ ] **Step 6: 提交**

```bash
cd /Users/xuli/claudeGame && git add tests/data/endingReachability.test.ts tests/data/chapter2Integrity.test.ts tests/data/chapter3Integrity.test.ts && git commit -m "test: add ending reachability tests, update room count assertions for expanded chapters"
```
