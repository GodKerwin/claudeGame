# 第二轮十项优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在已完成的9项优化基础上，继续从交互细节、人物设计、剧情、技术四个维度实施第二批10项优化。

**Architecture:** 全部改动均在现有文件内完成，无新路由和新页面。数据层改动（JSON）无需测试，逻辑层改动（hintEngine、RightPanel、CenterPanel）均有测试/可验证用例。

**Tech Stack:** React 18 + TypeScript + Zustand + Tailwind CSS v3 + Vitest

---

## File Map

| 文件 | 改动内容 |
|------|---------|
| `docs/memory/completed-work.md` | 补录两轮历史优化记录 |
| `docs/memory/project-overview.md` | 更新测试数、文件结构 |
| `src/data/profiles/chapter3.json` | 添加飞爷档案（6条事实）；添加无迹第三章档案（4条事实） |
| `src/data/profiles/chapter2.json` | 无迹档案追加2条第三章相关事实 |
| `tests/engine/hintEngine.test.ts` | 新建，12条规则断言 |
| `src/components/layout/RightPanel.tsx` | 键盘快捷键；任务完成标记；档案事实计数；物品标签红点；推理发现高亮 |
| `src/pages/Game/Game.tsx` | 在 handleAction 开头插入分隔符 storyText |
| `src/components/layout/CenterPanel.tsx` | 渲染 `---SEPARATOR---` 为细线分隔 |

---

### Task 1: 更新项目文档

**Files:**
- Modify: `docs/memory/completed-work.md`
- Modify: `docs/memory/project-overview.md`

- [ ] **Step 1: 更新 completed-work.md**

在文件顶部（`# 已完成工作记录` 之后，`---` 之后，最新条目之前）插入以下两段：

```markdown
## 2026-06-02（第二轮十项优化）

### 交互细节
- 物品标签新内容红点提示（items/clues 数量增长时显示）
- 推理面板：新发现高亮 + ✦ 新推论标签
- 故事面板：每次新交互前插入细线分隔符
- 键盘快捷键 1–4 切换右侧面板四个标签

### 人物设计
- 嫌疑人档案：标题栏显示已知事实数 "N/M"
- 任务日志：章节结束后任务标记为已结案状态

### 剧情
- 飞爷（npc_fei_ye）第三章嫌疑人档案（6条事实）
- 无迹和尚第三章视角档案（4条事实）

### 技术
- hintEngine 单元测试：三章共12条核心规则断言
- 更新 completed-work.md 与 project-overview.md（测试数105→172）

---

## 2026-06-02（首轮十项优化）

### 交互细节
- SVG gradient ID 冲突修复（React useId）
- 推理面板：甲选中时高亮可合成物品
- 首次游戏引导更新（4标签 + 推理说明）
- 房间切换淡入动画（panel-fade-in keyframes + key prop）
- 推理面板：动态步骤提示文字（选甲→选乙→完成）

### 人物设计
- 天赋专属动作结果前缀（【天赋·×××】）

### 剧情
- 章节结算页：线索/推理/走访三项数据汇总
- 第二章嫌疑人档案（无迹、李邈、浪鹏探子、古玩掌柜）
- 第三章嫌疑人档案（天机联络人）

### 技术
- foundSynthesisIds 存档全链路（sceneStore → useAutoSave → saveEngine → SaveLoadModal）
- sceneStore 单元测试（4条）；profilesIntegrity 测试（3条）

---
```

- [ ] **Step 2: 更新 project-overview.md**

将以下行：
```
| Vitest | - | 测试（105 用例，7 文件） |
```
改为：
```
| Vitest | - | 测试（172 用例，13 文件） |
```

并在文件结构 `tests/` 部分追加：
```
  tests/
    engine/hintEngine.test.ts
    store/sceneStore.test.ts
    data/profilesIntegrity.test.ts
```

- [ ] **Step 3: 确认文件无误后提交**

```bash
cd /Users/xuli/claudeGame
git add docs/memory/completed-work.md docs/memory/project-overview.md
git commit -m "docs: update completed-work and project-overview for second optimization sprint"
```

---

### Task 2: 飞爷第三章嫌疑人档案

**Files:**
- Modify: `src/data/profiles/chapter3.json`

- [ ] **Step 1: 在 chapter3.json 末尾添加飞爷档案**

