# 第一章扩展内容实施计划（城郊后巷 + 浪鹏帮暗线）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有第一章基础上新增「城郊后巷」地点、两条独立支线，引入浪鹏帮作为隐藏背景势力，所有变更仅涉及 JSON 数据文件，不改动任何引擎或 UI 代码。

**Architecture:** 纯数据驱动——新增 room/events/npcs/items 条目到现有 JSON 文件，旗标系统管理解锁逻辑。`getAvailableDialogues` 返回所有条件匹配的对话并取 `[0]`，因此对话数组的顺序决定优先级（更具体的条件放在前面）。

**Tech Stack:** JSON（无模式验证，靠测试保证完整性），Vitest 2.x，Node.js（用于手动验证脚本）

---

## 文件结构

| 操作 | 文件 |
|------|------|
| 修改 | `src/data/maps/chapter1.json` — 新增 back_alley 房间，更新 forest 出口 |
| 修改 | `src/data/events/chapter1.json` — 新增 evt_alley_marks、evt_cargo_remnants |
| 修改 | `src/data/npcs/chapter1.json` — 新增 npc_old_beggar、npc_merchant_zhou；向 npc_fei_ye、npc_innkeeper_li_fu、npc_white_stranger 追加对话 |
| 修改 | `src/data/items/chapter1.json` — 新增 4 个道具 |
| 新增 | `tests/data/chapter1Integrity.test.ts` — 数据完整性测试 |

---

## 关键知识（实施者必读）

**对话优先级规则**：`storyEngine.getAvailableDialogues` 过滤所有满足条件的对话，`Game.tsx` 取 `dialogues[0]`。因此数组顺序决定哪条对话被展示——更具体的条件（含更多 flags/has 检查）必须在数组中靠前。

**事件 actions 展示规则**：`eventEngine.getActionResults` 返回全部 actions 并标注 `available: true/false`。不可用的 actions 会在 UI 以置灰方式显示并附提示。`flags_absent` 可用于「已完成则隐藏」的模式。

**ActionGrant 说明**：NPC 对话的 grants 支持 `flags / clues / items / quests`，**不支持** `remove_items`（Game.tsx 中 NPC 分支未实现该逻辑）。因此老乞丐索要好酒只做 `has` 条件检查，不消耗酒。

**JSON 字符串规则**：结果文本中的换行用 `\n` 表示。中文引号「」无需转义。

---

### Task 1: 数据完整性测试（TDD 先行）

**Files:**
- Create: `tests/data/chapter1Integrity.test.ts`

- [ ] **Step 1: 写测试文件**

```typescript
// tests/data/chapter1Integrity.test.ts
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
```

- [ ] **Step 2: 运行测试，确认全部失败**

```bash
npx vitest run tests/data/chapter1Integrity.test.ts
```

期望输出：所有测试 FAIL（因为新内容尚未添加）

- [ ] **Step 3: 提交测试文件**

```bash
git add tests/data/chapter1Integrity.test.ts
git commit -m "test: add chapter1 data integrity tests for back_alley extension"
```

---

### Task 2: 新增 4 个道具

**Files:**
- Modify: `src/data/items/chapter1.json`

- [ ] **Step 1: 在 items 数组末尾追加 4 个新道具**

在 `src/data/items/chapter1.json` 数组最后一个元素之后追加（保持合法 JSON）：

```json
{
  "id": "alley_rubbing",
  "name": "巷中拓印",
  "description": "用薄纸拓下后巷墙角刻记得到的印迹。纹路繁复，三横一竖，中间是个变形的鸟形轮廓，像某种帮派暗号。",
  "isClue": true
},
{
  "id": "dafei_inner_token",
  "name": "大飞帮内部令牌",
  "description": "飞爷亲手交给你的铜质腰牌，背面刻着「飞」字暗记。持此令牌，可在大飞帮势力范围内通行无阻——至少飞爷是这么说的。",
  "isClue": false
},
{
  "id": "extortion_note",
  "name": "勒索纸条",
  "description": "一张折叠的粗纸，上书「名单交出来，货还你」，字迹粗犷，力透纸背，右下角印着一枚浪形印章。",
  "isClue": true
},
{
  "id": "merchant_manifest",
  "name": "药商货单",
  "description": "周药商的货物清单，正面是寻常药材名录，背面墨迹隐约——细看之下，是一份人名抄录，其中两个名字与天机阁人员名录重合。",
  "isClue": true
}
```

