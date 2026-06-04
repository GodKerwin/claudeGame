# 三层推理裁定系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在三章结局前加入三层推理验证：合成补强（Layer 1）、推理裁定问答（Layer 2）、关键证据出示（Layer 3），让合成系统有意义，并给玩家主动推理的仪式感。

**Architecture:** Layer 1 纯数据改动；Layer 2 新增 `verdicts/chapter{n}.json` + `PendingVerdict` state + CenterPanel 新面板；Layer 3 在 `EventAction` 上加 `evidenceGate` 字段，拦截后复用现有 `pendingInterrogation` UI。

**Tech Stack:** React 19 + TypeScript + Zustand；不引入新依赖。

---

## 文件清单

| 操作 | 文件 |
|---|---|
| 修改 | `src/types/game.ts` |
| 新建 | `src/data/verdicts/chapter1.json` |
| 新建 | `src/data/verdicts/chapter2.json` |
| 新建 | `src/data/verdicts/chapter3.json` |
| 修改 | `src/data/loader.ts` |
| 修改 | `src/data/events/chapter1.json` |
| 修改 | `src/data/events/chapter2.json` |
| 修改 | `src/data/events/chapter3.json` |
| 修改 | `src/pages/Game/Game.tsx` |
| 修改 | `src/components/layout/CenterPanel.tsx` |

---

## Task 1：类型定义

**Files:** Modify `src/types/game.ts`

- [ ] **Step 1.1：在 EventAction 上追加 evidenceGate 字段，并新增三个类型**

在 `export interface EventAction {` 之前插入：

```typescript
export interface EvidenceGate {
  prompt: string;
  accepts: string[];
  failText: string;
}

export interface VerdictOption {
  id: string;
  text: string;
}

export interface VerdictQuestion {
  id: string;
  text: string;
  options: VerdictOption[];
  correctId: string;
}

export interface ChapterVerdict {
  chapterId: number;
  eventId: string;
  grantFlag: string;
  failText: string;
  questions: VerdictQuestion[];
}
```

将 `export interface EventAction` 改为：

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

- [ ] **Step 1.2：TypeScript 编译验证**

```
npx tsc --noEmit
```

期望：0 errors

- [ ] **Step 1.3：Commit**

```
git add src/types/game.ts
git commit -m "feat: add EvidenceGate/VerdictQuestion/ChapterVerdict types; EventAction.evidenceGate"
```

---

## Task 2：Layer 1 — 合成补强（数据）

**Files:** Modify `src/data/events/chapter1.json`, `chapter2.json`, `chapter3.json`

- [ ] **Step 2.1：chapter1.json — force_ending 和 hermit_ending 追加合成前置**

找到 `"id": "force_ending"`，将其 `requires` 从：
```json
"requires": { "strength": 7 }
```
改为：
```json
"requires": { "strength": 7, "flags": ["synth_double_kill"] }
```

找到 `"id": "hermit_ending"`，将其 `requires` 从：
```json
"requires": { "flags": ["white_stranger_trust", "learned_wuhen_bu"] }
```
改为：
```json
"requires": { "flags": ["white_stranger_trust", "learned_wuhen_bu", "synth_double_kill"] }
```

- [ ] **Step 2.2：chapter2.json — release_ending 和 join_ending 追加合成前置**

找到 `"id": "release_ending"`，将其 `requires` 从：
```json
"requires": { "flags": ["langpeng_trail"], "has": ["langpeng_dispatch_order"] }
```
改为：
```json
"requires": { "flags": ["langpeng_trail", "synth_ch2_li_mao_commands_langpeng"], "has": ["langpeng_dispatch_order"] }
```

找到 `"id": "join_ending"`，将其 `requires` 从：
```json
"requires": { "flags": ["tianji_recruit_offered"] }
```
改为：
```json
"requires": { "flags": ["tianji_recruit_offered", "synth_ch2_li_mao_commands_langpeng"] }
```

- [ ] **Step 2.3：chapter3.json — standoff_ending 和 join_forces 追加合成前置**

