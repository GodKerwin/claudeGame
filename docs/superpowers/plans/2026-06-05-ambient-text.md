# 动态房间氛围文字 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 13 个关键房间添加随时段和 flag 变化的氛围描述文字，替换静态 `room.description`。

**Architecture:** 新增 `ambientEngine.ts` 纯函数，从 Room 的两个新可选字段（`ambientByFlag` / `ambientByTime`）中按优先级选出当前氛围文字；Game.tsx 用 `useMemo` 派生 `ambientText`，替换传给 CenterPanel 的 `roomDescription` prop；章节 JSON 数据补充各房间文字。

**Tech Stack:** TypeScript, React useMemo, Zustand, Vitest

---

### Task 1: 类型扩展 + ambientEngine（TDD）

**Files:**
- Modify: `src/types/game.ts:137-146`
- Create: `src/engine/ambientEngine.ts`
- Create: `tests/engine/ambientEngine.test.ts`

**背景：** `Room` interface 目前没有 `ambientByFlag` / `ambientByTime` 字段。`EvalContext` 已有 `flags` 和 `timeOfDay`。`evaluate()` 在 `src/engine/conditionEvaluator.ts` 中导出。

- [ ] **Step 1: 写失败测试**

新建 `tests/engine/ambientEngine.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { getAmbientText } from '../../src/engine/ambientEngine';
import type { Room } from '../../src/types/game';
import type { EvalContext } from '../../src/engine/conditionEvaluator';

const baseCtx: EvalContext = {
  player: { name: 'test', template: 'scholar', strength: 5, agility: 5, wisdom: 5, constitution: 5, talent: '' },
  inventory: [],
  flags: [],
  timeOfDay: 'morning',
};

const baseRoom: Room = {
  id: 'test_room',
  name: '测试房间',
  description: '这是默认描述。',
  interactables: [],
  exits: [],
};

describe('getAmbientText', () => {
  it('returns description when no ambient fields', () => {
    expect(getAmbientText(baseRoom, baseCtx)).toBe('这是默认描述。');
  });

  it('returns timeOfDay variant when ambientByTime matches', () => {
    const room: Room = { ...baseRoom, ambientByTime: { morning: '晨光文字' } };
    expect(getAmbientText(room, baseCtx)).toBe('晨光文字');
  });

  it('falls back to description when timeOfDay not in ambientByTime', () => {
    const room: Room = { ...baseRoom, ambientByTime: { night: '夜晚文字' } };
    expect(getAmbientText(room, baseCtx)).toBe('这是默认描述。');
  });

  it('flag variant takes priority over timeOfDay variant', () => {
    const room: Room = {
      ...baseRoom,
      ambientByTime: { morning: '晨光文字' },
      ambientByFlag: [{ requires: { flags: ['trusted'] }, text: 'flag文字' }],
    };
    const ctx = { ...baseCtx, flags: ['trusted'] };
    expect(getAmbientText(room, ctx)).toBe('flag文字');
  });

  it('skips flag entry when condition not met, falls through to timeOfDay', () => {
    const room: Room = {
      ...baseRoom,
      ambientByTime: { morning: '晨光文字' },
      ambientByFlag: [{ requires: { flags: ['missing_flag'] }, text: 'flag文字' }],
    };
    expect(getAmbientText(room, baseCtx)).toBe('晨光文字');
  });

  it('returns first matching flag entry when multiple entries', () => {
    const room: Room = {
      ...baseRoom,
      ambientByFlag: [
        { requires: { flags: ['flag_a'] }, text: '文字A' },
        { requires: { flags: ['flag_b'] }, text: '文字B' },
      ],
    };
    const ctx = { ...baseCtx, flags: ['flag_a', 'flag_b'] };
    expect(getAmbientText(room, ctx)).toBe('文字A');
  });

  it('handles empty ambientByFlag array without error', () => {
    const room: Room = { ...baseRoom, ambientByFlag: [] };
    expect(getAmbientText(room, baseCtx)).toBe('这是默认描述。');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd /Users/xuli/claudeGame
npx vitest run tests/engine/ambientEngine.test.ts
```

