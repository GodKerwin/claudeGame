# Round 5 Optimizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 10 optimizations ordered HIGH → LOW: revisitEvents for 7 rooms, hint engine chapter-intro rules, npc_temple_novice expansion, SVG clipPath, useCallback, interrogation keyboard nav, locked-action visual styling, ARIA landmarks, chapter-end screen polish.

**Architecture:** Pure content and targeted component edits. Tasks 1–4 are JSON/TS data; Tasks 5–8 are isolated component improvements; Tasks 9–10 are UI polish. No new files needed except tests.

**Tech Stack:** React 18 + TypeScript + Zustand + TailwindCSS v3, Vitest, SVG inline maps.

---

## File Map

- **Modify:** `src/data/maps/chapter2.json` — add `revisitEvents` to 3 rooms
- **Modify:** `src/data/maps/chapter3.json` — add `revisitEvents` to 4 rooms
- **Modify:** `src/engine/hintEngine.ts` — add chapter-intro rules at top of CHAPTER2/3 arrays; fix nav error
- **Modify:** `src/data/npcs/chapter3.json` — add 3 dialogues to npc_temple_novice
- **Modify:** `src/components/layout/LeftPanel.tsx` — SVG clipPath for label overflow
- **Modify:** `src/components/layout/RightPanel.tsx` — wrap handleSelectItem in useCallback
- **Modify:** `src/components/layout/CenterPanel.tsx` — keyboard nav for interrogation + locked-action styling
- **Modify:** `src/components/layout/GameLayout.tsx` — ARIA landmarks
- **Modify:** `src/pages/ChapterEnd/ChapterEnd.tsx` — auto-save reminder + differentiated closing text
- **Modify:** `tests/data/chapter2Integrity.test.ts` — revisitEvent tests
- **Modify:** `tests/data/chapter3Integrity.test.ts` — revisitEvent + novice dialogue tests
- **Modify:** `tests/engine/hintEngine.test.ts` — chapter-intro rule tests

---

## Context

### revisitEvent format (from existing examples in chapter2.json)
```json
{
  "id": "rev_<room>_<key>",
  "requires": { "flags": ["trigger_flag"], "flags_absent": ["rev_<room>_<key>_shown"] },
  "text": "〔atmospheric Chinese prose〕",
  "grants": { "flags": ["rev_<room>_<key>_shown"] }
}
```
Game.tsx line 184–194: fires on room *re-entry* when `evaluate(rev.requires, ctx)` is true. Grants flags immediately. `flags_absent` sentinel prevents repeat.

### HintContext (src/engine/hintEngine.ts)
```typescript
export interface HintContext {
  flags: string[];
  items: string[];
  chapter: 1 | 2 | 3;
  strength: number; agility: number; wisdom: number; constitution: number;
  talent: string;
}
const has = (ctx, flag) => ctx.flags.includes(flag);
const hasItem = (ctx, item) => ctx.items.includes(item);
```

### NPC dialogue condition format
```json
{
  "id": "dialogue_id",
  "condition": { "flags": ["..."], "flags_absent": ["..."], "has": ["item_id"], "talent": "天赋名" },
  "text": "...",
  "grants": { "flags": ["..."] }
}
```

### Ch2 room IDs
`east_market_entrance`, `huichuntang`✓, `antique_shop`, `cien_temple`✓, `pingkang_hideout`✓, `imperial_teahouse`

### Ch3 room IDs
`dayan_pagoda`, `tianji_safehouse`, `feiyes_manor`, `qujiang_pavilion`

Rooms marked ✓ already have revisitEvents. Add to the other 7.

---

## Task 1: Ch2 revisitEvents (3 rooms)

**Files:**
- Modify: `src/data/maps/chapter2.json`
- Test: `tests/data/chapter2Integrity.test.ts`

- [ ] **Step 1: Write failing test**

In `tests/data/chapter2Integrity.test.ts`, add at end of `describe('chapter2 map and item integrity', ...)`:

