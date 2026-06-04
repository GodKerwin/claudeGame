# 时间轴系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为三章游戏加入六时段系统，时段随事件触发推进，部分地点和事件限特定时段开放，LeftPanel 显示当前时段文字。

**Architecture:** `TimeOfDay` 类型从 `src/types/game.ts` export；`sceneStore` 持有 `timeOfDay` 状态；`conditionEvaluator` 的 `EvalContext` 新增 `timeOfDay` 字段；`Game.tsx` 在 evt 行动后调用 `advanceTime`；数据层用 `timeOfDay` 字段做时段门控。Tasks 严格按序执行（后续 task 依赖前序类型定义）。

**Tech Stack:** TypeScript + React 18 + Zustand；Vitest for tests。

---

## 文件清单

| 操作 | 文件 |
|---|---|
| 修改 | `src/types/game.ts` |
| 修改 | `src/store/sceneStore.ts` |
| 修改 | `src/engine/conditionEvaluator.ts` |
| 修改 | `src/pages/Game/Game.tsx` |
| 修改 | `src/components/layout/LeftPanel.tsx` |
| 修改 | `src/components/save/SaveLoadModal.tsx` |
| 修改 | `src/pages/MainMenu/MainMenu.tsx` |
| 修改 | `src/data/maps/chapter1.json` |
| 修改 | `src/data/maps/chapter2.json` |
| 修改 | `src/data/maps/chapter3.json` |
| 新建 | `tests/engine/timeSystem.test.ts` |

---

## Task 1：类型定义

**Files:**
- Modify: `src/types/game.ts`

- [ ] **Step 1.1：在 game.ts 顶部追加 TimeOfDay 类型**

在文件第一行之前插入：

```typescript
export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';
```

- [ ] **Step 1.2：Condition 追加 timeOfDay 字段**

找到：
```typescript
export interface Condition {
  strength?: number;
  agility?: number;
  wisdom?: number;
  constitution?: number;
  talent?: string;
  has?: string[];
  flags?: string[];
  flags_absent?: string[];
}
```

改为：
```typescript
export interface Condition {
  strength?: number;
  agility?: number;
  wisdom?: number;
  constitution?: number;
  talent?: string;
  has?: string[];
  flags?: string[];
  flags_absent?: string[];
  timeOfDay?: TimeOfDay[];
}
```

- [ ] **Step 1.3：EventAction 追加 timeCost 字段**

找到：
```typescript
export interface EventAction {
  id: string;
  label: string;
  requires: Condition | null;
  result: string;
  hint?: string;
  grants?: ActionGrant;
  evidenceGate?: EvidenceGate;
}
```

改为：
```typescript
export interface EventAction {
  id: string;
  label: string;
  requires: Condition | null;
  result: string;
  hint?: string;
  grants?: ActionGrant;
  evidenceGate?: EvidenceGate;
  timeCost?: 1 | 2;
}
```

- [ ] **Step 1.4：SaveData 追加 timeOfDay 字段**

找到：
```typescript
export interface SaveData {
  player: PlayerStats;
  currentRoomId: string;
  inventory: string[];
  clues: string[];
  flags: string[];
  questLog: string[];
  storyText: string[];
  seenDialogues: string[];
  visitedRooms: string[];
  foundSynthesisIds?: string[];
}
```

改为：
```typescript
export interface SaveData {
  player: PlayerStats;
  currentRoomId: string;
  inventory: string[];
  clues: string[];
  flags: string[];
  questLog: string[];
  storyText: string[];
  seenDialogues: string[];
  visitedRooms: string[];
  foundSynthesisIds?: string[];
  timeOfDay?: TimeOfDay;
}
```

- [ ] **Step 1.5：TypeScript 编译验证**

```bash
npx tsc --noEmit
```

期望：0 errors

- [ ] **Step 1.6：Commit**

```bash
git add src/types/game.ts
git commit -m "feat: add TimeOfDay type, Condition.timeOfDay, EventAction.timeCost, SaveData.timeOfDay"
```

