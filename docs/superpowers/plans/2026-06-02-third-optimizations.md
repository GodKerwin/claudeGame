# 第三轮优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 3 remaining bugs from the audit and implement 7 UX/gameplay improvements.

**Architecture:** All changes are isolated edits to existing files — no new files or abstractions. Each task is self-contained. Tests use Vitest. Run `npm test -- --run` to verify.

**Tech Stack:** React 18, TypeScript, Zustand, TailwindCSS v3, Vite, Vitest

---

## File Map

| File | Tasks |
|------|-------|
| `src/engine/hintEngine.ts` | Task 1 |
| `src/pages/ChapterEnd/ChapterEnd.tsx` | Task 2 |
| `src/pages/Game/Game.tsx` | Task 3 |
| `src/components/layout/RightPanel.tsx` | Tasks 4, 5, 6, 7, 9 |
| `src/components/layout/LeftPanel.tsx` | Task 8 |
| `src/components/layout/CenterPanel.tsx` | Task 10 |

---

### Task 1: hintEngine — 删除重复规则 + 补充 expose_truth 提示

**Files:**
- Modify: `src/engine/hintEngine.ts:145-180` (delete duplicate block)
- Modify: `src/engine/hintEngine.ts:285-376` (add expose_truth rule in CHAPTER3_RULES)
- Test: `tests/engine/hintEngine.test.ts` (add 1 test)

**Context:** Lines 31-66 contain the wuhen_bu path rules. Lines 145-180 are verbatim duplicates — because `getHint` returns on first match, lines 145-180 are dead code. The ch3 `expose_truth` action requires flag `deeper_threat_revealed` (see `src/data/events/chapter3.json`) but no hint rule covers this path.

- [ ] **Step 1: Add failing test for the expose_truth hint**

Open `tests/engine/hintEngine.test.ts` and add this test in the `describe('chapter3')` block:

```typescript
it('hints toward expose_truth when deeper_threat_revealed not yet found', () => {
  const ctx = base({
    chapter: 3,
    flags: ['chapter3_started', 'fei_ye_identity_confirmed', 'wujue_resolution_done'],
  });
  const hint = getHint(ctx);
  expect(hint).toMatch(/deeper_threat|上游|廷尉|名单.*威胁|更深/);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/xuli/claudeGame && npm test -- --run tests/engine/hintEngine.test.ts
```
Expected: FAIL (hint does not match pattern).

- [ ] **Step 3: Delete duplicate rules and add expose_truth hint**

In `src/engine/hintEngine.ts`:

**Delete lines 145–180 entirely** (the second copy of the wuhen_bu path). The block starts with:
```typescript
  {
    when: (ctx) =>
      has(ctx, 'learned_wuhen_bu') &&
      !has(ctx, 'innkeeper_trusted'),
    hint: '习得无痕步后废弃宅院还未开放。先回到客栈大堂，再和掌柜李福谈一次（他还有话要说），取得他的信任后可以进地窖拿到关键碎片。',
  },
```
...and ends with the block ending before line 181:
```typescript
    hint: '三件证物已齐。前往城郊废弃宅院（从大堂外「城郊树林」方向可到），在正堂找到「无痕步」的出路。',
  },
```

After deleting those 36 lines, add this new rule in `CHAPTER3_RULES`, just **before** the existing catch-all `when: (ctx) => has(ctx, 'feiyes_manor_searched') && !has(ctx, 'fei_ye_identity_confirmed')` rule (i.e., insert before the rule at what was line 351):

```typescript
  {
    when: (ctx) =>
      has(ctx, 'fei_ye_identity_confirmed') &&
      hasItem(ctx, 'tianji_founding_scroll') &&
      !has(ctx, 'deeper_threat_revealed'),
    hint: '飞爷身份已确认，创始卷在手，但名单背后还有未解的威胁。回到大雁塔找无迹和尚再谈一次，他知道名单上不止有受害者——有人早已倒戈，那才是更深处的危险。',
  },
```

- [ ] **Step 4: Run tests to verify**

```bash
cd /Users/xuli/claudeGame && npm test -- --run
```
Expected: all 166+ tests PASS, including the new expose_truth test.

- [ ] **Step 5: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/engine/hintEngine.ts tests/engine/hintEngine.test.ts && git commit -m "fix: remove 5 duplicate ch1 hint rules, add expose_truth path hint for ch3"
```

---

### Task 2: ChapterEnd — 三章线索列表修复

**Files:**
- Modify: `src/pages/ChapterEnd/ChapterEnd.tsx:107-109`

**Context:** Lines 107-109 currently:
```typescript
const clueItems = isChapter3 || isChapter2
  ? []
  : items.flatMap((id) => { const item = getItem(id); return item?.isClue ? [item] : []; });
