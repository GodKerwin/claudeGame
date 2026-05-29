# 天机残卷 游戏改进实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复7项已知问题：NPC对话卡关、问号显示、提示系统、移动端、属性成长、职业重设计、职业差异强化，并保证所有测试通过。

**Architecture:** Bug修复和类型扩展先行，然后新职业数据替换，最后提示系统重写（依赖对新职业的理解）。属性成长通过扩展ActionGrant类型实现，Game.tsx统一处理授予逻辑。移动端通过GameLayout内嵌状态+Tailwind断点实现，不改动各Panel组件内部。

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS, Vite, Vitest

---

## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/types/game.ts` | 修改 | ActionGrant加stat字段 |
| `src/store/playerStore.ts` | 修改 | 加incrementStat action |
| `src/engine/saveEngine.ts` | 修改 | seenDialogues向后兼容迁移 |
| `src/engine/conditionEvaluator.ts` | 修改 | 新天赋ID的属性加成逻辑 |
| `src/engine/hintEngine.ts` | 重写 | HintContext加talent，全量重写规则 |
| `src/pages/Game/Game.tsx` | 修改 | seenDialogues章节前缀，stat grants处理 |
| `src/components/layout/GameLayout.tsx` | 修改 | 移动端底部标签栏 |
| `src/components/layout/RightPanel.tsx` | 修改 | 修复"?"，显示属性成长delta |
| `src/pages/CharacterCreate/CharacterCreate.tsx` | 修改 | 移除±调整UI |
| `src/data/templates.json` | 替换 | 5个全新职业 |
| `src/data/talents.json` | 替换 | 5个全新天赋 |
| `src/data/events/chapter1.json` | 修改 | 更新旧天赋ID引用，加2个成长事件 |
| `src/data/npcs/chapter1.json` | 修改 | 更新旧天赋ID引用 |
| `src/data/events/chapter2.json` | 修改 | 加2个成长事件 |
| `src/data/events/chapter3.json` | 修改 | 加2个成长事件 |
| `tests/engine/conditionEvaluator.test.ts` | 修改 | 更新天赋测试用例 |
| `tests/engine/saveEngine.test.ts` | 修改 | 加seenDialogues迁移测试 |

---

## Task 1: 修复"?"字符细长显示

**Files:**
- Modify: `src/components/layout/RightPanel.tsx:93`

- [ ] **Step 1: 定位并修复"?"的样式**

将 `RightPanel.tsx` 第93行：
```tsx
<span className="text-ink/30 hover:text-gold/50 cursor-help ml-1">?</span>
```
改为：
```tsx
<span className="font-sans inline-block min-w-[1em] text-center text-ink/30 hover:text-gold/50 cursor-help ml-1">?</span>
```

- [ ] **Step 2: 验证（视觉）**

运行 `npm run dev`，进入游戏页面，在右侧面板"未竟之事"区域确认"?"字符宽度正常，不再细长。

- [ ] **Step 3: 提交**

```bash
git add src/components/layout/RightPanel.tsx
git commit -m "fix: 修复未竟之事问号字符在中文字体下渲染细长的问题"
```

---

## Task 2: 修复NPC跨章节对话锁定

**Files:**
- Modify: `src/pages/Game/Game.tsx:127,190,197`
- Modify: `src/engine/saveEngine.ts`

- [ ] **Step 1: 写失败测试（saveEngine迁移）**

在 `tests/engine/saveEngine.test.ts` 末尾添加：
```typescript
import { migrateSeenDialogues } from '../../src/engine/saveEngine';

describe('migrateSeenDialogues', () => {
  it('adds ch1 prefix to keys without chapter prefix', () => {
    const old = ['npc_wujue:first_meet', 'npc_lifude:greeting'];
    const migrated = migrateSeenDialogues(old);
    expect(migrated).toEqual(['ch1:npc_wujue:first_meet', 'ch1:npc_lifude:greeting']);
  });

  it('leaves already-prefixed keys unchanged', () => {
    const keys = ['ch2:npc_wujue:stele_reading', 'ch1:npc_lifude:greeting'];
    expect(migrateSeenDialogues(keys)).toEqual(keys);
  });

  it('handles empty array', () => {
    expect(migrateSeenDialogues([])).toEqual([]);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test -- tests/engine/saveEngine.test.ts
```
期望：FAIL，`migrateSeenDialogues is not a function`

- [ ] **Step 3: 在saveEngine.ts中导出migrateSeenDialogues函数**

在 `src/engine/saveEngine.ts` 末尾添加：
```typescript
export function migrateSeenDialogues(keys: string[]): string[] {
  return keys.map((key) => (/^ch\d:/.test(key) ? key : `ch1:${key}`));
}
```

并修改 `loadFromSlot` 函数，在返回前迁移旧数据：
```typescript
export function loadFromSlot(slotId: number): SaveData | null {
  const slots = loadAllSlots();
  const slot = slots.find((s) => s.id === slotId);
  if (!slot?.data) return null;
  return {
    ...slot.data,
    seenDialogues: migrateSeenDialogues(slot.data.seenDialogues ?? []),
  };
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm test -- tests/engine/saveEngine.test.ts
```
期望：所有测试 PASS

- [ ] **Step 5: 修改Game.tsx中的对话键生成逻辑**

在 `src/pages/Game/Game.tsx` 中，`chapter` 常量已在第233行定义。在 `actions` useMemo（第126-143行）和 `handleAction`（第190-197行）中，把对话键从 `${interactableId}:${d.id}` 改为 `ch${chapter}:${interactableId}:${d.id}`：

第127行改为：
```typescript
const nextUnseen = dialogues.find(
  (d) => !scene.seenDialogues.includes(`ch${chapter}:${interactableId}:${d.id}`)
);
```

第190行改为：
```typescript
const nextUnseen = dialogues.find((d) => !scene.seenDialogues.includes(`ch${chapter}:${entityId}:${d.id}`));
```

第197行改为：
```typescript
scene.markDialogueSeen(`ch${chapter}:${entityId}:${d.id}`);
```

注意：`chapter` 的计算在第233行，但 `actions` useMemo在第89行。需要把 `chapter` 计算提前到两者之前：

将第233-237行的 `chapter` 计算移动到第73行（`const room = ...`之后，`const ctx = ...`之前）：
```typescript
const chapter: 1 | 2 | 3 = scene.flags.includes('chapter3_started')
  ? 3
  : scene.flags.includes('chapter2_started')
  ? 2
  : 1;
```

