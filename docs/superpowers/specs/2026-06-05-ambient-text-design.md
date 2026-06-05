# 动态房间氛围文字 Design Spec

**日期：** 2026-06-05

## 目标

让每个房间在不同时段、不同剧情状态下显示不同的氛围描述文字，解决"每次进来都是同一段文字"和"时段没有存在感"的核心沉浸感问题。

---

## 架构

### 数据层扩展（`src/types/game.ts`）

在 `Room` interface 增加两个可选字段：

```ts
export interface AmbientFlagEntry {
  requires: Condition;
  text: string;
}

export interface Room {
  // ... 现有字段不变 ...
  ambientByTime?: Partial<Record<TimeOfDay, string>>;
  ambientByFlag?: AmbientFlagEntry[];
}
```

`ambientByFlag` 和 `ambientByTime` 均为可选。旧房间无需改动，向后兼容。

### 引擎层（新增 `src/engine/ambientEngine.ts`）

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

选取优先级：flag 变体（从上到下第一条满足的）> 时段变体 > 原始 `description`。

### UI 层（`src/pages/Game/Game.tsx`）

两个触发时机：
1. **进入新房间**（`setRoom` 调用后）：注入氛围文字到故事文本区。
2. **时段变化后仍在同一房间**（`advanceTime` 调用后）：刷新氛围文字。

注入方式：调用现有 `scene.setStoryText(ambientText)`，复用已有渲染管道。

---

## 房间内容

### 第一章

#### `lobby` 客栈大堂

**ambientByTime:**
```json
{
  "dawn":      "灶火刚燃，大堂里只有炊烟和掌柜一个人的背影。天将亮未亮，昨夜的气氛仿佛还没有散去。",
  "morning":   "朝食时分，几桌客人低声议论着昨夜的动静。掌柜李福站在柜台后，笑容比往日僵硬。",
  "noon":      "日头最盛，大堂里人声稀落。饭食的香气从后厨飘来，却没什么人有心思吃。",
  "afternoon": "午后的困倦笼在大堂里，伙计打着哈欠，食客寥寥。掌柜坐在柜台后翻账册，手指停在某一行，迟迟没有翻过去。",
  "dusk":      "夕阳把大堂染成橙红，第一盏油灯刚点上，火焰摇曳不定。今晚又要这样过去了。",
  "night":     "夜深人静，大堂只剩一盏灯。掌柜的背影在灯火下拉出长长的影子，他坐在那里，好像一直没动过。"
}
```

