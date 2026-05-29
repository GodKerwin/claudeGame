# Bug Fixes & Gameplay Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 11 个游玩测试中发现的问题，包含 P0 崩溃/不可通关 bug、UX 改进、以及新增开场剧情。

**Architecture:** 现有 React 18 + TypeScript + Vite + TailwindCSS v3 + Zustand v4 架构。所有改动均为增量——新增组件/hook、向现有 store 追加字段、修改 JSON 数据。引擎代码（conditionEvaluator、mapEngine）不变，仅 eventEngine 新增 `isCompleted` 逻辑。

**Tech Stack:** React 18, TypeScript, Vite, TailwindCSS v3, Zustand v4, Framer Motion v11, React Router v6, Vitest 2.x

---

## File Structure

| 操作 | 文件 | 说明 |
|------|------|------|
| 修改 | `src/data/events/chapter1.json` | climb_window agi 7→6，新增 recognize_gang_code action |
| 修改 | `src/data/npcs/chapter1.json` | hidden_tianji wis 9→7 |
| 修改 | `src/engine/eventEngine.ts` | 新增 `completed` 字段到 ActionResult，新增 `isCompleted()` |
| 修改 | `src/components/ui/ActionButton.tsx` | 新增 `completed` prop，显示已完成样式 |
| 修改 | `src/components/layout/CenterPanel.tsx` | ActionItem 新增 `completed` 字段 |
| 修改 | `src/types/game.ts` | SaveData 新增 `seenDialogues`、`visitedRooms` |
| 修改 | `src/store/sceneStore.ts` | 新增 `seenDialogues`、`visitedRooms` 及对应 actions |
| 新增 | `src/pages/Prologue/Prologue.tsx` | 开场剧情页面，打字机效果 |
| 修改 | `src/App.tsx` | 新增 `/prologue` 路由 |
| 修改 | `src/pages/CharacterCreate/CharacterCreate.tsx` | navigate 到 `/prologue` |
| 新增 | `src/hooks/useSettings.ts` | 字体大小持久化（localStorage） |
| 新增 | `src/components/settings/SettingsModal.tsx` | 设置面板 UI |
| 修改 | `src/pages/Game/Game.tsx` | processingRef + settings modal + seenDialogues 指示 + visitedRooms |
| 新增 | `src/components/ui/Tooltip.tsx` | 通用 hover tooltip 组件 |
| 修改 | `src/components/layout/RightPanel.tsx` | 属性/天赋/线索/任务 tooltip，任务提示按钮 |
| 修改 | `src/components/layout/LeftPanel.tsx` | 已探索地点列表，替换无用小地图 |
| 修改 | `src/hooks/useAutoSave.ts` | 保存 seenDialogues/visitedRooms |
| 修改 | `src/components/save/SaveLoadModal.tsx` | loadState 新增字段 fallback |
| 修改 | `src/pages/MainMenu/MainMenu.tsx` | loadState 新增字段 fallback |

---

## 关键知识（实施者必读）

**TailwindCSS 字体缩放**：设置 `document.documentElement.style.fontSize = '14px'` 后，所有使用 `rem` 单位的 Tailwind 类均按比例缩放。存 localStorage，页面加载时恢复。

**processingRef 防双击**：`const processingRef = useRef(false)`，handleAction 开头检查并设为 true，setTimeout 后重置。不用 useState 是因为不需要 re-render。

**ActionResult.completed 语义**：当 action 的唯一不满足条件是 `flags_absent` 时（说明玩家已通过其他方式完成了等效操作），该 action 应标记为 `completed: true`，在 UI 上显示"✓ 已完成"而非普通灰色不可用。

**seenDialogues**：NPC 对话被触发后，`${npcId}:${dialogueId}` 存入 seenDialogues。在操作列表中，如果 NPC 的当前对话 id 已在 seenDialogues 中，按钮上显示一个小圆点或"（已对话）"提示，但仍可点击。

**对话 id 获取**：`getAvailableDialogues(npc, ctx)` 返回 `DialogueLine[]`，使用 `dialogues[0].id` 即可。

**visitedRooms**：进入房间时将 roomId 加入 visitedRooms（去重），LeftPanel 读取并显示已访问房间名称列表。

**QUEST_HINTS 常量**：在 RightPanel 内部定义，key 为 questId，value 为对玩家的提示文字。

**Prologue 页面**：固定文本，全屏居中，TypewriterText 逐字显示，显示完成后出现「踏入江湖」按钮，navigate 到 `/game`。不需要路由参数。

**evt_alley_marks label 问题（Issue #10）**：当前 `examine_marks_wise` action 要求 `wisdom >= 6` 且 `flags_absent: [alley_marks_found]`，但 label 写"仔细辨认刻迹"——这个 label 对所有人可见，包括智慧不足的玩家，但点击后提示"需要智慧≥6"让玩家困惑。解决方案：`examine_marks_basic`（无属性要求）作为默认选项，`examine_marks_wise` 保持智慧要求但 label 改为"深入研究刻痕（需智慧≥6）"，`marks_done` 改为"已记录暗记"（flags_absent: [alley_marks_found] → 只有记录后才消失）。

