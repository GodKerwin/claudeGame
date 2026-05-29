# 第一章内容扩充实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 大幅扩充第一章游玩内容：新增 room_202 案发现场、NPC 分支对话选项系统、完整结局收尾叙事，使游玩时长翻倍。

**Architecture:** 纯 JSON 数据驱动 + Game.tsx 新增 `pendingChoices` 状态机处理分支对话。引擎代码不变，conditionEvaluator 用于过滤可用选项。

**Tech Stack:** React 18, TypeScript, Zustand, JSON data files, Vitest 2.x

---

## 文件结构

| 操作 | 文件 |
|------|------|
| 修改 | `src/data/maps/chapter1.json` — 新增 room_202，更新 room_203 出口 |
| 修改 | `src/data/events/chapter1.json` — 新增 3 个事件 + 扩充 2 个存根事件 + 扩充 3 个结局文本 |
| 修改 | `src/data/npcs/chapter1.json` — 为 5 个 NPC 新增含 choices 的对话条目 |
| 修改 | `src/data/items/chapter1.json` — 新增 5 个道具 |
| 修改 | `src/pages/Game/Game.tsx` — 新增 pendingChoices 状态机，处理分支对话 |
| 修改 | `src/components/layout/CenterPanel.tsx` — 分支选项时显示"请选择回应"提示 |
| 修改 | `tests/data/chapter1Integrity.test.ts` — 新增数据完整性测试 |

---

## 关键知识

**分支对话数据结构**（已在 `src/types/game.ts` 定义，但 Game.tsx 未实现）：
```typescript
interface DialogueChoice {
  id: string;
  label: string;        // 显示为玩家动作按钮的文字
  condition?: Condition; // 可选：属性/旗标条件
  response: string;     // NPC 回应文本
  grants?: ActionGrant; // 可选奖励
}
// DialogueLine 已有 choices?: DialogueChoice[]
```

**pendingChoices 状态机逻辑**：
- 玩家点击 NPC → 显示对话文本 → 若该对话有 choices → 设置 pendingChoices
- buildActions() 检查 pendingChoices：若存在，**只显示**选项按钮（不显示房间其他动作）
- 玩家点击选项（id 格式 `choice:{choiceId}`）→ 显示 NPC 回应 → 应用 grants → 清除 pendingChoices
- 若对话无 choices，对话结束，流程不变

**storyEngine 过滤规则**：`getAvailableDialogues` 返回所有满足 condition 的对话，Game.tsx 取 `[0]`。choices 内每条也需用 evaluate 过滤（condition 可选）。

**room_202 定位**：凶案现场，与 room_203 相邻，无解锁条件（门本就半开）。已有 room_203 的 evt_body_examine/evt_room_search 给出了基础线索（伤口、血信令牌、布料纤维、半截信件、脚印、窗户抓痕）。room_202 的事件给出**互补、深入**的线索，不重复。

**已有线索**（room_203）：勒痕+毒痕、血信令牌（东——三）、布料纤维、半截信件（残卷）、两种脚印、窗户抓痕。

**room_202 新增线索**：血迹分布（尸体被移动）、锁具撬痕（不是翻窗进来的）、账本隐码（宋怀义身份暗示）、藏匿玉佩（天机阁信物）、绳痕（逃脱方式）。

---

## Task 1: 新增 room_202 + 3 个新事件 + 5 个新道具

**Files:**
- Modify: `src/data/maps/chapter1.json`
- Modify: `src/data/events/chapter1.json`
- Modify: `src/data/items/chapter1.json`

- [ ] **Step 1: 在地图中新增 room_202，更新 room_203 出口**

在 `src/data/maps/chapter1.json` 的 rooms 数组中，在 `room_203` 之后插入：
```json
{
  "id": "room_202",
  "name": "二楼客房（二〇二号·凶案现场）",
  "description": "这就是宋怀义遇难的地方。房间陈设简单，一张架子床、一只木箱、一张小桌。床铺凌乱，枕侧有深褐色血迹已干涸发黑——奇怪的是，地板中央还有另一处新鲜的深色污迹，与床头位置相距三步。窗棂虚掩，寒风从缝隙钻入，带起床角的布帘。门边地板上有几道细微的划痕，像是重物被拖拽过的痕迹。",
  "interactables": ["evt_crime_scene_202", "evt_locked_room_mystery", "evt_victim_hidden_items"],
  "exits": ["room_203"],
  "requires": null
}
```

同时将 room_203 的 exits 由 `["lobby"]` 改为 `["lobby", "room_202"]`。

- [ ] **Step 2: 新增 5 个道具**