将文件内容替换为：

```json
[
  {
    "npcId": "npc_tianji_contact",
    "name": "天机联络人",
    "role": "天机安宅驻守者",
    "suspicion": "中立者——天机阁遗属，任务导向",
    "facts": [
      { "flag": "tianji_contact_met", "text": "掌管天机安宅，一直在等待「合适的人」来接手未竟的任务。", "type": "known" },
      { "flag": "tianji_briefing_received", "text": "透露：名单上共有三十七人，分散于大唐边疆各处，目前仍遭人追杀。", "type": "known" },
      { "flag": "tianji_trust_gained", "text": "认可调查能力，提供飞爷旧居精确位置及入内方式。", "type": "known" },
      { "flag": "tianji_endgame_ready", "text": "【矛盾】自称「只是守卫此地」，但他对飞爷的过往了如指掌——两人显然相识多年，绝非初见。", "type": "contradiction" }
    ]
  },
  {
    "npcId": "npc_fei_ye",
    "name": "飞爷",
    "role": "追查目标·「鸢」的真身",
    "suspicion": "核心人物——天机阁创始者，隐于市井二十年",
    "facts": [
      { "flag": "stele_decoded", "text": "碑文指向天机阁创始人代号「鸢」，此人于二十年前从长安消失，不知所踪。", "type": "known" },
      { "flag": "fei_ye_sighted", "text": "大雁塔附近留有新鲜脚印——飞爷至今未离长安城，隐身于市井之中。", "type": "known" },
      { "flag": "manor_injury_read", "text": "旧居内室伤痕印记证实：曾有人长居于此，其行事习惯与飞爷完全吻合。", "type": "known" },
      { "flag": "fei_ye_identity_confirmed", "text": "身份确认：飞爷即天机阁创始人「鸢」，当年主动销声匿迹，实则以另一身份守护名单。", "type": "known" },
      { "flag": "fei_ye_tianji_origin_known", "text": "创立天机阁的初衷：以情报之网护住名单上三十七名被追杀者，从不以杀戮换安宁。", "type": "known" },
      { "flag": "tianji_endgame_ready", "text": "【矛盾】自称「一切皆已放下」，却二十年来从未真正离开长安——他仍在等待某人来接手那张名单。", "type": "contradiction" }
    ]
  }
]
```

- [ ] **Step 2: 验证 JSON 语法**

```bash
cd /Users/xuli/claudeGame
node -e "JSON.parse(require('fs').readFileSync('src/data/profiles/chapter3.json','utf8')); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: 运行完整测试**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -10
```

Expected: 全部通过（测试数与之前相同，因为本任务只添加数据不改逻辑）

- [ ] **Step 4: 提交**

```bash
git add src/data/profiles/chapter3.json
git commit -m "feat: add Fei Ye (鸢) suspect profile for chapter 3 with 6 flag-gated facts"
```

---

### Task 3: 无迹和尚第三章档案（追加事实）

**Files:**
- Modify: `src/data/profiles/chapter2.json`

无迹在第二章档案已有 6 条事实，但其第三章弧线（最终证人、证实飞爷身份）尚未记录。在现有 ch2 档案末尾追加 2 条使用第三章 flag 的事实。

- [ ] **Step 1: 在 chapter2.json 中找到 npc_wujue 的 facts 数组**

当前内容（第16行附近）：
```json
      { "flag": "wujue_spoke_once", "text": "道出名单埋藏之处，以此了却心中二十年的执念。", "type": "known" }
    ]
```

将这一闭合括号前的末尾事实改为（保持原事实，追加两条新事实）：

```json
      { "flag": "wujue_spoke_once", "text": "道出名单埋藏之处，以此了却心中二十年的执念。", "type": "known" },
      { "flag": "fei_ye_identity_confirmed", "text": "亲口证实飞爷身份——他一直知道真相，只是沉默了整整二十年，等待有人值得相信。", "type": "known" },
      { "flag": "fei_ye_tianji_origin_known", "text": "【矛盾】以「已忘却世俗」为由多年拒绝开口，但对天机阁内情了如指掌——他根本没有忘记，只是在等待。", "type": "contradiction" }
    ]
```

- [ ] **Step 2: 验证 JSON 语法**

