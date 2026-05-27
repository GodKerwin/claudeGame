# 天机残卷 Chapter 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete playable Chapter 1 of 天机残卷 — a wuxia text mystery RPG with 6 locations, full murder mystery, character creation with 5 templates, attribute-driven multi-solution puzzles, and a fully hidden 大飞帮 side storyline.

**Architecture:** State Machine + JSON Data Driven. All story logic lives in JSON config files. A `ConditionEvaluator` engine reads player attributes / flags / inventory to determine available actions. Zustand stores manage all game state.

**Tech Stack:** React 18, TypeScript, Vite, TailwindCSS v3, Zustand v4, Framer Motion v11, React Router v6, Vitest v1

**Working directory for all commands:** `/Users/xuli/claudeGame`

---

## File Structure

```
/Users/xuli/claudeGame/
├── src/
│   ├── types/
│   │   └── game.ts                      # All shared TS interfaces
│   ├── engine/
│   │   ├── conditionEvaluator.ts        # Core: evaluate Condition against EvalContext
│   │   ├── mapEngine.ts                 # Room navigation, exit filtering
│   │   ├── eventEngine.ts               # Action availability + execution
│   │   ├── storyEngine.ts               # NPC dialogue filtering
│   │   └── saveEngine.ts                # localStorage save/load
│   ├── store/
│   │   ├── playerStore.ts               # Player stats + talent
│   │   ├── sceneStore.ts                # Current room, flags, clues, questLog, storyText
│   │   ├── inventoryStore.ts            # Item IDs
│   │   └── saveStore.ts                 # Save slot metadata
│   ├── data/
│   │   ├── loader.ts                    # Central data access — no engine imports data directly
│   │   ├── talents.json
│   │   ├── templates.json
│   │   ├── maps/chapter1.json           # 6 rooms
│   │   ├── npcs/chapter1.json           # 6 NPCs
│   │   ├── events/chapter1.json         # All events (inn, kitchen, cellar, forest, mansion, 大飞帮)
│   │   └── items/chapter1.json          # All items
│   ├── components/
│   │   ├── ui/
│   │   │   ├── TypewriterText.tsx       # Framer Motion typewriter
│   │   │   ├── StatBar.tsx              # Attribute bar (fill + number)
│   │   │   └── ActionButton.tsx         # Gold-border action button with disabled state
│   │   ├── layout/
│   │   │   ├── GameLayout.tsx           # 3-panel shell (160 / flex / 200)
│   │   │   ├── LeftPanel.tsx            # Location + exits
│   │   │   ├── CenterPanel.tsx          # Scene text + actions
│   │   │   └── RightPanel.tsx           # Stats + clues + quests
│   │   ├── scene/
│   │   │   └── SceneView.tsx            # Wires store → panels, handles action dispatch
│   │   └── save/
│   │       └── SaveLoadModal.tsx        # Save/load dialog
│   ├── pages/
│   │   ├── MainMenu/MainMenu.tsx
│   │   ├── CharacterCreate/CharacterCreate.tsx
│   │   └── Game/Game.tsx
│   ├── hooks/
│   │   └── useAutoSave.ts               # Auto-save on room change / flag change / clue change
│   ├── utils/
│   │   └── cn.ts                        # clsx + twMerge
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── tests/
│   └── engine/
│       ├── conditionEvaluator.test.ts
│       ├── mapEngine.test.ts
│       ├── eventEngine.test.ts
│       └── saveEngine.test.ts
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
└── tsconfig.json
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: Initialize project**

```bash
cd /Users/xuli/claudeGame
npm create vite@latest . -- --template react-ts
```

When prompted "Current directory is not empty", choose **Ignore files and continue**.

- [ ] **Step 2: Install all dependencies**

```bash
npm install react-router-dom@^6.23.1 zustand@^4.5.2 framer-motion@^11.2.10
npm install -D tailwindcss@^3.4.4 postcss@^8.4.38 autoprefixer@^10.4.19 \
  vitest@^1.6.0 jsdom@^24.1.0 @testing-library/react@^16.0.0 \
  @testing-library/jest-dom@^6.4.6 clsx@^2.1.1 tailwind-merge@^2.3.0
npx tailwindcss init -p --ts
```

- [ ] **Step 3: Configure Tailwind**

Replace `tailwind.config.ts` with:

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#1a1208',
        ink: '#e8d5a3',
        gold: '#c9a84c',
        blood: '#8b1a1a',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
      },
    },
  },
} satisfies Config;
```

- [ ] **Step 4: Configure Vite + Vitest**

Replace `vite.config.ts` with:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
});
```

- [ ] **Step 5: Create test setup**

Create `src/test-setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 6: Update index.css**

Replace `src/index.css` with:

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-paper text-ink font-serif;
  }
  * {
    box-sizing: border-box;
  }
}

@layer components {
  .panel {
    @apply bg-[rgba(26,18,8,0.90)] border border-gold/30 shadow-inner;
  }
  .gold-border {
    @apply border border-gold/50;
  }
}
```

- [ ] **Step 7: Update index.html**

Replace `index.html` with:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>天机残卷</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Stub App.tsx and main.tsx**

Replace `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Replace `src/App.tsx`:

```tsx
export default function App() {
  return <div className="min-h-screen bg-paper text-ink flex items-center justify-center">
    <p className="text-gold text-2xl">天机残卷 — 初始化中…</p>
  </div>;
}
```

- [ ] **Step 9: Verify build and test runner start up**

```bash
npm run dev &
sleep 3 && curl -s http://localhost:5173 | grep -c "天机残卷"
```
Expected output: `1`

```bash
npm run test -- --run
```
Expected: no test files found, exit 0 (or "No test files found" — either is fine for now).

- [ ] **Step 10: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold vite+react+ts project with tailwind and vitest"
```

---

### Task 2: TypeScript Type Definitions

**Files:**
- Create: `src/types/game.ts`

- [ ] **Step 1: Create types file**

Create `src/types/game.ts`:

```typescript
export interface PlayerStats {
  name: string;
  template: string;
  strength: number;
  agility: number;
  wisdom: number;
  constitution: number;
  talent: string;
}

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

export interface ActionGrant {
  flags?: string[];
  clues?: string[];
  items?: string[];
  remove_items?: string[];
  quests?: string[];
}

export interface EventAction {
  id: string;
  label: string;
  requires: Condition | null;
  result: string;
  grants?: ActionGrant;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  requires?: Condition;
  actions: EventAction[];
}

export interface DialogueChoice {
  id: string;
  label: string;
  condition?: Condition;
  response: string;
  grants?: ActionGrant;
}

export interface DialogueLine {
  id: string;
  condition?: Condition;
  text: string;
  grants?: ActionGrant;
  hidden?: boolean;
  choices?: DialogueChoice[];
}

export interface NPC {
  id: string;
  name: string;
  description: string;
  dialogues: DialogueLine[];
}

export interface Room {
  id: string;
  name: string;
  description: string;
  interactables: string[];
  exits: string[];
  requires?: Condition | null;
}

export interface GameMap {
  id: string;
  name: string;
  rooms: Room[];
}

export interface Item {
  id: string;
  name: string;
  description: string;
  isClue: boolean;
}

export interface Talent {
  id: string;
  name: string;
  description: string;
}

export interface CharacterTemplate {
  id: string;
  name: string;
  description: string;
  flavor: string;
  stats: {
    strength: number;
    agility: number;
    wisdom: number;
    constitution: number;
  };
  talent: string;
}

export interface SaveData {
  player: PlayerStats;
  currentRoomId: string;
  inventory: string[];
  clues: string[];
  flags: string[];
  questLog: string[];
  storyText: string[];
}

export interface SaveSlot {
  id: number;
  type: 'manual' | 'auto';
  timestamp: number;
  label: string;
  data: SaveData | null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/game.ts
git commit -m "feat: add shared TypeScript game interfaces"
```

---

### Task 3: ConditionEvaluator (TDD)

**Files:**
- Create: `src/engine/conditionEvaluator.ts`
- Create: `tests/engine/conditionEvaluator.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/engine/conditionEvaluator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { evaluate } from '../../src/engine/conditionEvaluator';
import type { EvalContext } from '../../src/engine/conditionEvaluator';

const baseCtx: EvalContext = {
  player: { name: '测试者', template: 'test', strength: 6, agility: 6, wisdom: 6, constitution: 6, talent: '' },
  inventory: [],
  flags: [],
};

describe('evaluate', () => {
  it('returns true for null condition', () => {
    expect(evaluate(null, baseCtx)).toBe(true);
  });

  it('returns true for undefined condition', () => {
    expect(evaluate(undefined, baseCtx)).toBe(true);
  });

  it('passes stat threshold when exactly met', () => {
    expect(evaluate({ wisdom: 6 }, baseCtx)).toBe(true);
  });

  it('fails stat threshold when not met', () => {
    expect(evaluate({ wisdom: 7 }, baseCtx)).toBe(false);
  });

  it('talent 机关奇才 reduces wisdom requirement by 2', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '机关奇才' } };
    expect(evaluate({ wisdom: 8 }, ctx)).toBe(true);
  });

  it('talent 天生神力 reduces strength requirement by 2', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '天生神力' } };
    expect(evaluate({ strength: 8 }, ctx)).toBe(true);
  });

  it('talent check passes when talent matches', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '毒体' } };
    expect(evaluate({ talent: '毒体' }, ctx)).toBe(true);
  });

  it('talent check fails when talent does not match', () => {
    expect(evaluate({ talent: '毒体' }, baseCtx)).toBe(false);
  });

  it('passes item check when item in inventory', () => {
    const ctx = { ...baseCtx, inventory: ['broken_copper_badge'] };
    expect(evaluate({ has: ['broken_copper_badge'] }, ctx)).toBe(true);
  });

  it('fails item check when item missing', () => {
    expect(evaluate({ has: ['broken_copper_badge'] }, baseCtx)).toBe(false);
  });

  it('passes flags check when all flags present', () => {
    const ctx = { ...baseCtx, flags: ['innkeeper_met', 'body_examined'] };
    expect(evaluate({ flags: ['innkeeper_met'] }, ctx)).toBe(true);
  });

  it('fails flags check when flag missing', () => {
    expect(evaluate({ flags: ['innkeeper_met'] }, baseCtx)).toBe(false);
  });

  it('passes flags_absent when flag is not set', () => {
    expect(evaluate({ flags_absent: ['already_done'] }, baseCtx)).toBe(true);
  });

  it('fails flags_absent when flag is set', () => {
    const ctx = { ...baseCtx, flags: ['already_done'] };
    expect(evaluate({ flags_absent: ['already_done'] }, ctx)).toBe(false);
  });

  it('evaluates combined conditions — all must pass', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, wisdom: 8 }, flags: ['innkeeper_met'] };
    expect(evaluate({ wisdom: 8, flags: ['innkeeper_met'] }, ctx)).toBe(true);
    expect(evaluate({ wisdom: 8, flags: ['innkeeper_trusted'] }, ctx)).toBe(false);
  });

  it('constitution check has no talent bonus', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, constitution: 7, talent: '机关奇才' } };
    expect(evaluate({ constitution: 8 }, ctx)).toBe(false);
  });

  it('毒体 talent requires both constitution AND talent', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, constitution: 8, talent: '毒体' } };
    expect(evaluate({ constitution: 8, talent: '毒体' }, ctx)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to see it fail**

```bash
npm run test -- --run tests/engine/conditionEvaluator.test.ts
```
Expected: FAIL — "Cannot find module '../../src/engine/conditionEvaluator'"

- [ ] **Step 3: Implement ConditionEvaluator**

Create `src/engine/conditionEvaluator.ts`:

```typescript
import type { Condition, PlayerStats } from '../types/game';

export interface EvalContext {
  player: PlayerStats;
  inventory: string[];
  flags: string[];
}

export function evaluate(condition: Condition | null | undefined, ctx: EvalContext): boolean {
  if (!condition) return true;
  const { player, inventory, flags } = ctx;

  if (condition.wisdom !== undefined) {
    const bonus = player.talent === '机关奇才' ? 2 : 0;
    if (player.wisdom + bonus < condition.wisdom) return false;
  }
  if (condition.strength !== undefined) {
    const bonus = player.talent === '天生神力' ? 2 : 0;
    if (player.strength + bonus < condition.strength) return false;
  }
  if (condition.agility !== undefined) {
    if (player.agility < condition.agility) return false;
  }
  if (condition.constitution !== undefined) {
    if (player.constitution < condition.constitution) return false;
  }
  if (condition.talent !== undefined) {
    if (player.talent !== condition.talent) return false;
  }
  if (condition.has) {
    for (const itemId of condition.has) {
      if (!inventory.includes(itemId)) return false;
    }
  }
  if (condition.flags) {
    for (const flag of condition.flags) {
      if (!flags.includes(flag)) return false;
    }
  }
  if (condition.flags_absent) {
    for (const flag of condition.flags_absent) {
      if (flags.includes(flag)) return false;
    }
  }
  return true;
}
```

- [ ] **Step 4: Run tests — all should pass**

```bash
npm run test -- --run tests/engine/conditionEvaluator.test.ts
```
Expected: PASS — 16 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/engine/conditionEvaluator.ts tests/engine/conditionEvaluator.test.ts
git commit -m "feat: implement ConditionEvaluator with TDD (16 tests)"
```

---

### Task 4: Zustand Stores

**Files:**
- Create: `src/store/playerStore.ts`
- Create: `src/store/sceneStore.ts`
- Create: `src/store/inventoryStore.ts`
- Create: `src/store/saveStore.ts`

- [ ] **Step 1: Create playerStore**

Create `src/store/playerStore.ts`:

```typescript
import { create } from 'zustand';
import type { PlayerStats } from '../types/game';

interface PlayerState extends PlayerStats {
  setPlayer: (player: PlayerStats) => void;
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
  reset: () => set(defaultPlayer),
}));
```

- [ ] **Step 2: Create sceneStore**

Create `src/store/sceneStore.ts`:

```typescript
import { create } from 'zustand';