- [ ] **Step 2: 验证 JSON 合法**

```bash
node -e "require('./src/data/items/chapter1.json'); console.log('JSON valid, items:', require('./src/data/items/chapter1.json').length)"
```

期望输出：`JSON valid, items: 21`

- [ ] **Step 3: 运行相关测试**

```bash
npx vitest run tests/data/chapter1Integrity.test.ts --reporter=verbose 2>&1 | grep -E "✓|✗|PASS|FAIL|new items"
```

期望：`new items exist` 测试通过，其余仍失败

- [ ] **Step 4: 提交**

```bash
git add src/data/items/chapter1.json
git commit -m "content: add 4 new items for back_alley side quests"
```

---

### Task 3: 新增 2 个事件

**Files:**
- Modify: `src/data/events/chapter1.json`

在现有 events 数组末尾追加以下两个事件对象。

- [ ] **Step 1: 追加 evt_alley_marks**

```json
{
  "id": "evt_alley_marks",
  "title": "查看墙上刻记",
  "description": "青砖墙的转角处，有一组浅浅的刻痕，像是被人刻意做下的记号。寻常人走过，多半视而不见。",
  "requires": null,
  "actions": [
    {
      "id": "examine_marks_wise",
      "label": "仔细辨认刻记（需智慧≥6）",
      "requires": {
        "wisdom": 6,
        "flags_absent": ["alley_marks_found"]
      },
      "result": "你蹲下细看：三横一竖，中间是个变形的鸟形轮廓。帮派暗记——你在江湖上见过类似的标记方式，这不是大飞帮的风格，出自另一股势力之手。你用随身的薄纸将印迹仔细拓了下来。",
      "grants": {
        "flags": ["alley_marks_found", "langpeng_discovered"],
        "items": ["alley_rubbing"]
      }
    },
    {
      "id": "examine_marks_basic",
      "label": "查看墙上刻记",
      "requires": {
        "flags_absent": ["alley_marks_found"]
      },
      "result": "墙上有一组奇怪的刻痕，像是某种记号。你看不出来历，但样式陌生，不像是寻常记路用的，倒像是刻意留给懂行人看的。你用薄纸把它拓了下来，或许找人能看出名堂。",
      "grants": {
        "flags": ["alley_marks_found"],
        "items": ["alley_rubbing"]
      }
    },
    {
      "id": "marks_done",
      "label": "再看一眼刻记",
      "requires": {
        "flags": ["alley_marks_found"]
      },
      "result": "那几道刻痕依旧刻在墙上，拓印已经在你手里了，再多看也看不出新东西。",
      "grants": null
    }
  ]
}
```

- [ ] **Step 2: 追加 evt_cargo_remnants**