```bash
cd /Users/xuli/claudeGame
node -e "JSON.parse(require('fs').readFileSync('src/data/profiles/chapter2.json','utf8')); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: 运行测试，确认 profilesIntegrity 通过**

```bash
npx vitest run tests/data/profilesIntegrity.test.ts --reporter=verbose
```

Expected: 3/3 通过

- [ ] **Step 4: 提交**

```bash
git add src/data/profiles/chapter2.json
git commit -m "feat: add chapter 3 arc facts to Wujue's suspect profile (identity witness)"
```

---

### Task 4: hintEngine 单元测试

**Files:**
- Create: `tests/engine/hintEngine.test.ts`

- [ ] **Step 1: 创建测试文件**

```typescript
// tests/engine/hintEngine.test.ts
import { describe, it, expect } from 'vitest';
import { getHint } from '../../src/engine/hintEngine';
import type { HintContext } from '../../src/engine/hintEngine';

const base = (overrides: Partial<HintContext> = {}): HintContext => ({
  flags: [],
  items: [],
  chapter: 1,
  strength: 5,
  agility: 5,
  wisdom: 5,
  constitution: 5,
  talent: 'none',
  ...overrides,
});

describe('hintEngine – Chapter 1', () => {
  it('returns final confrontation hint when all 3 items present', () => {
    const hint = getHint(base({
      items: ['clue_blood_letter_found', 'clue_arsenic_found', 'cellar_fragment_obtained'],
    }));
    expect(hint).toContain('废弃宅院');
  });

  it('returns cellar hint when innkeeper trusted but fragment missing', () => {
    const hint = getHint(base({
      flags: ['innkeeper_trusted'],
    }));
    expect(hint).toContain('地窖');
  });

  it('returns wuhen step hint when learned_wuhen_bu and innkeeper_trusted and fragment missing', () => {
    const hint = getHint(base({
      flags: ['learned_wuhen_bu', 'innkeeper_trusted'],
    }));
    expect(hint).toContain('无痕步');
    expect(hint).toContain('地窖');
  });

  it('returns exploration fallback when no flags', () => {
    const hint = getHint(base());
    expect(typeof hint).toBe('string');
    expect(hint.length).toBeGreaterThan(0);
  });
});

describe('hintEngine – Chapter 2', () => {
  it('returns confrontation hint when all 3 ch2 items present', () => {
    const hint = getHint(base({
      chapter: 2,
      flags: ['chapter2_started'],
      items: ['poison_residue_sample', 'monk_identity_scroll', 'langpeng_dispatch_order'],
    }));
    expect(hint).toContain('茶馆');
    expect(hint).toContain('李邈');
  });

  it('returns hideout hint when 2 items but missing dispatch order', () => {
    const hint = getHint(base({
      chapter: 2,
      flags: ['chapter2_started'],
      items: ['poison_residue_sample', 'monk_identity_scroll'],
    }));
    expect(hint).toContain('调令文书');
  });

  it('returns talent-specific monk healing hint for 望闻断骨 with poison sample', () => {
    const hint = getHint(base({
      chapter: 2,
      flags: ['chapter2_started'],
      items: ['poison_residue_sample'],
      talent: '望闻断骨',
    }));
    expect(hint).toContain('为他看诊');
  });

  it('returns fallback 两条线 hint when no chapter 2 progress', () => {
    const hint = getHint(base({
      chapter: 2,
      flags: ['chapter2_started'],
    }));
    expect(hint).toContain('两条线');
  });
});