并在 `actions` useMemo的依赖数组（第143行）中加入 `chapter`：
```typescript
}, [scene.currentRoomId, scene.flags, scene.clues, scene.seenDialogues, pendingChoices, ctx, room, chapter]);
```

并删除原第233-237行重复的chapter计算（现在只在一处定义）。

- [ ] **Step 6: 运行全量测试**

```bash
npm test
```
期望：全量 PASS（没有测试直接测试dialogue key格式）

- [ ] **Step 7: 提交**

```bash
git add src/pages/Game/Game.tsx src/engine/saveEngine.ts tests/engine/saveEngine.test.ts
git commit -m "fix: 修复跨章节NPC对话被永久锁定的卡关问题"
```

---

## Task 3: 扩展ActionGrant支持属性成长

**Files:**
- Modify: `src/types/game.ts`
- Modify: `src/store/playerStore.ts`
- Modify: `src/pages/Game/Game.tsx`

- [ ] **Step 1: 写incrementStat失败测试**

在 `tests/engine/` 新建文件 `tests/engine/playerStore.test.ts`：
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from '../../src/store/playerStore';

beforeEach(() => {
  usePlayerStore.getState().reset();
  usePlayerStore.getState().setPlayer({
    name: '测试者', template: 'bukai',
    strength: 8, agility: 5, wisdom: 7, constitution: 4,
    talent: '官威',
  });
});

describe('incrementStat', () => {
  it('增加属性值', () => {
    usePlayerStore.getState().incrementStat('wisdom', 1);
    expect(usePlayerStore.getState().wisdom).toBe(8);
  });

  it('不超过12的上限', () => {
    usePlayerStore.getState().setPlayer({
      name: 'x', template: 'x',
      strength: 12, agility: 12, wisdom: 12, constitution: 12, talent: '',
    });
    usePlayerStore.getState().incrementStat('strength', 1);
    expect(usePlayerStore.getState().strength).toBe(12);
  });

  it('增量为0时不变', () => {
    usePlayerStore.getState().incrementStat('agility', 0);
    expect(usePlayerStore.getState().agility).toBe(5);
  });
});
```

- [ ] **Step 2: 运行确认失败**

```bash
npm test -- tests/engine/playerStore.test.ts
```
期望：FAIL，`incrementStat is not a function`

- [ ] **Step 3: 扩展types/game.ts中的ActionGrant**

将 `src/types/game.ts` 第22-28行的 `ActionGrant` 改为：
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
}
```

- [ ] **Step 4: 在playerStore.ts中添加incrementStat**

将 `src/store/playerStore.ts` 改为：
```typescript
import { create } from 'zustand';
import type { PlayerStats } from '../types/game';

type StatKey = 'strength' | 'agility' | 'wisdom' | 'constitution';

interface PlayerState extends PlayerStats {
  setPlayer: (player: PlayerStats) => void;
  incrementStat: (stat: StatKey, amount: number) => void;
  reset: () => void;
}

const defaultPlayer: PlayerStats = {
  name: '',
  template: '',
  strength: 6,
  agility: 6,
  wisdom: 6,
  constitution: 6,
  talent: '',
};

export const usePlayerStore = create<PlayerState>((set) => ({
  ...defaultPlayer,
  setPlayer: (player) => set(player),
  incrementStat: (stat, amount) =>
    set((s) => ({ [stat]: Math.min(12, s[stat] + amount) })),
  reset: () => set(defaultPlayer),
}));
```

- [ ] **Step 5: 运行playerStore测试确认通过**

```bash
npm test -- tests/engine/playerStore.test.ts
```
期望：PASS

- [ ] **Step 6: 在Game.tsx的handleAction中处理stat grants**

在 `src/pages/Game/Game.tsx` 中，找到事件动作处理（第178-183行）和对话选项处理（第156-165行），在两处的grants处理块中分别加入stat处理。

事件动作（第183行之后 `action.grants.quests?.forEach(...)` 后）：
```typescript
if (action.grants.strength) player.incrementStat('strength', action.grants.strength);
if (action.grants.agility) player.incrementStat('agility', action.grants.agility);
if (action.grants.wisdom) player.incrementStat('wisdom', action.grants.wisdom);
if (action.grants.constitution) player.incrementStat('constitution', action.grants.constitution);
```

对话选项（第163行之后）同样添加：
```typescript
if (choice.grants.strength) player.incrementStat('strength', choice.grants.strength);
if (choice.grants.agility) player.incrementStat('agility', choice.grants.agility);
if (choice.grants.wisdom) player.incrementStat('wisdom', choice.grants.wisdom);
if (choice.grants.constitution) player.incrementStat('constitution', choice.grants.constitution);
```

NPC对话（第199行之后d.grants处理）同样添加：
```typescript
if (d.grants.strength) player.incrementStat('strength', d.grants.strength);
if (d.grants.agility) player.incrementStat('agility', d.grants.agility);
if (d.grants.wisdom) player.incrementStat('wisdom', d.grants.wisdom);
if (d.grants.constitution) player.incrementStat('constitution', d.grants.constitution);
```

同时在文件顶部解构player时添加 `incrementStat`：
```typescript
const player = usePlayerStore();
```
（已经是这样，但需要确保 `player.incrementStat` 可调用）

- [ ] **Step 7: 运行全量测试**

```bash
npm test
```
期望：PASS

- [ ] **Step 8: 提交**

```bash
git add src/types/game.ts src/store/playerStore.ts src/pages/Game/Game.tsx tests/engine/playerStore.test.ts
git commit -m "feat: 扩展ActionGrant支持属性成长，添加incrementStat"
```

---

## Task 4: 移动端底部标签栏布局

**Files:**
- Modify: `src/components/layout/GameLayout.tsx`

- [ ] **Step 1: 重写GameLayout.tsx**