在 `src/data/items/chapter1.json` 末尾追加（保持数组合法）：
```json
{ "id": "blood_pattern_sketch", "name": "血迹分布手绘", "description": "你在案发现场发现两处血迹中心——一处在地板中央，一处在床头。这说明死者在被最终陈尸床上之前，曾倒在地板上，之后被人移动了位置。", "isClue": true },
{ "id": "door_lock_scraping", "name": "门锁撬痕拓印", "description": "门锁内侧有明显的细铁丝划痕，说明有人用细工具从门缝伸入，在门内拨动了门闩。凶手不是从窗户进来的——他有钥匙，或者知道怎么开这扇门。", "isClue": true },
{ "id": "account_book", "name": "宋怀义的账本", "description": "一本普通的商贾账本，记录着布匹、茶叶的进出价格。但最后三页的数字规律奇怪：每页末尾的数字连起来是一个地名——「东市·回春堂」。", "isClue": true },
{ "id": "tianji_jade_token", "name": "天机玉令", "description": "一枚指甲盖大小的玉牌，藏在账本夹层中。正面刻着「天机」二字，背面刻着一只展翅飞鸟，与血信令牌正面的图案如出一辙。这不是寻常商人会携带的东西。", "isClue": true },
{ "id": "rope_burn_cloth", "name": "窗台焦痕布条", "description": "窗台外侧的石壁上缠绕着一截残留的布条，布面有绳索摩擦留下的焦黑痕迹。凶手从二楼降下时，用了绳索——而非翻窗。这人不是从窗户进来的，却是从窗户出去的。", "isClue": true }
```

- [ ] **Step 3: 新增事件 evt_crime_scene_202**

在 `src/data/events/chapter1.json` 末尾追加：

```json
{
  "id": "evt_crime_scene_202",
  "title": "勘察案发现场",
  "description": "这间房间藏着比走廊所见更多的细节。",
  "requires": null,
  "actions": [
    {
      "id": "survey_overall",
      "label": "环顾整体现场",
      "requires": { "flags_absent": ["scene_202_surveyed"] },
      "result": "你在房间中缓缓踱步。地板中央和床头各有一团血迹，相距三步。死者不是在床上被害的——他先倒在地上，后来被人移到了床上。床头柜上摆着半杯已凉的茶，茶面有一层薄薄的油膜，像是有什么东西溶在里面。门缝处的地板上有一道细微划痕，和几粒细铁屑。",
      "grants": { "flags": ["scene_202_surveyed"], "items": ["blood_pattern_sketch"], "clues": ["blood_pattern_sketch"] }
    },
    {
      "id": "analyze_blood",
      "label": "推断死亡经过（需智慧≥6）",
      "requires": { "wisdom": 6, "flags": ["scene_202_surveyed"], "flags_absent": ["murder_sequence_deduced"] },
      "result": "你蹲下细观两处血迹的形状：地板处的血迹呈圆形扩散，说明宋怀义当时是仰躺的，且已失去挣扎能力——毒发后倒地。床头的血迹却是侧溅，说明他被移至床上后，凶手又补了一道致命伤。\n\n顺序清晰了：毒茶致昏→倒地→搜身取物→移尸上床→勒毙。凶手极有耐心，且熟悉下毒的时机。",
      "grants": { "flags": ["murder_sequence_deduced"] }
    },
    {
      "id": "check_tea",
      "label": "检查床头茶杯",
      "requires": { "flags": ["scene_202_surveyed"], "flags_absent": ["tea_checked"] },
      "result": "你凑近茶杯细嗅，有一股极淡的苦味混在茶香中。与后厨发现的砒霜相对应——毒并非从外部施加，而是被人提前溶在了茶里。宋怀义喝下毒茶，以为只是睡意袭来，却再也没有醒来。\n\n凶手提前进入了这个房间。",
      "grants": { "flags": ["tea_checked", "poison_tea_confirmed"] }
    }
  ]
},
{
  "id": "evt_locked_room_mystery",
  "title": "调查门锁与出入口",
  "description": "门锁完好，窗户半开——这间房究竟如何被人进出？",
  "requires": null,
  "actions": [
    {
      "id": "check_door_lock",
      "label": "仔细检查门锁",
      "requires": { "flags_absent": ["door_lock_checked"] },
      "result": "门锁是普通的簧片锁，从外面无法拨开。但你发现门锁内侧有几道细铁丝留下的划痕，金属新亮，显然是近期才留下的。\n\n有人用细铁丝从门缝探入，在房间内侧拨动了门闩——他们进门时不是从窗户，而是手里有工具，甚至有备用钥匙。",
      "grants": { "flags": ["door_lock_checked"], "items": ["door_lock_scraping"], "clues": ["door_lock_scraping"] }
    },
    {
      "id": "check_window_exit",
      "label": "检查窗台外侧",
      "requires": { "agility": 4, "flags_absent": ["window_exit_checked"] },
      "result": "你探身从窗口向外看，窗台外侧的青砖上有一道凹槽，凹槽边缘缠着一截半截残留的布条——布面有绳索摩擦留下的焦痕。\n\n凶手是从这里用绳索降至地面逃走的。进来走门，出去走窗——他在事后才把自己藏入黑暗中。",
      "grants": { "flags": ["window_exit_checked"], "items": ["rope_burn_cloth"], "clues": ["rope_burn_cloth"] }
    },
    {
      "id": "reconstruct_entry",
      "label": "综合推断凶手出入路线",
      "requires": { "wisdom": 7, "flags": ["door_lock_checked", "window_exit_checked"], "flags_absent": ["entry_route_deduced"] },
      "result": "你将所有细节串联：\n\n凶手提前潜入此房（可能在宋怀义外出时），在茶水中下毒，然后离开并锁好房门。等宋怀义回房饮茶毒发，凶手再次以工具拨开门闩入内，确认对方已昏迷后搜身、取走目标物件、移尸补刀，最后以绳索从窗口降逃。\n\n这是一次精心策划的行动，而非临时起意。",
      "grants": { "flags": ["entry_route_deduced"] }
    }
  ]
},
{
  "id": "evt_victim_hidden_items",
  "title": "翻查死者秘密遗物",
  "description": "行旅箱里普通货物之下，或许藏着宋怀义真正的秘密。",
  "requires": null,
  "actions": [
    {
      "id": "open_chest",
      "label": "打开行旅箱",
      "requires": { "flags_absent": ["chest_202_opened"] },
      "result": "箱内装着绸缎、茶砖等寻常货物，已经被翻动过，凌乱地堆着。凶手显然在这里搜过，但搜得有些粗心——箱底的木板颜色比周围稍深，纹理也略有不同。",
      "grants": { "flags": ["chest_202_opened"] }
    },
    {
      "id": "find_false_bottom",
      "label": "撬开假底夹层",
      "requires": { "flags": ["chest_202_opened"], "flags_absent": ["false_bottom_found"] },
      "result": "你用指甲沿缝隙一扣，木板应声而起。夹层里薄薄地放着两件东西：一本账本，和一枚拇指大小的玉牌。\n\n这是凶手没有找到的东西——也许是时间紧迫，也许是根本不知道有这层夹层。",
      "grants": { "flags": ["false_bottom_found"], "items": ["account_book", "tianji_jade_token"], "clues": ["account_book", "tianji_jade_token"] }
    },
    {
      "id": "decode_account_book",
      "label": "解读账本末页隐码",
      "requires": { "wisdom": 6, "flags": ["false_bottom_found"], "flags_absent": ["account_decoded"] },
      "result": "你翻到最后三页，每页末尾的数字用朱砂略重：第一页末是"东"，第二页末是"市"，第三页末是"回春堂"。\n\n东市·回春堂——一家药铺。宋怀义在出事前，正打算与那里的人接头。那里，可能还有人在等他。",
      "grants": { "flags": ["account_decoded"], "flags_absent": [] }
    }
  ]
}
```