---

## Task 2：Store — timeOfDay 状态 + advanceTime

**Files:**
- Modify: `src/store/sceneStore.ts`
- Create: `tests/engine/timeSystem.test.ts`

- [ ] **Step 2.1：写失败测试**

创建 `tests/engine/timeSystem.test.ts`：

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneStore } from '../../src/store/sceneStore';

describe('timeSystem', () => {
  beforeEach(() => {
    useSceneStore.getState().reset();
  });

  it('默认时段为 morning', () => {
    expect(useSceneStore.getState().timeOfDay).toBe('morning');
  });

  it('advanceTime(1) 从 morning 推进到 noon', () => {
    useSceneStore.getState().advanceTime(1);
    expect(useSceneStore.getState().timeOfDay).toBe('noon');
  });

  it('advanceTime(2) 从 morning 推进到 afternoon', () => {
    useSceneStore.getState().advanceTime(2);
    expect(useSceneStore.getState().timeOfDay).toBe('afternoon');
  });

  it('night 推进 1 步循环回 dawn', () => {
    // 手动设置为 night：morning(1) → noon(2) → afternoon(3) → dusk(4) → night(5)
    const store = useSceneStore.getState();
    store.advanceTime(5);
    expect(store.timeOfDay).toBe('night');
    store.advanceTime(1);
    expect(useSceneStore.getState().timeOfDay).toBe('dawn');
  });

  it('chapter2_started flag 重置 timeOfDay 为 morning', () => {
    const store = useSceneStore.getState();
    store.advanceTime(3); // → dusk
    store.addFlag('chapter2_started');
    expect(useSceneStore.getState().timeOfDay).toBe('morning');
  });

  it('chapter3_started flag 重置 timeOfDay 为 morning', () => {
    const store = useSceneStore.getState();
    store.advanceTime(3);
    store.addFlag('chapter3_started');
    expect(useSceneStore.getState().timeOfDay).toBe('morning');
  });
});
```

- [ ] **Step 2.2：运行测试，确认失败**

```bash
npx vitest run tests/engine/timeSystem.test.ts
```

期望：FAIL（`timeOfDay` 和 `advanceTime` 不存在）

- [ ] **Step 2.3：实现 store 变更**

打开 `src/store/sceneStore.ts`，做以下修改：

**a. 在文件顶部追加 import：**
```typescript
import type { TimeOfDay } from '../types/game';
```

**b. 在 `SceneState` interface 中，`interrogationLevels` 字段之后追加：**
```typescript
  timeOfDay: TimeOfDay;
  advanceTime: (steps?: number) => void;
```

**c. `loadState` 的 Partial Pick 加入 `timeOfDay`：**

将：
```typescript
  loadState: (state: Partial<Pick<SceneState,
    'currentRoomId' | 'flags' | 'clues' | 'questLog' | 'storyText' |
    'seenDialogues' | 'visitedRooms' | 'foundSynthesisIds' | 'interrogationLevels'>>) => void;
```

改为：
```typescript
  loadState: (state: Partial<Pick<SceneState,
    'currentRoomId' | 'flags' | 'clues' | 'questLog' | 'storyText' |
    'seenDialogues' | 'visitedRooms' | 'foundSynthesisIds' | 'interrogationLevels' | 'timeOfDay'>>) => void;
```

**d. `defaultState` 追加：**
```typescript
  timeOfDay: 'morning' as TimeOfDay,
```

**e. `addFlag` 实现改为在章节 flag 时重置 timeOfDay：**

将：
```typescript
  addFlag: (flag) =>
    set((s) => ({ flags: s.flags.includes(flag) ? s.flags : [...s.flags, flag] })),
```

改为：
```typescript
  addFlag: (flag) =>
    set((s) => {
      if (s.flags.includes(flag)) return s;
      const isChapterStart = flag === 'chapter2_started' || flag === 'chapter3_started';
      return {
        flags: [...s.flags, flag],
        ...(isChapterStart ? { timeOfDay: 'morning' as TimeOfDay } : {}),
      };
    }),