```json
{
  "id": "evt_cargo_remnants",
  "title": "检查残余货物",
  "description": "周药商货箱的残骸散落在巷角，盖板被撬开，里头的药材翻乱不堪。夹层似乎还有些东西没被劫走。",
  "requires": {
    "flags": ["merchant_zhou_talked"]
  },
  "actions": [
    {
      "id": "search_wise",
      "label": "仔细搜查货箱夹层（需智慧≥7）",
      "requires": {
        "wisdom": 7,
        "flags": ["merchant_zhou_talked"],
        "flags_absent": ["manifest_found"]
      },
      "result": "你系统地检查每一层隔板，在最底层的暗格里找到一张叠起的货单。翻到背面——墨迹未干，是一份人名抄录，字体潦草却清晰可辨。其中两个名字，你在天机阁人员名录上见过。浪鹏帮在追同一批人。",
      "grants": {
        "flags": ["manifest_found", "manifest_decoded"],
        "items": ["merchant_manifest"]
      }
    },
    {
      "id": "search_basic",
      "label": "翻找货箱残余",
      "requires": {
        "flags": ["merchant_zhou_talked"],
        "flags_absent": ["manifest_found"]
      },
      "result": "货箱里大多被翻空了，你在最底层的暗格里摸到一张折叠的货单。正面是药材名录，看起来普普通通——但纸张略厚，似乎背面还藏着什么，一时又看不分明。",
      "grants": {
        "flags": ["manifest_found"],
        "items": ["merchant_manifest"]
      }
    },
    {
      "id": "manifest_obtained",
      "label": "货单已取得",
      "requires": {
        "flags": ["manifest_found"]
      },
      "result": "货箱已经搜查过了，货单已在你手中。",
      "grants": null
    }
  ]
}
```

- [ ] **Step 3: 验证 JSON 合法**

```bash
node -e "const e = require('./src/data/events/chapter1.json'); console.log('JSON valid, events:', e.length)"
```

期望输出：`JSON valid, events: 16`

- [ ] **Step 4: 运行相关测试**

```bash
npx vitest run tests/data/chapter1Integrity.test.ts --reporter=verbose 2>&1 | grep -E "evt_alley_marks|evt_cargo_remnants|alley_rubbing grants|manifest_decoded"
```

期望：`alley_rubbing grants set langpeng_discovered` 和 `evt_cargo_remnants wise path sets manifest_decoded` 两项通过

- [ ] **Step 5: 提交**

```bash
git add src/data/events/chapter1.json
git commit -m "content: add evt_alley_marks and evt_cargo_remnants events"
```

---

### Task 4: 新增 2 个 NPC

**Files:**
- Modify: `src/data/npcs/chapter1.json`

在现有 npcs 数组末尾追加两个 NPC。**对话数组的顺序决定优先级——最具体的条件（更多 flags/has 检查）排在前面。**

- [ ] **Step 1: 追加 npc_old_beggar**

```json
{
  "id": "npc_old_beggar",
  "name": "后巷老乞丐",
  "description": "蜷缩在巷角的老人，衣衫褴褛，却一双眼睛格外清明。看你进巷，眼皮微微一抬，又垂了下去。",
  "dialogues": [
    {
      "id": "tell_story",
      "condition": {
        "flags": ["beggar_first_talked"],
        "has": ["tavern_wine"],
        "flags_absent": ["beggar_told_langpeng"]
      },
      "text": "你将那碗酒递过去，老人接过，慢慢喝了一口，叹了声气。\n\n「昨夜二更，有个蓝衫汉子在这里蹲了半个时辰，腰上挂着串铜铃，走路有声。他拓了那面墙上的记号，又对着客栈方向看了好久，才走。」\n\n他顿了顿：「这城里的人叫他们浪鹏帮。不是什么好人，但也不乱杀人——只要你别挡着他们的道。」",
      "grants": {
        "flags": ["beggar_told_langpeng", "langpeng_discovered"]
      }
    },
    {
      "id": "after_told",
      "condition": {
        "flags": ["beggar_told_langpeng"]
      },
      "text": "「那蓝衫人，我再没见过。」老人眯眼靠在墙上，「浪鹏帮的人来去无踪，你若是招惹了他们，趁早离开这城。」"
    },
    {
      "id": "beg_for_wine",
      "condition": {
        "flags": ["beggar_first_talked"],
        "flags_absent": ["beggar_told_langpeng"]
      },
      "text": "「那墙上的记号么……」老人舔了舔干裂的嘴唇，「老头儿口渴了，喝碗酒，什么都好说。」"
    },
    {
      "id": "first_meet",
      "condition": {
        "flags_absent": ["beggar_first_talked"]
      },
      "text": "老人抬起浑浊的眼睛打量你，目光在你手上的拓印上停了一下，又移开了。\n\n「年轻人，在这条巷子里打听事，不是好习惯。」他顿了顿，「不过老头儿知道些东西——看你面善，或许可以说说。」",
      "grants": {
        "flags": ["beggar_first_talked"]
      }
    }
  ]
}
```