```
Chapter 2 and 3 get an empty array, so no clues show on those ending screens. `scene.clues` (already destructured at line 81) holds the IDs granted by events/NPCs. Use that uniformly.

- [ ] **Step 1: Replace the clueItems derivation**

Replace those 3 lines with:

```typescript
const clueItems = clues
  .map((id) => getItem(id))
  .filter((item): item is NonNullable<typeof item> => item !== undefined && item !== null);
```

The `useMemo` at line 111 already depends on `clueItems`, and `lines` already has the `【你所掌握的线索】` section — no further changes needed.

- [ ] **Step 2: Run tests**

```bash
cd /Users/xuli/claudeGame && npm test -- --run
```
Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/pages/ChapterEnd/ChapterEnd.tsx && git commit -m "fix: show scene.clues on chapter end screen for all three chapters"
```

---

### Task 3: Game.tsx — revisit 事件补加分隔符

**Files:**
- Modify: `src/pages/Game/Game.tsx:166-174`

**Context:** When the player enters a new room, `revisitEvents` fire and call `scene.addStoryText(rev.text)`. No separator is added before that text, so the revisit note mixes visually with whatever text was shown last. The separator logic (check `scene.storyText.length > 0` then `scene.addStoryText('---SEPARATOR---')`) already exists for `handleAction` — apply the same pattern here.

Current code (lines 166-174):
```typescript
    for (const rev of currentRoom.revisitEvents) {
      if (evaluate(rev.requires, ctx)) {
        scene.addStoryText(rev.text);
        audioEngine.playSFX('hint');
        rev.grants?.flags?.forEach((f) => scene.addFlag(f));
      }
    }
```

- [ ] **Step 1: Add separator before first revisit text**

Replace those lines with:

```typescript
    let firstRevisit = true;
    for (const rev of currentRoom.revisitEvents) {
      if (evaluate(rev.requires, ctx)) {
        if (firstRevisit && scene.storyText.length > 0) {
          scene.addStoryText('---SEPARATOR---');
          firstRevisit = false;
        }
        scene.addStoryText(rev.text);
        audioEngine.playSFX('hint');
        rev.grants?.flags?.forEach((f) => scene.addFlag(f));
      }
    }
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/xuli/claudeGame && npm test -- --run
```
Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/pages/Game/Game.tsx && git commit -m "fix: add separator before revisit event text on room enter"
```

---

### Task 4: RightPanel items tab — 点击展开物品描述

**Files:**
- Modify: `src/components/layout/RightPanel.tsx`

**Context:** Item/clue descriptions are only visible via hover tooltip. Mobile users and keyboard users can't see them. Add a click-to-expand inline description. One item expanded at a time; clicking the same item again collapses it.

Current item list (lines 349-357 for carriedItems, similar pattern for clueItems):
```tsx
{carriedItems.map((item) => item && (
  <Tooltip key={item.id} content={item.description} position="left">
    <li className="text-xs text-ink/60 flex items-start gap-1.5 cursor-help px-1 py-0.5 hover:text-ink/80 transition-colors group">
      <span className="text-gold/30 mt-0.5 shrink-0 group-hover:text-gold/50 transition-colors">◇</span>
      <span>{item.name}</span>
    </li>
  </Tooltip>
))}
```

- [ ] **Step 1: Add expandedItemId state**

After the `const [expandedNpc, setExpandedNpc] = useState<string | null>(null);` line (around line 134), add:

```typescript
const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
```

- [ ] **Step 2: Replace carriedItems list**

Replace the `carriedItems.map(...)` block (the Tooltip+li for carried items) with:

```tsx
{carriedItems.map((item) => item && (
  <li key={item.id} className="text-xs">
    <button
      onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
      className="w-full flex items-start gap-1.5 px-1 py-0.5 text-ink/60 hover:text-ink/80 transition-colors group cursor-pointer text-left"
    >
      <span className="text-gold/30 mt-0.5 shrink-0 group-hover:text-gold/50 transition-colors">◇</span>
      <span className="flex-1">{item.name}</span>
      <span className="text-[9px] text-ink/18 shrink-0 mt-0.5">{expandedItemId === item.id ? '▴' : '▾'}</span>
    </button>
    {expandedItemId === item.id && (
      <p className="text-[11px] text-ink/38 leading-relaxed pl-4 pr-1 pb-1 border-l border-gold/12 ml-1.5">{item.description}</p>
    )}
  </li>
))}
```

- [ ] **Step 3: Replace clueItems list**

Replace the `clueItems.map(...)` block (Tooltip+li for clues) with:

```tsx
{clueItems.map((item) => item && (
  <li key={item.id} className="text-xs">
    <button
      onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
      className="w-full flex items-start gap-1.5 px-1 py-0.5 text-ink/60 hover:text-ink/80 transition-colors group cursor-pointer text-left"
    >
      <span className="text-gold/35 mt-0.5 shrink-0 group-hover:text-gold/55 transition-colors">◈</span>
      <span className="flex-1">{item.name}</span>
      <span className="text-[9px] text-ink/18 shrink-0 mt-0.5">{expandedItemId === item.id ? '▴' : '▾'}</span>
    </button>
    {expandedItemId === item.id && (
      <p className="text-[11px] text-ink/38 leading-relaxed pl-4 pr-1 pb-1 border-l border-gold/12 ml-1.5">{item.description}</p>
    )}
  </li>
))}
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/xuli/claudeGame && npm test -- --run
```
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/components/layout/RightPanel.tsx && git commit -m "feat: click item/clue in items tab to expand inline description"
```

