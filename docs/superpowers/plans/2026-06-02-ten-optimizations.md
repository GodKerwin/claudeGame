# 十项优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从低到高依次落地十项体验与技术优化（⑩⑥⑧ → ②⑤④⑦ → ①③）。

**Architecture:** 所有改动限于 src/ 内，零外部依赖。新增 profiles/chapter2.json 和 profiles/chapter3.json 扩展 NPC 档案数据；foundSynthesisIds 迁移到 sceneStore 实现持久化；其余均为 UI 与 CSS 层改动。

**Tech Stack:** React 18, TypeScript, Zustand v4, Tailwind CSS v3, Vitest

---

## 文件改动地图

| 文件 | 任务 | 操作 |
|------|------|------|
| `src/components/ui/ChapterIntro.tsx` | Task 1 | 修改：SVG gradient ID 用 useId() |
| `src/components/layout/RightPanel.tsx` | Task 2, 5, 8 | 修改：合成高亮、持久化读写、步骤引导 |
| `src/pages/Game/Game.tsx` | Task 3, 6 | 修改：firstRun 文案、天赋反馈 |
| `src/index.css` | Task 4 | 修改：新增 panel-fade-in keyframe |
| `src/components/layout/CenterPanel.tsx` | Task 4 | 修改：story/action div 加 key + 动画类 |
| `src/types/game.ts` | Task 5 | 修改：SaveData 增 foundSynthesisIds |
| `src/store/sceneStore.ts` | Task 5 | 修改：增 foundSynthesisIds 字段与 action |
| `src/hooks/useAutoSave.ts` | Task 5 | 修改：存档包含 foundSynthesisIds |
| `src/engine/saveEngine.ts` | Task 5 | 修改：loadFromSlot 迁移兼容旧存档 |
| `src/components/save/SaveLoadModal.tsx` | Task 5 | 修改：handleLoad 还原 foundSynthesisIds |
| `src/pages/ChapterEnd/ChapterEnd.tsx` | Task 7 | 修改：新增个性化通关小结 |
| `src/data/profiles/chapter2.json` | Task 9 | 新建：第二章 NPC 档案 |
| `src/data/profiles/chapter3.json` | Task 9 | 新建：第三章 NPC 档案 |
| `src/data/loader.ts` | Task 9 | 修改：合并三章 profiles |
| `tests/store/sceneStore.test.ts` | Task 5 | 新建：foundSynthesisIds 单测 |
| `tests/data/profilesIntegrity.test.ts` | Task 9 | 新建：profiles 数据完整性测试 |

---

## Task 1: 修复 ChapterIntro SVG gradient ID 冲突风险（⑩）

**Files:**
- Modify: `src/components/ui/ChapterIntro.tsx`

- [ ] **Step 1: 修改 ChapterIntro.tsx，给 InkSplash 传唯一前缀**