- [ ] **Step 2: 追加 npc_merchant_zhou**

```json
{
  "id": "npc_merchant_zhou",
  "name": "周药商",
  "description": "五十出头的中年人，穿着素色长袍，此刻神色惶惶，在翻倒的货箱旁来回踱步，不时往巷口张望。",
  "dialogues": [
    {
      "id": "mention_langpeng",
      "condition": {
        "flags": ["merchant_zhou_first_met", "alley_marks_found"],
        "flags_absent": ["merchant_zhou_talked"]
      },
      "text": "你提到墙上的刻记，周药商身子一僵，转过头低声道：\n\n「你认得那个记号？那是浪鹏帮的暗记。」他从怀里摸出一张折皱的纸条，「劫我货的人走时留下这个，说什么『名单交出来，货还你』。什么名单，我哪里知道！」\n\n他将纸条塞进你手里：「你若能帮我查清此事，这纸条你拿着，算是谢礼。」",
      "grants": {
        "flags": ["merchant_zhou_talked"],
        "items": ["extortion_note"]
      }
    },
    {
      "id": "after_talked",
      "condition": {
        "flags": ["merchant_zhou_talked"]
      },
      "text": "「货单的事，我已经告诉你了。」周药商疲惫地靠在墙上，「那些货物，怕是要不回来了。只求别再惹上麻烦。」"
    },
    {
      "id": "waiting",
      "condition": {
        "flags": ["merchant_zhou_first_met"],
        "flags_absent": ["merchant_zhou_talked"]
      },
      "text": "周药商抬眼看你，神色焦虑：「你打听出什么了吗？是谁劫了我的货？」"
    },
    {
      "id": "first_meet",
      "condition": {
        "flags_absent": ["merchant_zhou_first_met"]
      },
      "text": "中年男人发现你打量他，苦笑一声：「客官有所不知，昨夜我的货车在此处被劫，整整三车药材，损失惨重啊。」\n\n他环顾四周，压低声音：「劫货的人……不是寻常毛贼，来去无声，专挑夜里动手。」",
      "grants": {
        "flags": ["merchant_zhou_first_met"]
      }
    }
  ]
}
```

- [ ] **Step 3: 验证 JSON 合法**

```bash
node -e "const n = require('./src/data/npcs/chapter1.json'); console.log('JSON valid, npcs:', n.length)"
```

期望输出：`JSON valid, npcs: 8`

- [ ] **Step 4: 运行相关测试**

```bash
npx vitest run tests/data/chapter1Integrity.test.ts --reporter=verbose 2>&1 | grep -E "new npcs|✓|✗"
```

期望：`new npcs exist with required dialogues` 通过

- [ ] **Step 5: 提交**

```bash
git add src/data/npcs/chapter1.json
git commit -m "content: add npc_old_beggar and npc_merchant_zhou"
```

---

### Task 5: 向现有 NPC 追加对话分支

**Files:**
- Modify: `src/data/npcs/chapter1.json`

修改三个现有 NPC 的 `dialogues` 数组，在指定位置插入新对话。**对话插入位置至关重要——必须精确按照下方说明操作。**

- [ ] **Step 1: 向 npc_fei_ye 插入 alley_intel 对话**

在 `npc_fei_ye` 的 dialogues 数组中，将新对话插入 `first_appear` 之后、`gang_intel` 之前。

最终 fei_ye dialogues 顺序：`[first_appear, alley_intel, gang_intel, after_mission]`

新增对话对象：