将 `src/components/layout/GameLayout.tsx` 完整替换为：
```tsx
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type MobilePanel = 'left' | 'center' | 'right';

interface Props {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}

const MOBILE_TABS: { key: MobilePanel; label: string }[] = [
  { key: 'left', label: '地图' },
  { key: 'center', label: '故事' },
  { key: 'right', label: '状态' },
];

export function GameLayout({ left, center, right }: Props) {
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('center');

  const panelContent: Record<MobilePanel, React.ReactNode> = { left, center, right };

  return (
    <div className="flex h-screen w-screen bg-paper text-ink font-serif overflow-hidden select-none">
      {/* Desktop: 三栏布局 (≥768px) */}
      <div className="hidden md:flex w-full h-full">
        <div className="w-40 shrink-0 panel border-r border-gold/20 flex flex-col overflow-hidden">
          {left}
        </div>
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gold/20">
          {center}
        </div>
        <div className="shrink-0 panel flex flex-col overflow-hidden" style={{ width: '200px' }}>
          {right}
        </div>
      </div>

      {/* Mobile: 单栏 + 底部标签栏 (<768px) */}
      <div className="flex md:hidden flex-col w-full h-full">
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={mobilePanel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {panelContent[mobilePanel]}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex border-t border-gold/20 bg-paper shrink-0 pb-safe">
          {MOBILE_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMobilePanel(key)}
              className={`flex-1 py-3 text-xs tracking-widest transition-colors cursor-pointer ${
                mobilePanel === key
                  ? 'text-gold border-t-2 border-gold -mt-px'
                  : 'text-ink/40 hover:text-ink/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证桌面端不受影响**

运行 `npm run dev`，在浏览器中确认：
- 宽度 ≥ 768px：三栏布局正常显示，与之前完全一致
- 宽度 < 768px：只显示一个面板，底部有「地图 | 故事 | 状态」三个标签，点击可切换

- [ ] **Step 3: 运行全量测试**

```bash
npm test
```
期望：PASS（无UI单元测试，主要确保无类型错误）

- [ ] **Step 4: 提交**

```bash
git add src/components/layout/GameLayout.tsx
git commit -m "feat: 移动端底部标签栏布局，兼容小屏幕设备"
```

---

## Task 5: 全新职业与天赋数据

**Files:**
- Modify: `src/data/templates.json` (完整替换)
- Modify: `src/data/talents.json` (完整替换)
- Modify: `src/engine/conditionEvaluator.ts`

- [ ] **Step 1: 写conditionEvaluator新天赋测试**

在 `tests/engine/conditionEvaluator.test.ts` 中，找到并替换旧天赋测试（`机关奇才` 和 `天生神力` 的测试，约第28-35行）为：

```typescript
it('talent 三寸不烂之舌 reduces wisdom requirement by 2', () => {
  const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '三寸不烂之舌' } };
  expect(evaluate({ wisdom: 8 }, ctx)).toBe(true); // wisdom 6+2=8, passes
});

it('talent 夜行百盗 reduces agility requirement by 2', () => {
  const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '夜行百盗' } };
  expect(evaluate({ agility: 8 }, ctx)).toBe(true); // agility 6+2=8, passes
});

it('talent 毒经百草 reduces constitution requirement by 2', () => {
  const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '毒经百草' } };
  expect(evaluate({ constitution: 8 }, ctx)).toBe(true); // constitution 6+2=8, passes
});

it('other talents do not get wisdom bonus', () => {
  const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '官威' } };
  expect(evaluate({ wisdom: 8 }, ctx)).toBe(false);
});
```

- [ ] **Step 2: 运行确认失败**

```bash
npm test -- tests/engine/conditionEvaluator.test.ts
```
期望：新增测试 FAIL（因为conditionEvaluator还用旧天赋ID）

- [ ] **Step 3: 替换templates.json**

完整替换 `src/data/templates.json`：
```json
[
  {
    "id": "bukai",
    "name": "捕快",
    "description": "奉旨缉拿的官差，以权破局，公正严明。",
    "flavor": "「天子脚下，法度森严，犯我大唐者，虽远必诛。」",
    "stats": { "strength": 8, "agility": 5, "wisdom": 7, "constitution": 4 },
    "talent": "官威"
  },
  {
    "id": "daoshi",
    "name": "道士",
    "description": "玄门行者，以观破局，洞察天机。",
    "flavor": "「道可道，非常道。名可名，非常名。」",
    "stats": { "strength": 3, "agility": 5, "wisdom": 9, "constitution": 7 },
    "talent": "望气观相"
  },
  {
    "id": "shuoshuren",
    "name": "说书人",
    "description": "走江湖的艺人，以言破局，消息灵通。",
    "flavor": "「一张嘴，走遍天下路；三寸舌，抵得千军万马。」",
    "stats": { "strength": 3, "agility": 7, "wisdom": 8, "constitution": 4 },
    "talent": "三寸不烂之舌"
  },
  {
    "id": "youfangyi",
    "name": "游方医",
    "description": "走方郎中，以医破局，悬壶济世。",
    "flavor": "「救人一命，胜造七级浮屠。」",
    "stats": { "strength": 4, "agility": 5, "wisdom": 6, "constitution": 9 },
    "talent": "毒经百草"
  },
  {
    "id": "feizei",
    "name": "飞贼",
    "description": "夜行的江湖客，以快破局，飞檐走壁。",
    "flavor": "「最好的证据，是别人不知道你已经拿走了。」",
    "stats": { "strength": 7, "agility": 10, "wisdom": 4, "constitution": 4 },
    "talent": "夜行百盗"
  }
]
```

- [ ] **Step 4: 替换talents.json**

完整替换 `src/data/talents.json`：
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
    "id": "三寸不烂之舌",
    "name": "三寸不烂之舌",
    "description": "走南闯北，一张嘴能说天下，人脉广布各行各业。",
    "effect": "解锁「说书劝说」NPC专属对话；智慧类社交事件门槛降低2点"
  },
  {
    "id": "毒经百草",
    "name": "毒经百草",
    "description": "通晓百草药理，百毒不侵，以毒攻毒，以药救人。",
    "effect": "免疫毒素区域；根骨门槛降低2点（毒物相关事件）；可为NPC疗伤换取信任"
  },
  {
    "id": "夜行百盗",
    "name": "夜行百盗",
    "description": "夜行江湖多年，身手矫健，无门不入。",
    "effect": "可进入「禁止进入」区域；敏捷门槛降低2点（潜行追踪事件）"
  }
]
```

- [ ] **Step 5: 更新conditionEvaluator.ts中的天赋加成逻辑**

将 `src/engine/conditionEvaluator.ts` 第13-20行改为：
```typescript
if (condition.wisdom !== undefined) {
  const bonus = player.talent === '三寸不烂之舌' ? 2 : 0;
  if (player.wisdom + bonus < condition.wisdom) return false;
}
if (condition.strength !== undefined) {
  if (player.strength < condition.strength) return false;
}
if (condition.agility !== undefined) {
  const bonus = player.talent === '夜行百盗' ? 2 : 0;
  if (player.agility + bonus < condition.agility) return false;
}
if (condition.constitution !== undefined) {
  const bonus = player.talent === '毒经百草' ? 2 : 0;
  if (player.constitution + bonus < condition.constitution) return false;
}
```

- [ ] **Step 6: 运行conditionEvaluator测试确认通过**

```bash
npm test -- tests/engine/conditionEvaluator.test.ts
```
期望：PASS

- [ ] **Step 7: 提交**

```bash
git add src/data/templates.json src/data/talents.json src/engine/conditionEvaluator.ts tests/engine/conditionEvaluator.test.ts
git commit -m "feat: 全新五大职业设计，重写天赋系统与条件评估逻辑"
```

---

## Task 6: 更新章节数据中的旧天赋引用

**Files:**
- Modify: `src/data/events/chapter1.json`
- Modify: `src/data/npcs/chapter1.json`

旧天赋ID映射表：
| 旧ID | 新ID | 原因 |
|------|------|------|
| `过目不忘` | `望气观相` | 同为观察/感知类天赋 |
| `江湖老千` | `三寸不烂之舌` | 同为社交/识破类天赋 |
| `毒体` | `毒经百草` | 同为毒素免疫类天赋 |
| `察言观色` | `三寸不烂之舌` | 同为社交洞察类天赋 |

- [ ] **Step 1: 更新events/chapter1.json中的旧天赋引用**

**第119行**：`"requires": { "talent": "过目不忘" }` → `"requires": { "talent": "望气观相" }`

**第127行**：`"talent": "江湖老千"` → `"talent": "三寸不烂之舌"`（同时将action的label从`识别告示中的帮派暗记（江湖老千）`改为`识别告示中的帮派暗记（说书人）`）

**第227行**：`"requires": { "constitution": 8, "talent": "毒体", "flags_absent": ["secret_room_opened"] }` → `"requires": { "constitution": 8, "talent": "毒经百草", "flags_absent": ["secret_room_opened"] }`

**第308行**：`"requires": { "talent": "过目不忘", "flags_absent": ["dafei_password_known"] }` → `"requires": { "talent": "望气观相", "flags_absent": ["dafei_password_known"] }`

- [ ] **Step 2: 更新npcs/chapter1.json中的旧天赋引用**

**第44行**：`"condition": { "wisdom": 7, "talent": "察言观色", "flags": ["innkeeper_met"] }` → `"condition": { "talent": "三寸不烂之舌", "flags": ["innkeeper_met"] }`（去掉wisdom:7限制，因为说书人本身wisdom 8已满足，改为直接天赋门控）

- [ ] **Step 3: 运行章节完整性测试**

```bash
npm test -- tests/data/
```
期望：全部 PASS（章节数据完整性测试验证event/npc/item/room引用的一致性）

- [ ] **Step 4: 提交**

```bash
git add src/data/events/chapter1.json src/data/npcs/chapter1.json
git commit -m "fix: 更新章节数据中的旧天赋ID引用为新天赋ID"
```

---

## Task 7: 简化角色创建页面（移除±调整）

**Files:**
- Modify: `src/pages/CharacterCreate/CharacterCreate.tsx`

- [ ] **Step 1: 重写CharacterCreate.tsx**

将 `src/pages/CharacterCreate/CharacterCreate.tsx` 完整替换为：
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TEMPLATES, TALENTS } from '../../data/loader';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import type { CharacterTemplate } from '../../types/game';

type StatKey = 'strength' | 'agility' | 'wisdom' | 'constitution';
const STAT_LABELS: Record<StatKey, string> = {
  strength: '力量',
  agility: '敏捷',
  wisdom: '智慧',
  constitution: '根骨',
};

export default function CharacterCreate() {
  const navigate = useNavigate();
  const setPlayer = usePlayerStore((s) => s.setPlayer);
  const resetScene = useSceneStore((s) => s.reset);
  const resetInventory = useInventoryStore((s) => s.reset);

  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<CharacterTemplate>(TEMPLATES[0]);

  const handleStart = () => {
    if (!name.trim()) return;
    resetScene();
    resetInventory();
    setPlayer({
      name: name.trim(),
      template: selectedTemplate.id,
      strength: selectedTemplate.stats.strength,
      agility: selectedTemplate.stats.agility,
      wisdom: selectedTemplate.stats.wisdom,
      constitution: selectedTemplate.stats.constitution,
      talent: selectedTemplate.talent,
    });
    navigate('/prologue');
  };

  const talent = TALENTS.find((t) => t.id === selectedTemplate.talent);

  return (
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center p-8">
      <h1 className="text-gold text-3xl mb-2 tracking-widest">天机残卷</h1>
      <p className="text-ink/50 text-sm mb-10 tracking-widest">立身江湖，从此起</p>

      <div className="w-full max-w-3xl space-y-8">
        <div className="flex gap-4 items-center">
          <label className="text-ink/60 text-sm w-16 shrink-0">角色名</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
            placeholder="江湖人称你什么…"
            className="flex-1 bg-transparent border-b border-gold/30 focus:border-gold outline-none py-1 text-ink placeholder:text-ink/20 text-sm"
          />
        </div>

        <div>
          <p className="text-gold/60 text-xs mb-3 tracking-widest">【选一身份】</p>
          <div className="grid grid-cols-5 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={`p-3 border text-sm transition-all cursor-pointer ${
                  selectedTemplate.id === t.id
                    ? 'border-gold text-gold shadow-[0_0_8px_rgba(201,168,76,0.3)]'
                    : 'border-gold/20 text-ink/60 hover:border-gold/40'
                }`}
              >
                <div className="font-bold mb-1">{t.name}</div>
                <div className="text-xs opacity-70 leading-tight">{t.description}</div>
              </button>
            ))}
          </div>
          {selectedTemplate && (
            <p className="mt-2 text-ink/40 text-xs italic">{selectedTemplate.flavor}</p>
          )}
        </div>

        <div>
          <p className="text-gold/60 text-xs mb-3 tracking-widest">【资质】</p>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(STAT_LABELS) as StatKey[]).map((stat) => (
              <div key={stat} className="flex items-center gap-3">
                <span className="w-10 text-ink/60 text-sm">{STAT_LABELS[stat]}</span>
                <span className="w-8 text-center text-gold font-bold">
                  {selectedTemplate.stats[stat]}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-ink/30 text-xs">资质由身份决定，可在江湖历练中提升。</p>
        </div>

        {talent && (
          <div className="border border-gold/10 p-4">
            <p className="text-gold/60 text-xs mb-2 tracking-widest">【秉性天赋】{talent.name}</p>
            <p className="text-ink/70 text-sm">{talent.description}</p>
            <p className="text-ink/40 text-xs mt-1">{talent.effect}</p>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={!name.trim()}
          className={`w-full py-3 border text-base tracking-widest transition-all ${
            name.trim()
              ? 'border-gold text-gold hover:shadow-[0_0_16px_rgba(201,168,76,0.4)] cursor-pointer'
              : 'border-gold/10 text-ink/20 cursor-not-allowed'
          }`}
        >
          踏入江湖
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证角色创建页面**

运行 `npm run dev`，访问角色创建页面，确认：
- 选择职业后显示该职业固定属性，无+/-按钮
- 显示"资质由身份决定，可在江湖历练中提升"说明文字
- 输入名字后点击"踏入江湖"正常进入序章

- [ ] **Step 3: 运行全量测试**

```bash
npm test
```
期望：PASS

- [ ] **Step 4: 提交**

```bash
git add src/pages/CharacterCreate/CharacterCreate.tsx
git commit -m "feat: 简化角色创建，移除属性点分配，属性由职业直接决定"
```

---

## Task 8: 添加章节属性成长事件

**Files:**
- Modify: `src/data/events/chapter1.json`
- Modify: `src/data/events/chapter2.json`
- Modify: `src/data/events/chapter3.json`

每章新增2个属性成长事件。事件需要有前置flag条件（要求已完成一定探索），且为一次性（`flags_absent: ["stat_grown_*"]`）。

- [ ] **Step 1: 在chapter1.json中找到合适位置，添加2个成长事件**

找到chapter1中的事件数组，在现有事件的最后一个事件之后追加以下JSON（作为新的顶级event对象）：

**事件1（推理成长，+1智慧）：**
```json
{
  "id": "evt_ch1_wisdom_growth",
  "title": "沉思案情",
  "description": "将所见所闻在脑中梳理一遍，试图找到那个被忽略的细节。",
  "requires": { "flags": ["body_examined", "innkeeper_met"] },
  "actions": [
    {
      "id": "deduce_carefully",
      "label": "反复推敲，终有所得",
      "requires": { "flags_absent": ["ch1_wisdom_grown"] },
      "result": "你将案发当晚的每一个细节逐一复盘。死者的坐姿、倒地方向、杯中茶的温度……一个被忽视的矛盾浮出水面。这番推敲让你的心思愈发缜密。【智慧 +1】",
      "grants": { "flags": ["ch1_wisdom_grown"], "wisdom": 1 }
    }
  ]
},
```

在chapter1的某个room（推荐为`room_203`命案房间）的`interactables`数组中加入`"evt_ch1_wisdom_growth"`。

**事件2（魄力成长，+1力量）：**
```json
{
  "id": "evt_ch1_strength_growth",
  "title": "以气势压人",
  "description": "正面与那些试图阻拦你的人周旋，用气势迫使对方退让。",
  "requires": { "flags": ["innkeeper_met"] },
  "actions": [
    {
      "id": "confront_directly",
      "label": "寸步不让，以身压之",
      "requires": { "strength": 5, "flags_absent": ["ch1_strength_grown"] },
      "result": "你挺直了身子，目光如炬，一字一句掷地有声。对方在你的气场下悄悄退后了半步。这一番周旋，让你愈发懂得如何以身躯作为说话的武器。【力量 +1】",
      "grants": { "flags": ["ch1_strength_grown"], "strength": 1 }
    }
  ]
}
```

在chapter1的大堂（`room_lobby`）的`interactables`中加入`"evt_ch1_strength_growth"`。

- [ ] **Step 2: 在chapter2.json中添加2个成长事件**

**事件1（体质成长，+1根骨）：**
```json
{
  "id": "evt_ch2_constitution_growth",
  "title": "研习毒物",
  "description": "对着缴获的毒物样本，仔细研究其来路与成分。",
  "requires": { "flags": ["chapter2_started"] },
  "actions": [
    {
      "id": "study_poison_sample",
      "label": "以身试毒，感受毒性",
      "requires": { "constitution": 5, "flags_absent": ["ch2_constitution_grown"] },
      "result": "你取一丝微量的毒液涂于皮肤，感受其蔓延的路径。轻微的麻木感很快消退——你的身体在这种经历中悄悄变得更加顽强。【根骨 +1】",
      "grants": { "flags": ["ch2_constitution_grown"], "constitution": 1 }
    }
  ]
},
```

**事件2（敏捷成长，+1敏捷）：**
```json
{
  "id": "evt_ch2_agility_growth",
  "title": "穿街追踪",
  "description": "在东市迷宫般的街巷中追踪一个鬼鬼祟祟的身影。",
  "requires": { "flags": ["langpeng_discovered"] },
  "actions": [
    {
      "id": "chase_through_alleys",
      "label": "全力追踪，不丢目标",
      "requires": { "agility": 4, "flags_absent": ["ch2_agility_grown"] },
      "result": "你在狭窄的巷子里时而翻墙、时而俯身，追了足足半刻钟。这番追逐让你的脚步愈发轻盈，对身体的掌控也更加从容。【敏捷 +1】",
      "grants": { "flags": ["ch2_agility_grown", "langpeng_trail"], "agility": 1 }
    }
  ]
}
```

在chapter2对应房间的`interactables`中分别加入这两个事件ID。

- [ ] **Step 3: 在chapter3.json中添加2个成长事件**

**事件1（智慧成长，+1智慧）：**
```json
{
  "id": "evt_ch3_wisdom_growth",
  "title": "破解密语",
  "description": "天机阁遗留的密文，需要极强的推理能力才能解读。",
  "requires": { "flags": ["chapter3_started"] },
  "actions": [
    {
      "id": "decode_cipher",
      "label": "逐字推敲，拨云见日",
      "requires": { "wisdom": 6, "flags_absent": ["ch3_wisdom_grown"] },
      "result": "你在密文前枯坐了一个时辰，将每一个符号的逻辑关系理清。当那层迷雾终于散去，你感到脑中的某根弦被拨动了——推理之道，如同武功，愈练愈精。【智慧 +1】",
      "grants": { "flags": ["ch3_wisdom_grown"], "wisdom": 1 }
    }
  ]
},
```

**事件2（根骨成长，+1根骨）：**
```json
{
  "id": "evt_ch3_constitution_growth",
  "title": "枯坐冥想",
  "description": "在大雁塔旁的古树下枯坐，调息吐纳，感受身体的极限。",
  "requires": { "flags": ["chapter3_started"] },
  "actions": [
    {
      "id": "meditate",
      "label": "静心调息，固本培元",
      "requires": { "flags_absent": ["ch3_constitution_grown"] },
      "result": "你盘腿而坐，任凭风吹日晒，感受每一次呼吸在体内的流转。半日后，你睁开眼，身体仿佛比从前更加沉稳厚重。【根骨 +1】",
      "grants": { "flags": ["ch3_constitution_grown"], "constitution": 1 }
    }
  ]
}
```

- [ ] **Step 4: 运行章节完整性测试**

```bash
npm test -- tests/data/
```
期望：PASS（新event ID需要在对应room的interactables中）

- [ ] **Step 5: 提交**

```bash
git add src/data/events/chapter1.json src/data/events/chapter2.json src/data/events/chapter3.json
git commit -m "feat: 各章节添加属性成长事件，历练可提升角色资质"
```

---

## Task 9: 重写提示系统

**Files:**
- Modify: `src/engine/hintEngine.ts`
- Modify: `src/pages/Game/Game.tsx`（传入talent参数）

- [ ] **Step 1: 写hintEngine测试**

新建 `tests/engine/hintEngine.test.ts`：
```typescript
import { describe, it, expect } from 'vitest';
import { getHint } from '../../src/engine/hintEngine';
import type { HintContext } from '../../src/engine/hintEngine';