```

**f. 在 `setInterrogationLevel` 实现之后追加 `advanceTime`：**
```typescript
  advanceTime: (steps = 1) =>
    set((s) => {
      const ORDER: TimeOfDay[] = ['dawn', 'morning', 'noon', 'afternoon', 'dusk', 'night'];
      const idx = ORDER.indexOf(s.timeOfDay);
      return { timeOfDay: ORDER[(idx + steps) % ORDER.length] };
    }),
```

- [ ] **Step 2.4：运行测试，确认全部通过**

```bash
npx vitest run tests/engine/timeSystem.test.ts
```

期望：6/6 PASS

- [ ] **Step 2.5：运行全量测试**

```bash
npx vitest run
```

期望：全部通过（包含原有 228 tests）

- [ ] **Step 2.6：Commit**

```bash
git add src/store/sceneStore.ts tests/engine/timeSystem.test.ts
git commit -m "feat: timeOfDay state + advanceTime in sceneStore, tests"
```

---

## Task 3：conditionEvaluator — timeOfDay 评估

**Files:**
- Modify: `src/engine/conditionEvaluator.ts`

- [ ] **Step 3.1：追加测试用例到 timeSystem.test.ts**

打开 `tests/engine/timeSystem.test.ts`，在末尾追加新 describe 块：

```typescript
import { evaluate, isActionVisible } from '../../src/engine/conditionEvaluator';
import type { EvalContext } from '../../src/engine/conditionEvaluator';

describe('conditionEvaluator timeOfDay', () => {
  const baseCtx: EvalContext = {
    player: { name: '', template: '', strength: 6, agility: 6, wisdom: 6, constitution: 6, talent: '' },
    inventory: [],
    flags: [],
    timeOfDay: 'night',
  };

  it('timeOfDay 匹配时条件通过', () => {
    expect(evaluate({ timeOfDay: ['night', 'dawn'] }, baseCtx)).toBe(true);
  });

  it('timeOfDay 不匹配时条件失败', () => {
    expect(evaluate({ timeOfDay: ['morning', 'noon'] }, baseCtx)).toBe(false);
  });

  it('timeOfDay 不匹配时 isActionVisible 返回 false（隐藏，非置灰）', () => {
    expect(isActionVisible({ timeOfDay: ['morning'] }, baseCtx)).toBe(false);
  });

  it('无 timeOfDay 条件时正常通过', () => {
    expect(evaluate({}, baseCtx)).toBe(true);
  });
});
```

- [ ] **Step 3.2：运行测试，确认失败**

```bash
npx vitest run tests/engine/timeSystem.test.ts
```

期望：新增 4 个 conditionEvaluator 测试 FAIL（`timeOfDay` 字段不在 EvalContext）

- [ ] **Step 3.3：修改 conditionEvaluator.ts**

打开 `src/engine/conditionEvaluator.ts`，做以下修改：

**a. import 行追加 TimeOfDay：**
```typescript
import type { Condition, PlayerStats, TimeOfDay } from '../types/game';
```

**b. `EvalContext` 追加字段：**
```typescript
export interface EvalContext {
  player: PlayerStats;
  inventory: string[];
  flags: string[];
  timeOfDay: TimeOfDay;
}
```

**c. `isActionVisible` 中，在 `if (condition.has?.some(...))` 之后追加 timeOfDay 隐藏判断：**

找到：
```typescript
  if (condition.has?.some((i) => !ctx.inventory.includes(i))) return false;
  // 只剩属性/天赋未满足 → 置灰显示
  return true;
```

改为：
```typescript
  if (condition.has?.some((i) => !ctx.inventory.includes(i))) return false;
  if (condition.timeOfDay && !condition.timeOfDay.includes(ctx.timeOfDay)) return false;
  // 只剩属性/天赋未满足 → 置灰显示
  return true;