---

## Task 1: P0 Data Fixes + Completed Action State

**修复问题**：#6（不可通关）、#8（双击bug）、#11（已完成操作消失）

**Files:**
- Modify: `src/data/events/chapter1.json` — climb_window agility 7→6，evt_alley_marks label polish
- Modify: `src/data/npcs/chapter1.json` — hidden_tianji wisdom requirement 9→7
- Modify: `src/engine/eventEngine.ts` — 新增 completed 字段
- Modify: `src/components/ui/ActionButton.tsx` — completed prop
- Modify: `src/components/layout/CenterPanel.tsx` — ActionItem.completed
- Modify: `src/pages/Game/Game.tsx` — processingRef

- [ ] **Step 1: Fix data — climb_window agility requirement**

在 `src/data/events/chapter1.json` 中找到 `evt_cellar_mechanism` 的 `climb_window` action，修改：
```json
"requires": {
  "agility": 6,
  "flags_absent": ["secret_room_opened"]
}
```
（原为 `"agility": 7`）

- [ ] **Step 2: Fix data — evt_alley_marks label polish**

在 `src/data/events/chapter1.json` 中找到 `evt_alley_marks`，修改三个 action 的 label：
- `examine_marks_wise`：label 改为 `"深入研究刻痕（需智慧≥6）"`
- `examine_marks_basic`：label 改为 `"粗略打量墙上刻痕"`
- `marks_done`：label 改为 `"这刻痕你已记录在册"`

- [ ] **Step 3: Fix data — hidden_tianji wisdom requirement**

在 `src/data/npcs/chapter1.json` 中找到 `npc_white_stranger` 的 `hidden_tianji` dialogue，修改：
```json
"condition": {
  "wisdom": 7,
  "talent": "察言观色",
  "flags": ["stranger_met"]
}
```
（原为 `"wisdom": 9`）

- [ ] **Step 4: Update eventEngine — add completed field**

修改 `src/engine/eventEngine.ts`：

```typescript
import type { GameEvent, EventAction, Condition } from '../types/game';
import { evaluate } from './conditionEvaluator';
import type { EvalContext } from './conditionEvaluator';

export interface ActionResult {
  action: EventAction;
  available: boolean;
  completed: boolean;
  hint: string;
}

export function getActionResults(event: GameEvent, ctx: EvalContext): ActionResult[] {
  return event.actions.map((action) => ({
    action,
    available: evaluate(action.requires, ctx),
    completed: isCompleted(action, ctx),
    hint: getMissingConditionLabel(action.requires, ctx),
  }));
}

function isCompleted(action: EventAction, ctx: EvalContext): boolean {
  if (!action.requires?.flags_absent?.length) return false;
  if (evaluate(action.requires, ctx)) return false;
  const { flags_absent: _fa, ...rest } = action.requires;
  const hasOtherConditions = Object.keys(rest).length > 0;
  return hasOtherConditions ? evaluate(rest as Condition, ctx) : true;
}

export function canExecuteAction(action: EventAction, ctx: EvalContext): boolean {
  return evaluate(action.requires, ctx);
}

export function getMissingConditionLabel(condition: Condition | null | undefined, ctx: EvalContext): string {
  if (!condition || evaluate(condition, ctx)) return '';
  const hints: string[] = [];
  if (condition.wisdom !== undefined && ctx.player.wisdom < condition.wisdom)
    hints.push(`需要智慧 ≥ ${condition.wisdom}`);
  if (condition.strength !== undefined && ctx.player.strength < condition.strength)
    hints.push(`需要力量 ≥ ${condition.strength}`);
  if (condition.agility !== undefined && ctx.player.agility < condition.agility)
    hints.push(`需要敏捷 ≥ ${condition.agility}`);
  if (condition.constitution !== undefined && ctx.player.constitution < condition.constitution)
    hints.push(`需要根骨 ≥ ${condition.constitution}`);
  if (condition.talent !== undefined && ctx.player.talent !== condition.talent)
    hints.push(`需要天赋「${condition.talent}」`);
  if (condition.has) {
    for (const itemId of condition.has) {
      if (!ctx.inventory.includes(itemId)) hints.push(`缺少物品`);
    }
  }
  if (condition.flags) {
    for (const flag of condition.flags) {
      if (!ctx.flags.includes(flag)) hints.push(`条件未满足`);
    }
  }
  return hints.join('，');
}
```

- [ ] **Step 5: Update ActionButton — add completed prop**

修改 `src/components/ui/ActionButton.tsx`：