const base: HintContext = {
  flags: [], items: [], chapter: 1,
  strength: 6, agility: 6, wisdom: 6, constitution: 6, talent: '',
};

describe('getHint chapter 1', () => {
  it('第一步：未见掌柜时提示去找掌柜', () => {
    const hint = getHint(base);
    expect(hint).toContain('李福');
  });

  it('见过掌柜后提示去查尸体', () => {
    const hint = getHint({ ...base, flags: ['innkeeper_met'] });
    expect(hint).toContain('尸体');
  });

  it('三证齐全时提示准备对质', () => {
    const ctx = {
      ...base,
      flags: ['body_examined', 'cloth_fiber_found', 'kite_identity_clue', 'tianji_records_found'],
    };
    expect(getHint(ctx)).not.toBe('四处探查，不要放过任何可互动的对象和NPC。');
  });
});

describe('getHint chapter 2', () => {
  it('chapter2开始后有实质提示', () => {
    const hint = getHint({ ...base, chapter: 2, flags: ['chapter2_started'] });
    expect(hint).not.toBe('四处探查，不要放过任何可互动的对象和NPC。');
  });
});

describe('getHint chapter 3', () => {
  it('chapter3开始后有实质提示', () => {
    const hint = getHint({ ...base, chapter: 3, flags: ['chapter3_started'] });
    expect(hint).not.toBe('四处探查，不要放过任何可互动的对象和NPC。');
  });
});