```

**d. `evaluate` 函数末尾，在 `return true` 之前追加：**

找到文件末尾的：
```typescript
  if (condition.flags_absent) {
    for (const flag of condition.flags_absent) {
      if (flags.includes(flag)) return false;
    }
  }
  return true;
```

改为：
```typescript
  if (condition.flags_absent) {
    for (const flag of condition.flags_absent) {
      if (flags.includes(flag)) return false;
    }
  }
  if (condition.timeOfDay && !condition.timeOfDay.includes(ctx.timeOfDay)) return false;
  return true;
```

- [ ] **Step 3.4：运行测试，确认全部通过**

```bash
npx vitest run tests/engine/timeSystem.test.ts
```

期望：全部 10 tests PASS

- [ ] **Step 3.5：TypeScript 编译验证**

```bash
npx tsc --noEmit
```

> 此步骤会报 Game.tsx、LeftPanel.tsx 等调用 `evaluate` 的地方类型错误（`ctx` 缺少 `timeOfDay`），记录错误，继续 Task 4。

- [ ] **Step 3.6：Commit**

```bash
git add src/engine/conditionEvaluator.ts tests/engine/timeSystem.test.ts
git commit -m "feat: add timeOfDay to EvalContext and evaluate/isActionVisible"
```

---

## Task 4：Game.tsx — ctx 传入 timeOfDay + advanceTime 调用

**Files:**
- Modify: `src/pages/Game/Game.tsx`

- [ ] **Step 4.1：从 sceneStore 解构 timeOfDay**

找到（约第 130 行）：
```typescript
  const scene = useSceneStore();
```

在之后找到解构场景状态的地方，确认 `scene.timeOfDay` 可用（通过 `scene.timeOfDay` 直接访问即可，无需单独解构）。

- [ ] **Step 4.2：ctx useMemo 追加 timeOfDay**

找到：
```typescript
  const ctx = useMemo<EvalContext>(() => ({
    player: {
      name: player.name,
      template: player.template,
      strength: player.strength,
      agility: player.agility,
      wisdom: player.wisdom,
      constitution: player.constitution,
      talent: player.talent,
    },
    inventory: items,
    flags: scene.flags,
  }), [player, items, scene.flags]);
```

改为：
```typescript
  const ctx = useMemo<EvalContext>(() => ({
    player: {
      name: player.name,
      template: player.template,
      strength: player.strength,
      agility: player.agility,
      wisdom: player.wisdom,
      constitution: player.constitution,
      talent: player.talent,
    },
    inventory: items,
    flags: scene.flags,
    timeOfDay: scene.timeOfDay,
  }), [player, items, scene.flags, scene.timeOfDay]);
```

- [ ] **Step 4.3：handleAction 中 applyGrants 之后调用 advanceTime**

找到（约第 389 行）：
```typescript
      applyGrants(action.grants, scene, addItem, removeItem, player);
    } else if (entityId.startsWith('npc_')) {
```

在 `applyGrants(action.grants, ...)` 之后、`} else if` 之前插入：
```typescript
      scene.advanceTime(action.timeCost ?? 1);
```

- [ ] **Step 4.4：TypeScript 编译验证**

```bash
npx tsc --noEmit
```

期望：错误数减少，仅剩 LeftPanel.tsx 相关错误（下一 Task 修复）

- [ ] **Step 4.5：Commit**

```bash
git add src/pages/Game/Game.tsx
git commit -m "feat: pass timeOfDay to EvalContext, advanceTime on evt action"
```

---

## Task 5：LeftPanel.tsx — ctx 传入 timeOfDay + 时段 UI

**Files:**
- Modify: `src/components/layout/LeftPanel.tsx`

- [ ] **Step 5.1：从 sceneStore 解构 timeOfDay**

找到（约第 20 行）：
```typescript
  const { currentRoomId, flags, visitedRooms } = useSceneStore();
```

改为：
```typescript
  const { currentRoomId, flags, visitedRooms, timeOfDay } = useSceneStore();