预期：FAIL，报 `getAmbientText` 不存在。

- [ ] **Step 3: 扩展 Room 类型**

编辑 `src/types/game.ts`，在 `RoomRevisitEvent` 之前插入新 interface，并扩展 `Room`：

```ts
// 在 RoomRevisitEvent 定义之前插入：
export interface AmbientFlagEntry {
  requires: Condition;
  text: string;
}
```

将 `Room` interface 改为：

```ts
export interface Room {
  id: string;
  name: string;
  description: string;
  interactables: string[];
  exits: string[];
  requires?: Condition | null;
  revisitEvents?: RoomRevisitEvent[];
  talentViews?: { talent: string; text: string }[];
  ambientByTime?: Partial<Record<TimeOfDay, string>>;
  ambientByFlag?: AmbientFlagEntry[];
}
```

- [ ] **Step 4: 创建 ambientEngine.ts**

新建 `src/engine/ambientEngine.ts`：

```ts
import type { Room } from '../types/game';
import type { EvalContext } from './conditionEvaluator';
import { evaluate } from './conditionEvaluator';

export function getAmbientText(room: Room, ctx: EvalContext): string {
  if (room.ambientByFlag) {
    for (const entry of room.ambientByFlag) {
      if (evaluate(entry.requires, ctx)) return entry.text;
    }
  }
  if (room.ambientByTime) {
    const t = room.ambientByTime[ctx.timeOfDay];
    if (t) return t;
  }
  return room.description;
}
```

- [ ] **Step 5: 运行测试确认通过**

```bash
npx vitest run tests/engine/ambientEngine.test.ts
```

预期：7 passed。

- [ ] **Step 6: 运行全量测试确认无回归**

```bash
npx vitest run
```

预期：全部通过（≥328 tests）。

- [ ] **Step 7: 提交**

```bash
git add src/types/game.ts src/engine/ambientEngine.ts tests/engine/ambientEngine.test.ts
git commit -m "feat: AmbientFlagEntry type + ambientEngine.getAmbientText"
```

---

### Task 2: Game.tsx 集成

**Files:**
- Modify: `src/pages/Game/Game.tsx`

**背景：** `Game.tsx` 第 655 行将 `room.description` 静态传给 `CenterPanel`。`ctx` 已通过 `useMemo` 维护，依赖 `scene.flags` 和 `scene.timeOfDay`——只需再加一个 `ambientText` memo 即可。

- [ ] **Step 1: 在 Game.tsx 添加 import**

在文件顶部的引擎 import 区块（`import type { EvalContext }` 附近）加入：

```ts
import { getAmbientText } from '../../engine/ambientEngine';
```

- [ ] **Step 2: 添加 ambientText useMemo**

在 `ctx` 的 `useMemo` 声明之后（约第 224 行），插入：

```ts
const ambientText = useMemo(
  () => (room ? getAmbientText(room, ctx) : ''),
  [room, ctx]
);
```

- [ ] **Step 3: 替换 roomDescription prop**

将第 655 行：

```tsx
roomDescription={room.description}
```

改为：

```tsx
roomDescription={ambientText}
```

- [ ] **Step 4: 类型检查**

```bash
npx tsc -p tsconfig.app.json --noEmit
```

预期：0 errors。

- [ ] **Step 5: 提交**

```bash
git add src/pages/Game/Game.tsx
git commit -m "feat: dynamic ambientText in Game.tsx — replaces static room.description"
```

---

### Task 3: 第一章数据 — 5 个房间

**Files:**
- Modify: `src/data/maps/chapter1.json`

**背景：** chapter1.json 顶层是一个数组，第一个元素有 `rooms` 数组。需要为以下房间添加 `ambientByTime` 和/或 `ambientByFlag` 字段：`lobby`, `room_202`, `room_203`, `cellar`, `back_alley`。