- [ ] **Step 4: 扩充存根事件 evt_window_look**

将 `evt_window_look` 从单动作扩展为 2 个动作：
```json
{
  "id": "evt_window_look",
  "title": "从走廊望向后院",
  "description": "走廊尽头的小窗正对着后院。",
  "requires": null,
  "actions": [
    {
      "id": "look_outside",
      "label": "探身望向院子",
      "requires": { "flags_absent": ["seen_tracks_from_window"] },
      "result": "后院黄土地上有一串乱步，向东延伸，没入树林方向。脚印新鲜，应是昨夜留下的。步幅均匀，没有奔跑的迹象——凶手离开时极为从容。",
      "grants": { "flags": ["seen_tracks_from_window"] }
    },
    {
      "id": "look_wall",
      "label": "观察院墙走势",
      "requires": { "flags": ["seen_tracks_from_window"], "flags_absent": ["wall_route_noted"] },
      "result": "沿着脚印的方向看去，后院东侧墙角有一道攀爬痕迹——青砖上的苔藓被蹭掉了一块，露出新鲜的砖面。凶手越墙而出，没有从正门走。这人对客栈的布局很熟悉。",
      "grants": { "flags": ["wall_route_noted"] }
    }
  ]
}
```

- [ ] **Step 5: 扩充结局文本（evt_final_confrontation 三个动作的 result）**

将三个结局动作的 `result` 替换为完整收尾叙事：

**truth_ending result**（真相路线）：
```
你将所有线索串连，在废弃宅院的正堂缓缓开口，将那个已经成形的答案说了出来。

宋怀义是天机阁的叛徒线人，十年前他带走了一份名单，有人等了他十年。幕后主使"鸢"先以毒物击昏他，再假扮意外勒毙；凶手在后厨留下砒霜是个失误——原本打算毒杀后伪装成病死，但厨娘王氏无意中撞见，计划被迫改变。

大飞帮、浪鹏帮都在觊觎那份名单。而"鸢"这个字，指向的是某个更深的秘密。

你环顾这座写着"天机阁"三字的废院。这里曾经站过许多人，现在只有你一个人站在这里，握着一个没有人能确认的真相。

客栈伙计来报：官府的人已经到了。

你合上手中的线索，整了整衣袍，走出了宅院的大门。

身后，废院的牌匾在晨风中微微摇晃。
```