```json
{
  "id": "alley_intel",
  "condition": {
    "flags": ["dafei_joined", "langpeng_discovered"],
    "has": ["alley_rubbing"],
    "flags_absent": ["fei_ye_trust_deepened"]
  },
  "text": "你将拓印递给飞爷，他接过细看，眼神瞬间沉了下去。\n\n「浪鹏帮的人……他们追到这里来了。」他将拓印还给你，声音压低了几分，「三年前我们截了他们一条漕运线，从那以后没消停过。你明白这意味着什么——他们不只是来找我，他们也在追那份名单。」\n\n他从腰间解下一块铜质腰牌递来：「拿着。这东西以后用得上。」",
  "grants": {
    "flags": ["fei_ye_trust_deepened"],
    "items": ["dafei_inner_token"]
  }
}
```

- [ ] **Step 2: 向 npc_innkeeper_li_fu 插入 manifest_inquiry 对话**

在 `npc_innkeeper_li_fu` 的 dialogues 数组中，将新对话插入 `hidden_tianji` 之后、`after_trusted` 之前。

最终 innkeeper dialogues 顺序：`[first_meeting, trust_low, hidden_tianji, manifest_inquiry, after_trusted, normal_chat]`

新增对话对象：

```json
{
  "id": "manifest_inquiry",
  "condition": {
    "flags": ["innkeeper_met"],
    "has": ["merchant_manifest"],
    "flags_absent": ["merchant_clue_confirmed"]
  },
  "text": "你将货单递给李福，他接过来，只扫了一眼背面的字迹，手微微一顿。\n\n「这些名字……」他将货单还给你，语气恢复平静，「客官，这些名字你最好忘掉。这客栈里发生的事已经够复杂了，不必再往深处探。」\n\n他没有多说。但那一瞬间的停顿，说明了一切。",
  "grants": {
    "flags": ["merchant_clue_confirmed", "langpeng_active"]
  }
}
```

- [ ] **Step 3: 向 npc_white_stranger 插入 2 条对话**

在 `npc_white_stranger` 的 dialogues 数组中，将两条新对话插入 `trust_test_justice` 之后、`wuxue_gift` 之前。

最终 white_stranger dialogues 顺序：`[first_encounter, trust_test_justice, manifest_inquiry, langpeng_boss_hint, wuxue_gift, after_trust]`

两条新增对话对象（按顺序）：

```json
{
  "id": "manifest_inquiry",
  "condition": {
    "has": ["merchant_manifest"],
    "flags_absent": ["merchant_clue_confirmed"]
  },
  "text": "白衣人接过货单，在背面人名上停留片刻，轻声开口：\n\n「浪鹏帮和大飞帮，都在追同一样东西。而那样东西，就在这客栈里待过。」\n\n他将货单还给你，目光深沉，「你现在夹在两帮之间。选边站，是最愚蠢的做法。」",
  "grants": {
    "flags": ["merchant_clue_confirmed", "langpeng_active"]
  }
},
{
  "id": "langpeng_boss_hint",
  "condition": {
    "flags": ["merchant_clue_confirmed", "white_stranger_trust"],
    "flags_absent": ["langpeng_boss_hinted"]
  },
  "text": "「浪鹏帮的帮主，江湖上人称『浪王』，从不露面，只派手下行事。」白衣人停顿了一下，「连我，也从未见过他的真面目。」",
  "grants": {
    "flags": ["langpeng_boss_hinted"]
  }
}
```

- [ ] **Step 4: 验证 JSON 合法并检查对话顺序**

```bash
node -e "
const npcs = require('./src/data/npcs/chapter1.json');
const fei = npcs.find(n => n.id === 'npc_fei_ye');
const li = npcs.find(n => n.id === 'npc_innkeeper_li_fu');
const ws = npcs.find(n => n.id === 'npc_white_stranger');
console.log('fei_ye order:', fei.dialogues.map(d => d.id).join(', '));
console.log('innkeeper order:', li.dialogues.map(d => d.id).join(', '));
console.log('white_stranger order:', ws.dialogues.map(d => d.id).join(', '));
"
```