describe('talent-aware hints', () => {
  it('捕快/官威职业获得官方渠道提示', () => {
    const hint = getHint({ ...base, talent: '官威', flags: ['innkeeper_met'] });
    expect(hint).toBeTruthy();
  });
});
```

- [ ] **Step 2: 运行确认部分失败（talent字段不存在）**

```bash
npm test -- tests/engine/hintEngine.test.ts
```
期望：至少talent相关测试 FAIL（HintContext缺少talent字段）

- [ ] **Step 3: 重写hintEngine.ts**

完整替换 `src/engine/hintEngine.ts`：
```typescript
export interface HintContext {
  flags: string[];
  items: string[];
  chapter: 1 | 2 | 3;
  strength: number;
  agility: number;
  wisdom: number;
  constitution: number;
  talent: string;
}

interface HintRule {
  when: (ctx: HintContext) => boolean;
  hint: string;
}

const has = (ctx: HintContext, flag: string) => ctx.flags.includes(flag);
const hasItem = (ctx: HintContext, item: string) => ctx.items.includes(item);

const CHAPTER1_RULES: HintRule[] = [
  {
    when: (ctx) =>
      has(ctx, 'kite_identity_clue') &&
      has(ctx, 'cloth_fiber_found') &&
      has(ctx, 'tianji_records_found'),
    hint: '三条关键证据已齐备。前往城郊废弃宅院，揭开「鸢」的真面目。',
  },
  {
    when: (ctx) =>
      has(ctx, 'body_examined') &&
      has(ctx, 'kite_identity_clue') &&
      !has(ctx, 'tianji_records_found'),
    hint: '已有物证和身份线索。前往城郊废弃宅院（从客栈大堂可前往），搜寻天机阁的档案记录。',
  },
  {
    when: (ctx) =>
      has(ctx, 'body_examined') &&
      has(ctx, 'cloth_fiber_found') &&
      !has(ctx, 'kite_identity_clue'),
    hint: '布料纤维已找到。找到飞爷，与他深谈，追问「鸢」的身份——他知道内情。',
  },
  {
    when: (ctx) =>
      has(ctx, 'body_examined') &&
      !has(ctx, 'cloth_fiber_found') &&
      !has(ctx, 'kite_identity_clue'),
    hint: '尸体已检查。再仔细检查死者的手部，可能还有遗漏的物证。同时找飞爷了解案情背景。',
  },
  {
    when: (ctx) =>
      ctx.talent === '官威' &&
      has(ctx, 'innkeeper_met') &&
      !has(ctx, 'body_examined'),
    hint: '你持有官牒，可直接要求掌柜带路进入命案房间，无需额外周旋。',
  },
  {
    when: (ctx) =>
      ctx.talent === '望气观相' &&
      has(ctx, 'innkeeper_met') &&
      !has(ctx, 'body_examined'),
    hint: '以道法观气，命案房间必有残留的阴煞之气。前往二楼，你的感知会引导你找到关键之处。',
  },
  {
    when: (ctx) =>
      ctx.talent === '毒经百草' &&
      has(ctx, 'body_examined'),
    hint: '你的医术告诉你，死者身上的症状不像外伤所致。寻找毒物相关线索，从案发房间的角落入手。',
  },
  {
    when: (ctx) =>
      ctx.talent === '夜行百盗' &&
      !has(ctx, 'secret_room_opened'),
    hint: '你注意到客栈有些门上了锁，但锁对你来说不过是摆设。夜间行事，客栈二楼有可疑之处。',
  },
  {
    when: (ctx) =>
      has(ctx, 'white_stranger_trust') &&
      !has(ctx, 'learned_wuhen_bu'),
    hint: '白衣人已信任你。继续与他交谈，争取让他传授独门身法——这将开启另一条出路。',
  },
  {
    when: (ctx) =>
      ctx.wisdom >= 7 &&
      has(ctx, 'innkeeper_met') &&
      !has(ctx, 'body_examined'),
    hint: '你的智慧告诉你，掌柜的描述有些地方对不上。前往二楼命案房间，亲眼核实。',
  },
  {
    when: (ctx) => !has(ctx, 'innkeeper_met'),
    hint: '先与客栈掌柜李福交谈（他在大堂）。他第一个发现尸体，是了解案发经过的最佳入口。',
  },
  {
    when: (ctx) => has(ctx, 'innkeeper_met') && !has(ctx, 'body_examined'),
    hint: '前往二楼命案房间（从大堂可以前往），检查宋怀义的遗体和现场痕迹。',
  },
  {
    when: () => true,
    hint: '从客栈大堂的掌柜入手，了解案发经过，再去二楼检查命案现场。',
  },
];