找到 `"id": "demand_answers"`，将其 `requires` 从：
```json
"requires": { "flags": ["fei_ye_identity_confirmed"] }
```
改为：
```json
"requires": { "flags": ["fei_ye_identity_confirmed", "synth_ch3_fei_ye_confirmed"] }
```

找到 `"id": "join_forces"`，将其 `requires` 从：
```json
"requires": { "flags": ["chapter2_join_ending", "tianji_trust_gained"] }
```
改为：
```json
"requires": { "flags": ["chapter2_join_ending", "tianji_trust_gained", "synth_ch3_fei_ye_confirmed"] }
```

- [ ] **Step 2.4：运行测试**

```
npx vitest run
```

期望：228 tests passed

- [ ] **Step 2.5：Commit**

```
git add src/data/events/chapter1.json src/data/events/chapter2.json src/data/events/chapter3.json
git commit -m "data: Layer1 synth gate — non-truth endings now require core deduction flag"
```

---

## Task 3：Verdict 数据文件

**Files:** Create `src/data/verdicts/chapter1.json`, `chapter2.json`, `chapter3.json`

- [ ] **Step 3.1：创建 chapter1.json**

```json
{
  "chapterId": 1,
  "eventId": "evt_final_confrontation",
  "grantFlag": "deduction_verified_ch1",
  "failText": "〔你心中还有疑点未解。在开口之前，先把线索再理一遍。〕",
  "questions": [
    {
      "id": "q_murder_method",
      "text": "宋怀义遇害的方式是？",
      "options": [
        { "id": "a", "text": "毒茶先致昏，再遭勒毙——双重手法" },
        { "id": "b", "text": "直接被勒死，砒霜只是伪造痕迹" },
        { "id": "c", "text": "砒霜直接毒杀，勒痕是死后伪造" }
      ],
      "correctId": "a"
    },
    {
      "id": "q_motive",
      "text": "凶手的根本作案动机是？",
      "options": [
        { "id": "a", "text": "夺回天机阁名单，灭口知情人" },
        { "id": "b", "text": "劫取宋怀义随身财物" },
        { "id": "c", "text": "私人仇怨，借机报复" }
      ],
      "correctId": "a"
    },
    {
      "id": "q_entry_exit",
      "text": "凶手如何进出案发现场？",
      "options": [
        { "id": "a", "text": "密道入室，翻窗越墙而出" },
        { "id": "b", "text": "从正门进出，趁混乱离开" },
        { "id": "c", "text": "翻窗入室，再从密道离开" }
      ],
      "correctId": "a"
    }
  ]
}
```

- [ ] **Step 3.2：创建 chapter2.json**

```json
{
  "chapterId": 2,
  "eventId": "evt_li_mao_encounter",
  "grantFlag": "deduction_verified_ch2",
  "failText": "〔你的推断还不够完整。回头再整理一遍线索。〕",
  "questions": [
    {
      "id": "q_commander",
      "text": "浪鹏帮在长安行动的幕后指挥是？",
      "options": [
        { "id": "a", "text": "李邈——浪鹏帮是他手中的工具" },
        { "id": "b", "text": "浪鹏帮帮主，与李邈无关" },
        { "id": "c", "text": "无迹和尚，暗中操控全局" }
      ],
      "correctId": "a"
    },
    {
      "id": "q_wujue_role",
      "text": "无迹和尚在此案中的角色是？",
      "options": [
        { "id": "a", "text": "天机阁旧部，毒剂配方来源，被人利用而非主谋" },
        { "id": "b", "text": "主谋之一，主动参与了谋杀" },
        { "id": "c", "text": "与此案无关的普通僧人" }
      ],
      "correctId": "a"
    },
    {
      "id": "q_purpose",
      "text": "宋怀义来长安的真正目的是？",
      "options": [
        { "id": "a", "text": "交接天机阁名单，完成情报传递" },
        { "id": "b", "text": "来长安经商，只是偶然卷入此事" },
        { "id": "c", "text": "向官府自首，出卖天机阁情报" }
      ],
      "correctId": "a"
    }
  ]
}
```

- [ ] **Step 3.3：创建 chapter3.json**