```typescript
import { cn } from '../../utils/cn';

interface Props {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  completed?: boolean;
  hint?: string;
  variant?: 'default' | 'danger' | 'special';
  className?: string;
}

export function ActionButton({ label, onClick, disabled = false, completed = false, hint, variant = 'default', className }: Props) {
  const isDisabled = disabled || completed;
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={cn(
          'w-full text-left px-3 py-2 text-sm border transition-all duration-150 focus:outline-none',
          variant === 'default' && !isDisabled && 'border-gold/40 text-ink hover:border-gold hover:text-gold hover:shadow-[0_0_8px_rgba(201,168,76,0.3)] cursor-pointer',
          variant === 'danger' && !isDisabled && 'border-blood/40 text-blood/80 hover:border-blood hover:text-blood cursor-pointer',
          variant === 'special' && !isDisabled && 'border-gold/60 text-gold hover:border-gold hover:shadow-[0_0_12px_rgba(201,168,76,0.5)] cursor-pointer',
          completed && 'border-gold/15 text-ink/25 cursor-not-allowed',
          !completed && disabled && 'border-ink/10 text-ink/30 cursor-not-allowed',
          className,
        )}
      >
        {completed ? <span className="text-gold/30">✓ {label}</span> : label}
      </button>
      {!completed && disabled && hint && (
        <div className="absolute bottom-full left-0 mb-1 px-2 py-1 text-xs bg-paper border border-gold/20 text-ink/60 whitespace-nowrap z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          {hint}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Update CenterPanel — add completed to ActionItem**

修改 `src/components/layout/CenterPanel.tsx`：

```typescript
import { TypewriterText } from '../ui/TypewriterText';
import { ActionButton } from '../ui/ActionButton';

interface ActionItem {
  id: string;
  label: string;
  available: boolean;
  completed: boolean;
  hint: string;
  variant?: 'default' | 'danger' | 'special';
}

interface Props {
  roomName: string;
  roomDescription: string;
  storyTexts: string[];
  actions: ActionItem[];
  onAction: (actionId: string) => void;
}

