# 时间轴系统 Design Spec

## Goal

为三章游戏加入时段系统，部分地点和事件只在特定时段开放，增加世界沉浸感和探索节奏变化。无时间惩罚机制，玩家可自由探索。

## Architecture

**Store 层**：`sceneStore` 新增 `timeOfDay` 状态和 `advanceTime` 方法。  
**条件层**：`conditionEvaluator` 新增 `timeOfDay` 字段评估。  
**数据层**：`Condition` 和 `EventAction` 各追加一个新字段，房间和事件 JSON 按需标注时段。  
**UI 层**：`LeftPanel` 顶部显示当前时段文字。

## TimeOfDay 枚举

```typescript
type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';
```

顺序循环：dawn → morning → noon → afternoon → dusk → night → dawn → …

中文展示映射：
| 枚举值 | 展示文字 |
|---|---|
| dawn | 寅时·将明 |
| morning | 辰时·晨光 |
| noon | 午时·日正 |
| afternoon | 申时·斜阳 |
| dusk | 酉时·暮色 |
| night | 亥时·夜深 |

## Store 变更（`src/store/sceneStore.ts`）

新增字段：
```typescript
timeOfDay: TimeOfDay;
advanceTime: (steps?: number) => void;
```

`defaultState.timeOfDay = 'morning'`

`advanceTime` 实现：
```typescript
advanceTime: (steps = 1) =>
  set((s) => {
    const ORDER: TimeOfDay[] = ['dawn', 'morning', 'noon', 'afternoon', 'dusk', 'night'];
    const idx = ORDER.indexOf(s.timeOfDay);
    return { timeOfDay: ORDER[(idx + steps) % ORDER.length] };
  }),
```

章节切换（`chapter2_started` / `chapter3_started` flag 加入时重置）：在 `addFlag` 的 set 中，若 flag 为 `chapter2_started` 或 `chapter3_started`，同时重置 `timeOfDay: 'morning'`。

`loadState` 的 Partial Pick 加入 `timeOfDay`，旧存档不含该字段时默认 `morning`。

## 类型变更（`src/types/game.ts`）

`Condition` 追加：
```typescript
timeOfDay?: TimeOfDay[];
```

`EventAction` 追加：
```typescript
timeCost?: 1 | 2;
```

`TimeOfDay` 类型在此文件 export。

## 条件评估（`src/engine/conditionEvaluator.ts`）

在现有条件评估末尾追加：
```typescript
if (cond.timeOfDay && !cond.timeOfDay.includes(scene.timeOfDay)) return false;
```

参数签名需新增 `timeOfDay: TimeOfDay` 入参（或传入完整 scene 对象）。

## Game.tsx 时间推进

在 `handleAction` 的 `applyGrants` 调用之后追加：
```typescript
const cost = action.timeCost ?? 1;
scene.advanceTime(cost);
```

仅在 `evt_` 事件的 action 触发时推进（NPC dialogue、revisitEvent 不消耗时间）。

## 时段门控数据

### 第一章

| 位置 | 字段 | 时段 |
|---|---|---|
| `back_alley` room.requires | 追加 `timeOfDay: ["night","dawn"]` | 夜深/将明 |
| `evt_wall_sounds` 所有 actions | 追加 `timeCost: 1`（已有）；event 的 room interactable 加 requires.timeOfDay | `["dawn","morning"]` |
| `cellar` revisitEvent 新增一条 | requires.timeOfDay: `["night"]` | 夜里血迹反光 |

具体数据：

**`back_alley` room（`src/data/maps/chapter1.json`）**：
```json
"requires": { "flags": ["found_escape_clue"], "timeOfDay": ["night", "dawn"] }
```

**`cellar` revisitEvent 追加**：
```json
{
  "id": "rev_cellar_night_bloodstain",
  "requires": {
    "flags": ["innkeeper_trusted"],
    "flags_absent": ["cellar_night_seen"],
    "timeOfDay": ["night"]
  },
  "text": "〔烛光在地窖角落打出低斜的影——你这才看见，石缝里有一道细长的暗红。不是霉斑，是血，已经干透了，藏在白日的阴影里。〕",
  "grants": { "flags": ["cellar_night_seen"] }
}
```

### 第二章

**`yongning_nightmarket` room（`src/data/maps/chapter2.json`）**：
```json
"requires": { "flags": ["langpeng_discovered"], "timeOfDay": ["dusk", "night", "dawn"] }
```

**`pingkang_hideout` room**：
```json
"requires": { "flags": ["langpeng_trail"], "timeOfDay": ["night", "dawn"] }
```
（原 requires 只有 `langpeng_trail`，追加 `timeOfDay`）

**`imperial_teahouse` 某 action 追加 `timeCost: 2`**：
evt 内审讯关键行动标注 `"timeCost": 2`

### 第三章

**`leyou_plain` room.requires**：
```json
"requires": { "timeOfDay": ["dawn", "dusk"] }
```
（原 requires 为 null，改为时段限制）

**`evt_fei_ye_confrontation` 所有 actions**：追加 `"timeCost": 2`

**`tianji_ruins_ch3` revisitEvent 追加**：
```json
{
  "id": "rev_ruins_dawn_mark",
  "requires": {
    "flags": ["fei_ye_identity_confirmed"],
    "flags_absent": ["ruins_dawn_seen"],
    "timeOfDay": ["dawn"]
  },
  "text": "〔晨雾未散，残墙上有一道刻痕在斜光里浮现——三道竖线，一个缺角的方框。天机的旧印记。〕",
  "grants": { "flags": ["ruins_dawn_seen"] }
}
```

## UI 变更（`src/components/layout/LeftPanel.tsx`）

在地图标题区上方插入时段行：
```tsx
<div className="text-gold/40 text-[10px] tracking-[0.3em] text-center mb-2">
  {TIME_LABELS[scene.timeOfDay]}
</div>
```

`TIME_LABELS` 常量：
```typescript
const TIME_LABELS: Record<TimeOfDay, string> = {
  dawn: '寅时·将明',
  morning: '辰时·晨光',
  noon: '午时·日正',
  afternoon: '申时·斜阳',
  dusk: '酉时·暮色',
  night: '亥时·夜深',
};
```

## 存档兼容

`saveEngine.ts` 的存档结构加入 `timeOfDay`，读取旧存档时：
```typescript
timeOfDay: saved.timeOfDay ?? 'morning'
```

## 测试覆盖

新增 `tests/engine/timeSystem.test.ts`：
- `advanceTime` 循环正确（night → dawn）
- `advanceTime(2)` 跨 2 步正确
- conditionEvaluator 在 timeOfDay 不匹配时返回 false
- conditionEvaluator 在 timeOfDay 匹配时通过
- 章节切换重置 timeOfDay 为 morning

## Files to Modify

| 操作 | 文件 |
|---|---|
| 修改 | `src/types/game.ts` |
| 修改 | `src/store/sceneStore.ts` |
| 修改 | `src/engine/conditionEvaluator.ts` |
| 修改 | `src/pages/Game/Game.tsx` |
| 修改 | `src/components/layout/LeftPanel.tsx` |
| 修改 | `src/data/maps/chapter1.json` |
| 修改 | `src/data/maps/chapter2.json` |
| 修改 | `src/data/maps/chapter3.json` |
| 新建 | `tests/engine/timeSystem.test.ts` |