```json
{
  "chapterId": 3,
  "eventId": "evt_fei_ye_confrontation",
  "grantFlag": "deduction_verified_ch3",
  "failText": "〔真相还有一层未曾揭开。再想一想。〕",
  "questions": [
    {
      "id": "q_identity",
      "text": "飞爷的真实身份是？",
      "options": [
        { "id": "a", "text": "天机阁创立者，代号「鸢」" },
        { "id": "b", "text": "廷尉府派来卧底天机阁的密探" },
        { "id": "c", "text": "宋怀义的旧日同僚，寻仇而来" }
      ],
      "correctId": "a"
    },
    {
      "id": "q_threat",
      "text": "真正威胁天机阁遗留成员的势力是？",
      "options": [
        { "id": "a", "text": "廷尉府某一层级，追杀名单上的人" },
        { "id": "b", "text": "李邈的余党，借机扩大势力" },
        { "id": "c", "text": "浪鹏帮，为了夺取名单" }
      ],
      "correctId": "a"
    },
    {
      "id": "q_intent",
      "text": "飞爷为何主动安排了这次相遇？",
      "options": [
        { "id": "a", "text": "需要一个可信任的人来帮他收尾这件旧案" },
        { "id": "b", "text": "想借助官府力量逮捕追杀者" },
        { "id": "c", "text": "准备投降，以换取朝廷豁免" }
      ],
      "correctId": "a"
    }
  ]
}
```

- [ ] **Step 3.4：Commit**

```
git add src/data/verdicts/
git commit -m "data: add verdict questions for ch1/ch2/ch3 (3 questions each)"
```

---

## Task 4：Layer 3 数据 — evidenceGate 字段

**Files:** Modify `src/data/events/chapter1.json`, `chapter2.json`, `chapter3.json`

- [ ] **Step 4.1：chapter1.json — truth_ending 添加 evidenceGate**

找到 `"id": "truth_ending"`，在 `"grants"` 之前插入（与 `"grants"` 同级）：

```json
"evidenceGate": {
  "prompt": "在开口之前，将最能说明此案是蓄意谋杀的物证推到桌上——",
  "accepts": ["arsenic_evidence", "medical_report", "blood_letter"],
  "failText": "〔这件物证还不足以支撑你接下来要说的话。换一件试试。〕"
},
```

- [ ] **Step 4.2：chapter2.json — arrest_ending 添加 evidenceGate**

找到 `"id": "arrest_ending"`，在 `"grants"` 之前插入：

```json
"evidenceGate": {
  "prompt": "「证据确凿」——请出示那份证明李邈亲自下令监视宋怀义的文书。",
  "accepts": ["langpeng_dispatch_order"],
  "failText": "〔这不是最关键的那件证据。你手中还有别的东西。〕"
},
```

- [ ] **Step 4.3：chapter3.json — expose_truth 添加 evidenceGate**

找到 `"id": "expose_truth"`，在 `"grants"` 之前插入：

```json
"evidenceGate": {
  "prompt": "你将哪件物证推到他面前——",
  "accepts": ["tianji_founding_scroll"],
  "failText": "〔他看了看，摇了摇头。「这还不够。你手里还有什么？」〕"
},
```

- [ ] **Step 4.4：运行测试**

```
npx vitest run
```

期望：228 tests passed（evidenceGate 字段不影响现有逻辑）

- [ ] **Step 4.5：Commit**

```
git add src/data/events/chapter1.json src/data/events/chapter2.json src/data/events/chapter3.json
git commit -m "data: add evidenceGate to truth/arrest/expose_truth ending actions"
```

---

## Task 5：Loader — 加载 verdict 数据

**Files:** Modify `src/data/loader.ts`

- [ ] **Step 5.1：导入并导出 verdict 数据**

在 loader.ts 顶部已有 import 区，在最后一个 import 之后追加：

```typescript
import chapter1VerdictRaw from './verdicts/chapter1.json';
import chapter2VerdictRaw from './verdicts/chapter2.json';
import chapter3VerdictRaw from './verdicts/chapter3.json';
```

在文件末尾追加：