- [ ] **Step 1: 为 lobby 添加字段**

在 `lobby` 对象的 `talentViews`（或末尾字段）之后追加：

```json
"ambientByTime": {
  "dawn":      "灶火刚燃，大堂里只有炊烟和掌柜一个人的背影。天将亮未亮，昨夜的气氛仿佛还没有散去。",
  "morning":   "朝食时分，几桌客人低声议论着昨夜的动静。掌柜李福站在柜台后，笑容比往日僵硬。",
  "noon":      "日头最盛，大堂里人声稀落。饭食的香气从后厨飘来，却没什么人有心思吃。",
  "afternoon": "午后的困倦笼在大堂里，伙计打着哈欠，食客寥寥。掌柜坐在柜台后翻账册，手指停在某一行，迟迟没有翻过去。",
  "dusk":      "夕阳把大堂染成橙红，第一盏油灯刚点上，火焰摇曳不定。今晚又要这样过去了。",
  "night":     "夜深人静，大堂只剩一盏灯。掌柜的背影在灯火下拉出长长的影子，他坐在那里，好像一直没动过。"
},
"ambientByFlag": [
  {
    "requires": { "flags": ["innkeeper_trusted"] },
    "text": "掌柜见你进来，眼神里有了几分不同——不是防备，是慌乱时节里难得的信任，多了一分倚仗的意思。"
  },
  {
    "requires": { "flags": ["innkeeper_blood_letter_asked"] },
    "text": "掌柜抬起头，目光在你身上停了一下，随即移开，比往常更刻意地做着什么。大堂的气氛因为你的出现微微变了。"
  }
]
```

- [ ] **Step 2: 为 room_202 添加字段**

在 `room_202` 对象末尾追加：

```json
"ambientByTime": {
  "dawn":      "天光从虚掩的窗棂透进来，那几道干涸的血迹在晨光里看起来更深了，像是印进了木板里。",
  "morning":   "清晨的光线让房间每一处细节都无所遁形。木箱的划痕，地板上的拖拽印记，枕侧的血迹——你见过很多次了，却还是让人心里沉沉的。",
  "noon":      "正午的阳光从窗缝斜射进来，灰尘在光柱里慢慢浮动。房间安静得像是什么都没发生过，又像是什么都还留在这里。",
  "afternoon": "下午的光线在房间里打出长长的阴影。宋怀义的木箱还在原处，盖子没合严实，里面空荡荡的。",
  "dusk":      "夕阳最后的光线把房间照成暗橙色，然后慢慢消失。没有人来点灯。",
  "night":     "黑暗中，只有窗外的月光勉强照进一线。那些血迹在黑暗里成了另一种东西——更重，更难以面对。"
},
"ambientByFlag": [
  {
    "requires": { "flags": ["clue_arsenic_found"] },
    "text": "凶器的线索在你脑海里挥之不去。这个房间的每一处细节如今都有了不同的意味。"
  },
  {
    "requires": { "flags": ["scene_202_surveyed"] },
    "text": "你已经把这个房间翻了个遍。剩下的问题，不在这里，在人心里。"
  }
]
```

- [ ] **Step 3: 为 room_203 添加字段**

在 `room_203` 对象末尾追加：

```json
"ambientByTime": {
  "dawn":      "窗纸透出灰白的光，走廊里已有伙计的脚步声。你昨夜睡得不踏实，脑子里还在转。",
  "morning":   "晨光照进来，屋里的物件都清晰了。今天还有很多事要做。",
  "noon":      "午后的阳光把窗纸晒得发黄，房间里有些闷热。外面的声音远远传来，你在这里，暂时安静一下。",
  "afternoon": "一个人在房间里，脑子里把已知的线索默默理了一遍。思绪还是乱的。",
  "dusk":      "天色沉下去，走廊里有人走动。明天之前，还有多少事情没有答案。",
  "night":     "四下安静，只有窗外偶尔的风声。这一夜，你知道不会睡得安稳。"
}
```