interface SceneState {
  currentRoomId: string;
  flags: string[];
  clues: string[];
  questLog: string[];
  storyText: string[];
  setRoom: (roomId: string) => void;
  addFlag: (flag: string) => void;
  addClue: (clueId: string) => void;
  addQuest: (questId: string) => void;
  addStoryText: (text: string) => void;
  clearStoryText: () => void;
  loadState: (state: Partial<Pick<SceneState, 'currentRoomId' | 'flags' | 'clues' | 'questLog' | 'storyText'>>) => void;
  reset: () => void;
}

const defaultState = {
  currentRoomId: 'room_203',
  flags: [] as string[],
  clues: [] as string[],
  questLog: ['quest_main_murder'] as string[],
  storyText: [] as string[],
};

export const useSceneStore = create<SceneState>((set) => ({
  ...defaultState,
  setRoom: (roomId) =>
    set((s) => s.currentRoomId === roomId ? s : { currentRoomId: roomId, storyText: [] }),
  addFlag: (flag) =>
    set((s) => ({ flags: s.flags.includes(flag) ? s.flags : [...s.flags, flag] })),
  addClue: (clueId) =>
    set((s) => ({ clues: s.clues.includes(clueId) ? s.clues : [...s.clues, clueId] })),
  addQuest: (questId) =>
    set((s) => ({ questLog: s.questLog.includes(questId) ? s.questLog : [...s.questLog, questId] })),
  addStoryText: (text) =>
    set((s) => ({ storyText: [...s.storyText, text] })),
  clearStoryText: () => set({ storyText: [] }),
  loadState: (state) => set(state),
  reset: () => set(defaultState),
}));
```

- [ ] **Step 3: Create inventoryStore**

Create `src/store/inventoryStore.ts`:

```typescript
import { create } from 'zustand';

interface InventoryState {
  items: string[];
  addItem: (itemId: string) => void;
  removeItem: (itemId: string) => void;
  hasItem: (itemId: string) => boolean;
  loadItems: (items: string[]) => void;
  reset: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  addItem: (itemId) =>
    set((s) => ({ items: s.items.includes(itemId) ? s.items : [...s.items, itemId] })),
  removeItem: (itemId) =>
    set((s) => ({ items: s.items.filter((i) => i !== itemId) })),
  hasItem: (itemId) => get().items.includes(itemId),
  loadItems: (items) => set({ items }),
  reset: () => set({ items: [] }),
}));
```

- [ ] **Step 4: Create saveStore**

Create `src/store/saveStore.ts`:

```typescript
import { create } from 'zustand';
import type { SaveSlot } from '../types/game';

interface SaveState {
  slots: SaveSlot[];
  setSlots: (slots: SaveSlot[]) => void;
  updateSlot: (slot: SaveSlot) => void;
}

export const useSaveStore = create<SaveState>((set) => ({
  slots: [],
  setSlots: (slots) => set({ slots }),
  updateSlot: (slot) =>
    set((s) => ({
      slots: s.slots.some((sl) => sl.id === slot.id)
        ? s.slots.map((sl) => (sl.id === slot.id ? slot : sl))
        : [...s.slots, slot],
    })),
}));
```

- [ ] **Step 5: Commit**

```bash
git add src/store/
git commit -m "feat: add four Zustand stores (player, scene, inventory, save)"
```

---

### Task 5: Map Engine + Event Engine (TDD)

**Files:**
- Create: `src/engine/mapEngine.ts`
- Create: `src/engine/eventEngine.ts`
- Create: `tests/engine/mapEngine.test.ts`
- Create: `tests/engine/eventEngine.test.ts`

- [ ] **Step 1: Write mapEngine tests**

Create `tests/engine/mapEngine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getAvailableExits, getRoomInteractables } from '../../src/engine/mapEngine';
import type { Room } from '../../src/types/game';
import type { EvalContext } from '../../src/engine/conditionEvaluator';

const baseCtx: EvalContext = {
  player: { name: '测', template: 't', strength: 6, agility: 6, wisdom: 6, constitution: 6, talent: '' },
  inventory: [],
  flags: [],
};

const lobby: Room = {
  id: 'lobby',
  name: '大堂',
  description: '...',
  interactables: ['npc_innkeeper_li_fu', 'evt_notice_board'],
  exits: ['room_203', 'kitchen', 'cellar'],
  requires: null,
};

const kitchen: Room = {
  id: 'kitchen',
  name: '后厨',
  description: '...',
  interactables: ['npc_cook_wang'],
  exits: ['lobby'],
  requires: { flags: ['innkeeper_talked'] },
};

const cellar: Room = {
  id: 'cellar',
  name: '地窖',
  description: '...',
  interactables: [],
  exits: ['lobby'],
  requires: { flags: ['innkeeper_trusted'] },
};

const allRooms: Room[] = [lobby, kitchen, cellar];

describe('getAvailableExits', () => {
  it('returns accessible exits only', () => {
    const exits = getAvailableExits(lobby, baseCtx, allRooms);
    expect(exits.map((r) => r.id)).toContain('room_203');
    expect(exits.map((r) => r.id)).not.toContain('kitchen');
    expect(exits.map((r) => r.id)).not.toContain('cellar');
  });

  it('returns kitchen after innkeeper_talked flag is set', () => {
    const ctx = { ...baseCtx, flags: ['innkeeper_talked'] };
    const exits = getAvailableExits(lobby, ctx, allRooms);
    expect(exits.map((r) => r.id)).toContain('kitchen');
  });
});

describe('getRoomInteractables', () => {
  it('returns all interactable IDs in the room', () => {
    const ids = getRoomInteractables(lobby);
    expect(ids).toEqual(['npc_innkeeper_li_fu', 'evt_notice_board']);
  });
});
```

- [ ] **Step 2: Run test — expect fail**

```bash
npm run test -- --run tests/engine/mapEngine.test.ts
```
Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Implement mapEngine**

Create `src/engine/mapEngine.ts`:

```typescript
import type { Room } from '../types/game';
import { evaluate } from './conditionEvaluator';
import type { EvalContext } from './conditionEvaluator';

export function getAvailableExits(room: Room, ctx: EvalContext, allRooms: Room[]): Room[] {
  return room.exits
    .map((id) => allRooms.find((r) => r.id === id))
    .filter((r): r is Room => r !== undefined && evaluate(r.requires, ctx));
}

export function getRoomInteractables(room: Room): string[] {
  return room.interactables;
}
```

- [ ] **Step 4: Write eventEngine tests**

Create `tests/engine/eventEngine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getActionResults, canExecuteAction, getMissingConditionLabel } from '../../src/engine/eventEngine';
import type { GameEvent } from '../../src/types/game';
import type { EvalContext } from '../../src/engine/conditionEvaluator';

const baseCtx: EvalContext = {
  player: { name: '测', template: 't', strength: 6, agility: 6, wisdom: 6, constitution: 6, talent: '' },
  inventory: [],
  flags: [],
};

const testEvent: GameEvent = {
  id: 'test_event',
  title: '测试',
  description: '测试事件',
  actions: [
    { id: 'easy_action', label: '普通操作', requires: null, result: '成功了。' },
    { id: 'wisdom_action', label: '智慧操作', requires: { wisdom: 8 }, result: '推演成功。' },
    { id: 'flag_action', label: '旗帜操作', requires: { flags: ['innkeeper_met'] }, result: '通关了。' },
  ],
};

describe('getActionResults', () => {
  it('marks available actions correctly', () => {
    const results = getActionResults(testEvent, baseCtx);
    expect(results[0].available).toBe(true);
    expect(results[1].available).toBe(false);
    expect(results[2].available).toBe(false);
  });

  it('marks wisdom action available when stat met', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, wisdom: 8 } };
    const results = getActionResults(testEvent, ctx);
    expect(results[1].available).toBe(true);
  });
});

describe('canExecuteAction', () => {
  it('returns true when action has no requires', () => {
    expect(canExecuteAction(testEvent.actions[0], baseCtx)).toBe(true);
  });

  it('returns false when action requires stat not met', () => {
    expect(canExecuteAction(testEvent.actions[1], baseCtx)).toBe(false);
  });
});

describe('getMissingConditionLabel', () => {
  it('returns hint for unmet wisdom requirement', () => {
    const label = getMissingConditionLabel({ wisdom: 8 }, baseCtx);
    expect(label).toContain('智慧');
    expect(label).toContain('8');
  });

  it('returns empty string for met condition', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, wisdom: 9 } };
    expect(getMissingConditionLabel({ wisdom: 8 }, ctx)).toBe('');
  });
});
```

- [ ] **Step 5: Implement eventEngine**

Create `src/engine/eventEngine.ts`:

```typescript
import type { GameEvent, EventAction, Condition } from '../types/game';
import { evaluate } from './conditionEvaluator';
import type { EvalContext } from './conditionEvaluator';

export interface ActionResult {
  action: EventAction;
  available: boolean;
  hint: string;
}