```typescript
import type { ChapterVerdict } from '../types/game';

const VERDICTS: ChapterVerdict[] = [
  chapter1VerdictRaw as ChapterVerdict,
  chapter2VerdictRaw as ChapterVerdict,
  chapter3VerdictRaw as ChapterVerdict,
];

export function getVerdict(chapterId: 1 | 2 | 3): ChapterVerdict | undefined {
  return VERDICTS.find((v) => v.chapterId === chapterId);
}
```

- [ ] **Step 5.2：TypeScript 编译验证**

```
npx tsc --noEmit
```

期望：0 errors

- [ ] **Step 5.3：Commit**

```
git add src/data/loader.ts
git commit -m "feat: load verdict data and export getVerdict(chapterId)"
```

---

## Task 6：Game.tsx — 状态与处理函数

**Files:** Modify `src/pages/Game/Game.tsx`

- [ ] **Step 6.1：导入 getVerdict 和新类型**

在 loader.ts import 行找到：
```typescript
import { ... } from '../../data/loader';
```
追加 `getVerdict` 到解构列表。

在 game.ts import 行追加：
```typescript
import type { ChapterVerdict, EvidenceGate } from '../../types/game';
```

- [ ] **Step 6.2：新增两个 interface 和两个 state**

在现有 `interface PendingInterrogation` 之后追加：

```typescript
interface PendingVerdict {
  questions: ChapterVerdict['questions'];
  grantFlag: string;
  failText: string;
}

interface PendingEvidenceGate {
  prompt: string;
  accepts: string[];
  failText: string;
  successText: string;
  grants?: ActionGrant;
}
```

在 `const [pendingInterrogation, setPendingInterrogation]` 之后追加：

```typescript
const [pendingVerdict, setPendingVerdict] = useState<PendingVerdict | null>(null);
const [pendingEvidenceGate, setPendingEvidenceGate] = useState<PendingEvidenceGate | null>(null);
```

- [ ] **Step 6.3：房间切换时清除两个新状态**

在已有的 `setActiveInterrogation(null)` 的 useEffect 里追加：

```typescript
useEffect(() => {
  setActiveInterrogation(null);
  setPendingVerdict(null);
  setPendingEvidenceGate(null);
}, [scene.currentRoomId]);
```

- [ ] **Step 6.4：在 handleAction 事件分支插入 verdict 和 evidenceGate 拦截**

找到：
```typescript
    if (entityId.startsWith('evt_')) {
      const event = getEvent(entityId);
      if (!event) return;
      const action = event.actions.find((a) => a.id === subId);
      if (!action) return;
```

在 `if (!action) return;` 之后、音效判断之前插入：

```typescript
      // Layer 2：推理裁定拦截
      const verdictData = getVerdict(chapter);
      if (verdictData?.eventId === entityId && !scene.flags.includes(verdictData.grantFlag)) {
        audioEngine.playSFX('click');
        setPendingVerdict({
          questions: verdictData.questions,
          grantFlag: verdictData.grantFlag,
          failText: verdictData.failText,
        });
        return;
      }

      // Layer 3：证据出示门拦截
      if (action.evidenceGate && !pendingEvidenceGate) {
        audioEngine.playSFX('click');
        setPendingEvidenceGate({
          prompt: action.evidenceGate.prompt,
          accepts: action.evidenceGate.accepts,
          failText: action.evidenceGate.failText,
          successText: action.result,
          grants: action.grants,
        });
        return;
      }
```

- [ ] **Step 6.5：添加 handleVerdictPass 函数**

在 `handlePresentEvidence` 函数之后插入：

```typescript
  const handleVerdictPass = useCallback(() => {
    if (!pendingVerdict) return;
    scene.addStoryText('〔你整理好了心中的推断，准备开口。〕');
    scene.addFlag(pendingVerdict.grantFlag);
    audioEngine.playSFX('discover');
    setPendingVerdict(null);
  }, [pendingVerdict, scene]);

  const handleVerdictFail = useCallback(() => {
    if (!pendingVerdict) return;
    scene.addStoryText(pendingVerdict.failText);
    audioEngine.playSFX('click');
  }, [pendingVerdict, scene]);
```