```tsx
import { useEffect, useState, useId } from 'react';

interface Props {
  chapter: 1 | 2 | 3;
  onDone: () => void;
}

const CHAPTER_INFO: Record<number, { num: string; title: string; sub: string }> = {
  1: { num: '壹', title: '往事客栈', sub: '一人死于密室，真相藏于每一道门缝之后' },
  2: { num: '贰', title: '东市追查', sub: '浪鹏帮、天机阁、一张牵动长安的隐秘之网' },
  3: { num: '鸢归何处', title: '鸢归何处', sub: '名单、旧主与无法忘却的誓言' },
};

export function ChapterIntro({ chapter, onDone }: Props) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const uid = useId();
  const info = CHAPTER_INFO[chapter];

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 600);
    const t2 = setTimeout(() => setPhase('out'), 2400);
    const t3 = setTimeout(() => onDone(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const baseOpacity = phase === 'out' ? 'opacity-0' : phase === 'hold' ? 'opacity-100' : 'opacity-0';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-paper transition-opacity duration-700 ${baseOpacity}`}
      style={{ pointerEvents: phase === 'out' ? 'none' : 'auto' }}
      onClick={() => { setPhase('out'); setTimeout(onDone, 700); }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <InkSplash uid={uid} />
      </div>

      <div className={`relative z-10 text-center transition-all duration-700 ${phase === 'in' ? 'translate-y-3 opacity-0' : phase === 'out' ? '-translate-y-3 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <p className="text-gold/40 text-xs tracking-[0.5em] mb-4">第{info.num}章</p>
        <div className="relative inline-block">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-px bg-gold/25" />
            <h1
              className="text-gold/90 tracking-[0.25em]"
              style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', textShadow: '0 0 40px rgba(201,168,76,0.5)' }}
            >
              {chapter === 3 ? info.title : `往事客栈 · 东市追查 · 鸢归何处`.split(' · ')[chapter - 1]}
            </h1>
            <div className="w-12 h-px bg-gold/25" />
          </div>
        </div>
        <p className="text-ink/45 text-[13px] tracking-[0.15em] mt-3 max-w-xs mx-auto leading-relaxed">{info.sub}</p>
        <p className="text-ink/18 text-[11px] tracking-widest mt-8">点击跳过</p>
      </div>
    </div>
  );
}

function InkSplash({ uid }: { uid: string }) {
  const cId = `${uid}-ink-center`;
  const tId = `${uid}-ink-top`;
  const bId = `${uid}-ink-bot`;
  return (
    <svg
      viewBox="0 0 800 600"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0 }}
    >
      <defs>
        <radialGradient id={cId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(201,168,76,0.07)" />
          <stop offset="60%" stopColor="rgba(201,168,76,0.03)" />
          <stop offset="100%" stopColor="rgba(201,168,76,0)" />
        </radialGradient>
        <radialGradient id={tId} cx="30%" cy="20%" r="40%">
          <stop offset="0%" stopColor="rgba(201,168,76,0.05)" />
          <stop offset="100%" stopColor="rgba(201,168,76,0)" />
        </radialGradient>
        <radialGradient id={bId} cx="70%" cy="80%" r="40%">
          <stop offset="0%" stopColor="rgba(201,168,76,0.04)" />
          <stop offset="100%" stopColor="rgba(201,168,76,0)" />
        </radialGradient>
        <style>{`
          @keyframes inkFloat {
            0%, 100% { transform: scale(1) translate(0,0); }
            33% { transform: scale(1.06) translate(4px,-6px); }
            66% { transform: scale(0.97) translate(-3px,5px); }
          }
          .ink-anim { animation: inkFloat 8s ease-in-out infinite; transform-origin: center; }
        `}</style>
      </defs>
      <ellipse className="ink-anim" cx="400" cy="300" rx="380" ry="280" fill={`url(#${cId})`} style={{ animationDelay: '0s' }} />
      <ellipse className="ink-anim" cx="240" cy="160" rx="260" ry="200" fill={`url(#${tId})`} style={{ animationDelay: '-2.5s' }} />
      <ellipse className="ink-anim" cx="560" cy="440" rx="240" ry="180" fill={`url(#${bId})`} style={{ animationDelay: '-5s' }} />
    </svg>
  );
}
```

- [ ] **Step 2: 运行测试确认通过**

```bash
cd /Users/xuli/claudeGame && npx vitest run
```
Expected: 153 passed

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/ChapterIntro.tsx
git commit -m "fix: use React useId() for ChapterIntro SVG gradient IDs to prevent conflicts"
```

---

## Task 2: 推理标签——高亮可配对物证（⑥）

**Files:**
- Modify: `src/components/layout/RightPanel.tsx`

当玩家在"推理"标签中已选中甲件物证时，对能与其配对合成的物证按钮进行金色高亮（在现有 `border-ink/12` 基础上升级为 `border-gold/35`），帮助玩家发现有效组合。

- [ ] **Step 1: 在 RightPanel.tsx 中 import SYNTHESES**

找到第 8 行的 import 语句：
```ts
import { getItem, TALENTS, getTemplate, getSynthesisResult, SUSPECT_PROFILES } from '../../data/loader';
```
替换为：
```ts
import { getItem, TALENTS, getTemplate, getSynthesisResult, SUSPECT_PROFILES, SYNTHESES } from '../../data/loader';
```

- [ ] **Step 2: 在 handleSelectItem 上方计算 compatibleWithA**

找到 `const handleSelectItem = (itemId: string) => {` 这一行，在其上方插入：

```tsx
  // 当已选定甲件时，预计算哪些物品可与之配对（有 synthesis recipe）
  const compatibleWithA = selectedA
    ? new Set(
        SYNTHESES
          .filter((s) => s.itemA === selectedA || s.itemB === selectedA)
          .map((s) => (s.itemA === selectedA ? s.itemB : s.itemA))
      )
    : new Set<string>();
```

- [ ] **Step 3: 修改物证按钮的样式，加入可配对高亮**

找到推理标签中物证按钮的 className 赋值（当前约在 `tab === 'deduce'` 区域）：

```tsx
className={`text-[11px] px-2 py-0.5 border transition-colors cursor-pointer tracking-wide ${
  isSelected
    ? 'border-gold/60 text-gold/85 bg-gold/8'
    : 'border-ink/12 text-ink/45 hover:border-gold/30 hover:text-ink/65'
}`}
```

替换为：

```tsx
className={`text-[11px] px-2 py-0.5 border transition-colors cursor-pointer tracking-wide ${
  isSelected
    ? 'border-gold/60 text-gold/85 bg-gold/8'
    : compatibleWithA.has(item.id)
      ? 'border-gold/35 text-ink/60 hover:border-gold/55 hover:text-ink/80'
      : 'border-ink/12 text-ink/45 hover:border-gold/30 hover:text-ink/65'
}`}
```

- [ ] **Step 4: 运行测试**

```bash
npx vitest run
```
Expected: 153 passed

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/RightPanel.tsx
git commit -m "feat: highlight synthesis-compatible items when first clue is selected in deduce tab"
```

---

## Task 3: 更新首次游戏引导——补充推理标签说明（⑧）

**Files:**
- Modify: `src/pages/Game/Game.tsx`

首次进入游戏时显示的"入局须知"弹窗中，"右侧"一栏的描述需更新（当前错误显示三标签，实际是四标签），并补充推理功能引导。

- [ ] **Step 1: 找到 firstRun 弹窗的列表数据并替换**

在 `Game.tsx` 中找到：
```tsx
{[
  ['左侧', '可前往的地点，点击即可移动'],
  ['中央', '「人物」区对话 NPC，「探索」区调查场景'],
  ['右侧', '身家 · 物品 · 脉络，三标签切换'],
  ['提示', '卡关时点击行动区右上角「提示」按钮'],
].map(([label, desc]) => (
```

替换为：
```tsx
{[
  ['左侧', '可前往的地点，点击即可移动'],
  ['中央', '「人物」区对话 NPC，「探索」区调查场景'],
  ['右侧', '人物 · 物品 · 推理 · 脉络，四标签切换'],
  ['推理', '在推理标签中选择两件线索，可推断它们的关联'],
  ['提示', '卡关时点击行动区右上角「提示」按钮'],
].map(([label, desc]) => (
```

- [ ] **Step 2: 运行测试**

```bash
npx vitest run
```
Expected: 153 passed

- [ ] **Step 3: Commit**

```bash
git add src/pages/Game/Game.tsx
git commit -m "fix: update first-run guide to show 4 tabs and mention deduction feature"
```

---

## Task 4: 房间切换淡入过渡动画（②）

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/layout/CenterPanel.tsx`

换房间时，故事文字区和动作区淡入（200ms），消除骤变的断裂感。

- [ ] **Step 1: 在 index.css 末尾添加 keyframe**

在 `src/index.css` 文件末尾添加：

```css
@keyframes panelFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.panel-fade-in {
  animation: panelFadeIn 0.2s ease-out;
}
```

- [ ] **Step 2: 在 CenterPanel.tsx 的故事文字区 div 上加 key 和动画类**

找到故事文字区滚动容器（当前为）：
```tsx
<div ref={scrollContainerRef} className="flex-[3] min-h-0 overflow-y-auto px-5 py-5 space-y-4 scrollbar-thin">
```
替换为：
```tsx
<div key={roomName} ref={scrollContainerRef} className="flex-[3] min-h-0 overflow-y-auto px-5 py-5 space-y-4 scrollbar-thin panel-fade-in">
```

- [ ] **Step 3: 在操作区 div 上也加 key 和动画类**

找到操作区最外层 div（当前有 `flex-[1.5] min-h-0 flex flex-col border-t` 等类）：
```tsx
<div
  className="flex-[1.5] min-h-0 flex flex-col border-t border-gold/10 px-4 pt-3 pb-3"
  style={{
    background: `
```
替换为：
```tsx
<div
  key={`action-${roomName}`}
  className="flex-[1.5] min-h-0 flex flex-col border-t border-gold/10 px-4 pt-3 pb-3 panel-fade-in"
  style={{
    background: `
```

- [ ] **Step 4: 运行测试**

```bash
npx vitest run
```
Expected: 153 passed

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/components/layout/CenterPanel.tsx
git commit -m "feat: add fade-in animation on room change for story and action panels"
```

---

## Task 5: foundSyntheses 持久化迁移至 sceneStore（⑤⑨）

**Files:**
- Modify: `src/types/game.ts`
- Modify: `src/store/sceneStore.ts`
- Modify: `src/hooks/useAutoSave.ts`
- Modify: `src/engine/saveEngine.ts`
- Modify: `src/components/save/SaveLoadModal.tsx`
- Modify: `src/components/layout/RightPanel.tsx`
- Create: `tests/store/sceneStore.test.ts`

这是功能性 bug 修复：推理合成记录保存在 RightPanel 的组件 state 中，读档/页面重挂载后丢失。迁移至 sceneStore，随存档一起持久化。

- [ ] **Step 1: 写失败测试**

新建 `tests/store/sceneStore.test.ts`：

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneStore } from '../../src/store/sceneStore';

describe('sceneStore – foundSynthesisIds', () => {
  beforeEach(() => {
    useSceneStore.getState().reset();
  });

  it('starts empty', () => {
    expect(useSceneStore.getState().foundSynthesisIds).toEqual([]);
  });

  it('adds an id', () => {
    useSceneStore.getState().addFoundSynthesisId('synth_double_kill');
    expect(useSceneStore.getState().foundSynthesisIds).toContain('synth_double_kill');
  });

  it('does not add duplicates', () => {
    useSceneStore.getState().addFoundSynthesisId('synth_double_kill');
    useSceneStore.getState().addFoundSynthesisId('synth_double_kill');
    expect(useSceneStore.getState().foundSynthesisIds.length).toBe(1);
  });

  it('loadState restores foundSynthesisIds', () => {
    useSceneStore.getState().loadState({ foundSynthesisIds: ['synth_innkeeper_role'] });
    expect(useSceneStore.getState().foundSynthesisIds).toEqual(['synth_innkeeper_role']);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run tests/store/sceneStore.test.ts
```
Expected: FAIL（foundSynthesisIds 不存在）

- [ ] **Step 3: 修改 src/types/game.ts — SaveData 增加字段**

找到 `SaveData` interface，在 `visitedRooms: string[];` 后添加：
```ts
  foundSynthesisIds?: string[];
```

- [ ] **Step 4: 修改 src/store/sceneStore.ts**

完整替换文件内容：

```ts
import { create } from 'zustand';

interface SceneState {
  currentRoomId: string;
  flags: string[];
  clues: string[];
  questLog: string[];
  storyText: string[];
  seenDialogues: string[];
  visitedRooms: string[];
  foundSynthesisIds: string[];
  setRoom: (roomId: string) => void;
  addFlag: (flag: string) => void;
  addClue: (clueId: string) => void;
  addQuest: (questId: string) => void;
  addStoryText: (text: string) => void;
  clearStoryText: () => void;
  markDialogueSeen: (key: string) => void;
  addFoundSynthesisId: (id: string) => void;
  loadState: (state: Partial<Pick<SceneState,
    'currentRoomId' | 'flags' | 'clues' | 'questLog' | 'storyText' |
    'seenDialogues' | 'visitedRooms' | 'foundSynthesisIds'>>) => void;
  reset: () => void;
}

const defaultState = {
  currentRoomId: 'room_203',
  flags: [] as string[],
  clues: [] as string[],
  questLog: ['quest_main_murder'] as string[],
  storyText: [] as string[],
  seenDialogues: [] as string[],
  visitedRooms: ['room_203'] as string[],
  foundSynthesisIds: [] as string[],
};

export const useSceneStore = create<SceneState>((set) => ({
  ...defaultState,
  setRoom: (roomId) =>
    set((s) => {
      if (s.currentRoomId === roomId) return s;
      const visitedRooms = s.visitedRooms.includes(roomId)
        ? s.visitedRooms
        : [...s.visitedRooms, roomId];
      return { currentRoomId: roomId, storyText: [], visitedRooms };
    }),
  addFlag: (flag) =>
    set((s) => ({ flags: s.flags.includes(flag) ? s.flags : [...s.flags, flag] })),
  addClue: (clueId) =>
    set((s) => ({ clues: s.clues.includes(clueId) ? s.clues : [...s.clues, clueId] })),
  addQuest: (questId) =>
    set((s) => ({ questLog: s.questLog.includes(questId) ? s.questLog : [...s.questLog, questId] })),
  addStoryText: (text) =>
    set((s) => {
      const next = [...s.storyText, text];
      return { storyText: next.length > 50 ? next.slice(-50) : next };
    }),
  clearStoryText: () => set({ storyText: [] }),
  markDialogueSeen: (key) =>
    set((s) => ({
      seenDialogues: s.seenDialogues.includes(key) ? s.seenDialogues : [...s.seenDialogues, key],
    })),
  addFoundSynthesisId: (id) =>
    set((s) => ({
      foundSynthesisIds: s.foundSynthesisIds.includes(id) ? s.foundSynthesisIds : [...s.foundSynthesisIds, id],
    })),
  loadState: (state) => set(state),
  reset: () => set(defaultState),
}));
```

- [ ] **Step 5: 运行测试确认通过**

```bash
npx vitest run tests/store/sceneStore.test.ts
```
Expected: 4 passed

- [ ] **Step 6: 修改 src/hooks/useAutoSave.ts — 存档包含 foundSynthesisIds**

找到 `const data: SaveData = {` 块，在 `visitedRooms: scene.visitedRooms,` 后添加一行：
```ts
      foundSynthesisIds: scene.foundSynthesisIds,
```

同时在依赖数组中添加 `scene.foundSynthesisIds`（找到末尾的 `scene.seenDialogues, items, updateSlot,` 后面追加）：
```ts
    scene.currentRoomId, scene.flags, scene.clues, scene.questLog,
    scene.seenDialogues, scene.foundSynthesisIds, items, updateSlot,
```

- [ ] **Step 7: 修改 src/engine/saveEngine.ts — loadFromSlot 迁移兼容旧存档**

找到 `loadFromSlot` 函数的 return 语句：
```ts
  return {
    ...slot.data,
    seenDialogues: migrateSeenDialogues(slot.data.seenDialogues ?? []),
  };
```
替换为：
```ts
  return {
    ...slot.data,
    seenDialogues: migrateSeenDialogues(slot.data.seenDialogues ?? []),
    foundSynthesisIds: slot.data.foundSynthesisIds ?? [],
  };
```

- [ ] **Step 8: 修改 src/components/save/SaveLoadModal.tsx — handleLoad 还原 foundSynthesisIds**

找到 `scene.loadState({` 调用块，在 `visitedRooms: data.visitedRooms ?? [data.currentRoomId],` 后添加：
```ts
      foundSynthesisIds: data.foundSynthesisIds ?? [],
```

- [ ] **Step 9: 修改 RightPanel.tsx — 使用 store 的 foundSynthesisIds**

**第 9a 步**：在 `useSceneStore` 的解构中增加 `foundSynthesisIds` 和 `addFoundSynthesisId`：

找到：
```ts
  const { clues, questLog, flags, addFlag } = useSceneStore();
```
替换为：
```ts
  const { clues, questLog, flags, addFlag, foundSynthesisIds, addFoundSynthesisId } = useSceneStore();
```

**第 9b 步**：删除 `foundSyntheses` 的 useState：

找到并删除这一行：
```ts
  const [foundSyntheses, setFoundSyntheses] = useState<Array<{ id: string; hint: string; result: string }>>([]);
```

**第 9c 步**：在 allSelectableItems 定义附近添加 foundSyntheses 派生计算：

找到：
```ts
  // All selectable items for synthesis board
  const allSelectableItems = [
```
在其上方插入：
```ts
  // Derive synthesis display objects from store IDs
  const foundSyntheses = foundSynthesisIds
    .map((id) => SYNTHESES.find((s) => s.id === id))
    .filter(Boolean) as typeof SYNTHESES;
```

**第 9d 步**：在 handleSelectItem 中，将 `setFoundSyntheses` 替换为 `addFoundSynthesisId`：

找到：
```ts
        if (!alreadyFound) {
          setFoundSyntheses((prev) => [...prev, { id: synth.id, hint: synth.hint, result: synth.result }]);
          // Apply grants
          synth.grants?.flags?.forEach((f) => addFlag(f));
          synth.grants?.items?.forEach((i) => addItem(i));
          setSynthResult({ text: synth.result, isNew: true });
        } else {
          setSynthResult({ text: synth.result, isNew: false });
        }
```
替换为：
```ts
        const alreadyFound2 = foundSynthesisIds.includes(synth.id);
        if (!alreadyFound2) {
          addFoundSynthesisId(synth.id);
          // Apply grants
          synth.grants?.flags?.forEach((f) => addFlag(f));
          synth.grants?.items?.forEach((i) => addItem(i));
          setSynthResult({ text: synth.result, isNew: true });
        } else {
          setSynthResult({ text: synth.result, isNew: false });
        }
```

同时删除已不需要的 `alreadyFound` 变量声明（原来在上方的 `const alreadyFound = foundSyntheses.some(...)` 行）。

- [ ] **Step 10: 运行全部测试**

```bash
npx vitest run
```
Expected: 157 passed (原 153 + 4 新测试)

- [ ] **Step 11: Commit**

```bash
git add src/types/game.ts src/store/sceneStore.ts src/hooks/useAutoSave.ts \
        src/engine/saveEngine.ts src/components/save/SaveLoadModal.tsx \
        src/components/layout/RightPanel.tsx tests/store/sceneStore.test.ts
git commit -m "fix: persist foundSynthesisIds in sceneStore and save data — deduction records survive reload"
```

---

## Task 6: 天赋动作——故事文字前置天赋标识（④）

**Files:**
- Modify: `src/pages/Game/Game.tsx`

当玩家触发需要天赋的 EventAction 时，在结果文字前加 `【天赋·XXX】` 标识，强化天赋在剧情中的存在感。

- [ ] **Step 1: 在 Game.tsx 中 import TALENTS**

找到现有 import 行：
```ts
import { getRoom, getEvent, getNPC, getItem } from '../../data/loader';
```
替换为：
```ts
import { getRoom, getEvent, getNPC, getItem, TALENTS } from '../../data/loader';
```

- [ ] **Step 2: 在 handleAction 中，事件动作处理部分添加天赋前缀**

找到：
```ts
      scene.addStoryText(action.result);
      if (action.hint) { scene.addStoryText(action.hint); audioEngine.playSFX('hint'); }
      applyGrants(action.grants, scene, addItem, removeItem, player);
```
替换为：
```ts
      const talentPrefix = action.requires?.talent && action.requires.talent === player.talent
        ? `【天赋·${TALENTS.find((t) => t.id === player.talent)?.name ?? player.talent}】`
        : '';
      scene.addStoryText(talentPrefix ? `${talentPrefix}\n${action.result}` : action.result);
      if (action.hint) { scene.addStoryText(action.hint); audioEngine.playSFX('hint'); }
      applyGrants(action.grants, scene, addItem, removeItem, player);
```

- [ ] **Step 3: 运行测试**

```bash
npx vitest run
```
Expected: 157 passed

- [ ] **Step 4: Commit**

```bash
git add src/pages/Game/Game.tsx
git commit -m "feat: prefix talent-gated action results with talent name for stronger character identity"
```

---

## Task 7: 章节结束页——个性化通关小结（⑦）

**Files:**
- Modify: `src/pages/ChapterEnd/ChapterEnd.tsx`

在 ChapterEnd 页面加入"此行收获"小结区域，展示线索数、推理记录数、走访地点数。读自 sceneStore，在 MountainBackground 与结局文字之间渲染。

- [ ] **Step 1: 在 ChapterEnd.tsx 中 import useSceneStore**

找到现有 import 语句块。在 `import { useSceneStore } from '../../store/sceneStore';` 已经存在的情况下（如不存在则添加）：

确认文件顶部有：
```ts
import { useSceneStore } from '../../store/sceneStore';
```

- [ ] **Step 2: 在 ChapterEnd 组件内读取 sceneStore 数据，构建小结**

在 `ChapterEnd` 函数体内，在 `const navigate = useNavigate();` 之后，插入：

```tsx
  const { clues, visitedRooms, foundSynthesisIds } = useSceneStore();
  const { items } = useInventoryStore();
```

并确认已 import `useInventoryStore`：
```ts
import { useInventoryStore } from '../../store/inventoryStore';
```

- [ ] **Step 3: 在 ChapterEnd 的 JSX 中，渲染通关小结**

找到结局文字渲染区域（在现有的章节结束内容中，寻找 `endingText` 渲染的地方）。在结局文字区域结束标签之后、"继续"按钮之前插入：

```tsx
{/* 此行收获小结 */}
<div className="mt-8 mb-4 flex justify-center gap-8">
  {[
    { label: '线索收集', value: clues.length },
    { label: '推理洞察', value: foundSynthesisIds.length },
    { label: '走访之处', value: visitedRooms.length },
  ].map(({ label, value }) => (
    <div key={label} className="flex flex-col items-center gap-1">
      <span className="text-gold/75 text-xl tracking-wide font-serif">{value}</span>
      <span className="text-ink/30 text-[10px] tracking-[0.2em]">{label}</span>
    </div>
  ))}
</div>
```

- [ ] **Step 4: 运行测试**

```bash
npx vitest run
```
Expected: 157 passed

- [ ] **Step 5: Commit**

```bash
git add src/pages/ChapterEnd/ChapterEnd.tsx
git commit -m "feat: add personalized chapter summary (clues, deductions, rooms) on chapter end page"
```

---

## Task 8: 推理标签——步骤引导文字（①）

**Files:**
- Modify: `src/components/layout/RightPanel.tsx`

在"证据推断"区域将静态引导文字改为随选择状态变化的动态提示，帮助玩家理解两步选择操作。

- [ ] **Step 1: 替换静态引导文字为动态状态文字**

找到推理标签中的静态说明：
```tsx
<p className="text-ink/25 text-[10px] pl-1 mb-2 leading-snug">选择两件物证，推断其关联</p>
```
替换为：
```tsx
<p className="text-ink/25 text-[10px] pl-1 mb-2 leading-snug">
  {!selectedA
    ? '选择第一件物证（甲）开始推理'
    : !selectedB
      ? `已选甲：${allSelectableItems.find((i) => i.id === selectedA)?.name ?? selectedA}，再选一件物证（乙）`
      : '推理完成，可重置后继续'}
</p>
```

- [ ] **Step 2: 运行测试**

```bash
npx vitest run
```
Expected: 157 passed

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/RightPanel.tsx
git commit -m "feat: dynamic step guidance in deduction tab (select A → select B → result)"
```

---

## Task 9: 新增第二、三章 NPC 档案数据（③）

**Files:**
- Create: `src/data/profiles/chapter2.json`
- Create: `src/data/profiles/chapter3.json`
- Modify: `src/data/loader.ts`
- Create: `tests/data/profilesIntegrity.test.ts`

补全第二、三章的 NPC 嫌疑人档案，让"推理"标签的人物档案功能延续到游戏全程。

- [ ] **Step 1: 写完整性测试**

新建 `tests/data/profilesIntegrity.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { SUSPECT_PROFILES } from '../../src/data/loader';
import { NPCS } from '../../src/data/loader';

describe('SuspectProfile data integrity', () => {
  it('all profiles have valid npcId that exists in NPCS', () => {
    const npcIds = new Set(NPCS.map((n) => n.id));
    for (const p of SUSPECT_PROFILES) {
      expect(npcIds.has(p.npcId), `Profile npcId "${p.npcId}" not found in NPCS`).toBe(true);
    }
  });

  it('each profile has at least one fact', () => {
    for (const p of SUSPECT_PROFILES) {
      expect(p.facts.length, `Profile "${p.npcId}" has no facts`).toBeGreaterThan(0);
    }
  });

  it('covers all three chapters', () => {
    const ids = SUSPECT_PROFILES.map((p) => p.npcId);
    expect(ids).toContain('npc_innkeeper_li_fu');   // ch1
    expect(ids).toContain('npc_wujue');             // ch2/3
    expect(ids).toContain('npc_li_mao');            // ch2
    expect(ids).toContain('npc_tianji_contact');    // ch3
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run tests/data/profilesIntegrity.test.ts
```
Expected: FAIL（npc_wujue 等不在 SUSPECT_PROFILES 中）

- [ ] **Step 3: 创建 src/data/profiles/chapter2.json**

```json
[
  {
    "npcId": "npc_wujue",
    "name": "无迹和尚",
    "role": "大雁塔驻寺僧人",
    "suspicion": "知情者——身份复杂，隐有愧疚",
    "facts": [
      {
        "flag": "wujue_met",
        "text": "居于大雁塔多年，自称「已忘却世俗」，却对案情细节熟悉得异常。",
        "type": "known"
      },
      {
        "flag": "wujue_treated",
        "text": "旧伤来历不凡，是二十年前某次「任务」留下的，对此讳莫如深。",
        "type": "known"
      },
      {
        "flag": "poison_source_known",
        "text": "辨认出毒物配方：砒霜合曼陀罗，是天机阁当年的专用制剂，非市售寻常药材。",
        "type": "known"
      },
      {
        "flag": "wujue_tianji_revealed",
        "text": "【身份确认】天机阁「风」字组成员，二十年前奉命参与「收网」行动，事后出家以赎罪。",
        "type": "known"
      },
      {
        "flag": "wujue_guilt_revealed",
        "text": "【矛盾】声称自己「与此事无关」，但他知道鸢组的存在，知道那次行动的内容——他是亲历者，不是旁观者。",
        "type": "contradiction"
      },
      {
        "flag": "wujue_spoke_once",
        "text": "道出名单埋藏之处，以此了却心中二十年的执念。",
        "type": "known"
      }
    ]
  },
  {
    "npcId": "npc_li_mao",
    "name": "李邈",
    "role": "长安府主簿",
    "suspicion": "主要嫌疑人——幕后推手，证据确凿",
    "facts": [
      {
        "flag": "li_mao_exposed",
        "text": "【身份揭穿】长安府主簿，二十年来一直向浪鹏帮出售天机阁线人名单，以换取庇护。",
        "type": "known"
      },
      {
        "flag": "li_mao_cornered",
        "text": "被铁证逼问时承认：授意鸢组除掉宋怀义，以阻止残卷情报泄露。",
        "type": "known"
      },
      {
        "flag": "tianji_recruit_offered",
        "text": "【矛盾】声称自己「只是照命令行事」，但证据显示他在天机阁内部早有独立情报渠道，是主动的幕后操纵者，非被动棋子。",
        "type": "contradiction"
      }
    ]
  },
  {
    "npcId": "npc_langpeng_scout",
    "name": "浪鹏帮探子",
    "role": "浪鹏帮东市眼线",
    "suspicion": "目击者——受雇于浪鹏帮，知情程度有限",
    "facts": [
      {
        "flag": "langpeng_trail",
        "text": "确认浪鹏帮在东市设有秘密据点，专门追踪天机阁线人的下落。",
        "type": "known"
      },
      {
        "flag": "langpeng_scared",
        "text": "面对质问时态度明显软化，暗示浪鹏帮内部对「此次任务」存在分歧。",
        "type": "known"
      },
      {
        "flag": "langpeng_wujue_watched",
        "text": "【矛盾】自称只是「例行看守」，但据点记录显示他曾多次单独监视无迹和尚——这超出了普通眼线的职责。",
        "type": "contradiction"
      }
    ]
  },
  {
    "npcId": "npc_buyer_contact",
    "name": "古玩掌柜",
    "role": "东市情报中转人",
    "suspicion": "知情者——天机阁合法联络人",
    "facts": [
      {
        "flag": "antique_dealer_met",
        "text": "东市古玩铺掌柜，表面是普通商人，实为天机阁在东市的情报中转站。",
        "type": "known"
      },
      {
        "flag": "tianji_seal_read",
        "text": "认出天机玉令，并透露接头暗语「归鸟问津」——他是天机阁的合法联络人。",
        "type": "known"
      },
      {
        "flag": "buyer_identity_hinted",
        "text": "【矛盾】声称自己对「上面的事」一无所知，但他能认出天机玉令、背出接头暗语，说明他是主动知情者，非单纯受蒙蔽的掌柜。",
        "type": "contradiction"
      }
    ]
  }
]
```

- [ ] **Step 4: 创建 src/data/profiles/chapter3.json**

```json
[
  {
    "npcId": "npc_tianji_contact",
    "name": "天机联络人",
    "role": "天机安宅驻守者",
    "suspicion": "中立者——天机阁遗属，任务导向",
    "facts": [
      {
        "flag": "tianji_contact_met",
        "text": "掌管天机安宅，一直在等待「合适的人」来接手未竟的任务。",
        "type": "known"
      },
      {
        "flag": "tianji_briefing_received",
        "text": "透露：名单上共有三十七人，分散于大唐边疆各处，目前仍遭人追杀。",
        "type": "known"
      },
      {
        "flag": "tianji_trust_gained",
        "text": "认可调查能力，提供飞爷旧居精确位置及入内方式。",
        "type": "known"
      },
      {
        "flag": "tianji_endgame_ready",
        "text": "【矛盾】自称「只是守卫此地」，但他对飞爷的过往了如指掌——两人显然相识多年，绝非初见。",
        "type": "contradiction"
      }
    ]
  }
]
```

- [ ] **Step 5: 修改 src/data/loader.ts — 合并三章 profiles**

找到：
```ts
import chapter1ProfilesRaw from './profiles/chapter1.json';
```
替换为：
```ts
import chapter1ProfilesRaw from './profiles/chapter1.json';
import chapter2ProfilesRaw from './profiles/chapter2.json';
import chapter3ProfilesRaw from './profiles/chapter3.json';
```

找到：
```ts
export const SUSPECT_PROFILES: SuspectProfile[] = chapter1ProfilesRaw as SuspectProfile[];
```
替换为：
```ts
export const SUSPECT_PROFILES: SuspectProfile[] = [
  ...chapter1ProfilesRaw,
  ...chapter2ProfilesRaw,
  ...chapter3ProfilesRaw,
] as SuspectProfile[];
```

- [ ] **Step 6: 运行全部测试**

```bash
npx vitest run
```
Expected: 160 passed（157 + 3 新 profiles 测试）

- [ ] **Step 7: Commit**

```bash
git add src/data/profiles/chapter2.json src/data/profiles/chapter3.json \
        src/data/loader.ts tests/data/profilesIntegrity.test.ts
git commit -m "feat: add chapter 2-3 NPC profiles (无迹、李邈、探子、古玩掌柜、天机联络人)"
```

- [ ] **Step 8: push 到 origin main**

```bash
git push origin main
```

---

## 自查清单

**Spec coverage:**
- ⑩ SVG ID — Task 1 ✓
- ⑥ 合成高亮 — Task 2 ✓
- ⑧ 首次引导 — Task 3 ✓
- ② 房间过渡 — Task 4 ✓
- ⑤⑨ 持久化 — Task 5 ✓
- ④ 天赋反馈 — Task 6 ✓
- ⑦ 通关小结 — Task 7 ✓
- ① UI 引导 — Task 8 ✓
- ③ 档案数据 — Task 9 ✓

**Placeholder scan:** 无 TBD/TODO，所有代码块完整。

**Type consistency:**
- `foundSynthesisIds: string[]` 在 SceneState、SaveData、loadState Pick、useAutoSave、SaveLoadModal 中命名一致。
- `SYNTHESES` 在 loader.ts 中已导出，RightPanel Task 2 和 Task 5 均使用同一导入路径。
- `addFoundSynthesisId` 在 sceneStore 和 RightPanel 中命名一致。