---

### Task 5: RightPanel stats tab — 任务日志按章分组

**Files:**
- Modify: `src/components/layout/RightPanel.tsx`

**Context:** The `questLog` is a flat list. Quest IDs map clearly to chapters. Add section headers. The `QUEST_HINTS` constant at line 17 already defines all quest IDs. Map them:

```
quest_main_murder  → 第一章·旧案
quest_dafei_gang   → 第一章·旧案
quest_li_mao_case  → 第二章·追查
quest_find_kite    → 第三章·终局
```

Add this constant after the `QUEST_ENDINGS` block (around line 41):

- [ ] **Step 1: Add QUEST_CHAPTER_LABELS constant**

After the `QUEST_ENDINGS` const, add:

```typescript
const QUEST_CHAPTER_LABELS: Record<string, string> = {
  quest_main_murder: '第一章·旧案',
  quest_dafei_gang:  '第一章·旧案',
  quest_li_mao_case: '第二章·追查',
  quest_find_kite:   '第三章·终局',
};
```

- [ ] **Step 2: Replace the quest list render**

Find the `questLog.length > 0` block (starting around line 309). Replace the entire `<ul className="space-y-3">` block with:

```tsx
{(() => {
  const groups = new Map<string, string[]>();
  for (const qid of questLog) {
    const label = QUEST_CHAPTER_LABELS[qid] ?? '其他';
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(qid);
  }
  return Array.from(groups.entries()).map(([chapterLabel, qids]) => (
    <div key={chapterLabel} className="mb-3 last:mb-0">
      <p className="text-[9px] text-gold/22 tracking-[0.3em] px-1 mb-1.5">{chapterLabel}</p>
      <ul className="space-y-3">
        {qids.map((qid) => {
          const q = QUEST_HINTS[qid];
          const isDone = QUEST_ENDINGS[qid]?.some((f) => flags.includes(f)) ?? false;
          return (
            <li key={qid} className="text-xs">
              <div className="flex items-start gap-1.5 mb-1">
                <span className={`mt-0.5 shrink-0 text-[10px] ${isDone ? 'text-ink/20' : 'text-gold/40'}`}>
                  {isDone ? '✓' : '▸'}
                </span>
                <span className={isDone ? 'text-ink/25 line-through' : 'text-ink/65'}>
                  {q?.name ?? qid}
                </span>
                {isDone && (
                  <span className="text-[9px] text-ink/20 ml-1 shrink-0">·已结案</span>
                )}
              </div>
              {q?.hint && !isDone && (
                <p className="text-ink/28 leading-relaxed pl-3.5 text-[11px] whitespace-pre-line">{q.hint}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  ));
})()}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/xuli/claudeGame && npm test -- --run
```
Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/components/layout/RightPanel.tsx && git commit -m "feat: group quest log by chapter in stats tab"
```

---

### Task 6: RightPanel deduce tab — 矛盾条目置顶

**Files:**
- Modify: `src/components/layout/RightPanel.tsx`

**Context:** In the profile facts render (around line 493), facts display in their original JSON order. `contradiction` type facts are the most investigatively interesting — sort them to the top. Keep relative order of same-type facts stable (stable sort).

- [ ] **Step 1: Sort visibleFacts before rendering**

Find the line (around line 468):
```typescript
const visibleFacts = profile.facts.filter((f) => flags.includes(f.flag));
```

Replace with:
```typescript
const visibleFacts = profile.facts
  .filter((f) => flags.includes(f.flag))
  .sort((a, b) => {
    if (a.type === 'contradiction' && b.type !== 'contradiction') return -1;
    if (a.type !== 'contradiction' && b.type === 'contradiction') return 1;
    return 0;
  });
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/xuli/claudeGame && npm test -- --run
```
Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/components/layout/RightPanel.tsx && git commit -m "feat: sort contradiction facts to top of NPC profile in deduce tab"
```