```typescript
  it('east_market_entrance has at least 1 revisitEvent with sentinel flag', () => {
    const room = ch2Map?.rooms.find((r) => r.id === 'east_market_entrance');
    expect(room?.revisitEvents?.length).toBeGreaterThanOrEqual(1);
    const rev = room?.revisitEvents?.[0];
    expect(rev?.grants?.flags).toBeDefined();
    expect(rev?.requires?.flags_absent).toBeDefined();
  });

  it('antique_shop has at least 1 revisitEvent with sentinel flag', () => {
    const room = ch2Map?.rooms.find((r) => r.id === 'antique_shop');
    expect(room?.revisitEvents?.length).toBeGreaterThanOrEqual(1);
    const rev = room?.revisitEvents?.[0];
    expect(rev?.grants?.flags).toBeDefined();
  });

  it('imperial_teahouse has at least 1 revisitEvent with sentinel flag', () => {
    const room = ch2Map?.rooms.find((r) => r.id === 'imperial_teahouse');
    expect(room?.revisitEvents?.length).toBeGreaterThanOrEqual(1);
    const rev = room?.revisitEvents?.[0];
    expect(rev?.grants?.flags).toBeDefined();
  });
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter2Integrity.test.ts 2>&1 | tail -20
```

Expected: 3 new tests FAIL (revisitEvents undefined or length 0)

- [ ] **Step 3: Add revisitEvents to chapter2.json**

In `src/data/maps/chapter2.json`, for `east_market_entrance` room (after `"talentViews": [...]`), add:

```json
"revisitEvents": [
  {
    "id": "rev_east_market_crowd",
    "requires": { "flags": ["langpeng_discovered"], "flags_absent": ["rev_east_market_crowd_shown"] },
    "text": "〔悬赏令还贴在坊墙上，但你已不再是初来乍到的过客——再看这条街，摊贩的站位微妙，几个人的目光拐弯抹角地跟着你。消息已经散出去了。〕",
    "grants": { "flags": ["rev_east_market_crowd_shown"] }
  }
]
```

For `antique_shop` room (after `"talentViews": [...]`), add:

```json
"revisitEvents": [
  {
    "id": "rev_antique_broker_sense",
    "requires": { "flags": ["hideout_trust_gained"], "flags_absent": ["rev_antique_broker_sense_shown"] },
    "text": "〔据点里那些藏匿的往来账目……再看这间铺子，掌柜的见什么人说什么话、不先亮底牌的规矩，和平康坊里的人如出一辙。这间铺子，懂得沉默的价值。〕",
    "grants": { "flags": ["rev_antique_broker_sense_shown"] }
  }
]
```

For `imperial_teahouse` room (after `"talentViews": [...]`), add:

```json
"revisitEvents": [
  {
    "id": "rev_teahouse_watchers",
    "requires": { "flags": ["langpeng_trail"], "flags_absent": ["rev_teahouse_watchers_shown"] },
    "text": "〔茶馆里的茶客换了几张脸，但那种不动声色的观察没有换——李邈的人，还在。他知道你来了，也知道你带着什么来的。这一趟不是谈判，是一场两边都在等的棋局终盘。〕",
    "grants": { "flags": ["rev_teahouse_watchers_shown"] }
  }
]
```