- [ ] **Step 4: 为 cellar 添加字段**

在 `cellar` 对象末尾追加：

```json
"ambientByTime": {
  "night": "石阶下，黑暗深得像一口井。你借着微光往下走，脚步声在青石上格外清晰。那道缝隙渗出的冷气在这个时辰更明显了。",
  "dawn":  "就算外面天色已白，地窖里依然是深夜。酒气和湿气裹在一起，说不清冷意是从地里来的，还是从别处来的。"
},
"ambientByFlag": [
  {
    "requires": { "flags": ["cellar_night_seen"] },
    "text": "你知道那道墙后面有什么了。再站在这里，感觉不一样——那个发现不会消失，像一块石头压在心底。"
  }
]
```

- [ ] **Step 5: 为 back_alley 添加字段**

在 `back_alley` 对象末尾追加：

```json
"ambientByTime": {
  "night": "月色把窄巷分成两半，一半勉强可以看清，一半彻底沉在阴影里。脚步声在这里会被放大。",
  "dawn":  "天将亮，巷子里的黑暗开始松动，像水慢慢退去。转角的刻痕出现在视野里，比昨晚更清楚了。"
}
```

- [ ] **Step 6: 验证 JSON 格式**

```bash
python3 -c "import json; json.load(open('src/data/maps/chapter1.json')); print('chapter1.json OK')"
```

预期：`chapter1.json OK`

- [ ] **Step 7: 运行测试**

```bash
npx vitest run
```

预期：全部通过。

- [ ] **Step 8: 提交**

```bash
git add src/data/maps/chapter1.json
git commit -m "data: ambient text for ch1 — lobby/room202/room203/cellar/back_alley"
```

---

### Task 4: 第二章数据 — 4 个房间

**Files:**
- Modify: `src/data/maps/chapter2.json`

**背景：** chapter2.json 结构与 chapter1.json 相同（顶层数组，第一元素有 `rooms`）。需要修改：`east_market_entrance`, `yongning_nightmarket`, `cien_temple`, `pingkang_hideout`。

- [ ] **Step 1: 为 east_market_entrance 添加字段**

在该对象末尾追加：

```json
"ambientByTime": {
  "dawn":      "晨雾最厚，东市外的街道轮廓模糊。早起的行脚商人推着货车，彼此不多说话，各怀心思。",
  "morning":   "东市渐渐热闹起来，但那股紧张气息没有随着人声散去。你在人群里，人群也在打量你。",
  "noon":      "日头正高，叫卖声把思绪挤得零碎。悬赏令还贴在坊墙上，没有人敢当众指点，但都在偷偷看。",
  "afternoon": "午后的东市开始往另一个方向走，做买卖的换了批人，眼神也换了种颜色。",
  "dusk":      "收摊的铃声陆续响起，人潮慢慢往坊内退去。暮色里，那张悬赏令的白纸格外显眼。",
  "night":     "东市夜间关门，外街只剩巡逻的兵士和偶尔闪过的人影。你在这里，目标太明显。"
},
"ambientByFlag": [
  {
    "requires": { "flags": ["langpeng_discovered"] },
    "text": "你现在知道这条街上藏着什么了。走在这里，每一张随意的脸都值得多看一眼。"
  }
]
```

- [ ] **Step 2: 为 yongning_nightmarket 添加字段**

在该对象末尾追加：

```json
"ambientByTime": {
  "dusk":  "坊门刚关，夜市的灯火还稀稀落落，货商们压低声音谈着今晚的生意。",
  "night": "夜市到了最热闹的时候，灯火把人影拉得扭曲变形。这里流通的东西，比明面上的货物真实得多。",
  "dawn":  "快天亮了，夜市正在收摊。有些人赶着消失在夜色的最后一片里，有些人等着看今天的日出。"
},
"ambientByFlag": [
  {
    "requires": { "flags": ["nightmarket_ledger_obtained"] },
    "text": "那个消息人的位置你现在记得了。人来人往的夜市里，他依然是最不显眼的那个。"
  }
]
```