---

### Task 7: RightPanel stats tab — 活跃任务数量角标

**Files:**
- Modify: `src/components/layout/RightPanel.tsx`

**Context:** The items tab already has a red dot badge for new items. The stats tab has no indicator for pending quests. Add a small count badge showing the number of active (not completed) quests. It appears on the tab button when there are active quests and stats tab is not currently selected.

- [ ] **Step 1: Compute active quest count**

After the `itemsBadge` line (around line 143), add:

```typescript
const activeQuestCount = questLog.filter(
  (qid) => !(QUEST_ENDINGS[qid]?.some((f) => flags.includes(f)) ?? false)
).length;
```

- [ ] **Step 2: Add badge to stats tab button**

Find the stats tab button. It renders something like:
```tsx
<button ... title="角色·任务" onClick={() => setTab('stats')}>
```

The four tab buttons are in an array mapped over `tabKeys` or rendered individually. Find the button for index 0 (stats tab, key '1'). It currently contains only the icon glyph `亼`. Modify it to also show the badge:

Find the tab button with `title="角色·任务"`. It will look like:
```tsx
<button
  key="stats"
  title="角色·任务 (1)"
  onClick={() => setTab('stats')}
  className={...}
>
  亼
</button>
```

Replace the button content from just `亼` to:
```tsx
<span className="relative inline-flex">
  亼
  {tab !== 'stats' && activeQuestCount > 0 && (
    <span className="absolute -top-1 -right-1.5 text-[8px] text-gold/70 leading-none tabular-nums">
      {activeQuestCount}
    </span>
  )}
</span>
```

To find the exact location: search for the string `亼` in RightPanel.tsx — it appears once in the tab buttons section.

- [ ] **Step 3: Run tests**

```bash
cd /Users/xuli/claudeGame && npm test -- --run
```
Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/components/layout/RightPanel.tsx && git commit -m "feat: show active quest count badge on stats tab"
```

---

### Task 8: LeftPanel — 已访问出口标记

**Files:**
- Modify: `src/components/layout/LeftPanel.tsx`

**Context:** The "前往" section shows all accessible exits as buttons. There's a separate "足迹" section for previously-visited rooms. Combining these: when an exit room has been previously visited, show a tiny "·访" indicator next to its name, so players know they've been there before without needing to scroll to "足迹".

Current exit button (lines 121-134):
```tsx
<button
  key={r.id}
  onClick={() => onNavigate(r.id)}
  className="text-left text-ink/55 hover:text-ink/88 text-xs py-1.5 px-2 border border-transparent hover:border-gold/18 hover:bg-gold/3 transition-all duration-150 group flex items-center gap-2 cursor-pointer"
>
  <span className="text-[10px] shrink-0 transition-colors" style={{ color: glyph ? glyph.color : undefined }}>
    {glyph ? glyph.glyph : '▸'}
  </span>
  <span className="group-hover:text-gold/85 transition-colors">{r.name}</span>
</button>
```

- [ ] **Step 1: Compute visited set from visitedRooms**

The component already destructures `visitedRooms` from `useSceneStore` (line 43). Build a Set for O(1) lookup. Add after the `exitedRooms` / `lockedExits` derivations (around line 67):

```typescript
const visitedSet = useMemo(() => new Set(visitedRooms), [visitedRooms]);
```

- [ ] **Step 2: Add "·访" indicator to visited exits**

Modify the exit button's inner `<span>{r.name}</span>` to:

```tsx
<span className="group-hover:text-gold/85 transition-colors flex items-center gap-1.5">
  {r.name}
  {visitedSet.has(r.id) && (
    <span className="text-[8px] text-ink/18 tracking-wider shrink-0">·访</span>
  )}
</span>
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/xuli/claudeGame && npm test -- --run
```
Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/components/layout/LeftPanel.tsx && git commit -m "feat: mark previously visited exits in left panel navigation"
```

---

### Task 9: RightPanel deduce tab — 展开人物档案显示NPC描述

**Files:**
- Modify: `src/components/layout/RightPanel.tsx`

**Context:** When a profile card is expanded, it shows `profile.suspicion` (role note) and the fact list. But the player may not remember who this NPC is between sessions or chapters. Adding the NPC's flavour description (the short narrative text from `getNPC().description`) as a brief bio at the top of the expanded profile makes the deduction screen more self-contained. `getNPC` is already importable from `../../data/loader`.