```

- [ ] **Step 5.2：追加 TIME_LABELS 常量**

在 `export function LeftPanel` 函数定义之前追加：

```typescript
import type { TimeOfDay } from '../../types/game';

const TIME_LABELS: Record<TimeOfDay, string> = {
  dawn: '寅时·将明',
  morning: '辰时·晨光',
  noon: '午时·日正',
  afternoon: '申时·斜阳',
  dusk: '酉时·暮色',
  night: '亥时·夜深',
};
```

- [ ] **Step 5.3：ctx useMemo 追加 timeOfDay**

找到（约第 35 行）：
```typescript
  const ctx = useMemo<EvalContext>(() => ({
    player: { ... },
    inventory: items,
    flags,
  }), [..., flags]);
```

在 `flags,` 之后追加 `timeOfDay,`，并将 `flags` 依赖改为也包含 `timeOfDay`：

```typescript
  const ctx = useMemo<EvalContext>(() => ({
    player: {
      name: player.name,
      template: player.template,
      strength: player.strength,
      agility: player.agility,
      wisdom: player.wisdom,
      constitution: player.constitution,
      talent: player.talent,
    },
    inventory: items,
    flags,
    timeOfDay,
  }), [player.name, player.template, player.strength, player.agility,
      player.wisdom, player.constitution, player.talent, items, flags, timeOfDay]);
```

- [ ] **Step 5.4：在地图标题上方插入时段行**

找到（约第 122 行）：
```tsx
        {/* 章节名 */}
        <p className="text-gold/30 text-[9px] tracking-[0.35em] px-1">
          {currentMap.name}
        </p>
```

在 `{/* 章节名 */}` 之前插入：
```tsx
        {/* 时段 */}
        <p className="text-gold/40 text-[10px] tracking-[0.3em] text-center">
          {TIME_LABELS[timeOfDay]}
        </p>
```

- [ ] **Step 5.5：TypeScript 编译验证**

```bash
npx tsc --noEmit
```

期望：0 errors

- [ ] **Step 5.6：运行全量测试**

```bash
npx vitest run
```

期望：全部通过

- [ ] **Step 5.7：Commit**

```bash
git add src/components/layout/LeftPanel.tsx
git commit -m "feat: timeOfDay in LeftPanel ctx + 时段显示 UI"
```

---

## Task 6：存档兼容 — SaveLoadModal + MainMenu

**Files:**
- Modify: `src/components/save/SaveLoadModal.tsx`
- Modify: `src/pages/MainMenu/MainMenu.tsx`

- [ ] **Step 6.1：SaveLoadModal 读档时传入 timeOfDay**

打开 `src/components/save/SaveLoadModal.tsx`，找到 `handleLoad` 函数中的 `scene.loadState({...})` 调用（约第 74 行）：

```typescript
    scene.loadState({
      currentRoomId: data.currentRoomId,
      flags: data.flags ?? [],
      clues: data.clues ?? [],
      questLog: data.questLog ?? [],
      storyText: (data.storyText ?? []).slice(-20),
      seenDialogues: data.seenDialogues ?? [],
      visitedRooms: data.visitedRooms ?? [data.currentRoomId],
      foundSynthesisIds: data.foundSynthesisIds ?? [],
    });
```

改为：
```typescript
    scene.loadState({
      currentRoomId: data.currentRoomId,
      flags: data.flags ?? [],
      clues: data.clues ?? [],
      questLog: data.questLog ?? [],
      storyText: (data.storyText ?? []).slice(-20),
      seenDialogues: data.seenDialogues ?? [],
      visitedRooms: data.visitedRooms ?? [data.currentRoomId],
      foundSynthesisIds: data.foundSynthesisIds ?? [],
      timeOfDay: data.timeOfDay ?? 'morning',
    });