**force_ending result**（莽夫路线）：
```
你看见后门闪入的人影，凭着力气追上，将其按倒在地。

那人是个年轻的伙计，满身颤抖，招认是受人指使，却说不出幕后主使是谁——真正的幕后人趁乱逃脱了。

你抓了个跑腿的，放走了真凶。

伙计反复说的最后一句话让你记住了："我只是送信的，信是从东市回春堂来的……"

东市·回春堂。这是一条线索，但今天已经用完了。

你松开了手。伙计跌跌撞撞地逃开，消失在长安的街巷里。

宋怀义的案子，还没有结束。
```

**hermit_ending result**（隐士路线）：
```
你想起白衣人临别时的话："真相不总是用来揭露的，有时，它是你活命的筹码。"

你没有正面迎击，而是悄无声息地退出了宅院，带着你已知道的一切。

有些东西，比真相更重。

走出废院的小巷，拐过两条街，你在一处茶摊前坐下，要了一碗热茶，把手中的线索一张张地展开，又一张张地叠好。

你知道发生了什么，知道谁动的手，知道"鸢"这个字背后的轮廓。

但你还不知道：那个人究竟是谁。

茶端上来了，热气袅袅。你握着那枚天机玉令，看着它在掌心慢慢变暖。

长安的街市还在继续，人来人往，没有人知道昨夜发生了什么。

也没有人知道，你手里握着的，是一颗烫手的棋子。
```

- [ ] **Step 6: 验证 JSON 合法性**

```bash
cd /Users/xuli/claudeGame && python3 -c "
import json
json.load(open('src/data/maps/chapter1.json'))
json.load(open('src/data/events/chapter1.json'))
json.load(open('src/data/items/chapter1.json'))
print('All JSON valid')
"
```

- [ ] **Step 7: 运行测试**

```bash
cd /Users/xuli/claudeGame && npm run test
```