const CHAPTER2_RULES: HintRule[] = [
  {
    when: (ctx) =>
      hasItem(ctx, 'poison_residue_sample') &&
      hasItem(ctx, 'monk_identity_scroll') &&
      hasItem(ctx, 'langpeng_dispatch_order'),
    hint: '三件铁证俱在。前往东市茶馆，与李邈正面对质，将其绳之以法。',
  },
  {
    when: (ctx) =>
      hasItem(ctx, 'poison_residue_sample') &&
      hasItem(ctx, 'monk_identity_scroll') &&
      !hasItem(ctx, 'langpeng_dispatch_order'),
    hint: '还缺浪鹏帮调令文书。前往东市深处的浪鹏帮据点（平康坊方向），搜寻文书。',
  },
  {
    when: (ctx) =>
      hasItem(ctx, 'poison_residue_sample') &&
      !hasItem(ctx, 'monk_identity_scroll'),
    hint: '毒物样本已有。找到无迹和尚，他的身份文书是证明李邈参与其中的关键。',
  },
  {
    when: (ctx) =>
      ctx.talent === '官威' &&
      has(ctx, 'langpeng_discovered'),
    hint: '你可以凭官牒直接传唤浪鹏帮成员。前往东市官署，申请公函——这是最直接的路。',
  },
  {
    when: (ctx) =>
      ctx.talent === '三寸不烂之舌' &&
      !has(ctx, 'langpeng_discovered'),
    hint: '你在茶馆与说书摊混迹多年，消息灵通。找几个东市的老摊贩闲聊，浪鹏帮的风声自然会来。',
  },
  {
    when: (ctx) =>
      ctx.talent === '毒经百草' &&
      !hasItem(ctx, 'poison_residue_sample'),
    hint: '你闻到了空气中若有若无的气味——那是某种特殊植物提炼的毒素。追着这气味走，能找到毒物来源。',
  },
  {
    when: (ctx) =>
      ctx.talent === '夜行百盗' &&
      has(ctx, 'langpeng_discovered') &&
      !hasItem(ctx, 'langpeng_dispatch_order'),
    hint: '浪鹏帮的据点你已摸清。夜间潜入，文书就在帮主的内室，锁对你而言不是问题。',
  },
  {
    when: (ctx) => has(ctx, 'langpeng_trail') && !hasItem(ctx, 'langpeng_dispatch_order'),
    hint: '已掌握浪鹏帮踪迹。前往平康坊据点，调令文书是让李邈开口的筹码。',
  },
  {
    when: (ctx) => !has(ctx, 'langpeng_discovered'),
    hint: '在东市探查浪鹏帮踪迹。公告板上有线索，东市深处的醉汉也可能知道内情。',
  },
  {
    when: () => true,
    hint: '东市之事分两条线：查毒物来源（无迹和尚），查幕后主使（浪鹏帮→李邈）。两线汇合才能结案。',
  },
];