- [ ] **Step 6.6：添加 handleEvidenceGatePresent 函数**

在 `handleVerdictFail` 之后插入：

```typescript
  const handleEvidenceGatePresent = useCallback((itemId: string) => {
    if (!pendingEvidenceGate) return;
    const itemName = getItem(itemId)?.name ?? '此物';
    scene.addStoryText(`你出示了【${itemName}】。`);
    if (pendingEvidenceGate.accepts.includes(itemId)) {
      audioEngine.playSFX('discover');
      scene.addStoryText(pendingEvidenceGate.successText);
      if (pendingEvidenceGate.grants?.clues?.length || pendingEvidenceGate.grants?.items?.length) {
        audioEngine.playSFX('pickup');
      }
      applyGrants(pendingEvidenceGate.grants, scene, addItem, removeItem, player);
      setPendingEvidenceGate(null);
    } else {
      audioEngine.playSFX('click');
      scene.addStoryText(pendingEvidenceGate.failText);
    }
  }, [pendingEvidenceGate, scene, addItem, removeItem, player]);
```

- [ ] **Step 6.7：计算传给 CenterPanel 的 evidenceGateInterrogation**

在 `const currentHint = ...` 之后追加：

```typescript
  const evidenceGateInterrogation = useMemo(() => {
    if (!pendingEvidenceGate) return null;
    const allPlayerIds = [...scene.clues, ...items];
    return {
      npcName: '出示证据',
      prompt: pendingEvidenceGate.prompt,
      allItems: allPlayerIds
        .filter((id) => pendingEvidenceGate.accepts.includes(id))
        .map((id) => {
          const it = getItem(id);
          return it ? { id: it.id, name: it.name, isClue: scene.clues.includes(id) } : null;
        })
        .filter((x): x is { id: string; name: string; isClue: boolean } => x !== null),
      onPresent: handleEvidenceGatePresent,
      onCancel: () => setPendingEvidenceGate(null),
    };
  }, [pendingEvidenceGate, scene.clues, items, handleEvidenceGatePresent]);
```

- [ ] **Step 6.8：向 CenterPanel 传入新 props**

找到 `<CenterPanel` JSX，在现有 props 后追加：

```tsx
pendingVerdict={pendingVerdict ? {
  questions: pendingVerdict.questions,
  onPass: handleVerdictPass,
  onFail: handleVerdictFail,
} : null}
```

同时，将已有的 `pendingInterrogation={pendingInterrogation ? {...} : null}` 改为：

```tsx
pendingInterrogation={pendingEvidenceGate ? evidenceGateInterrogation : (pendingInterrogation ? {
  npcName: pendingInterrogation.npcName,
  prompt: pendingInterrogation.prompt,
  allItems: interrogationAllItems ?? [],
  onPresent: handlePresentEvidence,
  onCancel: () => setPendingInterrogation(null),
} : null)}
```

这样 evidenceGate 优先级高于 pendingInterrogation。

- [ ] **Step 6.9：TypeScript 编译验证**

```
npx tsc --noEmit
```

此步骤会报错（CenterPanel 还未接受 pendingVerdict prop），记录错误继续 Task 7。

---

## Task 7：CenterPanel.tsx — verdict 面板 UI

**Files:** Modify `src/components/layout/CenterPanel.tsx`

- [ ] **Step 7.1：扩展 Props interface**

在 `interrogationItems?` 之后添加：

```typescript
pendingVerdict?: {
  questions: Array<{
    id: string;
    text: string;
    options: Array<{ id: string; text: string }>;
    correctId: string;
  }>;
  onPass: () => void;
  onFail: () => void;
} | null;
```

- [ ] **Step 7.2：在函数参数解构中加入 pendingVerdict**

在 `interrogationItems = [],` 之后添加：

```typescript
pendingVerdict,
```

- [ ] **Step 7.3：添加 verdict 本地状态**

在 `const [evidenceOpen, setEvidenceOpen]` 之后添加：

```typescript
const [verdictAnswers, setVerdictAnswers] = useState<Record<string, string>>({});
const [verdictWrongIds, setVerdictWrongIds] = useState<string[]>([]);
```