export function getActionResults(event: GameEvent, ctx: EvalContext): ActionResult[] {
  return event.actions.map((action) => ({
    action,
    available: evaluate(action.requires, ctx),
    hint: getMissingConditionLabel(action.requires, ctx),
  }));
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

- [ ] **Step 6: Run all engine tests**

```bash
npm run test -- --run tests/engine/
```
Expected: PASS — all tests in conditionEvaluator, mapEngine, eventEngine pass

- [ ] **Step 7: Commit**

```bash
git add src/engine/mapEngine.ts src/engine/eventEngine.ts tests/engine/mapEngine.test.ts tests/engine/eventEngine.test.ts
git commit -m "feat: implement mapEngine and eventEngine with TDD"
```

---

### Task 6: Story Engine + Save Engine (TDD)

**Files:**
- Create: `src/engine/storyEngine.ts`
- Create: `src/engine/saveEngine.ts`
- Create: `tests/engine/saveEngine.test.ts`

- [ ] **Step 1: Implement storyEngine (no separate tests — pure filtering)**

Create `src/engine/storyEngine.ts`:

```typescript
import type { NPC, DialogueLine } from '../types/game';
import { evaluate } from './conditionEvaluator';
import type { EvalContext } from './conditionEvaluator';

export function getAvailableDialogues(npc: NPC, ctx: EvalContext): DialogueLine[] {
  return npc.dialogues.filter((d) => evaluate(d.condition, ctx));
}

export function getFirstDialogue(npc: NPC, ctx: EvalContext): DialogueLine | undefined {
  return getAvailableDialogues(npc, ctx)[0];
}
```

- [ ] **Step 2: Write saveEngine tests**

Create `tests/engine/saveEngine.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { loadAllSlots, saveToSlot, loadFromSlot, initDefaultSlots } from '../../src/engine/saveEngine';
import type { SaveData } from '../../src/types/game';

const mockSaveData: SaveData = {
  player: { name: '侠客', template: '游侠', strength: 8, agility: 7, wisdom: 5, constitution: 4, talent: '天生神力' },
  currentRoomId: 'lobby',
  inventory: ['blood_letter'],
  clues: ['blood_letter'],
  flags: ['innkeeper_met'],
  questLog: ['quest_main_murder'],
  storyText: ['你走进大堂。'],
};

beforeEach(() => {
  localStorage.clear();
});

describe('initDefaultSlots', () => {
  it('returns 4 slots (1 auto + 3 manual)', () => {
    const slots = initDefaultSlots();
    expect(slots).toHaveLength(4);
    expect(slots[0].type).toBe('auto');
    expect(slots.filter((s) => s.type === 'manual')).toHaveLength(3);
  });
});

describe('loadAllSlots', () => {
  it('returns default slots when localStorage is empty', () => {
    const slots = loadAllSlots();
    expect(slots).toHaveLength(4);
    expect(slots[0].data).toBeNull();
  });
});

describe('saveToSlot / loadFromSlot', () => {
  it('saves and retrieves data from slot 1', () => {
    saveToSlot(1, mockSaveData);
    const loaded = loadFromSlot(1);
    expect(loaded?.player.name).toBe('侠客');
    expect(loaded?.flags).toContain('innkeeper_met');
  });

  it('auto-save slot 0 works', () => {
    saveToSlot(0, mockSaveData);
    const loaded = loadFromSlot(0);
    expect(loaded?.currentRoomId).toBe('lobby');
  });

  it('returns null for empty slot', () => {
    expect(loadFromSlot(2)).toBeNull();
  });
});
```

- [ ] **Step 3: Implement saveEngine**

Create `src/engine/saveEngine.ts`:

```typescript
import type { SaveSlot, SaveData } from '../types/game';

const STORAGE_KEY = 'tianji_saves';

export function initDefaultSlots(): SaveSlot[] {
  return [
    { id: 0, type: 'auto', timestamp: 0, label: '自动存档', data: null },
    { id: 1, type: 'manual', timestamp: 0, label: '存档槽一', data: null },
    { id: 2, type: 'manual', timestamp: 0, label: '存档槽二', data: null },
    { id: 3, type: 'manual', timestamp: 0, label: '存档槽三', data: null },
  ];
}

export function loadAllSlots(): SaveSlot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initDefaultSlots();
    const parsed = JSON.parse(raw) as SaveSlot[];
    if (!Array.isArray(parsed) || parsed.length !== 4) return initDefaultSlots();
    return parsed;
  } catch {
    return initDefaultSlots();
  }
}

export function saveToSlot(slotId: number, data: SaveData, label?: string): SaveSlot {
  const slots = loadAllSlots();
  const idx = slots.findIndex((s) => s.id === slotId);
  if (idx === -1) throw new Error(`Save slot ${slotId} not found`);
  const updated: SaveSlot = {
    ...slots[idx],
    timestamp: Date.now(),
    data,
    label: label ?? slots[idx].label,
  };
  slots[idx] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  return updated;
}

export function loadFromSlot(slotId: number): SaveData | null {
  const slots = loadAllSlots();
  return slots.find((s) => s.id === slotId)?.data ?? null;
}

export function deleteSlot(slotId: number): void {
  const slots = loadAllSlots();
  const idx = slots.findIndex((s) => s.id === slotId);
  if (idx !== -1) {
    slots[idx] = { ...slots[idx], data: null, timestamp: 0 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- --run tests/engine/saveEngine.test.ts
```
Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add src/engine/storyEngine.ts src/engine/saveEngine.ts tests/engine/saveEngine.test.ts
git commit -m "feat: implement storyEngine and saveEngine with TDD"
```

---

### Task 7: Data Loader + Talents + Character Templates

**Files:**
- Create: `src/data/talents.json`
- Create: `src/data/templates.json`
- Create: `src/data/loader.ts`

- [ ] **Step 1: Create talents.json**

Create `src/data/talents.json`:

```json
[
  {
    "id": "过目不忘",
    "name": "过目不忘",
    "description": "见过的文字永不忘却，隐藏线索自动浮现。",
    "effect": "自动触发需要观察力的隐藏线索；等同智慧+1处理公告类事件"
  },
  {
    "id": "机关奇才",
    "name": "机关奇才",
    "description": "天生对机关结构有直觉，拨动几下便知玄机。",
    "effect": "机关类解谜智慧门槛降低2点"
  },
  {
    "id": "天生神力",
    "name": "天生神力",
    "description": "臂力过人，寻常壮汉难出其右。",
    "effect": "力量类破解门槛降低2点"
  },
  {
    "id": "毒体",
    "name": "毒体",
    "description": "幼时误服奇毒，炼就奇特体质，百毒不侵。",
    "effect": "免疫毒雾区域；解锁根骨+毒体专属解法"
  },
  {
    "id": "察言观色",
    "name": "察言观色",
    "description": "观人言行，心思七分便能猜透三分。",
    "effect": "NPC对话增加隐藏询问选项；智慧6即可触发需要智慧8的NPC隐藏台词"
  },
  {
    "id": "江湖老千",
    "name": "江湖老千",
    "description": "走南闯北，一身行走江湖的手段。",
    "effect": "欺骗与赌博类事件成功率+30%；部分NPC对话解锁"
  }
]
```

- [ ] **Step 2: Create templates.json**

Create `src/data/templates.json`:

```json
[
  {
    "id": "youxia",
    "name": "游侠",
    "description": "行走江湖的剑客，以力破局，快意恩仇。",
    "flavor": "「路见不平，拔刀相助。」",
    "stats": { "strength": 8, "agility": 7, "wisdom": 5, "constitution": 4 },
    "talent": "天生神力"
  },
  {
    "id": "moushi",
    "name": "谋士",
    "description": "运筹帷幄的智者，以谋破局，料事如神。",
    "flavor": "「千军易得，一将难求。」",
    "stats": { "strength": 3, "agility": 5, "wisdom": 10, "constitution": 6 },
    "talent": "过目不忘"
  },
  {
    "id": "cike",
    "name": "刺客",
    "description": "暗行于影的刀客，以快破局，神出鬼没。",
    "flavor": "「最快的刀，是对手看不见的刀。」",
    "stats": { "strength": 5, "agility": 10, "wisdom": 5, "constitution": 4 },
    "talent": "江湖老千"
  },
  {
    "id": "yaoshi",
    "name": "药师",
    "description": "精通本草的行医者，以毒破局，悬壶济世。",
    "flavor": "「世间没有无用之毒，只有无用之人。」",
    "stats": { "strength": 4, "agility": 5, "wisdom": 6, "constitution": 9 },
    "talent": "毒体"
  },
  {
    "id": "quanneng",
    "name": "全能客",
    "description": "阅历丰富的江湖过客，各有所长，随机应变。",
    "flavor": "「江湖路远，处处皆学问。」",
    "stats": { "strength": 6, "agility": 6, "wisdom": 6, "constitution": 6 },
    "talent": "察言观色"
  }
]
```

- [ ] **Step 3: Create data loader**

Create `src/data/loader.ts`:

```typescript
import type { GameMap, GameEvent, NPC, Item, Talent, CharacterTemplate, Room } from '../types/game';

import chapter1MapsRaw from './maps/chapter1.json';
import chapter1EventsRaw from './events/chapter1.json';
import chapter1NPCsRaw from './npcs/chapter1.json';
import chapter1ItemsRaw from './items/chapter1.json';
import talentsRaw from './talents.json';
import templatesRaw from './templates.json';

export const MAPS: GameMap[] = chapter1MapsRaw as GameMap[];
export const EVENTS: GameEvent[] = chapter1EventsRaw as GameEvent[];
export const NPCS: NPC[] = chapter1NPCsRaw as NPC[];
export const ITEMS: Item[] = chapter1ItemsRaw as Item[];
export const TALENTS: Talent[] = talentsRaw as Talent[];
export const TEMPLATES: CharacterTemplate[] = templatesRaw as CharacterTemplate[];

export const ALL_ROOMS: Room[] = MAPS.flatMap((m) => m.rooms);

export const getRoom = (id: string): Room | undefined => ALL_ROOMS.find((r) => r.id === id);
export const getEvent = (id: string): GameEvent | undefined => EVENTS.find((e) => e.id === id);
export const getNPC = (id: string): NPC | undefined => NPCS.find((n) => n.id === id);
export const getItem = (id: string): Item | undefined => ITEMS.find((i) => i.id === id);
export const getTalent = (id: string): Talent | undefined => TALENTS.find((t) => t.id === id);
export const getTemplate = (id: string): CharacterTemplate | undefined => TEMPLATES.find((t) => t.id === id);
```

Note: The `maps/chapter1.json`, `events/chapter1.json`, `npcs/chapter1.json`, and `items/chapter1.json` will be created in Tasks 8–12. For now, create placeholder empty-array files to avoid import errors:

```bash
mkdir -p src/data/maps src/data/events src/data/npcs src/data/items
echo '[]' > src/data/maps/chapter1.json
echo '[]' > src/data/events/chapter1.json
echo '[]' > src/data/npcs/chapter1.json
echo '[]' > src/data/items/chapter1.json
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npm run build 2>&1 | tail -5
```
Expected: "built in Xs" with no errors

- [ ] **Step 5: Commit**

```bash
git add src/data/
git commit -m "feat: add talents, character templates, and data loader module"
```

---

### Task 8: Data — Chapter 1 Maps (6 Rooms)

**Files:**
- Modify: `src/data/maps/chapter1.json`

- [ ] **Step 1: Write chapter1 maps**

Replace `src/data/maps/chapter1.json`:

```json
[
  {
    "id": "chapter1",
    "name": "长安城·往事客栈",
    "rooms": [
      {
        "id": "room_203",
        "name": "二楼客房（二〇三号）",
        "description": "你从沉睡中惊醒，窗外天光微亮。隔壁传来急促的敲门声与压低的哭声。你推开房门，走廊尽头，客栈伙计跌跌撞撞地奔来——隔壁二〇二号房的商人宋怀义，死了。他那房间的门半开着，一股血腥气顺着走廊飘来。",
        "interactables": ["evt_body_examine", "evt_room_search", "evt_window_look"],
        "exits": ["lobby"],
        "requires": null
      },
      {
        "id": "lobby",
        "name": "客栈大堂",
        "description": "油灯昏黄，几桌食客低声议论，人人面露惶恐。掌柜李福站在柜台后，神色不安，额角渗着细汗。公告板上贴着几张新旧告示，其中一张的墨迹看起来比其他新。",
        "interactables": ["npc_innkeeper_li_fu", "npc_drunk_zhang_san", "evt_notice_board"],
        "exits": ["room_203", "kitchen", "cellar", "forest"],
        "requires": null
      },
      {
        "id": "kitchen",
        "name": "后厨",
        "description": "灶火未熄，锅中不知煮着何物，香气与血腥混在一处。厨娘王氏坐在角落，双手捂脸，肩膀微微颤抖。灶台旁的木架上，一只药罐倒扣在地上，白色粉末撒了一地。密道的入口或许就藏在某处。",
        "interactables": ["npc_cook_wang", "evt_arsenic_trace", "evt_secret_tunnel"],
        "exits": ["lobby"],
        "requires": { "flags": ["innkeeper_talked"] }
      },
      {
        "id": "cellar",
        "name": "地窖",
        "description": "青石台阶向下延伸，空气阴冷潮湿，带着陈年酒气。角落堆着十数只酒坛，最里头的石墙上有一道隐约可见的细缝，寒气从中渗出。这道缝隙后面，一定藏着什么。",
        "interactables": ["evt_cellar_mechanism", "evt_cellar_fragment", "evt_wine_jars"],
        "exits": ["lobby"],
        "requires": { "flags": ["innkeeper_trusted"] }
      },
      {
        "id": "forest",
        "name": "城郊树林",
        "description": "天色将暮，林间树影婆娑，偶有鸦啼。你循着大堂地面上的模糊脚印一路追来，树林深处忽有人影一闪而过。枯树旁，一名白衣人背对着你站立，衣袂随风轻扬；树林边缘的空地上，一个须发皆白的老头正摆摊卖符纸。",
        "interactables": ["npc_white_stranger", "npc_paper_seller", "evt_forest_tracks"],
        "exits": ["lobby"],
        "requires": { "flags": ["found_escape_clue"] }
      },
      {
        "id": "old_mansion",
        "name": "废弃宅院",
        "description": "朱漆大门半开，院内荒草及膝，青砖缝隙间生满苔藓。正堂横梁上悬着一块匾额，"天机阁"三字在尘埃下若隐若现，笔力遒劲，想来曾是何等气象。院子东侧，一口干枯的古井静静矗立，井壁上刻满了看不懂的符文。",
        "interactables": ["evt_tianji_records", "evt_final_confrontation", "evt_dry_well"],
        "exits": ["lobby"],
        "requires": {
          "flags": ["clue_blood_letter_found", "clue_arsenic_found", "cellar_fragment_obtained"]
        }
      }
    ]
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add src/data/maps/chapter1.json
git commit -m "feat: add chapter 1 map data (6 rooms)"
```

---

### Task 9: Data — Chapter 1 NPCs

**Files:**
- Modify: `src/data/npcs/chapter1.json`

- [ ] **Step 1: Write chapter1 NPCs**

Replace `src/data/npcs/chapter1.json`:

```json
[
  {
    "id": "npc_innkeeper_li_fu",
    "name": "掌柜李福",
    "description": "五旬上下，腰围颇丰，惯于低眉顺眼地打招呼，今日却像丢了魂儿。",
    "dialogues": [
      {
        "id": "first_meeting",
        "condition": { "flags_absent": ["innkeeper_met"] },
        "text": "客官，小店……小店出了大事！昨夜不知何人，竟在本店行凶。衙门已报了，只是还没来人。您若有心，能否帮忙瞧瞧？",
        "grants": { "flags": ["innkeeper_met", "innkeeper_talked"] }
      },
      {
        "id": "normal_chat",
        "condition": { "flags": ["innkeeper_met"], "flags_absent": ["innkeeper_trusted", "body_examined"] },
        "text": "客官，实不相瞒，昨夜小店后厨也有些异动，不过……那是内部之事，还请见谅。"
      },
      {
        "id": "trust_low",
        "condition": { "flags": ["body_examined"], "flags_absent": ["innkeeper_trusted"] },
        "text": "客官，您真的在帮忙查案？那……后厨您可以去看看，厨娘王氏昨夜也听到了动静。",
        "grants": { "flags": ["innkeeper_trusted"] }
      },
      {
        "id": "hidden_tianji",
        "condition": { "wisdom": 9, "talent": "察言观色", "flags": ["innkeeper_met"] },
        "text": "……您是怎么看出来的？这块玉佩，是当年天机阁的人托付于我保管的。我与那些人，有旧日恩情。",
        "hidden": true,
        "grants": { "flags": ["innkeeper_tianji_secret"] }
      },
      {
        "id": "after_trusted",
        "condition": { "flags": ["innkeeper_trusted"] },
        "text": "地窖里有些异样，我本想不管的，只是昨夜听到声响……客官请自便。"
      }
    ]
  },
  {
    "id": "npc_drunk_zhang_san",
    "name": "醉汉张三",
    "description": "桌角趴着一个衣衫褴褛的汉子，面前三个空酒碗，鼾声若雷，却又在你靠近时睁开一只眼。",
    "dialogues": [
      {
        "id": "first_greet",
        "condition": { "flags_absent": ["drunk_talked"] },
        "text": "嗝——什么事？昨夜？昨夜三更……我，我是睡了，可睡前……二楼有人急着下楼，差点撞了我！脚步很急，像是逃命……",
        "grants": { "flags": ["drunk_talked", "found_escape_clue"] }
      },
      {
        "id": "more_details",
        "condition": { "flags": ["drunk_talked"] },
        "text": "那人……往外跑了，往东边，树林那头去了。你要是追，趁早，脚印还在呢……"
      },
      {
        "id": "bribed_details",
        "condition": { "flags": ["drunk_talked"], "has": ["tavern_wine"] },
        "text": "你拿酒换消息……好！那人腰间别着一块黑色牌子，入夜后我还看见他和掌柜说过话。",
        "grants": { "flags": ["drunk_extra_clue"], "clues": ["drunk_testimony"] }
      }
    ]
  },
  {
    "id": "npc_cook_wang",
    "name": "厨娘王氏",
    "description": "四十出头，眼角红肿，手指还在微微颤抖，见有人进来，急忙站起身。",
    "dialogues": [
      {
        "id": "first_meet",
        "condition": { "flags_absent": ["cook_talked"] },
        "text": "……您是来查案的？我……昨夜我亲眼见到了！二更天，有个黑衣人从后门溜进来，在厨房里翻找了半天。我躲在柴房，不敢出声……他在灶台那边动了什么。",
        "grants": { "flags": ["cook_talked"] }
      },
      {
        "id": "arsenic_question",
        "condition": { "flags": ["cook_talked"], "flags_absent": ["cook_arsenic_asked"] },
        "text": "那堆白粉？那是……砒霜。我也不知怎来的，昨晚还不在的！那黑衣人大概留下的。",
        "grants": { "flags": ["cook_arsenic_asked"] }
      },
      {
        "id": "tunnel_clue",
        "condition": { "wisdom": 6, "flags": ["cook_arsenic_asked"] },
        "text": "您问后门密道？……确实有一条，通向城外的枯井那边。那是当年建客栈时就有的，一般人不知道。",
        "grants": { "flags": ["tunnel_location_known"] }
      }
    ]
  },
  {
    "id": "npc_white_stranger",
    "name": "白衣人",
    "description": "面容清癯，双眸深邃，腰间无刀无剑，却有一种令人无法轻视的气度。白衣无尘，仿佛连树林的泥土都不愿沾染。",
    "dialogues": [
      {
        "id": "first_encounter",
        "condition": { "flags_absent": ["white_stranger_met"] },
        "text": "……你循着那人的脚印追来的？那人已经走了。你倒是比我预计的来得快。我在这里等了你一个时辰。",
        "grants": { "flags": ["white_stranger_met"] }
      },
      {
        "id": "trust_test",
        "condition": { "flags": ["white_stranger_met"], "flags_absent": ["white_stranger_trust"] },
        "text": "我有一件东西想给你，但我需要先知道——你查这案子，究竟是为了什么？",
        "choices": [
          {
            "id": "choice_justice",
            "label": "「为了找到真相，让死者安息。」",
            "response": "白衣人沉默片刻，点了点头。「好。真相，是这世上最稀缺的东西。」他从怀中取出一卷残破的纸片递来。",
            "grants": { "flags": ["white_stranger_trust"], "items": ["forest_fragment"], "clues": ["forest_fragment"] }
          },
          {
            "id": "choice_reward",
            "label": "「听说查案有赏钱。」",
            "response": "白衣人微微摇头。「你现在还不适合得到这东西。」他转身走入树林深处，身影消失于暗影中。",
            "grants": { "flags": ["white_stranger_refused"] }
          },
          {
            "id": "choice_tianji",
            "label": "「我想知道《天机残卷》的秘密。」",
            "condition": { "flags": ["cellar_fragment_obtained"] },
            "response": "白衣人的眸子骤然一亮，随即归于平静。「识货。」他递来残卷碎片，「去废弃宅院吧，那里有你想要的答案——和你不想要的麻烦。」",
            "grants": { "flags": ["white_stranger_trust", "tianji_path_hint"], "items": ["forest_fragment"], "clues": ["forest_fragment"] }
          }
        ]
      },
      {
        "id": "wuxue_gift",
        "condition": { "flags": ["white_stranger_trust"], "agility": 7 },
        "text": "你的步法颇有几分灵性。这套《无痕步》，适合你。",
        "grants": { "items": ["wuxue_wuhen_bu"], "flags": ["learned_wuhen_bu"] }
      },
      {
        "id": "after_trust",
        "condition": { "flags": ["white_stranger_trust"] },
        "text": "废弃宅院的正堂里，有一份被刻意掩盖的档案。那便是你需要的最后一块拼图。"
      }
    ]
  },
  {
    "id": "npc_paper_seller",
    "name": "卖符老人",
    "description": "须发皆白，眼神浑浊，摊上摆满了各色黄纸符文，不时抬头扫视来往行人，样子比眼神透露的更为机警。",
    "dialogues": [
      {
        "id": "normal_greeting",
        "condition": { "flags_absent": ["dafei_notice_found"] },
        "text": "买符不？辟邪镇宅，童叟无欺。"
      },
      {
        "id": "badge_recognition",
        "condition": { "flags": ["dafei_notice_found"], "has": ["broken_copper_badge"], "flags_absent": ["dafei_contact_made"] },
        "text": "老头眯眼盯着你腰间，忽然压低声音：「铜牌……你是认识的人？说出来听听。」",
        "choices": [
          {
            "id": "say_password",
            "label": "「云散见青天。」",
            "condition": { "flags": ["dafei_password_known"] },
            "response": "老人脸上绽出一丝笑意，从符纸下摸出一张折叠的纸条递来：「后面的人在等你。城外废弃宅院，东侧枯井底。三下，两下，五下。」",
            "grants": { "flags": ["dafei_contact_made", "dafei_address_obtained"], "items": ["dafei_address_note"] }
          },
          {
            "id": "wrong_approach",
            "label": "「我是朋友，来接头的。」",
            "response": "老人摆摆手：「买符不买？不买走开。」"
          }
        ]
      },
      {
        "id": "after_contact",
        "condition": { "flags": ["dafei_contact_made"] },
        "text": "老人只管低头摆弄符纸，再也不看你一眼。"
      }
    ]
  },
  {
    "id": "npc_fei_ye",
    "name": "飞爷",
    "description": "四十出头，面容普通得记不住，嘴角始终挂着一丝似笑非笑。若在街上遇到，你绝不会多看他一眼——这正是他最厉害的地方。",
    "dialogues": [
      {
        "id": "first_appear",
        "condition": { "flags": ["dafei_lock_solved"], "flags_absent": ["dafei_joined"] },
        "text": "好眼力，好手劲。能破这道锁的，在长安城不超过五个人。你是哪位前辈的门下？",
        "choices": [
          {
            "id": "join_gang",
            "label": "「我不是谁的门下。孤身入江湖。」",
            "response": "飞爷哈哈一笑：「好！大飞帮最缺这样的人。入帮？我飞爷担保，绝不叫你吃亏。」",
            "grants": {
              "flags": ["dafei_joined"],
              "items": ["wuxue_gui_bu_lianhuan"],
              "clues": ["dafei_secret_intel"],
              "quests": ["quest_dafei_gang"]
            }
          },
          {
            "id": "refuse_gang",
            "label": "「帮派之事，不感兴趣。」",
            "response": "飞爷耸耸肩：「随你。不过这里的秘密，你已经知道太多了。」他意味深长地看你一眼，转身离去。",
            "grants": { "flags": ["dafei_refused"] }
          }
        ]
      },
      {
        "id": "gang_intel",
        "condition": { "flags": ["dafei_joined"] },
        "text": "那个叫宋怀义的死者，不是普通商人。十年前，他在天机阁做线人，后来叛变，带走了一份关键名单。有人为此等了他十年。衙门档案室里有份旧卷宗，你去拿来，咱们再细说。",
        "grants": { "flags": ["dafei_mission_assigned"] }
      }
    ]
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add src/data/npcs/chapter1.json
git commit -m "feat: add chapter 1 NPC data (6 NPCs with full Chinese dialogue)"
```

---

### Task 10: Data — Chapter 1 Events (Inn + Kitchen + Cellar)

**Files:**
- Modify: `src/data/events/chapter1.json`

- [ ] **Step 1: Write inn, kitchen, and cellar events**

Replace `src/data/events/chapter1.json` with the full events array. Start with:

```json
[
  {
    "id": "evt_body_examine",
    "title": "检查尸体",
    "description": "宋怀义侧卧在床榻旁，面色青紫，双拳紧握。床头有翻乱的痕迹，枕头下的角落隐约可见一块暗色的东西。",
    "requires": null,
    "actions": [
      {
        "id": "examine_wounds",
        "label": "查看伤口",
        "requires": null,
        "result": "颈部有明显的勒痕，但伤口边缘发青，更像是先被毒物击昏，再被人勒毙。死前曾拼命挣扎过。",
        "grants": { "flags": ["body_examined", "wound_examined"] }
      },
      {
        "id": "find_under_pillow",
        "label": "翻找枕下",
        "requires": { "flags_absent": ["blood_letter_found"] },
        "result": "枕头下藏着一块染血的令牌，正面刻着"天机"二字，背面用血书写着三个字："东——三"，笔画颤抖，是死者最后留下的。",
        "grants": { "flags": ["blood_letter_found", "clue_blood_letter_found"], "items": ["blood_letter"], "clues": ["blood_letter"] }
      },
      {
        "id": "check_hands",
        "label": "察看死者双手",
        "requires": { "wisdom": 6 },
        "result": "死者右手指甲缝中夹着一小撮黑色布料纤维，材质特殊，不是寻常布匹。左手腕上有一道细小的针刺痕迹，入针极准。",
        "grants": { "flags": ["cloth_fiber_found"], "clues": ["cloth_fiber_clue"] }
      }
    ]
  },
  {
    "id": "evt_room_search",
    "title": "搜查房间",
    "description": "二〇二号房已被翻乱，行囊被人搜检过。地板上有几处异样的灰尘痕迹，窗户虚掩着。",
    "requires": null,
    "actions": [
      {
        "id": "search_luggage",
        "label": "检查行囊",
        "requires": { "flags_absent": ["room_searched"] },
        "result": "行囊里的物件被翻得乱七八糟，但仍残留一份半写完的信件，收信人名字被撕去了，只余"……务必在三日内将《残卷》第五页带至……"数字，笔迹工整。",
        "grants": { "flags": ["room_searched"], "clues": ["partial_letter"] }
      },
      {
        "id": "find_floor_mark",
        "label": "查看地板痕迹",
        "requires": { "agility": 5 },
        "result": "灰尘中有两种不同的脚印：一种大而沉，是宋怀义本人的；另一种细窄，像是女子的绣鞋，或身法极轻的刺客所穿。",
        "grants": { "clues": ["footprint_clue"] }
      },
      {
        "id": "check_window",
        "label": "查看窗户",
        "requires": null,
        "result": "窗扇外侧有抓痕，从窗台向下延伸，凶手可能是从外墙攀入，也可能是事后从此处离开。",
        "grants": { "flags": ["window_checked"] }
      }
    ]
  },
  {
    "id": "evt_window_look",
    "title": "从窗口远望",
    "description": "二〇三号房的窗口正对着客栈后院，隐约可以看到一些痕迹。",
    "requires": null,
    "actions": [
      {
        "id": "look_outside",
        "label": "探身望向院子",
        "requires": null,
        "result": "后院黄土地上有一串乱步，向东延伸，没入树林方向。脚印新鲜，应是昨夜留下。",
        "grants": { "flags": ["seen_tracks_from_window"] }
      }
    ]
  },
  {
    "id": "evt_notice_board",
    "title": "查看公告板",
    "description": "公告板上贴着七八张告示，大多是寻人启事和商铺广告，但最右下角有一张笔墨尚新的"失物招领"，内容措辞有些奇怪。",
    "requires": null,
    "actions": [
      {
        "id": "read_notice",
        "label": "浏览所有告示",
        "requires": null,
        "result": "大部分告示无特殊之处，那张失物招领写道：招领黑铁刀一把，失主速认领。落款为一首短诗：「大道无形生育天地，风吹万物自在飘荡，起舞江湖笑傲苍穹，兮有知音共话沧桑，云卷云舒随心所欲，飞鸟归林各得其所，扬名立万只在今时。」",
        "grants": { "flags": ["notice_read"] }
      },
      {
        "id": "decode_acrostic",
        "label": "细读诗文寻找规律",
        "requires": { "wisdom": 6 },
        "result": "你逐字审视，忽然发现——每行首字连读：大、风、起、兮、云、飞、扬。这是藏头诗！「大飞」二字已然呼之欲出，这不是普通的失物招领，而是某个组织留下的暗号。地板角落有一块铜牌，想必就是那把"黑铁刀"对应的真正"失物"。",
        "grants": { "flags": ["dafei_notice_found", "dafei_acrostic_decoded"], "items": ["broken_copper_badge"] }
      },
      {
        "id": "decode_acrostic_talent",
        "label": "扫一眼，脑中已有印象",
        "requires": { "talent": "过目不忘" },
        "result": "告示上的字句在你脑中过了一遍，每行首字的规律跃然而出——大、风、起、兮、云、飞、扬。藏头诗，而且是某个组织留下的接头暗号。你在地板角落找到了一块被踢到缝隙里的铜牌。",
        "grants": { "flags": ["dafei_notice_found", "dafei_acrostic_decoded"], "items": ["broken_copper_badge"] }
      }
    ]
  },
  {
    "id": "evt_arsenic_trace",
    "title": "检查砒霜痕迹",
    "description": "白色粉末散落在灶台旁，药罐倒扣在地，附近没有其他药材。",
    "requires": { "flags": ["innkeeper_talked"] },
    "actions": [
      {
        "id": "smell_powder",
        "label": "闻一闻白色粉末",
        "requires": null,
        "result": "淡淡的大蒜气味，这是砒霜无误。分量不少，足以毒杀一个成年人。有人刻意将它掺入了某样食物或饮品。",
        "grants": { "flags": ["arsenic_identified", "clue_arsenic_found"], "items": ["arsenic_evidence"], "clues": ["arsenic_evidence"] }
      },
      {
        "id": "constitution_test",
        "label": "以指沾取微量尝味（危险）",
        "requires": { "constitution": 7 },
        "result": "你以内力护体，以指尖沾了极少量置于舌尖——苦涩之中带着灼烧感，确是砒霜，且纯度极高，非一般市售之物。此乃专业人士手中的物事。",
        "grants": { "flags": ["arsenic_identified", "arsenic_highgrade", "clue_arsenic_found"], "items": ["arsenic_evidence"], "clues": ["arsenic_evidence"] }
      }
    ]
  },
  {
    "id": "evt_secret_tunnel",
    "title": "寻找密道",
    "description": "后厨角落的柴垛后面，墙壁有些异常，或许藏着什么。",
    "requires": { "flags": ["innkeeper_talked"] },
    "actions": [
      {
        "id": "move_woodpile",
        "label": "搬开柴垛察看",
        "requires": { "strength": 5 },
        "result": "柴垛后面是一扇低矮的木门，上面落着灰尘，但门缝旁有新鲜的土迹——最近有人用过。门后是一条向下延伸的暗道，通向何处不得而知。",
        "grants": { "flags": ["secret_tunnel_found"], "items": ["secret_tunnel_map"], "clues": ["secret_tunnel_map"] }
      },
      {
        "id": "detect_tunnel",
        "label": "叩击墙面聆听",
        "requires": { "wisdom": 6 },
        "result": "你沿着墙壁叩击，柴垛后方发出沉闷的空响——后面是空的，密道就在此处。不过要移开柴垛，还需一番力气。",
        "grants": { "flags": ["tunnel_location_detected"] }
      }
    ]
  },
  {
    "id": "evt_cellar_mechanism",
    "title": "密室机关",
    "description": "石墙上的细缝透着寒气，近看之下，缝隙旁嵌着一个铜制圆环，环上刻着八卦纹路，另有一扇木门隐在酒坛后面，还有一扇侧窗，以及角落里一股浓烈的奇异气味。",
    "requires": { "flags": ["innkeeper_trusted"] },
    "actions": [
      {
        "id": "decode_mechanism",
        "label": "推算铜环机关纹路",
        "requires": { "wisdom": 8 },
        "result": "你细观铜环上的八卦排列，推算出对应的卦序，依次拨动——咔哒、咔哒、咔哒——石门缓缓内移，一间密室出现在眼前。室内尘封已久，正中一张石台上摆着一只锦盒。",
        "grants": { "flags": ["secret_room_opened", "cellar_entered_wisdom"] }
      },
      {
        "id": "break_door",
        "label": "运气撞开木门",
        "requires": { "strength": 9 },
        "result": "你沉气凝神，双掌贴上木门运起内力，轰然一震——木门应声而裂，尘灰四散，动静不小。密室就在门后。你进去了，但外面应该有人听到了声音。",
        "grants": { "flags": ["secret_room_opened", "made_noise", "cellar_entered_strength"] }
      },
      {
        "id": "climb_window",
        "label": "翻越侧窗潜入",
        "requires": { "agility": 7 },
        "result": "你借力墙壁，身法轻灵地从侧窗鱼跃而入，悄无声息地落进密室，连灰尘都没带起多少。室内安静如故。",
        "grants": { "flags": ["secret_room_opened", "entered_silently", "cellar_entered_agility"] }
      },
      {
        "id": "through_poison",
        "label": "屏息穿越毒烟（需毒体）",
        "requires": { "constitution": 8, "talent": "毒体" },
        "result": "你察觉到角落飘来一丝微弱的气味——寻常人怕是早已昏倒。你从容屏息，踏过毒烟区域，绕至密室的另一道暗门，推门而入。毒雾对你，不过清风拂面。",
        "grants": { "flags": ["secret_room_opened", "immune_shown", "cellar_entered_poison"] }
      }
    ]
  },
  {
    "id": "evt_cellar_fragment",
    "title": "密室内的锦盒",
    "description": "石台上的锦盒看起来已有些年月，盒盖上刻着"天机"两字。",
    "requires": { "flags": ["secret_room_opened"] },
    "actions": [
      {
        "id": "open_box",
        "label": "打开锦盒",
        "requires": { "flags_absent": ["cellar_fragment_obtained"] },
        "result": "锦盒内铺着半朽的绸缎，中间放着一片卷轴碎片，纸质古旧，上书密密麻麻的小字，其中一行清晰可辨：「天机阁第五代传人，藏残卷于……」后面的字已模糊难辨。这是《天机残卷》的一部分。",
        "grants": { "flags": ["cellar_fragment_obtained"], "items": ["cellar_fragment"], "clues": ["cellar_fragment"] }
      }
    ]
  },
  {
    "id": "evt_wine_jars",
    "title": "检查酒坛",
    "description": "角落堆放的酒坛有十数只，大多封口完好，但最里面一只倒扣着，底部有些不自然。",
    "requires": null,
    "actions": [
      {
        "id": "check_overturned_jar",
        "label": "翻看倒扣的酒坛",
        "requires": null,
        "result": "酒坛底部用蜡封着一块薄薄的铁片，上面刻着几行密文，你认不出是什么暗语，但显然有人故意藏在这里。",
        "grants": { "clues": ["wine_jar_iron_plate"] }
      }
    ]
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add src/data/events/chapter1.json
git commit -m "feat: add chapter 1 event data (inn, kitchen, cellar)"
```

---

### Task 11: Data — Forest + Mansion + 大飞帮 Events

**Files:**
- Modify: `src/data/events/chapter1.json` (append to existing array)

- [ ] **Step 1: Append forest, mansion, and 大飞帮 events**

Open `src/data/events/chapter1.json` and append the following events **inside the existing JSON array** (before the closing `]`):

```json
  ,
  {
    "id": "evt_forest_tracks",
    "title": "追踪脚印",
    "description": "林间泥土松软，逃跑者留下了明显的足迹，向树林深处延伸。",
    "requires": { "flags": ["found_escape_clue"] },
    "actions": [
      {
        "id": "follow_tracks",
        "label": "循迹追踪",
        "requires": { "agility": 5 },
        "result": "你快步追踪脚印，沿途发现一块被丢弃的布条——黑色，与死者手指间发现的纤维材质一致。足迹最终消失在一块大石后方。凶手从此处换了鞋，改变了行进方向。",
        "grants": { "flags": ["tracks_followed"], "clues": ["abandoned_cloth"] }
      },
      {
        "id": "examine_surroundings",
        "label": "观察周围迹象",
        "requires": { "wisdom": 6 },
        "result": "脚印旁边的草丛有被人拨开的痕迹，树皮上有一道新鲜的刀痕，像是有人故意留下的记号，指向树林的东北方向。",
        "grants": { "flags": ["forest_clue_found"], "clues": ["forest_direction_mark"] }
      }
    ]
  },
  {
    "id": "evt_tianji_records",
    "title": "天机阁档案",
    "description": "正堂角落有一口半开的木箱，里面整齐地叠放着卷轴和册子，大多字迹已经模糊，但仍有部分可以辨读。",
    "requires": { "flags": ["old_mansion_entered"] },
    "actions": [
      {
        "id": "read_records",
        "label": "翻阅档案",
        "requires": null,
        "result": "你翻出一本薄册，扉页上写着"天机阁长安分支——人员名录（机密）"。宋怀义的名字赫然在列，旁边注有"线人·叛"二字，以及一个日期——十年前。有人在追杀叛徒。",
        "grants": { "flags": ["tianji_records_found"], "clues": ["tianji_roster"] }
      },
      {
        "id": "deep_search",
        "label": "仔细深挖箱底",
        "requires": { "wisdom": 7 },
        "result": "你在最底层发现一封密信，信封用特殊的蜡封口，上面印着飞鸟图案——与醉汉描述的那块黑色牌子上的图案一致。信中写道：「残卷已取，人已除，望速来接应。」落款只有一个字：「鸢」。",
        "grants": { "flags": ["kite_identity_clue"], "clues": ["kite_letter"] }
      }
    ]
  },
  {
    "id": "evt_final_confrontation",
    "title": "终章：真相",
    "description": "你已集齐所有线索，真相的轮廓已经清晰。就在此时，废弃宅院正堂的后门忽然被推开……",
    "requires": {
      "flags": ["tianji_records_found", "clue_blood_letter_found", "clue_arsenic_found"]
    },
    "actions": [
      {
        "id": "truth_ending",
        "label": "「我知道是谁干的了。」（真相路线）",
        "requires": { "flags": ["kite_letter", "cloth_fiber_clue", "tianji_roster"] },
        "result": "你将所有线索串连：宋怀义是天机阁的叛徒线人，十年前他带走了一份名单；幕后主使「鸢」派人先以毒物击晕他，再假扮意外勒毙；凶手在后厨留下砒霜是个失误——原本打算毒杀后再制造溺水假象，却被厨娘目击而仓皇更改计划。\n\n正堂中走出的人，你认识——正是掌柜李福的账房先生。他面色煞白，手中握着一把短刀……\n\n第一章·终。",
        "grants": { "flags": ["chapter1_truth_ending"] }
      },
      {
        "id": "force_ending",
        "label": "「管他真相，先擒人再说！」（莽夫路线）",
        "requires": { "strength": 8 },
        "result": "你看见后门闪入的人影，凭着力气追上，将其按倒在地。那人是个年轻的伙计，满身颤抖，招认是受人指使，却说不出幕后主使是谁——真正的幕后人趁乱逃脱了。\n\n你抓了个跑腿的，而真正的谋划者，仍隐于暗处。\n\n第一章·终。",
        "grants": { "flags": ["chapter1_force_ending"] }
      },
      {
        "id": "hermit_ending",
        "label": "「白衣人说的没错，这只是开始……」（隐士路线）",
        "requires": { "flags": ["white_stranger_trust", "learned_wuhen_bu"] },
        "result": "你想起白衣人临别时的话：「真相不总是用来揭露的，有时，它是你活命的筹码。」\n\n你没有正面迎击，而是悄无声息地退出了宅院，带着你已知道的一切。有些东西，比真相更重要——活着，继续追查。\n\n第一章·终。",
        "grants": { "flags": ["chapter1_hermit_ending"] }
      }
    ]
  },
  {
    "id": "evt_dry_well",
    "title": "枯井",
    "description": "院子东侧的枯井约有两丈深，井壁上刻满了形似太极的符文。井底似乎有一道铁门，门上嵌着五个铜轮，每轮刻有〇到九的数字。门旁的石壁上刻着："金木水火土，各归其位，方得开启。"",
    "requires": { "flags": ["dafei_address_obtained"] },
    "actions": [
      {
        "id": "enter_well",
        "label": "下到井底",
        "requires": { "agility": 5, "flags_absent": ["dafei_well_entered"] },
        "result": "你借助井壁上的凹槽手脚并用下到井底，身前是那道嵌着五个铜轮的铁门，数字轮转动自如。",
        "grants": { "flags": ["dafei_well_entered"] }
      },
      {
        "id": "solve_lock",
        "label": "拨动铜轮开锁",
        "requires": {
          "flags": ["dafei_well_entered", "clue_blood_letter_found", "clue_arsenic_found", "cellar_fragment_obtained"]
        },
        "result": "你回想起三处线索中隐藏的数字：血字令牌上写着「东——三步」；砒霜证据查验时发现分量是「二钱」；密室碎片上标注的是「第五代」。\n\n三、二、五。你依次拨动铜轮：三——二——五。\n\n咔哒一声，铁门应声而开，一道昏黄的烛光从门后透出。门内，那个普通得记不住面孔的中年人正坐在矮凳上，嘴角带笑望向你。",
        "grants": { "flags": ["dafei_lock_solved"] }
      },
      {
        "id": "guess_lock",
        "label": "强行尝试数字组合",
        "requires": { "flags": ["dafei_well_entered"], "flags_absent": ["dafei_lock_solved"] },
        "result": "你随机拨动了几次，铜轮纹丝不动，发出刺耳的摩擦声。看来需要找到正确的数字线索才行。",
        "grants": {}
      }
    ]
  }
```

- [ ] **Step 2: Verify JSON is valid**

```bash
python3 -m json.tool src/data/events/chapter1.json > /dev/null && echo "JSON valid"
```
Expected: `JSON valid`

- [ ] **Step 3: Commit**

```bash
git add src/data/events/chapter1.json
git commit -m "feat: add chapter 1 forest, mansion, and 大飞帮 event data"
```

---

### Task 12: Data — Items

**Files:**
- Modify: `src/data/items/chapter1.json`

- [ ] **Step 1: Write items**

Replace `src/data/items/chapter1.json`:

```json
[
  {
    "id": "blood_letter",
    "name": "染血令牌",
    "description": "一块铜质令牌，正面刻"天机"二字，背面用血书写着"东——三"。死者的最后留言，数字"三"清晰可辨。",
    "isClue": true
  },
  {
    "id": "arsenic_evidence",
    "name": "砒霜证据",
    "description": "用纸包裹的少量白色粉末，取自后厨现场。纯度极高，分量约二钱，非寻常市售药材。数字"二"暗藏其中。",
    "isClue": true
  },
  {
    "id": "cellar_fragment",
    "name": "密室残卷碎片",
    "description": "古旧的卷轴碎片，上书"天机阁第五代传人……"，后续文字模糊难辨。数字"五"赫然可见。这是《天机残卷》的一部分。",
    "isClue": true
  },
  {
    "id": "forest_fragment",
    "name": "树林残卷碎片",
    "description": "白衣人赠予的卷轴碎片，与密室碎片似乎可以拼合。上面的文字记载着天机阁某处秘密据点的位置。",
    "isClue": true
  },
  {
    "id": "broken_copper_badge",
    "name": "残破铜牌",
    "description": "一块缺了一角的铜质牌子，正面是飞鸟图案，背面有极细小的刻字——需要放大镜或屏气凝神才能辨读。",
    "isClue": false
  },
  {
    "id": "partial_letter",
    "name": "半截密信",
    "description": "收信人名字被撕去，仅余"……务必在三日内将《残卷》第五页带至……"字样，笔迹工整，应出自受过良好教育之人。",
    "isClue": true
  },
  {
    "id": "secret_tunnel_map",
    "name": "密道地图",
    "description": "一张简略的手绘地图，标注了客栈后厨通往城外枯井的密道走向。废弃宅院东侧，有一个圈标记。",
    "isClue": true
  },
  {
    "id": "dafei_address_note",
    "name": "枯井地址",
    "description": "卖符老人给的纸条，上书"城外废弃宅院，东侧枯井底。三下，两下，五下。"——接头暗语已在其中。",
    "isClue": false
  },
  {
    "id": "tianji_roster",
    "name": "天机阁人员名录",
    "description": "一本薄册，记录着天机阁长安分支的成员名单。宋怀义的名字旁注有"线人·叛"及十年前的日期。",
    "isClue": true
  },
  {
    "id": "kite_letter",
    "name": "鸢字密信",
    "description": "用蜡封口的密信，落款"鸢"，内容为"残卷已取，人已除，望速来接应。"——幕后主使的身份线索。",
    "isClue": true
  },
  {
    "id": "wuxue_wuhen_bu",
    "name": "《无痕步》残本",
    "description": "白衣人赠予的轻功心法，修炼后步法如风，无声无息。持有后敏捷类行动获得加成。",
    "isClue": false
  },
  {
    "id": "wuxue_gui_bu_lianhuan",
    "name": "《鬼步连环》秘籍",
    "description": "大飞帮专属武学，步法诡异多变，令人难以捉摸。效果等同敏捷+2。飞爷亲授，帮派专属。",
    "isClue": false
  },
  {
    "id": "dafei_secret_intel",
    "name": "大飞帮情报",
    "description": "飞爷所提供的内部消息：宋怀义并非普通商人，而是天机阁的叛变线人。衙门档案室中有一份十年前的旧卷宗可为佐证。",
    "isClue": true
  },
  {
    "id": "magnifying_glass",
    "name": "铜制放大镜",
    "description": "可放大细小文字，用于辨读铜牌背面的微刻——铜牌上刻有大飞帮接头暗语。",
    "isClue": false
  },
  {
    "id": "tavern_wine",
    "name": "一碗好酒",
    "description": "从柜台要来的一碗上好高粱，用来打通关系，软化醉汉的嘴。",
    "isClue": false
  }
]
```

- [ ] **Step 2: Add copper badge password event to events file**

The player needs a way to discover the password on the back of the copper badge. Add this event to `src/data/events/chapter1.json` (append inside the array before closing `]`):

```json
  ,
  {
    "id": "evt_copper_badge_examine",
    "title": "细看铜牌",
    "description": "这枚残破的铜牌背面有极细小的刻字，在光线下隐约可见，但太小了，几乎看不清。",
    "requires": { "has": ["broken_copper_badge"] },
    "actions": [
      {
        "id": "read_with_magnifier",
        "label": "用放大镜辨读",
        "requires": { "has": ["magnifying_glass"] },
        "result": "放大镜下，背面的微刻清晰可辨——「云散见青天」五字，应是某种暗语。",
        "grants": { "flags": ["dafei_password_known"] }
      },
      {
        "id": "read_hold_breath",
        "label": "屏气凝神，极力辨读",
        "requires": { "constitution": 5 },
        "result": "你凝神静气，运起内功稳住双手，在阳光下微微转动铜牌——「云散见青天」，五个细如发丝的字慢慢呈现。",
        "grants": { "flags": ["dafei_password_known"] }
      },
      {
        "id": "read_talent",
        "label": "借助天赋专注辨读",
        "requires": { "talent": "过目不忘" },
        "result": "你定睛扫过铜牌背面，视线所及之处纤毫毕现——「云散见青天」，就是这五个字。",
        "grants": { "flags": ["dafei_password_known"] }
      }
    ]
  }
```

- [ ] **Step 3: Validate all JSON files**

```bash
for f in src/data/maps/chapter1.json src/data/events/chapter1.json src/data/npcs/chapter1.json src/data/items/chapter1.json src/data/talents.json src/data/templates.json; do
  python3 -m json.tool "$f" > /dev/null && echo "OK: $f" || echo "FAIL: $f"
done
```
Expected: all lines show `OK:`

- [ ] **Step 4: Commit**

```bash
git add src/data/items/chapter1.json src/data/events/chapter1.json
git commit -m "feat: add chapter 1 items data and copper badge examine event"
```

---

### Task 13: UI Primitives

**Files:**
- Create: `src/utils/cn.ts`
- Create: `src/components/ui/TypewriterText.tsx`
- Create: `src/components/ui/StatBar.tsx`
- Create: `src/components/ui/ActionButton.tsx`

- [ ] **Step 1: Create cn utility**

Create `src/utils/cn.ts`:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create TypewriterText**

Create `src/components/ui/TypewriterText.tsx`:

```tsx
import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Props {
  text: string;
  className?: string;
  speed?: number;
}

export function TypewriterText({ text, className = '', speed = 0.03 }: Props) {
  const chars = useMemo(() => text.split(''), [text]);

  return (
    <span className={className}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * speed, duration: 0 }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}
```

- [ ] **Step 3: Create StatBar**

Create `src/components/ui/StatBar.tsx`:

```tsx
import { cn } from '../../utils/cn';

interface Props {
  label: string;
  value: number;
  max?: number;
  className?: string;
}

const STAT_LABELS: Record<string, string> = {
  strength: '力量',
  agility: '敏捷',
  wisdom: '智慧',
  constitution: '根骨',
};

export function StatBar({ label, value, max = 10, className }: Props) {
  const displayLabel = STAT_LABELS[label] ?? label;
  const fillPercent = Math.min(100, (value / max) * 100);

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <span className="w-8 text-ink/70 shrink-0">{displayLabel}</span>
      <div className="flex-1 h-2 bg-paper border border-gold/20 rounded-sm overflow-hidden">
        <div
          className="h-full bg-gold/70 rounded-sm transition-all duration-300"
          style={{ width: `${fillPercent}%` }}
        />
      </div>
      <span className="w-4 text-right text-gold font-bold">{value}</span>
    </div>
  );
}
```

- [ ] **Step 4: Create ActionButton**

Create `src/components/ui/ActionButton.tsx`:

```tsx
import { cn } from '../../utils/cn';

interface Props {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  hint?: string;
  variant?: 'default' | 'danger' | 'special';
  className?: string;
}

export function ActionButton({ label, onClick, disabled = false, hint, variant = 'default', className }: Props) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'w-full text-left px-3 py-2 text-sm border transition-all duration-150',
          'focus:outline-none',
          variant === 'default' && !disabled && 'border-gold/40 text-ink hover:border-gold hover:text-gold hover:shadow-[0_0_8px_rgba(201,168,76,0.3)] cursor-pointer',
          variant === 'danger' && !disabled && 'border-blood/40 text-blood/80 hover:border-blood hover:text-blood cursor-pointer',
          variant === 'special' && !disabled && 'border-gold/60 text-gold hover:border-gold hover:shadow-[0_0_12px_rgba(201,168,76,0.5)] cursor-pointer',
          disabled && 'border-ink/10 text-ink/30 cursor-not-allowed',
          className,
        )}
      >
        {label}
      </button>
      {disabled && hint && (
        <div className="absolute bottom-full left-0 mb-1 px-2 py-1 text-xs bg-paper border border-gold/20 text-ink/60 whitespace-nowrap z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          {hint}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verify TypeScript builds cleanly**

```bash
npm run build 2>&1 | grep -E "(error|Error)" | head -5
```
Expected: no output (no errors)

- [ ] **Step 6: Commit**

```bash
git add src/utils/cn.ts src/components/ui/
git commit -m "feat: add UI primitives (TypewriterText, StatBar, ActionButton)"
```

---

### Task 14: Layout Components

**Files:**
- Create: `src/components/layout/GameLayout.tsx`
- Create: `src/components/layout/LeftPanel.tsx`
- Create: `src/components/layout/CenterPanel.tsx`
- Create: `src/components/layout/RightPanel.tsx`

- [ ] **Step 1: Create GameLayout**

Create `src/components/layout/GameLayout.tsx`:

```tsx
interface Props {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}

export function GameLayout({ left, center, right }: Props) {
  return (
    <div className="flex h-screen w-screen bg-paper text-ink font-serif overflow-hidden select-none">
      <div className="w-40 shrink-0 panel border-r border-gold/20 flex flex-col overflow-hidden">
        {left}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gold/20">
        {center}
      </div>
      <div className="w-50 shrink-0 panel flex flex-col overflow-hidden" style={{ width: '200px' }}>
        {right}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create LeftPanel**

Create `src/components/layout/LeftPanel.tsx`:

```tsx
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
  const { currentRoomId, flags } = useSceneStore();
  const player = usePlayerStore();
  const { items } = useInventoryStore();

  const room = getRoom(currentRoomId);
  const ctx: EvalContext = {
    player: { name: player.name, template: player.template, strength: player.strength, agility: player.agility, wisdom: player.wisdom, constitution: player.constitution, talent: player.talent },
    inventory: items,
    flags,
  };
  const exits = room ? getAvailableExits(room, ctx, ALL_ROOMS) : [];

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

      <div className="mt-auto">
        <p className="text-gold/40 text-xs tracking-widest">【小地图】</p>
        <div className="mt-1 h-16 border border-gold/10 flex items-center justify-center text-ink/20 text-xs">
          长安城
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create CenterPanel**

Create `src/components/layout/CenterPanel.tsx`:

```tsx
import { TypewriterText } from '../ui/TypewriterText';
import { ActionButton } from '../ui/ActionButton';

interface ActionItem {
  id: string;
  label: string;
  available: boolean;
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

- [ ] **Step 4: Create RightPanel**

Create `src/components/layout/RightPanel.tsx`:

```tsx
import { StatBar } from '../ui/StatBar';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { getItem } from '../../data/loader';

export function RightPanel() {
  const player = usePlayerStore();
  const { clues, questLog } = useSceneStore();

  const clueItems = clues.map((id) => getItem(id)).filter(Boolean);

  const questLabels: Record<string, string> = {
    quest_main_murder: '调查客栈命案',
    quest_dafei_gang: '大飞帮隐藏线索',
  };

  return (
    <div className="flex flex-col h-full p-3 gap-4 text-sm overflow-y-auto">
      <div>
        <p className="text-gold/60 text-xs mb-2 tracking-widest">【角色属性】</p>
        <div className="space-y-1.5">
          <StatBar label="strength" value={player.strength} />
          <StatBar label="agility" value={player.agility} />
          <StatBar label="wisdom" value={player.wisdom} />
          <StatBar label="constitution" value={player.constitution} />
        </div>
        {player.talent && (
          <p className="mt-2 text-xs text-gold/50">天赋：<span className="text-gold">{player.talent}</span></p>
        )}
      </div>

      <div>
        <p className="text-gold/60 text-xs mb-2 tracking-widest">【线索记录】</p>
        {clueItems.length === 0 ? (
          <p className="text-ink/30 text-xs">尚无线索</p>
        ) : (
          <ul className="space-y-1">
            {clueItems.map((item) => item && (
              <li key={item.id} className="text-xs text-ink/70 flex items-start gap-1">
                <span className="text-gold/50 mt-0.5">·</span>
                <span>{item.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-gold/60 text-xs mb-2 tracking-widest">【当前任务】</p>
        <ul className="space-y-1">
          {questLog.map((qid) => (
            <li key={qid} className="text-xs text-ink/70 flex items-start gap-1">
              <span className="text-gold/50 mt-0.5">◈</span>
              <span>{questLabels[qid] ?? qid}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add three-panel game layout components"
```

---

### Task 15: Character Creation Page

**Files:**
- Create: `src/pages/CharacterCreate/CharacterCreate.tsx`

- [ ] **Step 1: Create CharacterCreate page**

Create `src/pages/CharacterCreate/CharacterCreate.tsx`:

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
  const [adjustments, setAdjustments] = useState<Record<StatKey, number>>({
    strength: 0, agility: 0, wisdom: 0, constitution: 0,
  });

  const totalAdjust = Object.values(adjustments).reduce((a, b) => a + b, 0);
  const ADJUST_LIMIT = 4;

  const finalStats = (Object.keys(STAT_LABELS) as StatKey[]).reduce((acc, key) => {
    acc[key] = selectedTemplate.stats[key] + adjustments[key];
    return acc;
  }, {} as Record<StatKey, number>);

  const handleAdjust = (stat: StatKey, delta: number) => {
    const next = adjustments[stat] + delta;
    const nextTotal = totalAdjust + delta;
    if (next < -2 || next > 2) return;
    if (nextTotal < -ADJUST_LIMIT || nextTotal > ADJUST_LIMIT) return;
    if (finalStats[stat] + delta < 1 || finalStats[stat] + delta > 12) return;
    setAdjustments((prev) => ({ ...prev, [stat]: next }));
  };

  const handleStart = () => {
    if (!name.trim()) return;
    resetScene();
    resetInventory();
    setPlayer({
      name: name.trim(),
      template: selectedTemplate.id,
      ...finalStats,
      talent: selectedTemplate.talent,
    });
    navigate('/game');
  };

  const talent = TALENTS.find((t) => t.id === selectedTemplate.talent);

  return (
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center p-8">
      <h1 className="text-gold text-3xl mb-2 tracking-widest">天机残卷</h1>
      <p className="text-ink/50 text-sm mb-10 tracking-widest">创建角色</p>

      <div className="w-full max-w-3xl space-y-8">
        <div className="flex gap-4 items-center">
          <label className="text-ink/60 text-sm w-16 shrink-0">角色名</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
            placeholder="请输入名号…"
            className="flex-1 bg-transparent border-b border-gold/30 focus:border-gold outline-none py-1 text-ink placeholder:text-ink/20 text-sm"
          />
        </div>

        <div>
          <p className="text-gold/60 text-xs mb-3 tracking-widest">【选择模板】</p>
          <div className="grid grid-cols-5 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelectedTemplate(t); setAdjustments({ strength: 0, agility: 0, wisdom: 0, constitution: 0 }); }}
                className={`p-3 border text-sm transition-all ${
                  selectedTemplate.id === t.id
                    ? 'border-gold text-gold shadow-[0_0_8px_rgba(201,168,76,0.3)]'
                    : 'border-gold/20 text-ink/60 hover:border-gold/40'
                }`}
              >
                <div className="font-bold mb-1">{t.name}</div>
                <div className="text-xs opacity-70">{t.description}</div>
              </button>
            ))}
          </div>
          {selectedTemplate && (
            <p className="mt-2 text-ink/40 text-xs italic">{selectedTemplate.flavor}</p>
          )}
        </div>

        <div>
          <p className="text-gold/60 text-xs mb-3 tracking-widest">
            【属性微调】剩余调整点：
            <span className={Math.abs(totalAdjust) >= ADJUST_LIMIT ? 'text-blood' : 'text-gold'}>
              {ADJUST_LIMIT - Math.abs(totalAdjust)}
            </span>
            （总计 ±{ADJUST_LIMIT} 点，单项 ±2）
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(STAT_LABELS) as StatKey[]).map((stat) => (
              <div key={stat} className="flex items-center gap-3">
                <span className="w-10 text-ink/60 text-sm">{STAT_LABELS[stat]}</span>
                <button
                  onClick={() => handleAdjust(stat, -1)}
                  className="w-6 h-6 border border-gold/20 hover:border-gold text-gold text-xs"
                >
                  −
                </button>
                <span className="w-8 text-center text-gold font-bold">{finalStats[stat]}</span>
                <button
                  onClick={() => handleAdjust(stat, 1)}
                  className="w-6 h-6 border border-gold/20 hover:border-gold text-gold text-xs"
                >
                  ＋
                </button>
                {adjustments[stat] !== 0 && (
                  <span className={`text-xs ${adjustments[stat] > 0 ? 'text-gold/60' : 'text-blood/60'}`}>
                    ({adjustments[stat] > 0 ? '+' : ''}{adjustments[stat]})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border border-gold/10 p-4">
          <p className="text-gold/60 text-xs mb-2 tracking-widest">【天赋】{selectedTemplate.talent}</p>
          <p className="text-ink/70 text-sm">{talent?.description}</p>
          <p className="text-ink/40 text-xs mt-1">{talent?.effect}</p>
        </div>

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

- [ ] **Step 2: Commit**

```bash
git add src/pages/CharacterCreate/
git commit -m "feat: add character creation page with template selection and stat adjustment"
```

---

### Task 16: Game Page + Main Menu + App Router + useAutoSave + SaveLoadModal

**Files:**
- Create: `src/hooks/useAutoSave.ts`
- Create: `src/components/save/SaveLoadModal.tsx`
- Create: `src/pages/Game/Game.tsx`
- Create: `src/pages/MainMenu/MainMenu.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create useAutoSave hook**

Create `src/hooks/useAutoSave.ts`:

```typescript
import { useEffect } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { useSceneStore } from '../store/sceneStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useSaveStore } from '../store/saveStore';
import { saveToSlot, loadAllSlots } from '../engine/saveEngine';
import type { SaveData } from '../types/game';

export function useAutoSave() {
  const player = usePlayerStore();
  const scene = useSceneStore();
  const { items } = useInventoryStore();
  const { setSlots, updateSlot } = useSaveStore();

  useEffect(() => {
    setSlots(loadAllSlots());
  }, [setSlots]);

  useEffect(() => {
    if (!player.name) return;
    const data: SaveData = {
      player: { name: player.name, template: player.template, strength: player.strength, agility: player.agility, wisdom: player.wisdom, constitution: player.constitution, talent: player.talent },
      currentRoomId: scene.currentRoomId,
      inventory: items,
      clues: scene.clues,
      flags: scene.flags,
      questLog: scene.questLog,
      storyText: scene.storyText,
    };
    const saved = saveToSlot(0, data, '自动存档');
    updateSlot(saved);
  }, [scene.currentRoomId, scene.flags.length, scene.clues.length]);
}
```

- [ ] **Step 2: Create SaveLoadModal**

Create `src/components/save/SaveLoadModal.tsx`:

```tsx
import { useSaveStore } from '../../store/saveStore';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { saveToSlot, loadFromSlot, loadAllSlots } from '../../engine/saveEngine';
import type { SaveData } from '../../types/game';

interface Props {
  mode: 'save' | 'load';
  onClose: () => void;
}

export function SaveLoadModal({ mode, onClose }: Props) {
  const { slots, setSlots, updateSlot } = useSaveStore();
  const player = usePlayerStore();
  const scene = useSceneStore();
  const { items, loadItems } = useInventoryStore();

  const handleSave = (slotId: number) => {
    if (slotId === 0) return;
    const data: SaveData = {
      player: { name: player.name, template: player.template, strength: player.strength, agility: player.agility, wisdom: player.wisdom, constitution: player.constitution, talent: player.talent },
      currentRoomId: scene.currentRoomId,
      inventory: items,
      clues: scene.clues,
      flags: scene.flags,
      questLog: scene.questLog,
      storyText: scene.storyText,
    };
    const saved = saveToSlot(slotId, data);
    updateSlot(saved);
    onClose();
  };

  const handleLoad = (slotId: number) => {
    const data = loadFromSlot(slotId);
    if (!data) return;
    player.setPlayer(data.player);
    scene.loadState({
      currentRoomId: data.currentRoomId,
      flags: data.flags,
      clues: data.clues,
      questLog: data.questLog,
      storyText: data.storyText,
    });
    loadItems(data.inventory);
    setSlots(loadAllSlots());
    onClose();
  };

  const manualSlots = slots.filter((s) => s.type === 'manual');

  return (
    <div className="fixed inset-0 bg-paper/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-80 border border-gold/30 bg-paper panel p-6 space-y-4">
        <h3 className="text-gold text-center tracking-widest">{mode === 'save' ? '存档' : '读档'}</h3>
        <div className="space-y-2">
          {manualSlots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => mode === 'save' ? handleSave(slot.id) : handleLoad(slot.id)}
              disabled={mode === 'load' && !slot.data}
              className={`w-full text-left px-3 py-2 text-sm border transition-all ${
                mode === 'load' && !slot.data
                  ? 'border-ink/10 text-ink/20 cursor-not-allowed'
                  : 'border-gold/20 text-ink/70 hover:border-gold hover:text-ink'
              }`}
            >
              <span className="text-gold/60 mr-2">{slot.label}</span>
              {slot.data ? (
                <span className="text-xs text-ink/40">
                  {new Date(slot.timestamp).toLocaleString('zh-CN')} — {slot.data.player.name}
                </span>
              ) : (
                <span className="text-xs text-ink/20">（空槽）</span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full py-2 border border-ink/20 text-ink/40 hover:text-ink text-sm"
        >
          取消
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Game page**

Create `src/pages/Game/Game.tsx`:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameLayout } from '../../components/layout/GameLayout';
import { LeftPanel } from '../../components/layout/LeftPanel';
import { CenterPanel } from '../../components/layout/CenterPanel';
import { RightPanel } from '../../components/layout/RightPanel';
import { SaveLoadModal } from '../../components/save/SaveLoadModal';
import { useAutoSave } from '../../hooks/useAutoSave';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { getRoom, getEvent, getNPC } from '../../data/loader';
import { getActionResults } from '../../engine/eventEngine';
import { getAvailableDialogues } from '../../engine/storyEngine';
import type { EvalContext } from '../../engine/conditionEvaluator';

type ModalType = 'save' | 'load' | null;

export default function Game() {
  const navigate = useNavigate();
  const player = usePlayerStore();
  const scene = useSceneStore();
  const { items, addItem, removeItem } = useInventoryStore();
  const [modal, setModal] = useState<ModalType>(null);

  useAutoSave();

  if (!player.name) {
    navigate('/');
    return null;
  }

  const room = getRoom(scene.currentRoomId);
  if (!room) return <div className="text-blood p-8">错误：找不到当前房间 {scene.currentRoomId}</div>;

  const ctx: EvalContext = {
    player: { name: player.name, template: player.template, strength: player.strength, agility: player.agility, wisdom: player.wisdom, constitution: player.constitution, talent: player.talent },
    inventory: items,
    flags: scene.flags,
  };

  const buildActions = () => {
    const actions: Array<{ id: string; label: string; available: boolean; hint: string }> = [];

    for (const interactableId of room.interactables) {
      if (interactableId.startsWith('evt_')) {
        const event = getEvent(interactableId);
        if (!event) continue;
        const results = getActionResults(event, ctx);
        for (const r of results) {
          actions.push({ id: `${interactableId}:${r.action.id}`, label: r.action.label, available: r.available, hint: r.hint });
        }
      } else if (interactableId.startsWith('npc_')) {
        const npc = getNPC(interactableId);
        if (!npc) continue;
        const dialogues = getAvailableDialogues(npc, ctx);
        if (dialogues.length > 0) {
          actions.push({ id: `${interactableId}:talk`, label: `与${npc.name}交谈`, available: true, hint: '' });
        }
      }
    }
    return actions;
  };

  const handleAction = (actionId: string) => {
    const [entityId, subId] = actionId.split(':');

    if (entityId.startsWith('evt_')) {
      const event = getEvent(entityId);
      if (!event) return;
      const action = event.actions.find((a) => a.id === subId);
      if (!action) return;
      scene.addStoryText(action.result);
      if (action.grants) {
        action.grants.flags?.forEach((f) => scene.addFlag(f));
        action.grants.clues?.forEach((c) => scene.addClue(c));
        action.grants.items?.forEach((i) => addItem(i));
        action.grants.remove_items?.forEach((i) => removeItem(i));
        action.grants.quests?.forEach((q) => scene.addQuest(q));
      }
    } else if (entityId.startsWith('npc_')) {
      const npc = getNPC(entityId);
      if (!npc) return;
      const dialogues = getAvailableDialogues(npc, ctx);
      if (dialogues.length === 0) return;
      const d = dialogues[0];
      scene.addStoryText(`【${npc.name}】${d.text}`);
      if (d.grants) {
        d.grants.flags?.forEach((f) => scene.addFlag(f));
        d.grants.clues?.forEach((c) => scene.addClue(c));
        d.grants.items?.forEach((i) => addItem(i));
        d.grants.quests?.forEach((q) => scene.addQuest(q));
      }
    }
  };

  const handleNavigate = (roomId: string) => {
    scene.setRoom(roomId);
  };

  const actions = buildActions();

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setModal('save')}
          className="fixed top-2 right-52 z-20 text-xs text-gold/20 hover:text-gold/60 px-2 py-1"
          title="存档"
        >
          ✦
        </button>
      </div>

      <GameLayout
        left={<LeftPanel onNavigate={handleNavigate} />}
        center={
          <CenterPanel
            roomName={room.name}
            roomDescription={room.description}
            storyTexts={scene.storyText}
            actions={actions}
            onAction={handleAction}
          />
        }
        right={<RightPanel />}
      />

      {modal && (
        <SaveLoadModal mode={modal} onClose={() => setModal(null)} />
      )}
    </>
  );
}
```

- [ ] **Step 4: Create MainMenu**

Create `src/pages/MainMenu/MainMenu.tsx`:

```tsx
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { loadFromSlot, loadAllSlots } from '../../engine/saveEngine';
import { useSaveStore } from '../../store/saveStore';

export default function MainMenu() {
  const navigate = useNavigate();
  const player = usePlayerStore();
  const scene = useSceneStore();
  const { loadItems } = useInventoryStore();
  const { setSlots } = useSaveStore();

  const slots = loadAllSlots();
  const autoSave = slots.find((s) => s.id === 0);
  const hasSave = slots.some((s) => s.data !== null);

  const handleContinue = () => {
    const data = loadFromSlot(0);
    if (!data) return;
    player.setPlayer(data.player);
    scene.loadState({
      currentRoomId: data.currentRoomId,
      flags: data.flags,
      clues: data.clues,
      questLog: data.questLog,
      storyText: data.storyText,
    });
    loadItems(data.inventory);
    setSlots(loadAllSlots());
    navigate('/game');
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center">
      <div className="text-center space-y-2 mb-16">
        <h1 className="text-gold text-5xl tracking-[0.3em]">天机残卷</h1>
        <p className="text-ink/30 text-sm tracking-widest">第一章·长安往事</p>
      </div>

      <div className="flex flex-col gap-4 w-64">
        <button
          onClick={() => navigate('/create')}
          className="py-3 border border-gold/40 text-ink hover:border-gold hover:text-gold tracking-widest transition-all"
        >
          新游戏
        </button>

        {hasSave && autoSave?.data && (
          <button
            onClick={handleContinue}
            className="py-3 border border-gold/20 text-ink/60 hover:border-gold/40 hover:text-ink/80 tracking-widest transition-all text-sm"
          >
            继续游戏
            <span className="block text-xs text-ink/30 mt-0.5">
              {autoSave.data.player.name} · {new Date(autoSave.timestamp).toLocaleDateString('zh-CN')}
            </span>
          </button>
        )}

        <button
          onClick={() => {
            const data = loadFromSlot(0);
            if (!data) return;
            player.setPlayer(data.player);
            scene.loadState({ currentRoomId: data.currentRoomId, flags: data.flags, clues: data.clues, questLog: data.questLog, storyText: data.storyText });
            loadItems(data.inventory);
            navigate('/game');
          }}
          className={`py-2 border border-ink/10 text-ink/30 hover:text-ink/50 tracking-widest transition-all text-sm ${!hasSave && 'opacity-30 pointer-events-none'}`}
        >
          读取存档
        </button>
      </div>

      <p className="absolute bottom-6 text-ink/15 text-xs">
        天机残卷 · Chapter I · MVP
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Update App.tsx with router**

Replace `src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainMenu from './pages/MainMenu/MainMenu';
import CharacterCreate from './pages/CharacterCreate/CharacterCreate';
import Game from './pages/Game/Game';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/create" element={<CharacterCreate />} />
        <Route path="/game" element={<Game />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 6: Verify build**

```bash
npm run build 2>&1 | tail -10
```
Expected: output ending with `built in Xs` with no TypeScript errors.

- [ ] **Step 7: Start dev server and smoke test**

```bash
npm run dev
```

Open http://localhost:5173 in a browser and verify:
- [ ] Main menu renders with title "天机残卷"
- [ ] Clicking "新游戏" navigates to character creation
- [ ] All 5 templates selectable, stat adjustment works
- [ ] Clicking "踏入江湖" starts the game (with a name entered)
- [ ] Game page shows 3-panel layout
- [ ] Exiting to room_203 description visible in center panel
- [ ] Clicking actions adds text to center panel
- [ ] Talking to innkeeper adds dialogue text
- [ ] Stats visible in right panel
- [ ] ✦ button opens save modal

- [ ] **Step 8: Run all tests one final time**

```bash
npm run test -- --run
```
Expected: all tests pass

- [ ] **Step 9: Final commit**

```bash
git add -A
git commit -m "feat: complete Chapter 1 MVP — main menu, game loop, auto-save, and routing"
```

---

## Summary

16 tasks building a complete playable Chapter 1:

| Phase | Tasks | Output |
|-------|-------|--------|
| Foundation | 1–3 | Vite project, types, ConditionEvaluator |
| State | 4 | 4 Zustand stores |
| Engines | 5–6 | mapEngine, eventEngine, storyEngine, saveEngine |
| Data | 7–12 | Talents, templates, 6 rooms, 6 NPCs, all events, all items |
| UI | 13–14 | TypewriterText, StatBar, ActionButton, 3-panel layout |
| Pages | 15–16 | CharacterCreate, Game loop, MainMenu, Router |

**Key story content included:**
- 主线命案：掌柜、醉汉、厨娘、白衣人 complete dialogue trees
- 地窖四解法：智慧/力量/敏捷/根骨+毒体 all implemented
- 大飞帮三阶解锁链：藏头诗 → 铜牌暗号 → 五行锁（答案 3-2-5）
- 三种结局分支：真相/莽夫/隐士路线
- 所有 flags、clues、items 完整定义