const CHAPTER3_RULES: HintRule[] = [
  {
    when: (ctx) =>
      hasItem(ctx, 'tianji_founding_scroll') &&
      has(ctx, 'fei_ye_identity_confirmed'),
    hint: '证据与真相俱全。前往曲江亭，飞爷在那里等你——做出你的最终选择。',
  },
  {
    when: (ctx) =>
      has(ctx, 'fei_ye_identity_confirmed') &&
      !hasItem(ctx, 'tianji_founding_scroll'),
    hint: '飞爷身份已确认，但还缺天机阁创始档案作为铁证。大雁塔下的无名碑藏有线索。',
  },
  {
    when: (ctx) =>
      ctx.talent === '官威' &&
      has(ctx, 'fei_ye_identity_confirmed'),
    hint: '你有官牒。飞爷的身份一经坐实，可直接持令拘捕——前往曲江亭执行。',
  },
  {
    when: (ctx) =>
      ctx.talent === '望气观相' &&
      !has(ctx, 'fei_ye_identity_confirmed'),
    hint: '飞爷旧居的画像壁藏有气息——你走进那间屋子就会感知到。前往飞爷故居。',
  },
  {
    when: (ctx) =>
      ctx.talent === '三寸不烂之舌' &&
      !has(ctx, 'tianji_trust_gained'),
    hint: '天机安宅的联络人是个谨慎的人。讲一个关于「鸢」的故事给他听——人都爱听故事。',
  },
  {
    when: (ctx) =>
      ctx.talent === '夜行百盗' &&
      !has(ctx, 'feiyes_manor_searched'),
    hint: '飞爷故居戒备森严，但屋顶对你来说就是平地。夜里翻进去，画像壁就在正厅。',
  },
  {
    when: (ctx) =>
      has(ctx, 'feiyes_manor_searched') &&
      !has(ctx, 'fei_ye_identity_confirmed'),
    hint: '旧居已搜查完毕。与无迹和尚再次交谈，他掌握最后的证词，是最终拼图。',
  },
  {
    when: (ctx) =>
      has(ctx, 'chapter2_join_ending') &&
      !has(ctx, 'tianji_trust_gained'),
    hint: '你曾加入天机阁。前往天机安宅，向联络人展示你对阁内事务的了解，重获信任。',
  },
  {
    when: (ctx) => !has(ctx, 'stele_decoded') && !hasItem(ctx, 'tianji_founding_scroll'),
    hint: '从大雁塔下的无名碑入手（从曲江池可前往），碑文藏着天机阁创始者的信息。',
  },
  {
    when: (ctx) =>
      (has(ctx, 'stele_decoded') || hasItem(ctx, 'tianji_founding_scroll')) &&
      !has(ctx, 'feiyes_manor_searched'),
    hint: '线索指向一个人。前往城西飞爷旧居，画像壁上藏着你需要的最后一块拼图。',
  },
  {
    when: () => true,
    hint: '追查「鸢」身份：大雁塔无名碑→飞爷旧居画像壁→无迹和尚证词→曲江亭终局。',
  },
];