- [ ] **Step 7.4：切换裁定题时重置本地状态**

在 `useEffect(() => { setEvidenceOpen(false); }, [...])` 之后添加：

```typescript
useEffect(() => {
  setVerdictAnswers({});
  setVerdictWrongIds([]);
}, [pendingVerdict]);
```

- [ ] **Step 7.5：在操作区插入 verdict 面板（最高优先级）**

在操作区 `div` 内，`{/* ── 深层审讯状态机 ── */}` 之前插入：

```tsx
{/* ── 推理裁定面板 ── */}
{pendingVerdict && (
  <div className="flex flex-col h-full">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-3 h-px bg-gold/30" />
      <p className="text-gold/50 text-[10px] tracking-[0.4em]">推理裁定</p>
      <div className="w-3 h-px bg-gold/30" />
    </div>
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin space-y-4 mb-3">
      {pendingVerdict.questions.map((q) => {
        const isWrong = verdictWrongIds.includes(q.id);
        return (
          <div key={q.id} className={`border-l-2 pl-3 ${isWrong ? 'border-blood/55' : 'border-gold/20'}`}>
            <p className={`text-[12px] mb-1.5 ${isWrong ? 'text-blood/70' : 'text-ink/70'}`}>{q.text}</p>
            <div className="space-y-1">
              {q.options.map((opt) => {
                const selected = verdictAnswers[q.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setVerdictAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                    className={`w-full text-left px-2.5 py-1.5 text-[12px] border transition-colors cursor-pointer ${
                      selected
                        ? 'border-gold/55 text-gold/80 bg-gold/5'
                        : 'border-gold/15 text-ink/50 hover:border-gold/35 hover:text-ink/70'
                    }`}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
    <button
      onClick={() => {
        const wrong = pendingVerdict.questions
          .filter((q) => verdictAnswers[q.id] !== q.correctId)
          .map((q) => q.id);
        if (wrong.length > 0) {
          setVerdictWrongIds(wrong);
          pendingVerdict.onFail();
        } else {
          setVerdictWrongIds([]);
          pendingVerdict.onPass();
        }
      }}
      disabled={pendingVerdict.questions.some((q) => !verdictAnswers[q.id])}
      className="w-full py-2 border border-gold/35 text-gold/65 text-[12px] tracking-widest hover:border-gold/55 hover:text-gold/85 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
    >
      提交推断
    </button>
  </div>
)}
```

- [ ] **Step 7.6：TypeScript 编译验证**

```
npx tsc --noEmit
```

期望：0 errors

- [ ] **Step 7.7：运行全量测试**

```
npx vitest run
```

期望：228 tests passed

- [ ] **Step 7.8：Commit**

```
git add src/types/game.ts src/data/loader.ts src/pages/Game/Game.tsx src/components/layout/CenterPanel.tsx
git commit -m "feat: Layer2+3 verdict panel + evidence gate — deduction gate system complete"
```

---

## Task 8：最终验证 + Push

- [ ] **Step 8.1：Build 验证**

```
npm run build
```

期望：✓ built in Xs，0 errors

- [ ] **Step 8.2：手动验证清单**

游戏内验证（在浏览器中）：

**Layer 1：**
- [ ] 第一章：进入 `evt_final_confrontation`，不触发 `synth_double_kill`，`force_ending` 行动不显示
- [ ] 完成 `synth_double_kill` 后，`force_ending` 显示

**Layer 2：**
- [ ] 第一章：持有 `synth_double_kill` + `synth_tianji_motive` 后，点击最终对质事件任意行动 → 出现推理裁定面板
- [ ] 3题全选正确 → 提交推断成功 → storyText 出现确认文字 → 面板关闭 → 可正常选择结局
- [ ] 有错题 → 提交后错误题目高亮显示为血色，可重选重提交

**Layer 3：**
- [ ] 通过裁定后选择 `truth_ending` → 出现"出示证据"面板（复用 pendingInterrogation UI）
- [ ] 出示正确物证 → 结局文字显示
- [ ] 出示错误物证 → 提示 failText，可继续选择

- [ ] **Step 8.3：Push**

```
git push origin main
```