期望输出：
```
fei_ye order: first_appear, alley_intel, gang_intel, after_mission
innkeeper order: first_meeting, trust_low, hidden_tianji, manifest_inquiry, after_trusted, normal_chat
white_stranger order: first_encounter, trust_test_justice, manifest_inquiry, langpeng_boss_hint, wuxue_gift, after_trust
```

- [ ] **Step 5: 运行相关测试**

```bash
npx vitest run tests/data/chapter1Integrity.test.ts --reporter=verbose 2>&1 | grep -E "fei_ye|innkeeper|white_stranger|✓|✗"
```

期望：`fei_ye has alley_intel`、`innkeeper has manifest_inquiry`、`white_stranger has manifest_inquiry and langpeng_boss_hint` 全部通过

- [ ] **Step 6: 提交**

```bash
git add src/data/npcs/chapter1.json
git commit -m "content: add alley_intel, manifest_inquiry, langpeng_boss_hint dialogue branches to existing NPCs"
```

---

### Task 6: 新增 back_alley 房间，更新 forest 出口

**Files:**
- Modify: `src/data/maps/chapter1.json`

- [ ] **Step 1: 在 forest 房间的 exits 数组中追加 "back_alley"**

找到 `"id": "forest"` 的房间，将其 exits 从：
```json
"exits": ["lobby"]
```
改为：
```json
"exits": ["lobby", "back_alley"]
```

- [ ] **Step 2: 在 rooms 数组末尾追加 back_alley 房间**

```json
{
  "id": "back_alley",
  "name": "城郊后巷",
  "description": "客栈背后延伸出去的一条窄巷，青砖墙壁上留着各色痕迹。白日里少有人走动，只有偶尔路过的乞丐和来往的货商。转角处，一段墙壁上的刻痕引人注目。",
  "interactables": ["npc_old_beggar", "npc_merchant_zhou", "evt_alley_marks", "evt_cargo_remnants"],
  "exits": ["forest"],
  "requires": { "flags": ["found_escape_clue"] }
}
```

- [ ] **Step 3: 验证 JSON 合法**

```bash
node -e "
const maps = require('./src/data/maps/chapter1.json');
const rooms = maps[0].rooms;
console.log('total rooms:', rooms.length);
console.log('forest exits:', rooms.find(r => r.id === 'forest').exits);
console.log('back_alley exits:', rooms.find(r => r.id === 'back_alley').exits);
"
```

期望输出：
```
total rooms: 7
forest exits: [ 'lobby', 'back_alley' ]
back_alley exits: [ 'forest' ]
```

- [ ] **Step 4: 运行全部测试，确认全部通过**

```bash
npx vitest run
```

期望输出：
```
Test Files  5 passed (5)
     Tests  XX passed (XX)
```

所有测试应全部通过（包含之前的 38 条 + 新增的数据完整性测试）。

- [ ] **Step 5: 提交**

```bash
git add src/data/maps/chapter1.json
git commit -m "content: add back_alley room, update forest exits — chapter1 extended content complete"
```

---

## 自检：规格覆盖验证

| 设计要求 | 实现任务 |
|---------|---------|
| 新地点 back_alley，从 forest 解锁 | Task 6 |
| evt_alley_marks，智慧≥6 路线设置 langpeng_discovered | Task 3 |
| evt_cargo_remnants，智慧≥7 路线设置 manifest_decoded | Task 3 |
| npc_old_beggar，需要好酒才说话 | Task 4 |
| npc_merchant_zhou，需要 alley_marks_found 才开口 | Task 4 |
| fei_ye 新对话，需持 alley_rubbing + dafei_joined | Task 5 |
| 掌柜李福 manifest_inquiry，设置 langpeng_active | Task 5 |
| 白衣人 manifest_inquiry + langpeng_boss_hint | Task 5 |
| 4 个新道具 | Task 2 |
| 数据完整性测试 | Task 1 |
| 双线完成旗标（langpeng_discovered + langpeng_active）语义完整 | Task 3、5 覆盖 |