export function getHint(ctx: HintContext): string {
  const rules =
    ctx.chapter === 3
      ? CHAPTER3_RULES
      : ctx.chapter === 2
      ? CHAPTER2_RULES
      : CHAPTER1_RULES;

  for (const rule of rules) {
    if (rule.when(ctx)) return rule.hint;
  }
  return '四处探查，与每位NPC交谈，不要放过任何可互动的事件。';
}
```

- [ ] **Step 4: 更新Game.tsx中getHint的调用，传入talent**

在 `src/pages/Game/Game.tsx` 第240行，将：
```typescript
? getHint({ flags: scene.flags, items, chapter, strength: player.strength, agility: player.agility, wisdom: player.wisdom })
```
改为：
```typescript
? getHint({ flags: scene.flags, items, chapter, strength: player.strength, agility: player.agility, wisdom: player.wisdom, constitution: player.constitution, talent: player.talent })
```

- [ ] **Step 5: 运行hintEngine测试确认通过**

```bash
npm test -- tests/engine/hintEngine.test.ts
```
期望：PASS

- [ ] **Step 6: 运行全量测试**

```bash
npm test
```
期望：全部 PASS

- [ ] **Step 7: 提交**

```bash
git add src/engine/hintEngine.ts src/pages/Game/Game.tsx tests/engine/hintEngine.test.ts
git commit -m "feat: 重写提示系统，加入职业感知和属性感知的精准指引"
```

---

## Task 10: RightPanel显示属性成长Delta

**Files:**
- Modify: `src/components/layout/RightPanel.tsx`

- [ ] **Step 1: 更新RightPanel以显示属性成长差值**

在 `src/components/layout/RightPanel.tsx` 中添加 `getTemplate` 导入，并在属性显示区域加入成长delta：

在第5行导入中加入 `getTemplate`：
```typescript
import { getItem, TALENTS, getTemplate } from '../../data/loader';
```

在 `RightPanel` 函数内，`const clueItems = ...` 之前加入：
```typescript
const baseTemplate = getTemplate(player.template);
```

将第45-51行的属性循环替换为：
```tsx
{(['strength', 'agility', 'wisdom', 'constitution'] as const).map((stat) => {
  const base = baseTemplate?.stats[stat] ?? player[stat];
  const delta = player[stat] - base;
  return (
    <Tooltip key={stat} content={STAT_DESCRIPTIONS[stat]} position="left">
      <div className="cursor-help w-full flex items-center gap-1">
        <div className="flex-1">
          <StatBar label={stat} value={player[stat]} />
        </div>
        {delta > 0 && (
          <span className="text-xs text-gold/60 shrink-0">+{delta}</span>
        )}
      </div>
    </Tooltip>
  );
})}
```

- [ ] **Step 2: 验证属性delta显示**

运行 `npm run dev`，进入游戏，触发一个属性成长事件（或临时在浏览器console中手动调用 `usePlayerStore.getState().incrementStat('wisdom', 1)`），确认右侧面板属性栏出现金色 `+1` 标记。

- [ ] **Step 3: 运行全量测试**

```bash
npm test
```
期望：PASS

- [ ] **Step 4: 提交**

```bash
git add src/components/layout/RightPanel.tsx
git commit -m "feat: 右侧面板属性栏显示历练成长值"
```

---

## Task 11: 全量测试验证

**Files:** 无新增文件

- [ ] **Step 1: 运行完整测试套件**

```bash
npm test
```
期望：全部 PASS，105条原有测试 + 新增测试均通过

- [ ] **Step 2: 类型检查**

```bash
npx tsc --noEmit
```
期望：无类型错误

- [ ] **Step 3: 构建验证**

```bash
npm run build
```
期望：构建成功，无错误

- [ ] **Step 4: 手动验证通关路线（各职业）**

`npm run dev` 后分别测试：
- **捕快**：进入游戏，确认「审讯」选项出现在章节1相关NPC中
- **说书人**：确认NPC对话有「说书劝说」专属选项（npcs/chapter1.json第44行条件）
- **游方医**：进入密室毒烟区域，确认毒经百草能免疫通过
- **道士**：确认望气观相事件自动触发隐藏线索
- **飞贼**：确认夜行百盗可进入通常锁闭区域

- [ ] **Step 5: 最终提交**

```bash
git add -A
git commit -m "test: 全量验证通过，7项改进实现完毕"
```

---

## 快速参考：天赋ID映射

| 旧天赋 | 新天赋 | conditionEvaluator加成 |
|--------|--------|------------------------|
| 机关奇才 (wisdom+2) | 三寸不烂之舌 | wisdom+2 |
| 天生神力 (strength+2) | —（移除） | 无 |
| 过目不忘 → 望气观相 | 望气观相 | 无数值加成 |
| 毒体 → 毒经百草 | 毒经百草 | constitution+2 |
| 察言观色 → 三寸不烂之舌 | 三寸不烂之舌 | wisdom+2 |
| 江湖老千 → 三寸不烂之舌 | 三寸不烂之舌 | wisdom+2 |
| — | 夜行百盗 | agility+2 |
| — | 官威 | 无数值加成 |