export function CenterPanel({ roomName, roomDescription, storyTexts, actions, onAction }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b border-gold/10">
        <h2 className="text-gold text-base tracking-wider">{roomName}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <p className="text-ink/80 leading-loose text-sm">{roomDescription}</p>
        {storyTexts.map((text, i) => (
          <div key={i} className="border-l-2 border-gold/20 pl-3">
            <TypewriterText text={text} className="text-ink/90 leading-loose text-sm" />
          </div>
        ))}
      </div>

      <div className="border-t border-gold/10 px-5 py-3">
        <p className="text-gold/40 text-xs mb-2 tracking-widest">── 操作 ──</p>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((a) => (
            <ActionButton
              key={a.id}
              label={a.label}
              onClick={() => onAction(a.id)}
              disabled={!a.available}
              completed={a.completed}
              hint={a.hint}
              variant={a.variant}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Update Game.tsx — processingRef + pass completed**

在 `src/pages/Game/Game.tsx` 的 imports 里加上 `useRef`，修改 buildActions 和 handleAction：

在函数组件顶部（`const [modal, setModal] = useState<ModalType>(null);` 之后）添加：
```typescript
const processingRef = useRef(false);
```

在 buildActions 里，push evt_ action 时加上 completed 字段：
```typescript
actions.push({
  id: `${interactableId}:${r.action.id}`,
  label: r.action.label,
  available: r.available,
  completed: r.completed,
  hint: r.hint,
});
```

对于 NPC push 的 action，也需要 completed 字段（NPC 不涉及 completed，固定 false）：
```typescript
actions.push({
  id: `${interactableId}:talk`,
  label: `与${npc.name}交谈`,
  available: true,
  completed: false,
  hint: '',
});
```

handleAction 开头加防双击：
```typescript
const handleAction = (actionId: string) => {
  if (processingRef.current) return;
  processingRef.current = true;
  setTimeout(() => { processingRef.current = false; }, 300);
  // ... rest of existing code
```

- [ ] **Step 8: Run tests**

```bash
cd /Users/xuli/claudeGame && npm run test
```

期望：所有测试通过（包含现有 51 个）

- [ ] **Step 9: TypeScript check**

```bash
cd /Users/xuli/claudeGame && npm run build 2>&1 | head -50
```

期望：无 TypeScript 错误

- [ ] **Step 10: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/data/events/chapter1.json src/data/npcs/chapter1.json src/engine/eventEngine.ts src/components/ui/ActionButton.tsx src/components/layout/CenterPanel.tsx src/pages/Game/Game.tsx && git commit -m "fix: P0 bugs - unwinnable states, double-click, completed action state"
```

---

## Task 2: Prologue Opening Scene

**修复问题**：#4（无开场剧情）

**Files:**
- Create: `src/pages/Prologue/Prologue.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/CharacterCreate/CharacterCreate.tsx`

- [ ] **Step 1: Create Prologue page**

新建 `src/pages/Prologue/Prologue.tsx`：

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TypewriterText } from '../../components/ui/TypewriterText';

const PROLOGUE_LINES = [
  '大唐开元二十三年，秋。',
  '长安城，往事客栈。',
  '你本只是路过此地，却在一个普通的夜晚被命运留了下来。',
  '清晨，隔壁房间的商人宋怀义死在了密室之中——',
  '门窗俱锁，无人进出，却留下了一具冰冷的尸体。',
  '驿卒未至，官府难查。',
  '这一天，解开谜题的人，只能是你。',
];

export default function Prologue() {
  const navigate = useNavigate();
  const [currentLine, setCurrentLine] = useState(0);
  const [allDone, setAllDone] = useState(false);

  const handleLineDone = () => {
    if (currentLine < PROLOGUE_LINES.length - 1) {
      setTimeout(() => setCurrentLine((l) => l + 1), 600);
    } else {
      setTimeout(() => setAllDone(true), 800);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center p-12">
      <div className="max-w-xl w-full space-y-6">
        {PROLOGUE_LINES.slice(0, currentLine + 1).map((line, i) => (
          <div key={i} className={`transition-opacity duration-500 ${i <= currentLine ? 'opacity-100' : 'opacity-0'}`}>
            {i === currentLine ? (
              <TypewriterText
                text={line}
                className="text-ink/80 leading-loose text-base"
                onComplete={handleLineDone}
              />
            ) : (
              <p className="text-ink/70 leading-loose text-base">{line}</p>
            )}
          </div>
        ))}

        {allDone && (
          <div className="pt-8 text-center">
            <button
              onClick={() => navigate('/game')}
              className="border border-gold text-gold px-8 py-2 text-sm tracking-widest hover:shadow-[0_0_16px_rgba(201,168,76,0.4)] transition-all cursor-pointer"
            >
              踏入江湖
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

**注意**：`TypewriterText` 组件可能没有 `onComplete` 回调。在这之前先读取 `src/components/ui/TypewriterText.tsx` 检查其接口。如果没有 `onComplete`，则改为：通过 `currentLine` 递增来控制显示顺序，每行用 `useEffect` + `setTimeout` 自动推进（不需要回调）：

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PROLOGUE_LINES = [
  '大唐开元二十三年，秋。',
  '长安城，往事客栈。',
  '你本只是路过此地，却在一个普通的夜晚被命运留了下来。',
  '清晨，隔壁房间的商人宋怀义死在了密室之中——',
  '门窗俱锁，无人进出，却留下了一具冰冷的尸体。',
  '驿卒未至，官府难查。',
  '这一天，解开谜题的人，只能是你。',
];

const LINE_DURATION = 2000; // ms per line

export default function Prologue() {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(0);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (visibleCount < PROLOGUE_LINES.length) {
      const t = setTimeout(() => setVisibleCount((c) => c + 1), visibleCount === 0 ? 300 : LINE_DURATION);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setShowButton(true), 800);
      return () => clearTimeout(t);
    }
  }, [visibleCount]);

  return (
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center p-12">
      <div className="max-w-xl w-full space-y-5">
        {PROLOGUE_LINES.map((line, i) => (
          <p
            key={i}
            className={`leading-loose text-base transition-opacity duration-1000 ${i < visibleCount ? 'opacity-80' : 'opacity-0'}`}
          >
            {line}
          </p>
        ))}

        <div className={`pt-8 text-center transition-opacity duration-700 ${showButton ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => navigate('/game')}
            className={`border border-gold text-gold px-8 py-2 text-sm tracking-widest hover:shadow-[0_0_16px_rgba(201,168,76,0.4)] transition-all ${showButton ? 'cursor-pointer' : 'pointer-events-none'}`}
          >
            踏入江湖
          </button>
        </div>
      </div>
    </div>
  );
}
```

使用第二个版本（更稳健，不依赖 TypewriterText 回调）。

- [ ] **Step 2: Add prologue route to App.tsx**

读取 `src/App.tsx`，找到路由配置，在 `/game` 路由前新增：
```tsx
<Route path="/prologue" element={<Prologue />} />
```
并在顶部 import：
```tsx
import Prologue from './pages/Prologue/Prologue';
```

- [ ] **Step 3: Update CharacterCreate to navigate to /prologue**

在 `src/pages/CharacterCreate/CharacterCreate.tsx` 的 `handleStart` 函数中，将：
```typescript
navigate('/game');
```
改为：
```typescript
navigate('/prologue');
```

- [ ] **Step 4: Run tests and build**

```bash
cd /Users/xuli/claudeGame && npm run test && npm run build 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/pages/Prologue/Prologue.tsx src/App.tsx src/pages/CharacterCreate/CharacterCreate.tsx && git commit -m "feat: add prologue opening scene before game start"
```

---

## Task 3: Settings Modal (Font Size + Save/Load Entry)

**修复问题**：#1（字体太小，需要设置面板）

**Files:**
- Create: `src/hooks/useSettings.ts`
- Create: `src/components/settings/SettingsModal.tsx`
- Modify: `src/pages/Game/Game.tsx` — 添加设置按钮

- [ ] **Step 1: Create useSettings hook**

新建 `src/hooks/useSettings.ts`：

```typescript
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'tianji_font_size';
const DEFAULT_SIZE = 16;
const MIN_SIZE = 12;
const MAX_SIZE = 22;

function applyFontSize(size: number) {
  document.documentElement.style.fontSize = `${size}px`;
}

export function useSettings() {
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_SIZE;
  });

  useEffect(() => {
    applyFontSize(fontSize);
    localStorage.setItem(STORAGE_KEY, String(fontSize));
  }, [fontSize]);

  const increaseFontSize = () => setFontSize((s) => Math.min(s + 1, MAX_SIZE));
  const decreaseFontSize = () => setFontSize((s) => Math.max(s - 1, MIN_SIZE));
  const resetFontSize = () => setFontSize(DEFAULT_SIZE);

  return { fontSize, increaseFontSize, decreaseFontSize, resetFontSize, MIN_SIZE, MAX_SIZE };
}
```

- [ ] **Step 2: Create SettingsModal component**

新建 `src/components/settings/SettingsModal.tsx`：

```typescript
import { useSettings } from '../../hooks/useSettings';