- [ ] **Step 3: 为 cien_temple 添加字段**

在该对象末尾追加：

```json
"ambientByTime": {
  "dawn":      "早课的诵经声在大雁塔上方飘散，偏院里只有鸟鸣和松风，安静得像是与长安城不在同一个地方。",
  "morning":   "晨光穿过老柏，在青砖上画出碎影。偶有香客从山门外走过，脚步声很快消失在走廊的尽头。",
  "noon":      "正午的日光把偏院晒得有些白，老柏的树荫是唯一阴凉。蝉声偶发，又忽然停了。",
  "afternoon": "午后的寺院连风声都小了，那间虚掩的僧房里，草药气息更加明显。",
  "dusk":      "黄昏钟声响起时，大雁塔的影子把偏院切成两半。这个时候的慈恩寺，有一种说不清的肃穆。",
  "night":     "夜里的偏院几乎看不清轮廓，只有塔顶的影子映在夜空里。脚步声在青砖上格外响。"
}
```

- [ ] **Step 4: 为 pingkang_hideout 添加字段**

在该对象末尾追加：

```json
"ambientByTime": {
  "night": "院门还关着，但你知道里面有人。周围没有别的动静，只有远处偶尔传来更夫的梆子声。",
  "dawn":  "天将亮，据点里的灯火已经熄了。青苔上的脚印还新鲜——有人刚离开，或是刚回来。"
}
```

- [ ] **Step 5: 验证 JSON 格式**

```bash
python3 -c "import json; json.load(open('src/data/maps/chapter2.json')); print('chapter2.json OK')"
```

预期：`chapter2.json OK`

- [ ] **Step 6: 运行测试**

```bash
npx vitest run
```

预期：全部通过。

- [ ] **Step 7: 提交**

```bash
git add src/data/maps/chapter2.json
git commit -m "data: ambient text for ch2 — east_market/nightmarket/cien_temple/pingkang"
```

---

### Task 5: 第三章数据 — 4 个房间

**Files:**
- Modify: `src/data/maps/chapter3.json`

**背景：** 同上。需要修改：`feiyes_manor`, `leyou_plain`, `tianji_ruins_ch3`, `qujiang_pavilion`。

- [ ] **Step 1: 为 feiyes_manor 添加字段**

在该对象末尾追加：

```json
"ambientByTime": {
  "dawn":      "院子里最后的夜色还没散尽，枯草上有细细的露水。飞爷故居在将明未明的光线里，比白天看起来更旧，也更重。",
  "morning":   "晨光打在院墙上，灰缝里的杂草投下细碎的影子。这个地方住过一个人，然后那个人消失了，留下这些东西替他说话。",
  "noon":      "正午的光把院子里的一切都照得清楚，书架上的空格，桌上的茶杯，无一处不是刻意的。",
  "afternoon": "午后的光线斜进来，灰尘在空气里浮动，懒洋洋的，像是这个院子的时间早就停了。",
  "dusk":      "夕阳把院墙烧成暗橙色，然后慢慢冷却。这个时候站在这里，有种说不清的沉。",
  "night":     "月光落在院子里，四下无声。这个地方白天还能看清，夜里只剩下轮廓和猜测。"
},
"ambientByFlag": [
  {
    "requires": { "flags": ["fei_ye_identity_confirmed"] },
    "text": "你知道这里住过谁了。再看这些陈设，每一样都有了具体的重量。"
  },
  {
    "requires": { "flags": ["fei_ye_upper_truth_known"] },
    "text": "你在这里见过他，说了那些话。空气里还留着什么，像是对话没有真正结束。"
  }
]
```