- [ ] **Step 1: Import getNPC**

In the import line (line 8):
```typescript
import { getItem, TALENTS, getTemplate, getSynthesisResult, SUSPECT_PROFILES, SYNTHESES } from '../../data/loader';
```
Add `getNPC`:
```typescript
import { getItem, getNPC, TALENTS, getTemplate, getSynthesisResult, SUSPECT_PROFILES, SYNTHESES } from '../../data/loader';
```

- [ ] **Step 2: Show NPC description inside expanded profile**

Find the expanded profile block (around line 487):
```tsx
{isExpanded && (
  <div className="ml-3 pl-3 border-l border-gold/12 pb-2 space-y-1.5">
    <p className={`text-[10px] tracking-wide mb-1 ${
      profile.suspicion.startsWith('可疑') ? 'text-blood/65' : 'text-gold/50'
    }`}>
      {profile.suspicion}
    </p>
    {visibleFacts.map((fact) => (
```

After the `{profile.suspicion}` paragraph and before the `visibleFacts.map(...)`, add:

```tsx
{(() => {
  const npcDesc = getNPC(profile.npcId)?.description;
  return npcDesc ? (
    <p className="text-[10px] text-ink/30 leading-relaxed italic border-l border-gold/8 pl-2 mb-1">
      {npcDesc}
    </p>
  ) : null;
})()}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/xuli/claudeGame && npm test -- --run
```
Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/components/layout/RightPanel.tsx && git commit -m "feat: show NPC character description in expanded deduce profile card"
```

---

### Task 10: CenterPanel — 房间探查完毕空状态提示

**Files:**
- Modify: `src/components/layout/CenterPanel.tsx`

**Context:** When a player has completed every visible action in a room (all event actions `completed: true`, all NPC dialogues exhausted), the action area shows nothing actionable — but there's no explicit message telling them to move on. Add an "已探查完毕" hint so players know to navigate elsewhere rather than wondering if they missed something.

Current empty state (line 354-355):
```tsx
{entities.filter((e) => e.type !== 'npc').length === 0 && entities.filter((e) => e.type === 'npc').length === 0 && (
  <p className="text-ink/20 text-xs px-2 py-2 italic">此处无可交互之物</p>
)}
```

This only fires when there are literally zero entities, not when all are completed.

- [ ] **Step 1: Compute allExplored**

After the `eventGroups` useMemo (around line 113), add:

```typescript
const allExplored = useMemo(() => {
  if (pendingChoices) return false;
  const nonChoice = [...npcActions, ...eventActions];
  return nonChoice.length > 0 && nonChoice.every((a) => a.completed);
}, [npcActions, eventActions, pendingChoices]);
```

- [ ] **Step 2: Show explored state message**

Find the action area `<div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">` (around line 353). Inside it, just before the existing `{entities.filter(...).length === 0 ...}` empty-state check, add:

```tsx
{allExplored && (
  <p className="text-ink/18 text-[11px] px-2 py-3 italic text-center leading-relaxed">
    此处探查已尽<br />
    <span className="text-[10px] tracking-wide">可前往其他地点继续调查</span>
  </p>
)}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/xuli/claudeGame && npm test -- --run
```
Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/components/layout/CenterPanel.tsx && git commit -m "feat: show 'all explored' message when every room action is completed"
```

---

## Self-Review

**Spec coverage:**
1. ✅ Duplicate hints deleted (Task 1)
2. ✅ expose_truth hint added (Task 1)
3. ✅ ChapterEnd all-chapter clues (Task 2)
4. ✅ Revisit separator (Task 3)
5. ✅ Item click-expand (Task 4)
6. ✅ Quest chapter grouping (Task 5)
7. ✅ Contradiction sort first (Task 6)
8. ✅ Active quest badge (Task 7)
9. ✅ Visited exits marked (Task 8)
10. ✅ NPC description in profile (Task 9)
11. ✅ All-explored empty state (Task 10)

**No placeholders found.**

**Type consistency:**
- `visibleFacts` defined and sorted in Task 6 is the same variable used in Task 9's fact rendering — consistent.
- `QUEST_CHAPTER_LABELS` used in Task 5, `QUEST_ENDINGS` used in Task 7 — both exist and are consistent with the existing `QUEST_HINTS`/`QUEST_ENDINGS` pattern.
- `getNPC` added to import in Task 9 — function signature `getNPC(id: string): NPC | undefined` already exported from loader.ts.
- `allExplored` in Task 10 uses `npcActions`/`eventActions` already computed in CenterPanel — no new derivation needed.