- [ ] **Step 8: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/data/maps/chapter1.json src/data/events/chapter1.json src/data/items/chapter1.json && git commit -m "feat: add room_202 crime scene with 3 events, 5 new clue items, expanded endings"
```

---

## Task 2: 分支对话系统（Game.tsx + CenterPanel）

**Files:**
- Modify: `src/pages/Game/Game.tsx`
- Modify: `src/components/layout/CenterPanel.tsx`

- [ ] **Step 1: 读取当前 Game.tsx 确认结构**

读取完整的 `src/pages/Game/Game.tsx`，理解：
- imports 区域
- 当前 state 声明位置
- buildActions() 函数完整结构
- handleAction() 函数完整结构
- JSX 返回值中 CenterPanel 的 props

- [ ] **Step 2: 更新 Game.tsx — 新增 pendingChoices 状态机**

做以下精确修改（不改动其他部分）：

**2a. 新增 import**（加到现有 imports 后）：
```typescript
import type { DialogueChoice } from '../../types/game';
import { evaluate } from '../../engine/conditionEvaluator';
```

**2b. 新增 state**（加在 `const processingRef = useRef(false);` 之后）：
```typescript
const [pendingChoices, setPendingChoices] = useState<{
  npcId: string;
  npcName: string;
  choices: DialogueChoice[];
} | null>(null);
```

**2c. 修改 buildActions()** — 在函数开头加检测：
```typescript
const buildActions = () => {
  // 若有待选对话，只显示选项按钮
  if (pendingChoices) {
    return pendingChoices.choices.map((c) => ({
      id: `choice:${c.id}`,
      label: `「${c.label}」`,
      available: true,
      completed: false,
      hint: '',
    }));
  }
  // ... 以下保持现有代码不变
```

**2d. 修改 handleAction()** — 在开头的 processingRef 守卫之后、现有 colonIdx 之前，插入 choice 处理：
```typescript
// 处理对话选项
if (actionId.startsWith('choice:')) {
  if (!pendingChoices) return;
  const choiceId = actionId.slice('choice:'.length);
  const choice = pendingChoices.choices.find((c) => c.id === choiceId);
  if (!choice) return;
  scene.addStoryText(`【${pendingChoices.npcName}】${choice.response}`);
  if (choice.grants) {
    choice.grants.flags?.forEach((f) => scene.addFlag(f));
    choice.grants.clues?.forEach((c) => scene.addClue(c));
    choice.grants.items?.forEach((i) => addItem(i));
    choice.grants.remove_items?.forEach((i) => removeItem(i));
    choice.grants.quests?.forEach((q) => scene.addQuest(q));
  }
  setPendingChoices(null);
  return;
}
```

**2e. 修改 handleAction() 中的 NPC 分支** — 在 `scene.markDialogueSeen(...)` 之后添加 choices 处理：
```typescript
scene.markDialogueSeen(`${entityId}:${d.id}`);
// 处理分支选项
if (d.choices && d.choices.length > 0) {
  const availableChoices = d.choices.filter(
    (c) => !c.condition || evaluate(c.condition, ctx)
  );
  if (availableChoices.length > 0) {
    setPendingChoices({ npcId: entityId, npcName: npc.name, choices: availableChoices });
    // grants 仍然应用（对话本身的奖励，不依赖选项）
  }
}
// 原有 d.grants 处理保持不变
```

**注意**：d.grants 的处理（addFlag/addClue 等）**保持在原位**，不要移动。只是在它们的适当位置之后加 choices 检测。

- [ ] **Step 3: 修改 CenterPanel.tsx — 待选状态提示**

在 CenterPanel 的操作区，在 `── 操作 ──` 标签之前加条件渲染：若 actions 的第一个 id 以 `choice:` 开头，显示不同的标题：

修改 CenterPanel.tsx 中的操作区标题：
```tsx
<p className="text-gold/40 text-xs mb-2 tracking-widest">
  {actions.length > 0 && actions[0].id.startsWith('choice:')
    ? '── 如何回应 ──'
    : '── 操作 ──'}
</p>
```

- [ ] **Step 4: TypeScript 检查**

```bash
cd /Users/xuli/claudeGame && npm run build 2>&1 | head -40
```

- [ ] **Step 5: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/pages/Game/Game.tsx src/components/layout/CenterPanel.tsx && git commit -m "feat: implement dialogue choice system with pendingChoices state machine"
```

---

## Task 3: NPC 分支对话内容——证人与掌柜

**为 npc_innkeeper_li_fu、npc_drunk_zhang_san、npc_cook_wang 新增含 choices 的对话条目**

**Files:**
- Modify: `src/data/npcs/chapter1.json`

- [ ] **Step 1: 读取当前 NPCs 文件，确认各 NPC 现有对话条目和顺序**

```bash
cd /Users/xuli/claudeGame && python3 -c "
import json
d = json.load(open('src/data/npcs/chapter1.json'))
for n in d:
    if n['id'] in ['npc_innkeeper_li_fu', 'npc_drunk_zhang_san', 'npc_cook_wang']:
        print(f'\n{n[\"id\"]}:')
        for dl in n['dialogues']:
            print(f'  {dl[\"id\"]}: cond={dl.get(\"condition\")}')
"
```

- [ ] **Step 2: 为 npc_innkeeper_li_fu 新增 2 条含 choices 的对话**

在 `npc_innkeeper_li_fu` 的 dialogues 数组中，**在现有条目之前**插入（更具体条件的排前面）：

**对话 A**（触发条件：已见面未深谈，适合第一次深入盘问）：
```json
{
  "id": "innkeeper_interrogation",
  "condition": { "flags": ["innkeeper_met"], "flags_absent": ["innkeeper_talked"] },
  "text": "李福掸了掸柜台上的灰尘，神情比初见时镇定了一些，但眼底的慌乱还是藏不住：「官人有何想问的，小人知无不言。」",
  "choices": [
    {
      "id": "ask_victim_background",
      "label": "宋怀义常来此地？",
      "response": "李福顿了顿：「来过几次，是跑布匹生意的。」他的手指在柜台上轻轻叩了一下，「上次来是半月前，这次……比往常提前了。说是有桩急事要在长安办。」他没有说那桩急事是什么。"
    },
    {
      "id": "ask_last_night",
      "label": "昨夜你在何处？",
      "response": "「小人守夜，在前台坐到亥时。」他的眼神飘向柜台下方——那里有一口小抽屉。「听见动静时，还以为是哪位客人夜里起夜……后来伙计来喊，才知道……」他住了口，抹了把额头。"
    },
    {
      "id": "ask_suspicious_person",
      "label": "近日可有可疑之人出入？",
      "response": "李福沉默了一息，压低声音：「有个人……昨日下午在大堂坐了许久，点了壶茶，什么都没喝，就一直看着楼梯口。我当时以为是在等人，现在想来……」他摇了摇头，「穿的是普通蓝衫，腰里挂着一串铜铃，我印象很深。」",
      "grants": { "flags": ["innkeeper_talked", "blue_shirt_seen_by_innkeeper"] }
    }
  ]
},
{
  "id": "innkeeper_trusted_secret",
  "condition": { "flags": ["innkeeper_trusted"], "flags_absent": ["innkeeper_secret_told"] },
  "text": "李福把「暂停营业」的木牌挂到门口，回身时，神情已经变了——不再是掌柜的油滑，而是某种久藏心底的沉重：「有些事，我已经藏了十年。也许……是该有人知道了。」",
  "choices": [
    {
      "id": "ask_tianji",
      "label": "你与天机阁是什么关系？",
      "response": "「我是驿。」他说。「专门负责消息的中转，就像客栈里最普通的一块砖，但每块砖都有它的位置。十年前阁里出了事，上面的人说：原地潜伏，等待。我就等了十年。」他苦笑，「等来的，是宋怀义的死。」",
      "grants": { "flags": ["li_fu_tianji_confirmed"] }
    },
    {
      "id": "ask_jade_token",
      "label": "你那枚玉佩是什么来历？",
      "response": "李福从怀里掏出一枚玉牌——与你在宋怀义夹层里找到的如出一辙，但这枚背面刻的是「驿」字。「宋怀义临死前托人带给我一句话：'告诉驿，东市回春堂，三日之内。'」\n\n他把玉牌放到桌上，推向你：「我不能去。但你可以。」",
      "grants": { "flags": ["innkeeper_secret_told", "huichuntang_clue_given"], "items": ["innkeeper_jade"] }
    },
    {
      "id": "ask_kite",
      "label": "你知道"鸢"是谁吗？",
      "response": "李福的手猛地一顿。「你在哪里见过这个字？」他盯着你，眼神里第一次出现了真正的恐惧，不是因为案子，而是因为这个名字。\n\n「鸢……是阁里最后一支行动组的代号。他们做的是没有名字的事。如果鸢出现了，说明有人动用了最后的手段。」他闭了闭眼，「宋怀义死得不冤，但是……不该是现在。」",
      "grants": { "flags": ["kite_group_known"] }
    }
  ]
}
```

- [ ] **Step 3: 为 npc_drunk_zhang_san 新增 1 条含 choices 的对话**

在 `npc_drunk_zhang_san` 的 dialogues 中，在 `zhang_san_key_info`（需要酒的关键信息对话）**之后**插入（更具体条件排前）：

```json
{
  "id": "zhang_san_detail_question",
  "condition": { "flags": ["zhang_san_told"], "flags_absent": ["zhang_san_details_asked"] },
  "text": "张三眯着眼，酒劲上来了，话匣子反而打开了：「你还想问什么，尽管说，爷今儿个都告诉你！」",
  "choices": [
    {
      "id": "ask_appearance",
      "label": "那人长什么样子？",
      "response": "「身形……挺细的，走路没声儿，像猫。」张三比划了一下，「衣服是黑的，脸……没看清。但腰间有个东西，黑色的，圆圆的，像块令牌。走路带风……」他打了个嗝，「比老子跑得快多了。」"
    },
    {
      "id": "ask_direction",
      "label": "那人往哪个方向走的？",
      "response": "「往后厨那边转，然后……就没了。」张三皱眉，「我当时还奇怪，后厨那条路是死路，哪儿也去不了，但那人进去就没出来……」他摸了摸脑袋，「难道后头还有什么门？」",
      "grants": { "flags": ["zhang_san_details_asked", "tunnel_hinted_by_zhang"] }
    },
    {
      "id": "ask_timing",
      "label": "大约是什么时辰？",
      "response": "「二更……二更多一点儿？」张三掰着手指，「我记得我的酒刚喝了一半，你知道我一壶酒喝完要多久……大概就是那个时候。那人走得急，差点撞上我，」他摸了摸鼻子，「连道歉都没有，哼。」"
    }
  ]
}
```

- [ ] **Step 4: 为 npc_cook_wang 新增 1 条含 choices 的对话**

在 `npc_cook_wang` 的 dialogues 中，在 `cook_wang_key`（arsenic 相关关键对话）**之后**插入：

```json
{
  "id": "cook_wang_detail_question",
  "condition": { "flags": ["cook_talked"], "flags_absent": ["cook_details_asked"] },
  "text": "王氏擦了擦眼角，握紧了围裙：「你问吧，我都说……昨晚那事儿，憋了一夜了。」",
  "choices": [
    {
      "id": "ask_person_look",
      "label": "那人是男是女？",
      "response": "「身形……像是女子。」王氏声音很低，「腰细，走路没声儿。我当时就奇怪，哪有这么晚还在厨房转的？但我没敢出声……」她顿了顿，「她没有看见我。我躲在灶台后面，大气不敢出。」"
    },
    {
      "id": "ask_what_doing",
      "label": "那人在后厨做了什么？",
      "response": "「先是在药柜那里翻了一遍——把我的砒霜翻出来了，只取了一点点，剩下的撒了一地。然后……」王氏深吸一口气，「她对着那条细缝说了句话。我只听清了一个字：找到了。」\n\n「然后她就从那条缝里……进去了。」",
      "grants": { "flags": ["cook_details_asked", "tunnel_confirmed_by_cook"] }
    },
    {
      "id": "ask_warned",
      "label": "你为何不当时喊人？",
      "response": "王氏抬起头，眼神里有一丝不一样的东西：「因为……前一天晚上，有人来找过我。说让我这两天别多事，好好待着，会有好处。」\n\n「我没收那人的钱，但我害怕了。」她低下头，「我对不住宋掌柜。」",
      "grants": { "flags": ["cook_warned_confirmed"] }
    }
  ]
}
```

- [ ] **Step 5: 验证 JSON 合法性**

```bash
cd /Users/xuli/claudeGame && python3 -c "import json; json.load(open('src/data/npcs/chapter1.json')); print('NPC JSON valid')"
```

- [ ] **Step 6: 运行测试**

```bash
cd /Users/xuli/claudeGame && npm run test
```

- [ ] **Step 7: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/data/npcs/chapter1.json && git commit -m "feat: add branching dialogue choices for innkeeper, drunk, cook NPCs"
```

---

## Task 4: NPC 分支对话内容——神秘人物

**为 npc_white_stranger、npc_fei_ye 新增含 choices 的对话条目**

**Files:**
- Modify: `src/data/npcs/chapter1.json`

- [ ] **Step 1: 读取白衣人和飞爷现有对话条目**

```bash
cd /Users/xuli/claudeGame && python3 -c "
import json
d = json.load(open('src/data/npcs/chapter1.json'))
for n in d:
    if n['id'] in ['npc_white_stranger', 'npc_fei_ye']:
        print(f'\n{n[\"id\"]}:')
        for dl in n['dialogues']:
            print(f'  {dl[\"id\"]}: {dl.get(\"condition\")}')
"
```

- [ ] **Step 2: 为 npc_white_stranger 新增 2 条含 choices 的对话**

在 `npc_white_stranger` 的 dialogues 数组的**开头**插入（条件最宽松的对话放最后，条件严格的放最前）：

**对话 A**（首次相遇，可以主动追问）：
```json
{
  "id": "white_stranger_first_questions",
  "condition": { "flags": ["stranger_met"], "flags_absent": ["white_stranger_trust", "stranger_questioned"] },
  "text": "白衣人看着你，目光沉静，像是在等你说什么。他开口：「你已经查到了一些东西。想问，就问吧。」",
  "choices": [
    {
      "id": "ask_identity",
      "label": "你究竟是什么人？",
      "response": "「一个知道太多的人。」他说得很平静，「知道太多，有时候是负担，有时候是武器。你选择用它做什么，才是真正重要的问题。」\n\n他停顿了一下：「我曾经和天机阁有过一段渊源。仅此而已。」"
    },
    {
      "id": "ask_motive",
      "label": "你为何要帮助我？",
      "response": "「我没有在帮你。」白衣人微微偏头，「我在帮一件事情走向它该走向的地方。你只是恰好站在这条路上。」\n\n他望向树林深处：「宋怀义死了十年应该死的事，但不该死得这么快。有人急了。急着做事的人，会留下痕迹。」",
      "grants": { "flags": ["stranger_questioned"] }
    },
    {
      "id": "ask_kite_name",
      "label": "鸢——你认识这个人吗？",
      "response": "白衣人沉默了很长时间。\n\n「鸢是一个代号，不是一个人。」他最终说，「就像天机阁里所有的组一样，用飞鸟命名。鸢组做的是最后的事——收尾、抹除、封口。」\n\n「能动用鸢组的人，在整个阁里不超过三个。」他看了你一眼，「现在可能更少了。」",
      "grants": { "flags": ["kite_role_known"] }
    }
  ]
},
{
  "id": "white_stranger_deep_talk",
  "condition": { "flags": ["stranger_questioned", "clue_blood_letter_found", "tianji_records_found"], "flags_absent": ["white_stranger_trust"] },
  "text": "白衣人看了看你手中握着的线索，点了点头，像是在确认什么：「你比我预想的走得更远。」他指了指旁边一块平整的石头，「坐下。这一次，我多说一些。」",
  "choices": [
    {
      "id": "ask_song_real_identity",
      "label": "宋怀义背叛了天机阁？",
      "response": "「这要看你怎么定义背叛。」白衣人的声音里有某种复杂的情绪，「他带走了一份名册，那是真的。但他为什么带走，带去哪里，要给谁……」他停顿，「没有人知道他真正的打算。十年里，我一直在想这个问题。」"
    },
    {
      "id": "ask_scroll_purpose",
      "label": "残卷里到底藏着什么？",
      "response": "「你手里的那些碎片，只是皮毛。」他直视你，「残卷记录的是一张网，一张覆盖大唐边疆与朝堂的情报网络。这张网还活着，只是没有人在操持它。」\n\n「一旦有人能把所有碎片拼齐，就能重新掌控这张网。」他顿了顿，「所以，有人不能让它被拼齐。」",
      "grants": { "flags": ["scroll_true_purpose_known"] }
    },
    {
      "id": "ask_for_guidance",
      "label": "你觉得我该怎么做？",
      "response": "白衣人长时间地看着你，像是在下某个决定。\n\n「东市，回春堂。」他说，「那里有人在等一个已经死了的人。去见他，说：归鸟问津。」\n\n「至于之后……」他站起身，衣袂随风而起，「这条路，你自己选。我能做的，已经做完了。」",
      "grants": { "flags": ["white_stranger_trust", "huichuntang_password_known"] }
    }
  ]
}
```

- [ ] **Step 3: 为 npc_fei_ye 新增 1 条含 choices 的对话**

在 `npc_fei_ye` 的 dialogues 中，在基础对话之后插入：

```json
{
  "id": "fei_ye_deep_talk",
  "condition": { "flags": ["dafei_joined", "dafei_lock_solved"], "flags_absent": ["fei_ye_secret_told"] },
  "text": "飞爷收起了那副漫不经心的笑容，指了指密室深处的一张椅子：「坐。你已经证明了你不是来捣乱的，那我们就说点真话。」",
  "choices": [
    {
      "id": "ask_real_purpose",
      "label": "大飞帮建立的真正目的是什么？",
      "response": "「你以为是经营长安地下市场？」飞爷轻笑，「那只是外壳。」他看了你一眼，「我曾经是天机阁里的一枚棋子。十年前阁子散了，但那张情报网络还活着——只是没有人控着。我建大飞帮，是在等那张网重新有人来认领的那一天。」\n\n「现在，或许那一天快来了。」"
    },
    {
      "id": "ask_about_langpeng",
      "label": "浪鹏帮追查残卷的目的？",
      "response": "飞爷手指敲了敲桌面：「浪鹏帮……有意思。他们不像是冲着残卷的情报价值来的。」他微微皱眉，「他们翻的是货单、是名册，找的不是地点，而是一个人的名字。」\n\n「寻仇。」他下了结论，「浪鹏帮是在寻仇，只是我不知道他们要找的是谁。」",
      "grants": { "flags": ["fei_ye_langpeng_analysis", "fei_ye_secret_told"] }
    },
    {
      "id": "ask_who_is_kite",
      "label": "你知道鸢是谁吗？",
      "response": "飞爷沉默了一拍，然后笑了——不是寻常那种算计的笑，而是某种更复杂的表情。\n\n「鸢……」他摩挲着桌边，「当年阁里，鸢组只有一个执行人。一个女人。我见过她一次，那时她还很年轻。」\n\n他抬眼看你：「如果她还活着，如果还是她在动手……那说明这件事，比我们所有人想象的都要复杂。」",
      "grants": { "flags": ["fei_ye_kite_hint"] }
    }
  ]
}
```

- [ ] **Step 4: 验证 JSON 并运行测试**

```bash
cd /Users/xuli/claudeGame && python3 -c "import json; json.load(open('src/data/npcs/chapter1.json')); print('NPC JSON valid')" && npm run test
```

- [ ] **Step 5: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/data/npcs/chapter1.json && git commit -m "feat: add branching dialogue choices for white stranger and master fei"
```

---

## Task 5: 更新数据完整性测试

**Files:**
- Modify: `tests/data/chapter1Integrity.test.ts`

- [ ] **Step 1: 读取现有测试文件**

```bash
cd /Users/xuli/claudeGame && cat tests/data/chapter1Integrity.test.ts
```

- [ ] **Step 2: 新增测试用例**

在现有测试文件中追加以下测试用例：

```typescript
// room_202 测试
test('room_202 exists with correct interactables', () => {
  const room = ALL_ROOMS.find((r) => r.id === 'room_202');
  expect(room).toBeDefined();
  if (!room) return;
  expect(room.interactables).toContain('evt_crime_scene_202');
  expect(room.interactables).toContain('evt_locked_room_mystery');
  expect(room.interactables).toContain('evt_victim_hidden_items');
});

test('room_203 exits include room_202', () => {
  const room = ALL_ROOMS.find((r) => r.id === 'room_203');
  expect(room).toBeDefined();
  if (!room) return;
  expect(room.exits).toContain('room_202');
});

// 新事件测试
test('new crime scene events exist', () => {
  const eventIds = ['evt_crime_scene_202', 'evt_locked_room_mystery', 'evt_victim_hidden_items'];
  for (const id of eventIds) {
    const event = EVENTS.find((e) => e.id === id);
    expect(event).toBeDefined();
    expect(event?.actions.length).toBeGreaterThan(0);
  }
});

// 新道具测试
test('new crime scene items exist', () => {
  const itemIds = ['blood_pattern_sketch', 'door_lock_scraping', 'account_book', 'tianji_jade_token', 'rope_burn_cloth'];
  for (const id of itemIds) {
    const item = ITEMS.find((i) => i.id === id);
    expect(item).toBeDefined();
    expect(item?.isClue).toBe(true);
  }
});

// NPC choices 测试
test('key NPCs have dialogues with choices', () => {
  const npcIds = ['npc_innkeeper_li_fu', 'npc_white_stranger', 'npc_fei_ye'];
  for (const id of npcIds) {
    const npc = NPCS.find((n) => n.id === id);
    expect(npc).toBeDefined();
    if (!npc) continue;
    const hasChoices = npc.dialogues.some((d) => d.choices && d.choices.length > 0);
    expect(hasChoices).toBe(true);
  }
});

// choices 引用的 grants 合法性
test('dialogue choice grants only reference existing items', () => {
  for (const npc of NPCS) {
    for (const dialogue of npc.dialogues) {
      if (!dialogue.choices) continue;
      for (const choice of dialogue.choices) {
        if (!choice.grants?.items) continue;
        for (const itemId of choice.grants.items) {
          const item = ITEMS.find((i) => i.id === itemId);
          expect(item).toBeDefined();
        }
      }
    }
  }
});
```

- [ ] **Step 3: 运行完整测试**

```bash
cd /Users/xuli/claudeGame && npm run test
```

期望：所有测试通过（含新增测试）

- [ ] **Step 4: TypeScript build**

```bash
cd /Users/xuli/claudeGame && npm run build 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
cd /Users/xuli/claudeGame && git add tests/data/chapter1Integrity.test.ts && git commit -m "test: add integrity tests for room_202, new events, dialogue choices"
```