**ambientByFlag:**
```json
[
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

---

#### `room_202` 二楼客房（凶案现场）

**ambientByTime:**
```json
{
  "dawn":      "天光从虚掩的窗棂透进来，那几道干涸的血迹在晨光里看起来更深了，像是印进了木板里。",
  "morning":   "清晨的光线让房间每一处细节都无所遁形。木箱的划痕，地板上的拖拽印记，枕侧的血迹——你见过很多次了，却还是让人心里沉沉的。",
  "noon":      "正午的阳光从窗缝斜射进来，灰尘在光柱里慢慢浮动。房间安静得像是什么都没发生过，又像是什么都还留在这里。",
  "afternoon": "下午的光线在房间里打出长长的阴影。宋怀义的木箱还在原处，盖子没合严实，里面空荡荡的。",
  "dusk":      "夕阳最后的光线把房间照成暗橙色，然后慢慢消失。没有人来点灯。",
  "night":     "黑暗中，只有窗外的月光勉强照进一线。那些血迹在黑暗里成了另一种东西——更重，更难以面对。"
}
```

**ambientByFlag:**
```json
[
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

---

#### `room_203` 二楼客房（二〇三号）

**ambientByTime:**
```json
{
  "dawn":      "窗纸透出灰白的光，走廊里已有伙计的脚步声。你昨夜睡得不踏实，脑子里还在转。",
  "morning":   "晨光照进来，屋里的物件都清晰了。今天还有很多事要做。",
  "noon":      "午后的阳光把窗纸晒得发黄，房间里有些闷热。外面的声音远远传来，你在这里，暂时安静一下。",
  "afternoon": "一个人在房间里，脑子里把已知的线索默默理了一遍。思绪还是乱的。",
  "dusk":      "天色沉下去，走廊里有人走动。明天之前，还有多少事情没有答案。",
  "night":     "四下安静，只有窗外偶尔的风声。这一夜，你知道不会睡得安稳。"
}
```

---

#### `cellar` 地窖

**ambientByTime:**
```json
{
  "night": "石阶下，黑暗深得像一口井。你借着微光往下走，脚步声在青石上格外清晰。那道缝隙渗出的冷气在这个时辰更明显了。",
  "dawn":  "就算外面天色已白，地窖里依然是深夜。酒气和湿气裹在一起，说不清冷意是从地里来的，还是从别处来的。"
}
```

**ambientByFlag:**
```json
[
  {
    "requires": { "flags": ["cellar_night_seen"] },
    "text": "你知道那道墙后面有什么了。再站在这里，感觉不一样——那个发现不会消失，像一块石头压在心底。"
  }
]
```

---

#### `back_alley` 城郊后巷

**ambientByTime:**
```json
{
  "night": "月色把窄巷分成两半，一半勉强可以看清，一半彻底沉在阴影里。脚步声在这里会被放大。",
  "dawn":  "天将亮，巷子里的黑暗开始松动，像水慢慢退去。转角的刻痕出现在视野里，比昨晚更清楚了。"
}
```

---

### 第二章

#### `east_market_entrance` 东市入口

**ambientByTime:**
```json
{
  "dawn":      "晨雾最厚，东市外的街道轮廓模糊。早起的行脚商人推着货车，彼此不多说话，各怀心思。",
  "morning":   "东市渐渐热闹起来，但那股紧张气息没有随着人声散去。你在人群里，人群也在打量你。",
  "noon":      "日头正高，叫卖声把思绪挤得零碎。悬赏令还贴在坊墙上，没有人敢当众指点，但都在偷偷看。",
  "afternoon": "午后的东市开始往另一个方向走，做买卖的换了批人，眼神也换了种颜色。",
  "dusk":      "收摊的铃声陆续响起，人潮慢慢往坊内退去。暮色里，那张悬赏令的白纸格外显眼。",
  "night":     "东市夜间关门，外街只剩巡逻的兵士和偶尔闪过的人影。你在这里，目标太明显。"
}
```

**ambientByFlag:**
```json
[
  {
    "requires": { "flags": ["langpeng_discovered"] },
    "text": "你现在知道这条街上藏着什么了。走在这里，每一张随意的脸都值得多看一眼。"
  }
]
```

---

#### `yongning_nightmarket` 永宁坊夜市

**ambientByTime:**
```json
{
  "dusk":  "坊门刚关，夜市的灯火还稀稀落落，货商们压低声音谈着今晚的生意。",
  "night": "夜市到了最热闹的时候，灯火把人影拉得扭曲变形。这里流通的东西，比明面上的货物真实得多。",
  "dawn":  "快天亮了，夜市正在收摊。有些人赶着消失在夜色的最后一片里，有些人等着看今天的日出。"
}
```

**ambientByFlag:**
```json
[
  {
    "requires": { "flags": ["nightmarket_ledger_obtained"] },
    "text": "那个消息人的位置你现在记得了。人来人往的夜市里，他依然是最不显眼的那个。"
  }
]
```

---

#### `cien_temple` 慈恩寺偏院

**ambientByTime:**
```json
{
  "dawn":      "早课的诵经声在大雁塔上方飘散，偏院里只有鸟鸣和松风，安静得像是与长安城不在同一个地方。",
  "morning":   "晨光穿过老柏，在青砖上画出碎影。偶有香客从山门外走过，脚步声很快消失在走廊的尽头。",
  "noon":      "正午的日光把偏院晒得有些白，老柏的树荫是唯一阴凉。蝉声偶发，又忽然停了。",
  "afternoon": "午后的寺院连风声都小了，那间虚掩的僧房里，草药气息更加明显。",
  "dusk":      "黄昏钟声响起时，大雁塔的影子把偏院切成两半。这个时候的慈恩寺，有一种说不清的肃穆。",
  "night":     "夜里的偏院几乎看不清轮廓，只有塔顶的影子映在夜空里。脚步声在青砖上格外响。"
}
```

---

#### `pingkang_hideout` 平康坊据点

**ambientByTime:**
```json
{
  "night": "院门还关着，但你知道里面有人。周围没有别的动静，只有远处偶尔传来更夫的梆子声。",
  "dawn":  "天将亮，据点里的灯火已经熄了。青苔上的脚印还新鲜——有人刚离开，或是刚回来。"
}
```

---

### 第三章

#### `feiyes_manor` 飞爷故居

**ambientByTime:**
```json
{
  "dawn":      "院子里最后的夜色还没散尽，枯草上有细细的露水。飞爷故居在将明未明的光线里，比白天看起来更旧，也更重。",
  "morning":   "晨光打在院墙上，灰缝里的杂草投下细碎的影子。这个地方住过一个人，然后那个人消失了，留下这些东西替他说话。",
  "noon":      "正午的光把院子里的一切都照得清楚，书架上的空格，桌上的茶杯，无一处不是刻意的。",
  "afternoon": "午后的光线斜进来，灰尘在空气里浮动，懒洋洋的，像是这个院子的时间早就停了。",
  "dusk":      "夕阳把院墙烧成暗橙色，然后慢慢冷却。这个时候站在这里，有种说不清的沉。",
  "night":     "月光落在院子里，四下无声。这个地方白天还能看清，夜里只剩下轮廓和猜测。"
}
```

**ambientByFlag:**
```json
[
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

---

#### `leyou_plain` 乐游原

**ambientByTime:**
```json
{
  "dawn": "长安城还在黑暗里，但乐游原的高地上天色已经开始变了。城市的轮廓从黑暗中一点点浮现，你站在这里，像是站在时间的前面。",
  "dusk": "夕阳把整个长安城染成深金色，然后慢慢沉下去。「夕阳无限好，只是近黄昏」——这片高地上，那种感觉是真实的。"
}
```

**ambientByFlag:**
```json
[
  {
    "requires": { "flags": ["ruins_dawn_seen"] },
    "text": "那块石碑和上面的刻痕，你已经知道意味着什么了。再站在这里，目光会不由自主地落过去。"
  }
]
```

---

#### `tianji_ruins_ch3` 天机旧宅·故地

**ambientByTime:**
```json
{
  "dawn":    "天将亮，「天机阁」三字在尘埃下比白天更难辨认。这个时候站在这里，有一种第一次来和最后一次来之间说不清的叠合感。",
  "morning": "晨光慢慢把这个院子照亮。荒草、青砖、古井——都是原来的样子，却因为你现在知道的事，变成了另一个样子。",
  "dusk":    "夕阳的最后一线光留在院墙顶上，然后消失。这个地方在暮色里有一种正在结束的感觉。",
  "night":   "夜里的天机旧宅只有轮廓，「天机阁」三字彻底没入黑暗。但你知道它在那里。"
}
```

**ambientByFlag:**
```json
[
  {
    "requires": { "flags": ["fei_ye_identity_confirmed"] },
    "text": "飞爷的名字和这个地方，你现在都知道了。它们之间的关系在你脑子里慢慢成形，比你第一次来时感受到的更沉。"
  }
]
```

---

#### `qujiang_pavilion` 曲江亭

**ambientByTime:**
```json
{
  "dawn":      "曲江池在黎明里平静得像一面镜子，亭子的轮廓映在水里，比实物更清晰。这个时候来，池边几乎没有人。",
  "morning":   "晨光落在水面上，波光碎碎的。池边有几个早起的人，远远的，各有各的心事。",
  "noon":      "正午的曲江池光线刺眼，水面的反光让人难以直视。日头最烈的时候，亭子里反而有一种安静。",
  "afternoon": "午后的光把亭子的影子拉长，投在水面上晃动。池边的柳条垂下来，风一来，掠过水面。",
  "dusk":      "夕阳在曲江池上燃起来，然后一点一点沉进水里。这个时候的曲江亭，有一种什么都快说完了的感觉。",
  "night":     "夜里的曲江池只有月光。水面安静，偶有涟漪，很快平复。亭子在夜色里就是个黑色的轮廓。"
}
```

---

## 实现说明

### 新增文件
- `src/engine/ambientEngine.ts` — `getAmbientText(room, ctx): string`
- `tests/engine/ambientEngine.test.ts` — 单元测试

### 修改文件
- `src/types/game.ts` — Room 增加 `ambientByTime`、`ambientByFlag`、新增 `AmbientFlagEntry` interface
- `src/pages/Game/Game.tsx` — 进入房间 + 时段变化时调用 `getAmbientText` 并 `setStoryText`
- `src/data/maps/chapter1.json` — lobby, room_202, room_203, cellar, back_alley 增加字段
- `src/data/maps/chapter2.json` — east_market_entrance, yongning_nightmarket, cien_temple, pingkang_hideout 增加字段
- `src/data/maps/chapter3.json` — feiyes_manor, leyou_plain, tianji_ruins_ch3, qujiang_pavilion 增加字段

### UI 样式
氛围文字通过现有 `setStoryText` 注入，无需新增 UI 组件。如需视觉区分，可在 Game.tsx 中对氛围文字包一层 `<em>` 或通过 prose 样式渲染为斜体。

### 触发时机精确定义
- 进入新房间（currentRoom 变化）：立即注入
- `advanceTime` 后：若 currentRoom 未变，重新注入（时段变化使文字刷新）
- `setRoom` 调用 + `advanceTime` 调用均在 Game.tsx 中有明确位置

---

## 测试要点

- `getAmbientText` 优先返回第一条满足的 flag 变体
- 无 flag 命中时返回 `ambientByTime[timeOfDay]`
- 两者都缺席时返回 `room.description`（兜底）
- flag + 时段均存在时，flag 优先
- `ambientByFlag` 为空数组时不报错
- `ambientByTime` 缺某时段时，正确降级到 description

---

## 统计

- 13 个房间
- ~85 条氛围文字（72 时段变体 + 13 flag 变体）
- 新增 1 个引擎文件，修改 5 个文件