```

- [ ] **Step 6.2：SaveLoadModal 存档时保存 timeOfDay**

在同一文件找到 `handleSave` 函数中构建 `SaveData` 的地方，追加 `timeOfDay: scene.timeOfDay`。需要先确认 `scene` 是否已从 `useSceneStore` 解构，如未解构则追加解构。

读取文件后找到 handleSave 中 saveToSlot 的调用，在传入的 data 对象追加：
```typescript
      timeOfDay: scene.timeOfDay,
```

- [ ] **Step 6.3：MainMenu 自动读档时传入 timeOfDay**

打开 `src/pages/MainMenu/MainMenu.tsx`，找到 `scene.loadState({...})` 调用（约第 103 行），在对象末尾追加：
```typescript
      timeOfDay: data.timeOfDay ?? 'morning',
```

- [ ] **Step 6.4：TypeScript 编译验证**

```bash
npx tsc --noEmit
```

期望：0 errors

- [ ] **Step 6.5：运行全量测试**

```bash
npx vitest run
```

期望：全部通过

- [ ] **Step 6.6：Commit**

```bash
git add src/components/save/SaveLoadModal.tsx src/pages/MainMenu/MainMenu.tsx
git commit -m "feat: persist timeOfDay in save/load"
```

---

## Task 7：数据层 — 时段门控 JSON

**Files:**
- Modify: `src/data/maps/chapter1.json`
- Modify: `src/data/maps/chapter2.json`
- Modify: `src/data/maps/chapter3.json`

- [ ] **Step 7.1：chapter1 — back_alley 时段限制**

打开 `src/data/maps/chapter1.json`，找到 `"id": "back_alley"` 的 room，将其 `"requires"` 字段：

```json
"requires": { "flags": ["found_escape_clue"] }
```

改为：
```json
"requires": { "flags": ["found_escape_clue"], "timeOfDay": ["night", "dawn"] }
```

- [ ] **Step 7.2：chapter1 — cellar revisitEvent 追加夜晚血迹**

找到 `"id": "cellar"` 的 room，在其 `"revisitEvents"` 数组末尾追加（若无 revisitEvents 字段则新增）：

```json
,
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

- [ ] **Step 7.3：chapter2 — yongning_nightmarket 时段限制**

打开 `src/data/maps/chapter2.json`，找到 `"id": "yongning_nightmarket"` 的 room，将其 `"requires"` 字段（目前为 `{ "flags": ["langpeng_discovered"] }`）改为：

```json
"requires": { "flags": ["langpeng_discovered"], "timeOfDay": ["dusk", "night", "dawn"] }
```

- [ ] **Step 7.4：chapter2 — pingkang_hideout 时段限制**

找到 `"id": "pingkang_hideout"` 的 room（目前 requires 为 `{ "flags": ["langpeng_trail"] }`），改为：

```json
"requires": { "flags": ["langpeng_trail"], "timeOfDay": ["night", "dawn"] }
```

- [ ] **Step 7.5：chapter3 — leyou_plain 时段限制**

打开 `src/data/maps/chapter3.json`，找到 `"id": "leyou_plain"` 的 room（目前 requires 为 null），改为：

```json
"requires": { "timeOfDay": ["dawn", "dusk"] }
```

- [ ] **Step 7.6：chapter3 — tianji_ruins_ch3 revisitEvent 追加清晨暗记**

找到 `"id": "tianji_ruins_ch3"` 的 room，在其 `"revisitEvents"` 数组末尾追加：

```json
,
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

- [ ] **Step 7.7：运行全量测试**

```bash
npx vitest run
```

期望：全部通过（integrity tests 会验证 revisitEvent 字段结构）

- [ ] **Step 7.8：Commit**

```bash
git add src/data/maps/chapter1.json src/data/maps/chapter2.json src/data/maps/chapter3.json
git commit -m "data: 时段门控 — back_alley/cellar/夜市/藏身处/乐游原/天机旧宅"
```

---

## Task 8：Build 验证 + Push

- [ ] **Step 8.1：Build 验证**

```bash
npm run build
```

期望：✓ built in Xs，0 errors

- [ ] **Step 8.2：Push**

```bash
git push origin main
```