- [ ] **Step 4: Run test to verify passing**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter2Integrity.test.ts 2>&1 | tail -10
```

Expected: all tests PASS

- [ ] **Step 5: Run full suite to check no regressions**

```bash
cd /Users/xuli/claudeGame && npx vitest run 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/data/maps/chapter2.json tests/data/chapter2Integrity.test.ts && git commit -m "feat: add revisitEvents to 3 ch2 rooms (east_market, antique_shop, teahouse)"
```

---

## Task 2: Ch3 revisitEvents (4 rooms)

**Files:**
- Modify: `src/data/maps/chapter3.json`
- Test: `tests/data/chapter3Integrity.test.ts`

- [ ] **Step 1: Write failing test**

In `tests/data/chapter3Integrity.test.ts`, add at end of `describe('chapter3 map and item integrity', ...)`:

```typescript
  it('dayan_pagoda has at least 1 revisitEvent with sentinel flag', () => {
    const room = ch3Map?.rooms.find((r) => r.id === 'dayan_pagoda');
    expect(room?.revisitEvents?.length).toBeGreaterThanOrEqual(1);
    expect(room?.revisitEvents?.[0]?.grants?.flags).toBeDefined();
  });

  it('tianji_safehouse has at least 1 revisitEvent with sentinel flag', () => {
    const room = ch3Map?.rooms.find((r) => r.id === 'tianji_safehouse');
    expect(room?.revisitEvents?.length).toBeGreaterThanOrEqual(1);
    expect(room?.revisitEvents?.[0]?.grants?.flags).toBeDefined();
  });

  it('feiyes_manor has at least 1 revisitEvent with sentinel flag', () => {
    const room = ch3Map?.rooms.find((r) => r.id === 'feiyes_manor');
    expect(room?.revisitEvents?.length).toBeGreaterThanOrEqual(1);
    expect(room?.revisitEvents?.[0]?.grants?.flags).toBeDefined();
  });

  it('qujiang_pavilion has at least 1 revisitEvent with sentinel flag', () => {
    const room = ch3Map?.rooms.find((r) => r.id === 'qujiang_pavilion');
    expect(room?.revisitEvents?.length).toBeGreaterThanOrEqual(1);
    expect(room?.revisitEvents?.[0]?.grants?.flags).toBeDefined();
  });
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter3Integrity.test.ts 2>&1 | tail -20
```

Expected: 4 new tests FAIL

- [ ] **Step 3: Add revisitEvents to chapter3.json**

In `src/data/maps/chapter3.json`, for each room add `"revisitEvents": [...]` after `"talentViews": [...]`.

For `dayan_pagoda`:
```json
"revisitEvents": [
  {
    "id": "rev_dayan_after_decode",
    "requires": { "flags": ["stele_decoded"], "flags_absent": ["rev_dayan_after_decode_shown"] },
    "text": "〔碑文已经读懂，但再看这块石头，它依然一动不动地立在这里——二十年的风雨，所有守候和恐惧，都被压进这几行字里。立碑的人，当时是什么心情。〕",
    "grants": { "flags": ["rev_dayan_after_decode_shown"] }
  }
]
```

For `tianji_safehouse`:
```json
"revisitEvents": [
  {
    "id": "rev_safehouse_map_read",
    "requires": { "flags": ["tianji_trust_gained"], "flags_absent": ["rev_safehouse_map_read_shown"] },
    "text": "〔堪舆图上的红点又多了几个——联络人没有说，但你注意到了。有些暴露的节点不像是意外，更像是主动让人找到的诱饵。有人在这张网之外，比所有人都清醒。〕",
    "grants": { "flags": ["rev_safehouse_map_read_shown"] }
  }
]
```

For `feiyes_manor`:
```json
"revisitEvents": [
  {
    "id": "rev_manor_echo",
    "requires": { "flags": ["feiyes_manor_searched"], "flags_absent": ["rev_manor_echo_shown"] },
    "text": "〔画像壁上的人你已经认出——再扫一眼这间屋子，那些故意留下的物件、干涸的茶、空着的书架，都像是写给来者的一封信。他在等的，原来就是你这样的人。〕",
    "grants": { "flags": ["rev_manor_echo_shown"] }
  }
]
```

For `qujiang_pavilion`:
```json
"revisitEvents": [
  {
    "id": "rev_qujiang_stillness",
    "requires": { "flags": ["fei_ye_identity_confirmed"], "flags_absent": ["rev_qujiang_stillness_shown"] },
    "text": "〔曲江池的水还在，亭中的人还在等——他知道你还没做最终的决定。风从水面吹过来，有一种奇异的平静，像是所有的追查、所有的谎言，在这里都停住了，等着最后一句话落地。〕",
    "grants": { "flags": ["rev_qujiang_stillness_shown"] }
  }
]
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter3Integrity.test.ts 2>&1 | tail -10
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/data/maps/chapter3.json tests/data/chapter3Integrity.test.ts && git commit -m "feat: add revisitEvents to all 4 ch3 rooms"
```

---

## Task 3: Hint Engine Chapter-Intro Rules + Navigation Fix

**Files:**
- Modify: `src/engine/hintEngine.ts`
- Test: `tests/engine/hintEngine.test.ts`

- [ ] **Step 1: Write failing tests**

In `tests/engine/hintEngine.test.ts`, add:

```typescript
describe('hintEngine – Chapter 2 intro', () => {
  it('returns chapter-intro hint when chapter2_started but no ch2 flags', () => {
    const hint = getHint(base({
      chapter: 2,
      flags: ['chapter2_started'],
    }));
    expect(hint).toContain('第二章');
  });
});