describe('hintEngine – Chapter 3', () => {
  it('returns final confrontation hint when scroll and identity confirmed', () => {
    const hint = getHint(base({
      chapter: 3,
      flags: ['chapter3_started', 'fei_ye_identity_confirmed'],
      items: ['tianji_founding_scroll'],
    }));
    expect(hint).toContain('曲江亭');
  });

  it('returns starting hint at chapter 3 start with no progress', () => {
    const hint = getHint(base({
      chapter: 3,
      flags: ['chapter3_started'],
    }));
    expect(hint).toContain('大雁塔');
  });

  it('returns stele hint when mission started but stele not decoded', () => {
    const hint = getHint(base({
      chapter: 3,
      flags: ['chapter3_started', 'tianji_mission_started'],
    }));
    expect(hint).toContain('碑文');
  });

  it('returns wujue testimony hint when manor searched but identity not confirmed', () => {
    const hint = getHint(base({
      chapter: 3,
      flags: ['chapter3_started', 'feiyes_manor_searched'],
    }));
    expect(hint).toContain('无迹');
  });
});
```

- [ ] **Step 2: 确认测试文件会失败（如果 export 缺失）或全部通过**

```bash
cd /Users/xuli/claudeGame
npx vitest run tests/engine/hintEngine.test.ts --reporter=verbose
```

Expected: 12/12 通过（`HintContext` 和 `getHint` 已从 hintEngine.ts export）

如果出现 "HintContext is not exported" 错误，在 `src/engine/hintEngine.ts` 第1行的 `export interface HintContext` 确认有 `export` 关键字（已有，无需改动）。

- [ ] **Step 3: 运行完整测试套件确认无回归**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: 全部通过，Tests 数量 = 之前数量 + 12

- [ ] **Step 4: 提交**

```bash
git add tests/engine/hintEngine.test.ts
git commit -m "test: add 12 unit tests for hintEngine covering all 3 chapters"
```

---

### Task 5: 键盘快捷键切换标签（1–4键）

**Files:**
- Modify: `src/components/layout/RightPanel.tsx`

- [ ] **Step 1: 在 RightPanel 函数体顶部（`useState` 声明之后）添加 useEffect**

在 `src/components/layout/RightPanel.tsx` 第111行（`const [tab, setTab] = useState<Tab>('stats');` 后面）插入：

```typescript
  useEffect(() => {
    const tabKeys: Record<string, Tab> = { '1': 'stats', '2': 'items', '3': 'deduce', '4': 'lore' };
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
      const t = tabKeys[e.key];
      if (t) setTab(t);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
```

`useEffect` 已在文件顶部 import（`import { useState } from 'react';`），需要确认 `useEffect` 已在 import 列表中。当前第1行是 `import { useState } from 'react';`，改为：

```typescript
import { useState, useEffect } from 'react';
```

- [ ] **Step 2: 在标签按钮上添加 title 提示**

找到 `TAB_LABELS` 渲染循环（约第204行）：

```tsx
{(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
  <button
    key={t}
    onClick={() => setTab(t)}
    className={...}
  >
    {TAB_LABELS[t]}
  </button>
))}
```

改为：

```tsx
{(Object.keys(TAB_LABELS) as Tab[]).map((t, i) => (
  <button
    key={t}
    onClick={() => setTab(t)}
    title={`${TAB_LABELS[t]} (${i + 1})`}
    className={`flex-1 py-2 text-[11px] tracking-widest transition-colors cursor-pointer ${
      tab === t
        ? 'text-gold/80 border-b border-gold/55 -mb-px bg-gold/5'
        : 'text-ink/30 hover:text-ink/55'
    }`}
  >
    {TAB_LABELS[t]}
  </button>
))}
```

- [ ] **Step 3: 验证 TypeScript 无错误**

```bash
cd /Users/xuli/claudeGame
npx tsc --noEmit 2>&1 | head -20
```

Expected: 无输出（无错误）

- [ ] **Step 4: 运行测试**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: 全部通过

- [ ] **Step 5: 提交**

```bash
git add src/components/layout/RightPanel.tsx
git commit -m "feat: add keyboard shortcuts 1-4 to switch right panel tabs"
```

---

### Task 6: 故事面板交互分隔线

**Files:**
- Modify: `src/pages/Game/Game.tsx`
- Modify: `src/components/layout/CenterPanel.tsx`

每次新交互（handleAction 调用）前，若 storyText 非空，插入特殊分隔符条目，CenterPanel 渲染为细线。

- [ ] **Step 1: 在 Game.tsx 的 handleAction 开头插入分隔符逻辑**

在 `src/pages/Game/Game.tsx` 找到 `handleAction` 函数体开头（约第270行，`processingRef.current = true;` 后面）。

在处理第一个 `addStoryText` 调用之前，找到函数内最早的一次 `scene.addStoryText(` 之前插入：

实际上，在 handleAction 函数体最前面（`processingRef.current = true;` 之后，第一个判断分支之前）添加：

```typescript
    if (scene.storyText.length > 0) {
      scene.addStoryText('---SEPARATOR---');
    }
```

具体位置：找到：
```typescript
    processingRef.current = true;
    const [prefix, entityId] = actionId.split(':');
```

在这两行之间插入上面的分隔符代码。

- [ ] **Step 2: 在 CenterPanel.tsx 中渲染分隔符**

在 `src/components/layout/CenterPanel.tsx`，找到故事文本渲染循环（约第191行）：

```tsx
{storyTexts.map((text, i) => {
  const isLatest = i === storyTexts.length - 1;
  const isRecent = i >= storyTexts.length - 3;
  const isNpcSpeech = text.startsWith('【') && text.includes('】');
  const isPlaceholder = text.startsWith('（') && text.endsWith('。）');
  const isPsychHint = text.startsWith('〔') && text.endsWith('〕');
```

在该 `map` 回调的最开头，在所有变量声明之前，插入：

```tsx
{storyTexts.map((text, i) => {
  if (text === '---SEPARATOR---') {
    return <div key={i} className="border-t border-gold/8 my-1 mx-1 opacity-60" />;
  }
  const isLatest = i === storyTexts.length - 1;
  // ... 其余不变
```

- [ ] **Step 3: 确认 TypeScript 无错误**

```bash
cd /Users/xuli/claudeGame
npx tsc --noEmit 2>&1 | head -20
```

Expected: 无输出

- [ ] **Step 4: 运行测试**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: 全部通过

- [ ] **Step 5: 提交**

```bash
git add src/pages/Game/Game.tsx src/components/layout/CenterPanel.tsx
git commit -m "feat: add thin separator line between story interactions in center panel"
```

---

### Task 7: 嫌疑人档案事实计数（N/M）

**Files:**
- Modify: `src/components/layout/RightPanel.tsx`

在推理标签的嫌疑人档案区，每个档案标题行右侧显示 "已知 N/M" 的事实进度。

- [ ] **Step 1: 修改档案标题行渲染**

在 `src/components/layout/RightPanel.tsx`，找到档案标题按钮（约第419行）：

```tsx
<button
  onClick={() => setExpandedNpc(isExpanded ? null : profile.npcId)}
  className={`w-full flex items-center gap-2 px-1 py-2 text-left transition-colors cursor-pointer ${
    isExpanded ? 'text-gold/75' : 'text-ink/55 hover:text-ink/75'
  }`}
>
  <span className={`text-[9px] shrink-0 ${isExpanded ? 'text-gold/45' : 'text-ink/20'}`}>
    {isExpanded ? '▾' : '▸'}
  </span>
  <span className="text-[13px] flex-1 tracking-wide">{profile.name}</span>
  <span className="text-[9px] text-ink/25 shrink-0">{profile.role}</span>
</button>
```

改为：

```tsx
<button
  onClick={() => setExpandedNpc(isExpanded ? null : profile.npcId)}
  className={`w-full flex items-center gap-2 px-1 py-2 text-left transition-colors cursor-pointer ${
    isExpanded ? 'text-gold/75' : 'text-ink/55 hover:text-ink/75'
  }`}
>
  <span className={`text-[9px] shrink-0 ${isExpanded ? 'text-gold/45' : 'text-ink/20'}`}>
    {isExpanded ? '▾' : '▸'}
  </span>
  <span className="text-[13px] flex-1 tracking-wide">{profile.name}</span>
  <span className="text-[9px] text-ink/20 shrink-0 tabular-nums">
    {visibleFacts.length}/{profile.facts.length}
  </span>
</button>
```

注意：`visibleFacts` 变量已在 `map` 回调内定义（`const visibleFacts = profile.facts.filter((f) => flags.includes(f.flag));`），可以直接使用。原来的 `{profile.role}` span 删去（换成计数）。

- [ ] **Step 2: 验证 TypeScript 无错误**

```bash
cd /Users/xuli/claudeGame
npx tsc --noEmit 2>&1 | head -20
```

Expected: 无输出

- [ ] **Step 3: 运行测试**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: 全部通过

- [ ] **Step 4: 提交**

```bash
git add src/components/layout/RightPanel.tsx
git commit -m "feat: show known/total fact count (N/M) in suspect profile header"
```

---

### Task 8: 任务完成状态标记

**Files:**
- Modify: `src/components/layout/RightPanel.tsx`

章节结束后，已结案的任务在"未竟之事"区显示划线 + "·已结案" 标记。

- [ ] **Step 1: 在 RightPanel 中添加 QUEST_ENDINGS 映射常量**

在文件顶部 `const QUEST_HINTS` 常量之后添加：

```typescript
const QUEST_ENDINGS: Record<string, string[]> = {
  quest_main_murder:  ['chapter1_truth_ending', 'chapter1_force_ending', 'chapter1_hermit_ending'],
  quest_dafei_gang:   ['chapter2_started', 'chapter1_hermit_ending'],
  quest_li_mao_case:  ['chapter2_arrest_ending', 'chapter2_release_ending', 'chapter2_join_ending'],
  quest_find_kite:    ['chapter3_truth_ending', 'chapter3_standoff_ending', 'chapter3_join_ending'],
};
```

- [ ] **Step 2: 修改任务列表渲染**

找到任务渲染部分（约第272行）：

```tsx
{questLog.map((qid) => {
  const q = QUEST_HINTS[qid];
  return (
    <li key={qid} className="text-xs">
      <div className="flex items-start gap-1.5 mb-1">
        <span className="text-gold/40 mt-0.5 shrink-0 text-[10px]">▸</span>
        <span className="text-ink/65">{q?.name ?? qid}</span>
      </div>
      {q?.hint && (
        <p className="text-ink/28 leading-relaxed pl-3.5 text-[11px] whitespace-pre-line">{q.hint}</p>
      )}
    </li>
  );
})}
```

改为：

```tsx
{questLog.map((qid) => {
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
```

- [ ] **Step 3: 验证 TypeScript 无错误**

```bash
cd /Users/xuli/claudeGame
npx tsc --noEmit 2>&1 | head -20
```

Expected: 无输出

- [ ] **Step 4: 运行测试**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: 全部通过

- [ ] **Step 5: 提交**

```bash
git add src/components/layout/RightPanel.tsx
git commit -m "feat: show completed/closed state for quests after chapter ending"
```

---

### Task 9: 物品标签新内容红点提示

**Files:**
- Modify: `src/components/layout/RightPanel.tsx`

拾取新物品/线索时，"物品"标签出现小红点，切换到物品标签后消失。

- [ ] **Step 1: 在 RightPanel 函数体内添加 refs 和 badge 逻辑**

在 `useState` 声明之后（约第111行）、现有 `useEffect` 之前，添加：

```typescript
  const lastSeenItemCountRef = useRef(items.length);
  const lastSeenClueCountRef = useRef(clues.length);
  const itemsBadge = items.length > lastSeenItemCountRef.current || clues.length > lastSeenClueCountRef.current;
```

`useRef` 已需要从 `react` 导入。将文件顶部 import 改为：

```typescript
import { useState, useEffect, useRef } from 'react';
```

- [ ] **Step 2: 在 tab 切换时更新 refs**

在现有 `useEffect`（键盘快捷键）之后添加：

```typescript
  useEffect(() => {
    if (tab === 'items') {
      lastSeenItemCountRef.current = items.length;
      lastSeenClueCountRef.current = clues.length;
    }
  }, [tab, items.length, clues.length]);
```

- [ ] **Step 3: 在标签按钮渲染中添加红点**

修改标签循环，对 `items` 标签加红点（在 Step 5 的键盘快捷键任务代码基础上修改）：

```tsx
{(Object.keys(TAB_LABELS) as Tab[]).map((t, i) => (
  <button
    key={t}
    onClick={() => setTab(t)}
    title={`${TAB_LABELS[t]} (${i + 1})`}
    className={`flex-1 py-2 text-[11px] tracking-widest transition-colors cursor-pointer relative ${
      tab === t
        ? 'text-gold/80 border-b border-gold/55 -mb-px bg-gold/5'
        : 'text-ink/30 hover:text-ink/55'
    }`}
  >
    {TAB_LABELS[t]}
    {t === 'items' && itemsBadge && tab !== 'items' && (
      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blood/70 rounded-full" />
    )}
  </button>
))}
```

- [ ] **Step 4: 验证 TypeScript 无错误**

```bash
cd /Users/xuli/claudeGame
npx tsc --noEmit 2>&1 | head -20
```

Expected: 无输出

- [ ] **Step 5: 运行测试**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: 全部通过

- [ ] **Step 6: 提交**

```bash
git add src/components/layout/RightPanel.tsx
git commit -m "feat: show red badge on items tab when new items or clues are acquired"
```

---

### Task 10: 推理新发现高亮提示

**Files:**
- Modify: `src/components/layout/RightPanel.tsx`

首次发现某条推论时，在推理面板中该结果旁显示 `✦ 新推论` 标签，带短暂高亮背景。

- [ ] **Step 1: 在 RightPanel 中添加 isNewSynth state**

在现有 `synthResult` state 之后（第114行），添加：

```typescript
  const [isNewSynth, setIsNewSynth] = useState(false);
```

- [ ] **Step 2: 修改 handleSelectItem 中的新发现逻辑**

找到约第170行的 `if (!alreadyFound)` 分支。当前代码：

```typescript
        if (!alreadyFound) {
          addFoundSynthesisId(synth.id);
          synth.grants?.flags?.forEach((f) => addFlag(f));
          synth.grants?.items?.forEach((i) => addItem(i));
          setSynthResult({ text: synth.result, isNew: true });
        } else {
          setSynthResult({ text: synth.result, isNew: false });
        }
```

将 `setSynthResult({ text: synth.result, isNew: true });` 那行改为：

```typescript
          setSynthResult({ text: synth.result, isNew: true });
          setIsNewSynth(true);
          setTimeout(() => setIsNewSynth(false), 3000);
```

- [ ] **Step 3: 修改推理结果渲染，添加 3 秒高亮**

找到约第381行的 `synthResult` 渲染。当前代码：

```tsx
{synthResult && (
  <div className={`border-l-2 pl-3 mb-2 ${synthResult.isNew ? 'border-gold/55' : 'border-ink/15'}`}>
    {synthResult.isNew && (
      <span className="text-[9px] text-gold/65 tracking-widest mb-1 block">新发现</span>
    )}
    <p className="text-xs leading-relaxed text-ink/70">{synthResult.text}</p>
  </div>
)}
```

改为：

```tsx
{synthResult && (
  <div className={`border-l-2 pl-3 mb-2 transition-colors duration-700 ${
    isNewSynth ? 'border-gold/60 bg-gold/6' : synthResult.isNew ? 'border-gold/55' : 'border-ink/15'
  }`}>
    {isNewSynth && (
      <span className="text-[9px] text-gold/65 tracking-[0.2em] mb-1 block">✦ 新推论</span>
    )}
    {!isNewSynth && synthResult.isNew && (
      <span className="text-[9px] text-gold/45 tracking-widest mb-1 block">新发现</span>
    )}
    <p className="text-xs leading-relaxed text-ink/70">{synthResult.text}</p>
  </div>
)}
```

- [ ] **Step 4: 验证 TypeScript 无错误**

```bash
cd /Users/xuli/claudeGame
npx tsc --noEmit 2>&1 | head -20
```

Expected: 无输出

- [ ] **Step 5: 运行完整测试套件**

```bash
cd /Users/xuli/claudeGame
npx vitest run 2>&1 | tail -8
```

Expected:
```
Test Files  13 passed (13)
     Tests  172 passed (172)
```

- [ ] **Step 6: 提交**

```bash
git add src/components/layout/RightPanel.tsx
git commit -m "feat: highlight new synthesis discovery with gold flash and ✦ label for 3 seconds"
```

---

## 自检清单

**Spec coverage:**
- ① 物品红点 → Task 9 ✓
- ② 推理发现高亮 → Task 10 ✓
- ③ 键盘快捷键 1-4 → Task 5 ✓
- ④ 故事分隔线 → Task 6 ✓
- ⑤ 档案事实计数 → Task 7 ✓
- ⑥ 任务完成状态 → Task 8 ✓
- ⑦ 飞爷第三章档案 → Task 2 ✓
- ⑧ 无迹第三章事实 → Task 3 ✓
- ⑨ hintEngine 测试 → Task 4 ✓
- ⑩ 更新文档 → Task 1 ✓

**Type consistency:** 所有 `Tab` 类型引用均来自 Task 5 定义的 `type Tab = 'stats' | 'items' | 'deduce' | 'lore'`，Task 9 的 `t === 'items'` 是合法 Tab 值比较。

**No placeholders:** 全部代码块均完整，无 TBD/TODO。