interface Props {
  onClose: () => void;
  onSave: () => void;
  onLoad: () => void;
}

export function SettingsModal({ onClose, onSave, onLoad }: Props) {
  const { fontSize, increaseFontSize, decreaseFontSize, resetFontSize, MIN_SIZE, MAX_SIZE } = useSettings();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-paper border border-gold/30 p-6 w-80 font-serif"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-gold text-base tracking-widest mb-5">── 设置 ──</h2>

        <div className="space-y-5">
          <div>
            <p className="text-ink/60 text-xs mb-2 tracking-widest">【字体大小】</p>
            <div className="flex items-center gap-3">
              <button
                onClick={decreaseFontSize}
                disabled={fontSize <= MIN_SIZE}
                className="w-7 h-7 border border-gold/30 text-gold hover:border-gold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-base"
              >
                −
              </button>
              <span className="text-gold font-bold w-10 text-center">{fontSize}px</span>
              <button
                onClick={increaseFontSize}
                disabled={fontSize >= MAX_SIZE}
                className="w-7 h-7 border border-gold/30 text-gold hover:border-gold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-base"
              >
                ＋
              </button>
              <button
                onClick={resetFontSize}
                className="text-xs text-ink/40 hover:text-ink/70 ml-1 cursor-pointer"
              >
                重置
              </button>
            </div>
            <p className="text-ink/30 text-xs mt-1">预览：这是一行示例文字</p>
          </div>

          <div className="border-t border-gold/10 pt-4 space-y-2">
            <p className="text-ink/60 text-xs mb-2 tracking-widest">【存档】</p>
            <button
              onClick={() => { onSave(); onClose(); }}
              className="w-full py-2 border border-gold/30 text-ink/70 text-sm hover:border-gold hover:text-gold transition-all cursor-pointer"
            >
              保存进度
            </button>
            <button
              onClick={() => { onLoad(); onClose(); }}
              className="w-full py-2 border border-gold/30 text-ink/70 text-sm hover:border-gold hover:text-gold transition-all cursor-pointer"
            >
              读取进度
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2 text-ink/40 text-xs hover:text-ink/70 cursor-pointer"
        >
          关闭
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update Game.tsx — add settings button and modal**

在 Game.tsx 中：

1. 新增 import：
```typescript
import { SettingsModal } from '../../components/settings/SettingsModal';
import { useSettings } from '../../hooks/useSettings';
```

2. ModalType 改为：
```typescript
type ModalType = 'save' | 'load' | 'settings' | null;
```

3. 在组件内调用（在 `useAutoSave()` 之后）：
```typescript
useSettings(); // 应用保存的字体大小
```

4. 将原来的存档按钮（`✦`）改为设置按钮（`⚙`），并改为打开 settings modal：
```tsx
<button
  onClick={() => setModal('settings')}
  className="fixed top-2 right-4 z-20 text-xs text-gold/20 hover:text-gold/60 px-2 py-1 cursor-pointer"
  title="设置（⚙）"
>
  ⚙
</button>
```

5. 在 `{modal && <SaveLoadModal ...>}` 之前加：
```tsx
{modal === 'settings' && (
  <SettingsModal
    onClose={() => setModal(null)}
    onSave={() => setModal('save')}
    onLoad={() => setModal('load')}
  />
)}
```

6. SaveLoadModal 只在 `modal === 'save' || modal === 'load'` 时渲染：
```tsx
{(modal === 'save' || modal === 'load') && (
  <SaveLoadModal mode={modal} onClose={() => setModal(null)} />
)}
```

- [ ] **Step 4: Run build**

```bash
cd /Users/xuli/claudeGame && npm run build 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/hooks/useSettings.ts src/components/settings/SettingsModal.tsx src/pages/Game/Game.tsx && git commit -m "feat: add settings modal with font size control and save/load entry"
```

---

## Task 4: Right Panel Tooltips + Quest Hints

**修复问题**：#2（属性/天赋/线索缺少 tooltip）、#3（任务提示不足）

**Files:**
- Create: `src/components/ui/Tooltip.tsx`
- Modify: `src/components/layout/RightPanel.tsx`

- [ ] **Step 1: Create Tooltip component**

新建 `src/components/ui/Tooltip.tsx`：

```typescript
import { useState, useRef } from 'react';

interface Props {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'left';
}

export function Tooltip({ content, children, position = 'top' }: Props) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div
          className={`absolute z-50 px-2 py-1.5 text-xs bg-paper border border-gold/30 text-ink/70 whitespace-pre-wrap max-w-48 pointer-events-none shadow-sm ${
            position === 'top'
              ? 'bottom-full left-0 mb-1.5'
              : 'right-full top-0 mr-1.5'
          }`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update RightPanel with tooltips and quest hints**

读取 `src/data/loader.ts` 或 `src/data/talents/` 了解如何获取天赋描述（`TALENTS` 数组）。

完整替换 `src/components/layout/RightPanel.tsx`：

```typescript
import { StatBar } from '../ui/StatBar';
import { Tooltip } from '../ui/Tooltip';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { getItem, TALENTS } from '../../data/loader';

const STAT_DESCRIPTIONS: Record<string, string> = {
  strength: '力量\n影响体力检定、破门、格斗等动作',
  agility: '敏捷\n影响潜行、翻越、追踪等动作',
  wisdom: '智慧\n影响推理、识别暗语、解读线索等动作',
  constitution: '根骨\n影响耐毒、抗压、长途行进等动作',
};

const QUEST_HINTS: Record<string, { name: string; hint: string }> = {
  quest_main_murder: {
    name: '调查客栈命案',
    hint: '尝试检查二〇二号房与大堂，\n与掌柜李福交谈可能获得更多线索。\n收集足够的证据后前往废弃宅院。',
  },
  quest_dafei_gang: {
    name: '大飞帮隐藏线索',
    hint: '注意大堂的公告板，\n某些告示可能暗藏玄机。\n试着与饮酒的客人搭话。',
  },
};

export function RightPanel() {
  const player = usePlayerStore();
  const { clues, questLog } = useSceneStore();

  const clueItems = clues.map((id) => getItem(id)).filter(Boolean);
  const talentInfo = TALENTS.find((t) => t.id === player.talent);

  return (
    <div className="flex flex-col h-full p-3 gap-4 text-sm overflow-y-auto">
      <div>
        <p className="text-gold/60 text-xs mb-2 tracking-widest">【角色属性】</p>
        <div className="space-y-1.5">
          {(['strength', 'agility', 'wisdom', 'constitution'] as const).map((stat) => (
            <Tooltip key={stat} content={STAT_DESCRIPTIONS[stat]} position="left">
              <div className="cursor-help">
                <StatBar label={stat} value={player[stat]} />
              </div>
            </Tooltip>
          ))}
        </div>
        {player.talent && talentInfo && (
          <Tooltip content={`${talentInfo.description}\n\n${talentInfo.effect}`} position="left">
            <p className="mt-2 text-xs text-gold/50 cursor-help">
              天赋：<span className="text-gold">{player.talent}</span>
              <span className="text-ink/30 ml-1">(?)</span>
            </p>
          </Tooltip>
        )}
      </div>

      <div>
        <p className="text-gold/60 text-xs mb-2 tracking-widest">【线索记录】</p>
        {clueItems.length === 0 ? (
          <p className="text-ink/30 text-xs">尚无线索</p>
        ) : (
          <ul className="space-y-1">
            {clueItems.map((item) => item && (
              <Tooltip key={item.id} content={item.description} position="left">
                <li className="text-xs text-ink/70 flex items-start gap-1 cursor-help">
                  <span className="text-gold/50 mt-0.5">·</span>
                  <span>{item.name}</span>
                </li>
              </Tooltip>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-gold/60 text-xs mb-2 tracking-widest">【当前任务】</p>
        <ul className="space-y-2">
          {questLog.map((qid) => {
            const q = QUEST_HINTS[qid];
            return (
              <li key={qid} className="text-xs text-ink/70">
                <div className="flex items-start gap-1">
                  <span className="text-gold/50 mt-0.5">◈</span>
                  <span className="flex-1">{q?.name ?? qid}</span>
                  {q?.hint && (
                    <Tooltip content={q.hint} position="left">
                      <span className="text-ink/30 hover:text-gold/50 cursor-help ml-1">?</span>
                    </Tooltip>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TALENTS is exported from loader**

```bash
cd /Users/xuli/claudeGame && grep -n "TALENTS" src/data/loader.ts
```

如果没有导出，读取 loader.ts 并添加。

- [ ] **Step 4: Run build**

```bash
cd /Users/xuli/claudeGame && npm run build 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/components/ui/Tooltip.tsx src/components/layout/RightPanel.tsx && git commit -m "feat: add tooltips to right panel stats/talent/clues, quest hints"
```

---

## Task 5: Balance Fixes — 江湖老千 Usability

**修复问题**：#7（江湖老千天赋无实际用途）

**Files:**
- Modify: `src/data/events/chapter1.json` — 新增 `recognize_gang_code` action 到 `evt_notice_board`

- [ ] **Step 1: Add recognize_gang_code action to evt_notice_board**

在 `src/data/events/chapter1.json` 中找到 `evt_notice_board` 的 actions 数组，在 `decode_acrostic_talent` 之后（`read_again` 之前）新增：

```json
{
  "id": "recognize_gang_code",
  "label": "识别告示中的帮派暗记（江湖老千）",
  "requires": {
    "talent": "江湖老千",
    "flags": ["notice_read"],
    "flags_absent": ["dafei_notice_found"]
  },
  "result": "你在江湖上混迹多年，对各路暗语烂熟于心。那首诗的藏头一眼便识破——大、风、起、兮、云、飞、扬，「大飞」二字。不仅如此，你还注意到招领启事的纸张质地和字体，这是某个中等规模帮派惯用的文书格式。你顺手在告示背后摸到一枚铜牌。",
  "grants": {
    "flags": ["dafei_notice_found", "dafei_acrostic_decoded", "gang_culture_known"],
    "items": ["broken_copper_badge"]
  }
}
```

- [ ] **Step 2: Verify evt_alley_marks labels are correct from Task 1**

```bash
cd /Users/xuli/claudeGame && python3 -c "import json; d=json.load(open('src/data/events/chapter1.json')); e=[x for x in d if x['id']=='evt_alley_marks'][0]; [print(a['id'],a['label']) for a in e['actions']]"
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/xuli/claudeGame && npm run test
```

- [ ] **Step 4: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/data/events/chapter1.json && git commit -m "feat: add recognize_gang_code for 江湖老千 talent, balance improvements"
```

---

## Task 6: Minor UX — seenDialogues + visitedRooms + Persistence

**修复问题**：#5（小地图无用 → 已探索地点列表）、#9（NPC 可无限对话无提示）

**Files:**
- Modify: `src/types/game.ts`
- Modify: `src/store/sceneStore.ts`
- Modify: `src/pages/Game/Game.tsx`
- Modify: `src/components/layout/LeftPanel.tsx`
- Modify: `src/hooks/useAutoSave.ts`
- Modify: `src/components/save/SaveLoadModal.tsx`
- Modify: `src/pages/MainMenu/MainMenu.tsx`

- [ ] **Step 1: Update SaveData type**

在 `src/types/game.ts` 的 `SaveData` interface 中新增两个字段：

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
}
```

- [ ] **Step 2: Update sceneStore**

在 `src/store/sceneStore.ts` 中完整替换内容：

```typescript
import { create } from 'zustand';

interface SceneState {
  currentRoomId: string;
  flags: string[];
  clues: string[];
  questLog: string[];
  storyText: string[];
  seenDialogues: string[];
  visitedRooms: string[];
  setRoom: (roomId: string) => void;
  addFlag: (flag: string) => void;
  addClue: (clueId: string) => void;
  addQuest: (questId: string) => void;
  addStoryText: (text: string) => void;
  clearStoryText: () => void;
  markDialogueSeen: (key: string) => void;
  addVisitedRoom: (roomId: string) => void;
  loadState: (state: Partial<Pick<SceneState, 'currentRoomId' | 'flags' | 'clues' | 'questLog' | 'storyText' | 'seenDialogues' | 'visitedRooms'>>) => void;
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
};

export const useSceneStore = create<SceneState>((set) => ({
  ...defaultState,
  setRoom: (roomId) =>
    set((s) => {
      if (s.currentRoomId === roomId) return s;
      const visitedRooms = s.visitedRooms.includes(roomId) ? s.visitedRooms : [...s.visitedRooms, roomId];
      return { currentRoomId: roomId, storyText: [], visitedRooms };
    }),
  addFlag: (flag) =>
    set((s) => ({ flags: s.flags.includes(flag) ? s.flags : [...s.flags, flag] })),
  addClue: (clueId) =>
    set((s) => ({ clues: s.clues.includes(clueId) ? s.clues : [...s.clues, clueId] })),
  addQuest: (questId) =>
    set((s) => ({ questLog: s.questLog.includes(questId) ? s.questLog : [...s.questLog, questId] })),
  addStoryText: (text) =>
    set((s) => ({ storyText: [...s.storyText, text] })),
  clearStoryText: () => set({ storyText: [] }),
  markDialogueSeen: (key) =>
    set((s) => ({ seenDialogues: s.seenDialogues.includes(key) ? s.seenDialogues : [...s.seenDialogues, key] })),
  addVisitedRoom: (roomId) =>
    set((s) => ({ visitedRooms: s.visitedRooms.includes(roomId) ? s.visitedRooms : [...s.visitedRooms, roomId] })),
  loadState: (state) => set(state),
  reset: () => set(defaultState),
}));
```

- [ ] **Step 3: Update Game.tsx — mark seen dialogues, pass to actions**

在 `src/pages/Game/Game.tsx` 中：

1. 从 scene store 中解构 `seenDialogues` 和 `markDialogueSeen`：
```typescript
const { items, addItem, removeItem } = useInventoryStore();
// scene 已有，在 scene.seenDialogues / scene.markDialogueSeen 访问
```

2. 在 buildActions 的 NPC 分支中，读取当前对话 id 并检查是否已见过：
```typescript
} else if (interactableId.startsWith('npc_')) {
  const npc = getNPC(interactableId);
  if (!npc) continue;
  const dialogues = getAvailableDialogues(npc, ctx);
  if (dialogues.length > 0) {
    const dialogueKey = `${interactableId}:${dialogues[0].id}`;
    const seen = scene.seenDialogues.includes(dialogueKey);
    actions.push({
      id: `${interactableId}:talk`,
      label: seen ? `与${npc.name}交谈（已对话）` : `与${npc.name}交谈`,
      available: true,
      completed: false,
      hint: '',
    });
  }
}
```

3. 在 handleAction 的 NPC 分支中，触发对话后 markDialogueSeen：
```typescript
} else if (entityId.startsWith('npc_')) {
  const npc = getNPC(entityId);
  if (!npc) return;
  const dialogues = getAvailableDialogues(npc, ctx);
  if (dialogues.length === 0) return;
  const d = dialogues[0];
  scene.addStoryText(`【${npc.name}】${d.text}`);
  scene.markDialogueSeen(`${entityId}:${d.id}`);
  if (d.grants) {
    d.grants.flags?.forEach((f) => scene.addFlag(f));
    d.grants.clues?.forEach((c) => scene.addClue(c));
    d.grants.items?.forEach((i) => addItem(i));
    d.grants.quests?.forEach((q) => scene.addQuest(q));
  }
}
```

- [ ] **Step 4: Update LeftPanel — replace mini-map with visited rooms**

完整替换 `src/components/layout/LeftPanel.tsx`：

```typescript
import { useSceneStore } from '../../store/sceneStore';
import { getRoom, ALL_ROOMS } from '../../data/loader';
import { getAvailableExits } from '../../engine/mapEngine';
import { usePlayerStore } from '../../store/playerStore';
import { useInventoryStore } from '../../store/inventoryStore';
import type { EvalContext } from '../../engine/conditionEvaluator';

interface Props {
  onNavigate: (roomId: string) => void;
}

export function LeftPanel({ onNavigate }: Props) {
  const { currentRoomId, flags, visitedRooms } = useSceneStore();
  const player = usePlayerStore();
  const { items } = useInventoryStore();

  const room = getRoom(currentRoomId);
  const ctx: EvalContext = {
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
  };
  const exits = room ? getAvailableExits(room, ctx, ALL_ROOMS) : [];

  const visitedRoomNames = visitedRooms
    .map((id) => getRoom(id))
    .filter(Boolean)
    .filter((r) => r!.id !== currentRoomId);

  return (
    <div className="flex flex-col h-full p-3 gap-4 text-sm">
      <div>
        <p className="text-gold/60 text-xs mb-1 tracking-widest">【当前地点】</p>
        <p className="text-ink font-bold leading-snug">{room?.name ?? '—'}</p>
      </div>

      <div>
        <p className="text-gold/60 text-xs mb-2 tracking-widest">【可前往】</p>
        <div className="flex flex-col gap-1">
          {exits.map((r) => (
            <button
              key={r.id}
              onClick={() => onNavigate(r.id)}
              className="text-left text-ink/80 hover:text-gold text-xs py-1 px-2 border border-transparent hover:border-gold/20 transition-colors"
            >
              ▶ {r.name}
            </button>
          ))}
        </div>
      </div>

      {visitedRoomNames.length > 0 && (
        <div>
          <p className="text-gold/40 text-xs mb-1 tracking-widest">【已探索】</p>
          <ul className="space-y-0.5">
            {visitedRoomNames.map((r) => r && (
              <li key={r.id} className="text-xs text-ink/40 py-0.5 px-2">
                · {r.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Update persistence — useAutoSave**

读取 `src/hooks/useAutoSave.ts`，在构建 SaveData 的地方新增 `seenDialogues` 和 `visitedRooms`：

```typescript
// 在 data 对象中添加：
seenDialogues: scene.seenDialogues,
visitedRooms: scene.visitedRooms,
```

- [ ] **Step 6: Update SaveLoadModal — loadState fallbacks**

读取 `src/components/save/SaveLoadModal.tsx`，找到调用 `scene.loadState` 的地方，确保新字段有默认值：

```typescript
scene.loadState({
  currentRoomId: data.currentRoomId,
  flags: data.flags ?? [],
  clues: data.clues ?? [],
  questLog: data.questLog ?? [],
  storyText: [],
  seenDialogues: data.seenDialogues ?? [],
  visitedRooms: data.visitedRooms ?? [data.currentRoomId],
});
```

- [ ] **Step 7: Update MainMenu — loadState fallbacks**

读取 `src/pages/MainMenu/MainMenu.tsx`，同上对 `scene.loadState` 调用加 fallback。

- [ ] **Step 8: Run all tests and build**

```bash
cd /Users/xuli/claudeGame && npm run test && npm run build 2>&1 | head -30
```

- [ ] **Step 9: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/types/game.ts src/store/sceneStore.ts src/pages/Game/Game.tsx src/components/layout/LeftPanel.tsx src/hooks/useAutoSave.ts src/components/save/SaveLoadModal.tsx src/pages/MainMenu/MainMenu.tsx && git commit -m "feat: seenDialogues indicator, visited rooms list, persistence updates"
```