describe('hintEngine – Chapter 3 intro', () => {
  it('returns chapter-intro hint when chapter3_started but no ch3 progress', () => {
    const hint = getHint(base({
      chapter: 3,
      flags: ['chapter3_started'],
    }));
    expect(hint).toContain('第三章');
  });

  it('ch3 Rule 14 does not reference 曲江池 for navigation to dayan_pagoda', () => {
    const hint = getHint(base({
      chapter: 3,
      flags: ['chapter3_started', 'stele_seen'],
      items: [],
    }));
    expect(hint).not.toContain('曲江池可前往');
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/engine/hintEngine.test.ts 2>&1 | tail -20
```

Expected: new tests FAIL (existing hints don't contain "第二章"/"第三章"; ch3 hint contains wrong nav)

- [ ] **Step 3: Add ch2 intro rule at top of CHAPTER2_RULES**

In `src/engine/hintEngine.ts`, insert at the very beginning of the `CHAPTER2_RULES` array (before line 174's first rule):

```typescript
  // ── 章节起始：无ch2进展时给出明确的章节引导 ──
  {
    when: (ctx) =>
      has(ctx, 'chapter2_started') &&
      !has(ctx, 'langpeng_discovered') &&
      !has(ctx, 'wujue_met'),
    hint: '第二章伊始，案情延至长安。从东市入口探查起——悬赏告示上有线索，回春堂药铺的无迹和尚也值得拜访。两条线可并行推进。',
  },
```

- [ ] **Step 4: Add ch3 intro rule at top of CHAPTER3_RULES**

Insert at the very beginning of the `CHAPTER3_RULES` array (before the first existing rule):

```typescript
  // ── 章节起始：无ch3进展时给出明确的章节引导 ──
  {
    when: (ctx) =>
      has(ctx, 'chapter3_started') &&
      !has(ctx, 'tianji_contact_met') &&
      !has(ctx, 'stele_decoded'),
    hint: '第三章伊始，天机阁来令追查旧主。两处起点：天机安宅（接令了解目标）或大雁塔下（无名碑藏有线索）。任选其一皆可展开。',
  },
```

- [ ] **Step 5: Fix ch3 Rule 14 navigation error**

Find the rule in `CHAPTER3_RULES` that contains `'从大雁塔下的无名碑入手（从曲江池可前往）'`. Change it to:

```typescript
  {
    when: (ctx) =>
      !has(ctx, 'stele_decoded') && !hasItem(ctx, 'tianji_founding_scroll'),
    hint: '从大雁塔下的无名碑入手，碑文藏着天机阁创始者的信息。',
  },
```

(Remove "（从曲江池可前往）" — `dayan_pagoda` is accessible directly, not via `qujiang_pavilion`.)

- [ ] **Step 6: Run tests**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/engine/hintEngine.test.ts 2>&1 | tail -10
```

Expected: PASS

- [ ] **Step 7: Run full suite**

```bash
cd /Users/xuli/claudeGame && npx vitest run 2>&1 | tail -5
```

- [ ] **Step 8: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/engine/hintEngine.ts tests/engine/hintEngine.test.ts && git commit -m "feat: add ch2/ch3 chapter-intro hint rules; fix ch3 nav error in rule 14"
```

---

## Task 4: npc_temple_novice Dialogue Expansion

**Files:**
- Modify: `src/data/npcs/chapter3.json`
- Test: `tests/data/chapter3Integrity.test.ts`

- [ ] **Step 1: Write failing test**

In `tests/data/chapter3Integrity.test.ts`, inside `describe('chapter3 npc integrity', ...)`:

```typescript
  it('npc_temple_novice has 6 dialogues', () => {
    const npc = NPCS.find((n) => n.id === 'npc_temple_novice');
    expect(npc?.dialogues.length).toBeGreaterThanOrEqual(6);
  });

  it('npc_temple_novice has novice_kite_seen dialogue gated on fei_ye_identity_confirmed', () => {
    const npc = NPCS.find((n) => n.id === 'npc_temple_novice');
    const d = npc?.dialogues.find((d) => d.id === 'novice_kite_seen');
    expect(d, 'novice_kite_seen dialogue missing').toBeDefined();
    expect(d?.condition?.flags).toContain('fei_ye_identity_confirmed');
  });

  it('npc_temple_novice has novice_scroll_wonder dialogue requiring tianji_founding_scroll', () => {
    const npc = NPCS.find((n) => n.id === 'npc_temple_novice');
    const d = npc?.dialogues.find((d) => d.id === 'novice_scroll_wonder');
    expect(d, 'novice_scroll_wonder dialogue missing').toBeDefined();
    expect(d?.condition?.has).toContain('tianji_founding_scroll');
  });
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter3Integrity.test.ts 2>&1 | tail -20
```

Expected: new tests FAIL

- [ ] **Step 3: Add 3 dialogues to npc_temple_novice**

In `src/data/npcs/chapter3.json`, inside the `npc_temple_novice` dialogues array, append after the last existing dialogue (`wujue_testimony_ref`):

```json
      {
        "id": "novice_kite_seen",
        "condition": { "flags": ["fei_ye_identity_confirmed", "novice_met"], "flags_absent": ["novice_kite_seen_shown"] },
        "text": "「那位白衣施主……」小僧放低声音，「前几日他在大门外站了很久，没有进来。离开时，我听见他说了一句——」\n\n小僧皱眉，努力回忆，「『等得够久了』。说完就往曲江池方向走了。」\n\n他困惑地看着你：「施主认识他吗？」",
        "grants": { "flags": ["novice_kite_seen_shown"] }
      },
      {
        "id": "novice_shadow_watching",
        "condition": { "flags": ["deeper_threat_revealed", "novice_met"], "flags_absent": ["novice_shadow_watching_shown"] },
        "text": "「无迹大师刚才叫我来找施主。」小僧认真地看着你，「他说：『有人跟着他』。」\n\n小僧往廊道那边瞥了一眼，「大师从窗口看了好一阵，才叫我来的。施主要小心。」",
        "grants": { "flags": ["novice_shadow_watching_shown"] }
      },
      {
        "id": "novice_scroll_wonder",
        "condition": { "has": ["tianji_founding_scroll"], "flags_absent": ["novice_scroll_wonder_shown"] },
        "text": "小僧扫地时停下来，好奇地看向你手中的卷轴。\n\n「那个……是碑文上抄录下来的吗？」他凑近了一点，「无迹大师每次从碑边回来，都会在禅房里待很久，一声不响。」\n\n他若有所思，「也许他守着那块碑，就是在等有一天会有人把它带走。」",
        "grants": { "flags": ["novice_scroll_wonder_shown"] }
      }
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/xuli/claudeGame && npx vitest run tests/data/chapter3Integrity.test.ts 2>&1 | tail -10
```

Expected: PASS

- [ ] **Step 5: Run full suite**

```bash
cd /Users/xuli/claudeGame && npx vitest run 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/data/npcs/chapter3.json tests/data/chapter3Integrity.test.ts && git commit -m "feat: add 3 flag-gated dialogues to npc_temple_novice"
```

---

## Task 5: SVG Node Label Overflow Fix

**Files:**
- Modify: `src/components/layout/LeftPanel.tsx`

No test needed — visual fix; existing tests don't cover SVG rendering.

- [ ] **Step 1: Add clipPath defs to the SVG**

In `src/components/layout/LeftPanel.tsx`, locate the SVG element that renders nodes (the one with `style={{ overflow: 'visible' }}`). Add a `<defs>` block inside the SVG element, right before the `{edges.map(...)}` section:

```tsx
<defs>
  {nodes.map((node) => (
    <clipPath key={`clip-${node.id}`} id={`clip-${node.id}`}>
      <rect
        x={node.cx - NW / 2 + 2}
        y={node.cy - NH / 2 + 1}
        width={NW - 4}
        height={NH - 2}
      />
    </clipPath>
  ))}
</defs>
```

- [ ] **Step 2: Apply clipPath to the text element**

Find the `<text>` element inside the node `<g>` (around line 210–220). Wrap it in a `<g>` with `clipPath`:

Replace:
```tsx
<text
  x={node.cx}
  y={node.cy}
  textAnchor="middle"
  dominantBaseline="central"
  fill={textFill}
  fontSize="8.5"
  fontFamily="serif"
>
  {isCurrent ? `● ${node.label}` : isVisited ? `${node.label} ·` : node.label}
</text>
```

With:
```tsx
<g clipPath={`url(#clip-${node.id})`}>
  <text
    x={node.cx}
    y={node.cy}
    textAnchor="middle"
    dominantBaseline="central"
    fill={textFill}
    fontSize="8.5"
    fontFamily="serif"
  >
    {isCurrent ? `● ${node.label}` : isVisited ? `${node.label} ·` : node.label}
  </text>
</g>
```

- [ ] **Step 3: Build check**

```bash
cd /Users/xuli/claudeGame && npm run build 2>&1 | tail -10
```

Expected: no TypeScript errors

- [ ] **Step 4: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/components/layout/LeftPanel.tsx && git commit -m "fix: clip SVG node labels to prevent overflow outside node rect"
```

---

## Task 6: RightPanel handleSelectItem useCallback

**Files:**
- Modify: `src/components/layout/RightPanel.tsx`

No test needed — perf optimization, behavior unchanged.

- [ ] **Step 1: Wrap handleSelectItem in useCallback**

In `src/components/layout/RightPanel.tsx`, find `const handleSelectItem = (itemId: string) => {` (around line 193) and replace the whole function with:

```tsx
const handleSelectItem = useCallback((itemId: string) => {
  setHintPair(null);
  if (selectedA === itemId) {
    setSelectedA(null);
    setSynthResult(null);
    return;
  }
  if (selectedB === itemId) {
    setSelectedB(null);
    setSynthResult(null);
    return;
  }
  if (!selectedA) {
    setSelectedA(itemId);
    return;
  }
  if (!selectedB) {
    const newB = itemId;
    setSelectedB(newB);
    const synth = getSynthesisResult(selectedA, newB);
    if (!synth) {
      setSynthResult({ text: '这两件物证之间，暂无关联。', isNew: false });
    } else {
      const alreadyFound = foundSynthesisIds.includes(synth.id);
      if (!alreadyFound) {
        addFoundSynthesisId(synth.id);
        synth.grants?.flags?.forEach((f) => addFlag(f));
        synth.grants?.items?.forEach((i) => addItem(i));
        setSynthResult({ text: synth.result, isNew: true });
        setIsNewSynth(true);
        if (synthTimerRef.current) clearTimeout(synthTimerRef.current);
        synthTimerRef.current = setTimeout(() => setIsNewSynth(false), 3000);
      } else {
        setSynthResult({ text: synth.result, isNew: false });
      }
    }
  } else {
    setSelectedA(itemId);
    setSelectedB(null);
    setSynthResult(null);
  }
}, [selectedA, selectedB, foundSynthesisIds, addFoundSynthesisId, addFlag, addItem]);
```

Ensure `useCallback` is already imported — it is (line 1: `import { useState, useEffect, useRef } from 'react';` → add `useCallback` to this import).

- [ ] **Step 2: Build check**

```bash
cd /Users/xuli/claudeGame && npm run build 2>&1 | tail -10
```

Expected: no TypeScript errors

- [ ] **Step 3: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/components/layout/RightPanel.tsx && git commit -m "perf: wrap handleSelectItem in useCallback to stabilize reference"
```

---

## Task 7: Interrogation Keyboard Navigation

**Files:**
- Modify: `src/components/layout/CenterPanel.tsx`

- [ ] **Step 1: Add keyboard navigation state and effect**

In `src/components/layout/CenterPanel.tsx`, after the existing `const [expandedId, setExpandedId] = useState<string | null>(null);` state declaration (around line 85), add:

```tsx
const [interrogationFocusIdx, setInterrogationFocusIdx] = useState(0);
```

After the existing `useEffect(() => { scrollToBottom(); }, ...)`, add:

```tsx
// Reset focus index when interrogation items change
useEffect(() => {
  setInterrogationFocusIdx(0);
}, [pendingInterrogation]);

// Keyboard navigation for interrogation mode
useEffect(() => {
  if (!pendingInterrogation) return;
  const items = pendingInterrogation.allItems;
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setInterrogationFocusIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setInterrogationFocusIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[interrogationFocusIdx];
      if (item) pendingInterrogation.onPresent(item.id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      pendingInterrogation.onCancel();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [pendingInterrogation, interrogationFocusIdx]);
```

- [ ] **Step 2: Apply focus highlight in interrogation item list**

In `src/components/layout/CenterPanel.tsx`, in the `pendingInterrogation.allItems.map(...)` render (around line 267), update the button `className` to highlight the focused item:

Replace:
```tsx
className="w-full text-left flex items-center gap-2 px-2 py-1.5 border-l-2 border-gold/20 text-ink/65 hover:text-gold hover:border-gold/55 transition-colors cursor-pointer group"
```

With (using the map index):
```tsx
className={`w-full text-left flex items-center gap-2 px-2 py-1.5 border-l-2 transition-colors cursor-pointer group ${
  index === interrogationFocusIdx
    ? 'border-gold/55 text-gold bg-gold/5'
    : 'border-gold/20 text-ink/65 hover:text-gold hover:border-gold/55'
}`}
```

Update the `.map((item) => (...))` to `.map((item, index) => (...))`.

- [ ] **Step 3: Build check**

```bash
cd /Users/xuli/claudeGame && npm run build 2>&1 | tail -10
```

Expected: no TypeScript errors

- [ ] **Step 4: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/components/layout/CenterPanel.tsx && git commit -m "feat: add keyboard navigation (↑↓ Enter Escape) to interrogation panel"
```

---

## Task 8: Locked Action Visual Distinction

**Files:**
- Modify: `src/components/layout/CenterPanel.tsx`

The current locked (stat-gated) action renders with `border-gold/12` and `text-ink/28`. The fix makes stat-gated hints more readable by increasing contrast and adding a visual indicator.

- [ ] **Step 1: Update locked action styling**

In `src/components/layout/CenterPanel.tsx`, locate the `!a.available` branch in the non-choice actions render (around lines 434–444):

Replace:
```tsx
) : (
  <div
    key={a.id}
    className="pl-2 pr-1 py-1.5 border-l border-gold/12 ml-px select-none"
  >
    <p className="text-[13px] text-ink/28 leading-snug">{a.label}</p>
    {a.hint && (
      <p className="text-[11px] text-gold/30 mt-0.5 tracking-wide leading-snug">{a.hint}</p>
    )}
  </div>
)
```

With:
```tsx
) : (
  <div
    key={a.id}
    className="pl-2 pr-1 py-1.5 border-l-2 border-gold/18 ml-px select-none"
  >
    <p className="text-[13px] text-ink/32 leading-snug">{a.label}</p>
    {a.hint && (
      <p className="text-[11px] text-gold/42 mt-0.5 tracking-wide leading-snug">〔{a.hint}〕</p>
    )}
  </div>
)
```

Changes: `border-l` → `border-l-2`, `border-gold/12` → `border-gold/18`, `text-ink/28` → `text-ink/32`, `text-gold/30` → `text-gold/42`, wrap hint in `〔〕` to visually mark it as a requirement note.

- [ ] **Step 2: Build check**

```bash
cd /Users/xuli/claudeGame && npm run build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/components/layout/CenterPanel.tsx && git commit -m "style: improve locked action visibility with stronger border and hint contrast"
```

---

## Task 9: ARIA Landmarks

**Files:**
- Modify: `src/components/layout/GameLayout.tsx`

- [ ] **Step 1: Add ARIA roles to desktop layout panels**

In `src/components/layout/GameLayout.tsx`, in the desktop three-column layout (inside `<div className="hidden lg:flex...">`):

1. Left panel `CornerFrame` — add `aria-label="地图导航"` and wrap with `<nav>`:

Replace the left `CornerFrame`:
```tsx
<CornerFrame size="sm" className="w-56 shrink-0 panel border-r border-gold/15 flex flex-col overflow-hidden">
  {left}
</CornerFrame>
```
With:
```tsx
<nav aria-label="地图导航">
  <CornerFrame size="sm" className="w-56 shrink-0 panel border-r border-gold/15 flex flex-col overflow-hidden h-full">
    {left}
  </CornerFrame>
</nav>
```

2. Center panel — add `role="main"` and `aria-label="故事主区"`:

Replace:
```tsx
<div className="flex-1 flex flex-col overflow-hidden border-r border-gold/10">
  {center}
</div>
```
With:
```tsx
<main className="flex-1 flex flex-col overflow-hidden border-r border-gold/10" aria-label="故事主区">
  {center}
</main>
```

3. Right panel — add `role="complementary"` and `aria-label="角色状态"`:

Replace:
```tsx
<CornerFrame size="sm" className="shrink-0 panel flex flex-col overflow-hidden" style={{ width: '210px' }}>
  {right}
</CornerFrame>
```
With:
```tsx
<aside aria-label="角色状态">
  <CornerFrame size="sm" className="shrink-0 panel flex flex-col overflow-hidden h-full" style={{ width: '210px' }}>
    {right}
  </CornerFrame>
</aside>
```

- [ ] **Step 2: Build check**

```bash
cd /Users/xuli/claudeGame && npm run build 2>&1 | tail -10
```

- [ ] **Step 3: Run full suite**

```bash
cd /Users/xuli/claudeGame && npx vitest run 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/components/layout/GameLayout.tsx && git commit -m "a11y: add ARIA landmarks (nav/main/aside) to desktop game layout"
```

---

## Task 10: Chapter End Screen Polish

**Files:**
- Modify: `src/pages/ChapterEnd/ChapterEnd.tsx`

Two sub-tasks: (A) auto-save reminder, (B) differentiated chapter-close caption.

- [ ] **Step 1: Add per-chapter closing caption data**

In `src/pages/ChapterEnd/ChapterEnd.tsx`, after the `ENDING_STYLES` constant (around line 44), add:

```tsx
const CHAPTER_CLOSE_CAPTIONS: Record<string, string> = {
  1: '——线索已握，长安还在等你。',
  2: '——黑幕初破，名单仍藏深处。',
  3: '——真相既出，万事终有归处。',
};
```

- [ ] **Step 2: Replace static closing text with dynamic caption**

In the button section (around line 244), find the decorative divider:
```tsx
<div className="flex items-center justify-center gap-3 mb-6">
  <div className="w-8 h-px bg-gold/20" />
  <div className="w-[5px] h-[5px] bg-gold/30" style={{ transform: 'rotate(45deg)' }} />
  <div className="w-8 h-px bg-gold/20" />
</div>
```

Replace with:
```tsx
<div className="flex items-center justify-center gap-3 mb-3">
  <div className="w-8 h-px bg-gold/20" />
  <div className="w-[5px] h-[5px] bg-gold/30" style={{ transform: 'rotate(45deg)' }} />
  <div className="w-8 h-px bg-gold/20" />
</div>
{(() => {
  const chNum = isChapter3 ? '3' : isChapter2 ? '2' : '1';
  const caption = CHAPTER_CLOSE_CAPTIONS[chNum];
  return caption ? (
    <p className="text-ink/22 text-[11px] tracking-[0.2em] italic mb-5 text-center">{caption}</p>
  ) : null;
})()}
```

- [ ] **Step 3: Add auto-save reminder**

Import `useSaveStore` or access save state. First check what save store is available:

```bash
grep -rn "useSaveStore\|saveSlots\|saves\|SaveSlot" /Users/xuli/claudeGame/src/store/ | head -10
```

If `useSaveStore` exists with a `slots` or `saves` array, add before the button:

After the caption paragraph, add:
```tsx
{!isChapter3 && (
  <p className="text-ink/18 text-[10px] tracking-[0.15em] mb-4 text-center">
    建议在继续前保存游戏
  </p>
)}
```

(No import needed — this is static reminder text, no save state check required. Simple and always visible when not chapter 3.)

- [ ] **Step 4: Build check**

```bash
cd /Users/xuli/claudeGame && npm run build 2>&1 | tail -10
```

- [ ] **Step 5: Run full suite**

```bash
cd /Users/xuli/claudeGame && npx vitest run 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
cd /Users/xuli/claudeGame && git add src/pages/ChapterEnd/ChapterEnd.tsx && git commit -m "feat: add per-chapter closing caption and auto-save reminder to ChapterEnd"
```

---

## Self-Review

**Spec coverage check:**
1. ✅ Ch2 revisitEvents — Tasks 1 (3 rooms)
2. ✅ Ch3 revisitEvents — Task 2 (4 rooms)
3. ✅ Hint engine chapter transition — Task 3 (intro rules + nav fix)
4. ✅ npc_temple_novice expansion — Task 4 (3 dialogues)
5. ✅ SVG label overflow — Task 5 (clipPath)
6. ✅ handleSelectItem useCallback — Task 6
7. ✅ Interrogation keyboard nav — Task 7
8. ✅ Locked action visual — Task 8
9. ✅ ARIA landmarks — Task 9
10. ✅ Chapter end polish — Task 10

**Placeholder scan:** None found.

**Type consistency:**
- `revisitEvents` uses `requires.flags` (array) — matches conditionEvaluator `evaluate()` signature ✅
- `useCallback` deps array in Task 6 includes all referenced state ✅
- `interrogationFocusIdx` used in both effect and render ✅
- `CHAPTER_CLOSE_CAPTIONS` uses string keys `'1'/'2'/'3'` ✅