- [ ] **Step 2: 为 leyou_plain 添加字段**

在该对象末尾追加：

```json
"ambientByTime": {
  "dawn": "长安城还在黑暗里，但乐游原的高地上天色已经开始变了。城市的轮廓从黑暗中一点点浮现，你站在这里，像是站在时间的前面。",
  "dusk": "夕阳把整个长安城染成深金色，然后慢慢沉下去。「夕阳无限好，只是近黄昏」——这片高地上，那种感觉是真实的。"
},
"ambientByFlag": [
  {
    "requires": { "flags": ["ruins_dawn_seen"] },
    "text": "那块石碑和上面的刻痕，你已经知道意味着什么了。再站在这里，目光会不由自主地落过去。"
  }
]
```

- [ ] **Step 3: 为 tianji_ruins_ch3 添加字段**

在该对象末尾追加：

```json
"ambientByTime": {
  "dawn":    "天将亮，「天机阁」三字在尘埃下比白天更难辨认。这个时候站在这里，有一种第一次来和最后一次来之间说不清的叠合感。",
  "morning": "晨光慢慢把这个院子照亮。荒草、青砖、古井——都是原来的样子，却因为你现在知道的事，变成了另一个样子。",
  "dusk":    "夕阳的最后一线光留在院墙顶上，然后消失。这个地方在暮色里有一种正在结束的感觉。",
  "night":   "夜里的天机旧宅只有轮廓，「天机阁」三字彻底没入黑暗。但你知道它在那里。"
},
"ambientByFlag": [
  {
    "requires": { "flags": ["fei_ye_identity_confirmed"] },
    "text": "飞爷的名字和这个地方，你现在都知道了。它们之间的关系在你脑子里慢慢成形，比你第一次来时感受到的更沉。"
  }
]
```

- [ ] **Step 4: 为 qujiang_pavilion 添加字段**

在该对象末尾追加：

```json
"ambientByTime": {
  "dawn":      "曲江池在黎明里平静得像一面镜子，亭子的轮廓映在水里，比实物更清晰。这个时候来，池边几乎没有人。",
  "morning":   "晨光落在水面上，波光碎碎的。池边有几个早起的人，远远的，各有各的心事。",
  "noon":      "正午的曲江池光线刺眼，水面的反光让人难以直视。日头最烈的时候，亭子里反而有一种安静。",
  "afternoon": "午后的光把亭子的影子拉长，投在水面上晃动。池边的柳条垂下来，风一来，掠过水面。",
  "dusk":      "夕阳在曲江池上燃起来，然后一点一点沉进水里。这个时候的曲江亭，有一种什么都快说完了的感觉。",
  "night":     "夜里的曲江池只有月光。水面安静，偶有涟漪，很快平复。亭子在夜色里就是个黑色的轮廓。"
}
```

- [ ] **Step 5: 验证 JSON 格式**

```bash
python3 -c "import json; json.load(open('src/data/maps/chapter3.json')); print('chapter3.json OK')"
```

预期：`chapter3.json OK`

- [ ] **Step 6: 运行测试**

```bash
npx vitest run
```

预期：全部通过。

- [ ] **Step 7: 提交**

```bash
git add src/data/maps/chapter3.json
git commit -m "data: ambient text for ch3 — feiyes_manor/leyou_plain/tianji_ruins/qujiang"
```

---

### Task 6: 构建验证 + 推送

**Files:** 无新改动

- [ ] **Step 1: TypeScript 类型检查**

```bash
npx tsc -p tsconfig.app.json --noEmit
```

预期：0 errors。

- [ ] **Step 2: 全量测试**

```bash
npx vitest run
```

预期：全部通过（≥335 tests，含新增 ambientEngine 的 7 个）。

- [ ] **Step 3: 构建检查**

```bash
npx vite build 2>&1 | tail -10
```

预期：`built in Xs`，无错误。

- [ ] **Step 4: 推送**

```bash
git push origin main
```
