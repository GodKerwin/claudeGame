# 深层审讯系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 9 个关键 NPC 引入情绪状态机审讯系统——玩家通过施压/迂回/出示证据推进 NPC 情绪层级（警惕→动摇→招供），失败会降级，成功授予关键 flag。

**Architecture:** 四层改动：① game.ts 新增类型 → ② sceneStore 新增 interrogationLevels 状态 → ③ Game.tsx 拦截关键 NPC 点击，设置 activeInterrogation 状态并处理行动回调 → ④ CenterPanel 渲染审讯面板替换操作区。NPC JSON 并行添加 `interrogation` 字段。

**Tech Stack:** React 19 + TypeScript + Zustand + Vite；不引入新依赖

---

## 文件清单

| 操作 | 文件 |
|------|------|
| 修改 | `src/types/game.ts` |
| 修改 | `src/store/sceneStore.ts` |
| 修改 | `src/pages/Game/Game.tsx` |
| 修改 | `src/components/layout/CenterPanel.tsx` |
| 修改 | `src/data/npcs/chapter1.json` |
| 修改 | `src/data/npcs/chapter2.json` |
| 修改 | `src/data/npcs/chapter3.json` |

---

## Task 1：类型定义

**Files:** Modify `src/types/game.ts`

- [ ] **Step 1.1：在 NPC interface 之前添加两个新类型**

在 `export interface NPC` 之前插入：

```typescript
export interface InterrogationLevelData {
  level: 0 | 1 | 2;
  moodHint: string;
  text: string;
  indirectText?: string;
  pushEvidence?: string[];
  grants?: ActionGrant;
}

export interface NPCInterrogation {
  enabled: boolean;
  triggerFlag?: string;
  levels: InterrogationLevelData[];
}
```

- [ ] **Step 1.2：给 NPC interface 添加可选字段**

将：
```typescript
export interface NPC {
  id: string;
  name: string;
  description: string;
  dialogues: DialogueLine[];
}
```
改为：
```typescript
export interface NPC {
  id: string;
  name: string;
  description: string;
  dialogues: DialogueLine[];
  interrogation?: NPCInterrogation;
}
```

- [ ] **Step 1.3：TypeScript 编译验证**

```bash
npx tsc --noEmit
```
期望：0 errors

- [ ] **Step 1.4：Commit**

```bash
git add src/types/game.ts
git commit -m "feat: add InterrogationLevelData and NPCInterrogation types"
```

---

## Task 2：sceneStore — interrogationLevels 状态

**Files:** Modify `src/store/sceneStore.ts`

- [ ] **Step 2.1：在 SceneState interface 末尾添加字段**

在 `reset: () => void;` 之前插入：
```typescript
interrogationLevels: Record<string, number>;
setInterrogationLevel: (npcId: string, level: number) => void;
```

- [ ] **Step 2.2：在 defaultState 添加初始值**

在 `foundSynthesisIds: [] as string[],` 之后插入：
```typescript
interrogationLevels: {} as Record<string, number>,
```

- [ ] **Step 2.3：在 create 块添加 action**

在 `loadState: (state) => set(state),` 之前插入：
```typescript
setInterrogationLevel: (npcId, level) =>
  set((s) => ({
    interrogationLevels: { ...s.interrogationLevels, [npcId]: level },
  })),
```

- [ ] **Step 2.4：更新 loadState 类型以包含 interrogationLevels**

将 `loadState` 的类型参数从：
```typescript
loadState: (state: Partial<Pick<SceneState,
  'currentRoomId' | 'flags' | 'clues' | 'questLog' | 'storyText' |
  'seenDialogues' | 'visitedRooms' | 'foundSynthesisIds'>>) => void;
```
改为：
```typescript
loadState: (state: Partial<Pick<SceneState,
  'currentRoomId' | 'flags' | 'clues' | 'questLog' | 'storyText' |
  'seenDialogues' | 'visitedRooms' | 'foundSynthesisIds' | 'interrogationLevels'>>) => void;
```

- [ ] **Step 2.5：TypeScript 编译验证**

```bash
npx tsc --noEmit
```
期望：0 errors

- [ ] **Step 2.6：Commit**

```bash
git add src/store/sceneStore.ts
git commit -m "feat: add interrogationLevels state to sceneStore"
```

---

## Task 3：Game.tsx — 审讯状态与行动处理

**Files:** Modify `src/pages/Game/Game.tsx`

- [ ] **Step 3.1：添加 activeInterrogation state**

在 `const [pendingInterrogation, setPendingInterrogation]` 行之后插入：

```typescript
const [activeInterrogation, setActiveInterrogation] = useState<{
  npcId: string;
  npcName: string;
  currentLevel: number;
} | null>(null);
```

- [ ] **Step 3.2：房间切换时清除审讯状态**

在 `const [endingPending, setEndingPending]` 之后，在已有的 revisitEvents useEffect 之前插入：

```typescript
useEffect(() => {
  setActiveInterrogation(null);
}, [scene.currentRoomId]);
```

- [ ] **Step 3.3：在 sceneStore 解构中引入 interrogationLevels 和 setInterrogationLevel**

找到：
```typescript
const { currentRoomId, flags, visitedRooms } = useSceneStore();
```
改为（这行在 Game.tsx 顶部 hooks 区，找到 scene 变量赋值即可）：

找到 `const scene = useSceneStore();` 这行，在其下方添加：
```typescript
const { setInterrogationLevel } = useSceneStore();
```

- [ ] **Step 3.4：修改 handleAction 的 NPC 分支，加入审讯拦截**

找到：
```typescript
} else if (entityId.startsWith('npc_')) {
  const npc = getNPC(entityId);
  if (!npc) return;
  const dialogues = getAvailableDialogues(npc, ctx);
```

在 `const npc = getNPC(entityId);` 和 `if (!npc) return;` 之后、`const dialogues` 之前插入：

```typescript
  // 深层审讯系统拦截
  if (npc.interrogation?.enabled) {
    const { triggerFlag } = npc.interrogation;
    if (!triggerFlag || scene.flags.includes(triggerFlag)) {
      const currentLevel = scene.interrogationLevels[entityId] ?? 0;
      setActiveInterrogation({ npcId: entityId, npcName: npc.name, currentLevel });
      const levelData = npc.interrogation.levels[currentLevel];
      if (levelData) {
        audioEngine.playSFX('dialogue');
        scene.addStoryText(levelData.moodHint);
        scene.addStoryText(`【${npc.name}】${levelData.text}`);
      }
      return;
    }
  }
```

- [ ] **Step 3.5：添加 handleInterrogationAction 函数**

在 `handleAction` 函数结束后、`handlePresentEvidence` 之前插入：

```typescript
const handleInterrogationAction = useCallback((
  action: 'pressure' | 'indirect' | 'evidence',
  evidenceId?: string,
) => {
  if (!activeInterrogation) return;
  const { npcId } = activeInterrogation;
  const npc = getNPC(npcId);
  if (!npc?.interrogation) return;

  const currentLevel = scene.interrogationLevels[npcId] ?? 0;
  const levelData = npc.interrogation.levels[currentLevel];
  if (!levelData) return;

  scene.addStoryText('---SEPARATOR---');

  if (action === 'indirect') {
    audioEngine.playSFX('dialogue');
    scene.addStoryText(levelData.indirectText ?? `（${npc.name}没有正面回答。）`);
    return;
  }

  // 施压 / 出示证据：检查证物匹配
  const relevantEvidence = levelData.pushEvidence ?? [];
  const allPlayerItems = [...scene.clues, ...items];
  const hasEvidence =
    action === 'evidence'
      ? evidenceId != null && relevantEvidence.includes(evidenceId)
      : relevantEvidence.some((e) => allPlayerItems.includes(e));

  if (hasEvidence) {
    const newLevel = Math.min(currentLevel + 1, 2) as 0 | 1 | 2;
    setInterrogationLevel(npcId, newLevel);
    audioEngine.playSFX('discover');
    scene.addStoryText('〖他沉默了片刻，表情松动了一丝。〗');
    const nextData = npc.interrogation.levels[newLevel];
    if (nextData) {
      scene.addStoryText(nextData.moodHint);
      scene.addStoryText(`【${npc.name}】${nextData.text}`);
      setActiveInterrogation((prev) => prev ? { ...prev, currentLevel: newLevel } : null);
      if (newLevel === 2 && nextData.grants) {
        if (nextData.grants.clues?.length || nextData.grants.items?.length) audioEngine.playSFX('discover');
        applyGrants(nextData.grants, scene, addItem, removeItem, player);
      }
    }
  } else {
    const newLevel = Math.max(currentLevel - 1, 0) as 0 | 1 | 2;
    if (newLevel < currentLevel) {
      setInterrogationLevel(npcId, newLevel);
      audioEngine.playSFX('click');
      scene.addStoryText('〔他的神情骤然收紧，不再看你。〕');
      const prevData = npc.interrogation.levels[newLevel];
      if (prevData) {
        scene.addStoryText(`【${npc.name}】${prevData.text}`);
        setActiveInterrogation((prev) => prev ? { ...prev, currentLevel: newLevel } : null);
      }
    } else {
      audioEngine.playSFX('click');
      scene.addStoryText('〔他摆了摆手，没有接你的话。〕');
    }
  }
}, [activeInterrogation, scene, items, addItem, removeItem, player, setInterrogationLevel]);
```

- [ ] **Step 3.6：计算传给 CenterPanel 的审讯 props**

在 `const currentHint = showHint ? ...` 之后插入：

```typescript
const interrogationPanelProps = useMemo(() => {
  if (!activeInterrogation) return null;
  const npc = getNPC(activeInterrogation.npcId);
  if (!npc?.interrogation) return null;
  const { currentLevel } = activeInterrogation;
  const levelData = npc.interrogation.levels[currentLevel];
  return {
    npcName: activeInterrogation.npcName,
    currentLevel: currentLevel as 0 | 1 | 2,
    pushEvidence: levelData?.pushEvidence ?? [],
    isComplete: currentLevel === 2,
  };
}, [activeInterrogation]);

const interrogationInventoryItems = useMemo(() => {
  if (!interrogationPanelProps) return [];
  const push = interrogationPanelProps.pushEvidence;
  return [
    ...scene.clues
      .filter((id) => push.includes(id))
      .map((id) => { const it = getItem(id); return it ? { id: it.id, name: it.name, isClue: true } : null; })
      .filter(Boolean) as { id: string; name: string; isClue: boolean }[],
    ...items
      .filter((id) => push.includes(id))
      .map((id) => { const it = getItem(id); return it ? { id: it.id, name: it.name, isClue: false } : null; })
      .filter(Boolean) as { id: string; name: string; isClue: boolean }[],
  ];
}, [interrogationPanelProps, scene.clues, items]);
```

- [ ] **Step 3.7：将审讯 props 传入 CenterPanel**

在 `<CenterPanel` JSX 中添加三个新 props（在现有 `pendingInterrogation={...}` 之后）：

```tsx
interrogation={interrogationPanelProps}
onInterrogationAction={handleInterrogationAction}
onInterrogationDismiss={() => setActiveInterrogation(null)}
interrogationItems={interrogationInventoryItems}
```

- [ ] **Step 3.8：TypeScript 编译验证**

```bash
npx tsc --noEmit
```
此步骤会报错（CenterPanel props 还未更新），记录错误信息，继续 Task 4。

---

## Task 4：CenterPanel — 审讯面板 UI

**Files:** Modify `src/components/layout/CenterPanel.tsx`

- [ ] **Step 4.1：扩展 Props interface**

在 `pendingInterrogation?: InterrogationProps | null;` 之后添加：

```typescript
interrogation?: {
  npcName: string;
  currentLevel: 0 | 1 | 2;
  pushEvidence: string[];
  isComplete: boolean;
} | null;
onInterrogationAction?: (action: 'pressure' | 'indirect' | 'evidence', evidenceId?: string) => void;
onInterrogationDismiss?: () => void;
interrogationItems?: { id: string; name: string; isClue: boolean }[];
```

- [ ] **Step 4.2：在函数参数中解构新 props**

在 `pendingInterrogation,` 之后添加：
```typescript
interrogation,
onInterrogationAction,
onInterrogationDismiss,
interrogationItems = [],
```

- [ ] **Step 4.3：添加证物展开状态**

在 `const [interrogationFocusIdx, setInterrogationFocusIdx]` 之后添加：
```typescript
const [evidenceOpen, setEvidenceOpen] = useState(false);
```

- [ ] **Step 4.4：当切换到新审讯时收起证物列表**

在现有 `scrollToBottom` useEffect 之后添加：
```typescript
useEffect(() => { setEvidenceOpen(false); }, [interrogation?.npcName, interrogation?.currentLevel]);
```

- [ ] **Step 4.5：在操作区添加审讯面板分支**

在操作区 `div` 内，`{pendingInterrogation ? (` 之前插入审讯面板块：

```tsx
{/* ── 深层审讯面板 ── */}
{interrogation && !pendingInterrogation && (
  <div className="flex flex-col h-full">
    {/* 标题 + 层级指示 */}
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="w-2 h-px bg-blood/35" />
        <p className="text-blood/55 text-[10px] tracking-[0.3em]">审讯·{interrogation.npcName}</p>
        <div className="w-2 h-px bg-blood/35" />
      </div>
      <div className="flex items-center gap-1">
        {([0, 1, 2] as const).map((i) => (
          <span
            key={i}
            className="text-[10px]"
            style={{ color: i <= interrogation.currentLevel ? 'rgba(201,168,76,0.75)' : 'rgba(201,168,76,0.2)' }}
          >
            ●
          </span>
        ))}
      </div>
    </div>

    {interrogation.isComplete ? (
      <p className="text-ink/38 text-[11px] italic px-1 mb-3">〔审讯已完成。〕</p>
    ) : (
      <>
        {/* 行动按钮 */}
        <div className="flex flex-col gap-1.5 mb-2">
          <button
            onClick={() => onInterrogationAction?.('pressure')}
            className="w-full text-left px-3 py-2 border border-blood/25 text-ink/70 hover:border-blood/55 hover:text-ink/90 text-[13px] transition-colors cursor-pointer tracking-wide"
          >
            施压
          </button>
          <button
            onClick={() => onInterrogationAction?.('indirect')}
            className="w-full text-left px-3 py-2 border border-gold/18 text-ink/55 hover:border-gold/38 hover:text-ink/75 text-[13px] transition-colors cursor-pointer tracking-wide"
          >
            迂回试探
          </button>
          <button
            onClick={() => setEvidenceOpen((v) => !v)}
            className={`w-full text-left px-3 py-2 border text-[13px] transition-colors cursor-pointer tracking-wide ${
              evidenceOpen
                ? 'border-gold/45 text-gold/75 bg-gold/5'
                : 'border-gold/18 text-ink/55 hover:border-gold/38 hover:text-ink/75'
            }`}
          >
            出示证据 {evidenceOpen ? '▴' : '▾'}
          </button>
        </div>

        {/* 证物列表 */}
        {evidenceOpen && (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin space-y-0.5 mb-2 border-t border-gold/10 pt-2">
            {interrogationItems.length === 0 ? (
              <p className="text-ink/25 text-xs italic px-1">暂无相关证物可出示</p>
            ) : (
              interrogationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onInterrogationAction?.('evidence', item.id); setEvidenceOpen(false); }}
                  className="w-full text-left flex items-center gap-2 px-2 py-1.5 border-l-2 border-gold/22 text-ink/65 hover:text-gold hover:border-gold/55 transition-colors cursor-pointer"
                >
                  <span className="text-[9px] shrink-0 text-gold/45">{item.isClue ? '◈' : '◇'}</span>
                  <span className="text-[13px] flex-1">{item.name}</span>
                  <span className="text-[9px] text-gold/35 shrink-0">出示</span>
                </button>
              ))
            )}
          </div>
        )}
      </>
    )}

    {/* 退出按钮 */}
    <button
      onClick={() => { onInterrogationDismiss?.(); setEvidenceOpen(false); }}
      className="mt-auto w-full text-center text-[11px] text-ink/25 hover:text-ink/45 py-1 tracking-widest cursor-pointer transition-colors border-t border-gold/8 pt-2"
    >
      暂时先问到这里
    </button>
  </div>
)}
```

- [ ] **Step 4.6：TypeScript 编译验证**

```bash
npx tsc --noEmit
```
期望：0 errors

- [ ] **Step 4.7：Commit**

```bash
git add src/types/game.ts src/store/sceneStore.ts src/pages/Game/Game.tsx src/components/layout/CenterPanel.tsx
git commit -m "feat: interrogation state machine — types, store, Game handler, CenterPanel UI"
```

---

## Task 5：第一章关键 NPC 审讯数据

**Files:** Modify `src/data/npcs/chapter1.json`

为三个 NPC 添加 `interrogation` 字段（在 `"dialogues"` 数组结束的 `]` 之后、对象末尾 `}` 之前）：

- [ ] **Step 5.1：npc_innkeeper_li_fu 添加 interrogation**

找到 `"id": "npc_innkeeper_li_fu"` 对象，在其 `"dialogues": [...]` 结束后添加：

```json
,
    "interrogation": {
      "enabled": true,
      "triggerFlag": "innkeeper_met",
      "levels": [
        {
          "level": 0,
          "moodHint": "〔他擦着柜台，眼神没有停在你身上。〕",
          "text": "不知道，我只是个开店的，什么都不清楚。有什么事问衙门去。",
          "indirectText": "你随口问了几句食宿的事，他答得滴水不漏，不咸不淡。",
          "pushEvidence": ["blood_letter"]
        },
        {
          "level": 1,
          "moodHint": "〔他的手微微一顿，重新低头擦起柜台。〕",
          "text": "那块令牌……我见过类似的东西，但那是很久以前的事了，跟我无关。",
          "indirectText": "他看了看你手里的东西，把视线移开了，动作比刚才慢了一些。",
          "pushEvidence": ["innkeeper_jade", "tianji_roster"]
        },
        {
          "level": 2,
          "moodHint": "〔他放下了抹布，长叹一口气，像是放下了什么重担。〕",
          "text": "好，我说。这块玉牌是天机阁的信物，我认得。宋怀义来这里，是来交接一件东西的，我是中转人——已经十年了。他出事，我早就知道是迟早的事。那个人，左手有一道旧疤。",
          "grants": { "flags": ["innkeeper_secret_revealed", "left_hand_scar_known"] }
        }
      ]
    }
```

- [ ] **Step 5.2：npc_cook_wang 添加 interrogation**

找到 `"id": "npc_cook_wang"` 对象，在其 `"dialogues": [...]` 结束后添加：

```json
,
    "interrogation": {
      "enabled": true,
      "triggerFlag": "cook_talked",
      "levels": [
        {
          "level": 0,
          "moodHint": "〔她两手缠着围裙，不停地往门口看。〕",
          "text": "那壶茶不是我泡的，我只是端过去的。我什么都不知道。",
          "indirectText": "她低着头，灶台前的活儿做得比平时快了一倍，像是在逃避什么。",
          "pushEvidence": ["arsenic_evidence"]
        },
        {
          "level": 1,
          "moodHint": "〔她的眼圈红了，声音压得很低。〕",
          "text": "那个人……我没看清楚脸。但他在茶里放了什么，我闻到了不对劲的味道，我不敢说……",
          "indirectText": "她抬头看了你一眼，嘴唇动了动，又迅速低下头去。",
          "pushEvidence": ["arsenic_evidence", "premade_tea_testimony"]
        },
        {
          "level": 2,
          "moodHint": "〔她终于把抹布放下，用袖子擦了擦眼角。〕",
          "text": "是有人提前备好了那壶茶，放在灶台边，说让我端过去就行。我闻到了苦味，但我怕得不敢说。那个人，我只记得他戴着帽子，左手有一道旧疤，烫的那种。",
          "grants": { "flags": ["cook_full_testimony", "left_hand_scar_known"] }
        }
      ]
    }
```

- [ ] **Step 5.3：npc_drunk_zhang_san 添加 interrogation**

找到 `"id": "npc_drunk_zhang_san"` 对象，在其 `"dialogues": [...]` 结束后添加：

```json
,
    "interrogation": {
      "enabled": true,
      "levels": [
        {
          "level": 0,
          "moodHint": "〔他摇摇晃晃，连看你的目光都是散的。〕",
          "text": "嗝……什么事啊……我没看见什么，我当时睡着了……",
          "indirectText": "他含糊地哼了一声，喝了口酒，眼神涣散地看着别处。",
          "pushEvidence": ["tavern_wine"]
        },
        {
          "level": 1,
          "moodHint": "〔酒喝下去，他的眼神清醒了一点，开始打量你。〕",
          "text": "我那晚……是没睡着，嗯。我看见一个穿黑的，腰间别着什么，往二楼去了，很快就下来了。",
          "indirectText": "他摇摇手，「那不是我该说的事……」嘴里咕哝着什么，重新低下头去。",
          "pushEvidence": ["copper_bell_fragment", "cloth_fiber_clue"]
        },
        {
          "level": 2,
          "moodHint": "〔他放低了声音，靠近你说话。〕",
          "text": "那个人，腰上别的那个铜铃，跟浪鹏帮帮徽一样的纹路——我在码头见过。他走的时候走的后院，我看见他翻墙出去了。左手……左手好像有什么，袖子遮着的，但走路姿势，我认得，是个惯走江湖的人。",
          "grants": { "flags": ["drunk_full_testimony", "langpeng_discovered", "found_escape_clue"] }
        }
      ]
    }
```

- [ ] **Step 5.4：TypeScript 编译验证**

```bash
npx tsc --noEmit
```
期望：0 errors

- [ ] **Step 5.5：运行 chapter1 数据完整性测试**

```bash
npx vitest run tests/data/chapter1Integrity.test.ts
```
期望：全部 PASS

- [ ] **Step 5.6：Commit**

```bash
git add src/data/npcs/chapter1.json
git commit -m "data: add interrogation config to ch1 NPCs (innkeeper, cook, drunk)"
```

---

## Task 6：第二章关键 NPC 审讯数据

**Files:** Modify `src/data/npcs/chapter2.json`

- [ ] **Step 6.1：npc_langpeng_scout 添加 interrogation**

找到 `"id": "npc_langpeng_scout"` 对象的 dialogues 数组结束后添加：

```json
,
    "interrogation": {
      "enabled": true,
      "triggerFlag": "langpeng_discovered",
      "levels": [
        {
          "level": 0,
          "moodHint": "〔他把手搭在腰间，眼神危险地扫了你一眼。〕",
          "text": "我不认识你。滚开。",
          "indirectText": "你试着和他搭话，他只是斜眼看你，没有接话。",
          "pushEvidence": ["extortion_note", "copper_bell_fragment"]
        },
        {
          "level": 1,
          "moodHint": "〔他往后退了一步，眼神里有了慌乱。〕",
          "text": "你……你知道什么！那个据点，我只是个跑腿的，什么都不知道！",
          "indirectText": "他沉默地看着你，下颌有些紧绷，手指无意识地抓着衣角。",
          "pushEvidence": ["langpeng_hideout_intel", "extortion_note"]
        },
        {
          "level": 2,
          "moodHint": "〔他四周看了看，压低声音。〕",
          "text": "李爷让我们盯着宋怀义那家客栈，还有回春堂的和尚。调令在据点正堂灶台后面，李爷亲笔写的。我看见那个人了——戴着斗笠，左手有疤，进去了，不到一个时辰就出来了。",
          "grants": { "flags": ["langpeng_full_confession", "langpeng_trail", "langpeng_scared"] }
        }
      ]
    }
```

- [ ] **Step 6.2：npc_li_mao 添加 interrogation**

找到 `"id": "npc_li_mao"` 对象的 dialogues 数组结束后添加：

```json
,
    "interrogation": {
      "enabled": true,
      "triggerFlag": "langpeng_trail",
      "levels": [
        {
          "level": 0,
          "moodHint": "〔他端着茶杯，似乎对你毫无兴趣。〕",
          "text": "有意思。你认为你查到了什么？",
          "indirectText": "他悠悠地喝了口茶，用一种漫不经心的眼神看着你——这人见过比你厉害的多。",
          "pushEvidence": ["langpeng_dispatch_order"]
        },
        {
          "level": 1,
          "moodHint": "〔他放下茶杯，手指在桌面轻敲了两下。〕",
          "text": "……你比我预计的查得深。这说明有人在帮你，或者你运气极好。",
          "indirectText": "他重新端起茶杯，但没有再喝，像是在斟酌什么。",
          "pushEvidence": ["monk_identity_scroll", "langpeng_dispatch_order"]
        },
        {
          "level": 2,
          "moodHint": "〔他向后靠在椅背上，换了一种语气。〕",
          "text": "好。我告诉你一件事：宋怀义带走的名单，不只有天机阁的成员。那份名单上还有另一批人，「鸢」真正要的，是找到这批人的下落。我可以合作，但你要给我一个保证。",
          "grants": { "flags": ["li_mao_exposed", "li_mao_deal_offered", "tianji_deeper_intel"] }
        }
      ]
    }
```

- [ ] **Step 6.3：npc_wujue（ch2 context）添加 interrogation**

找到 `"id": "npc_wujue"` 对象，在其 dialogues 结束后添加：

```json
,
    "interrogation": {
      "enabled": true,
      "triggerFlag": "wujue_suspicious",
      "levels": [
        {
          "level": 0,
          "moodHint": "〔他垂着眼帘，一副闭目打坐的样子。〕",
          "text": "施主来求诊还是求签？若是别的事，贫僧不擅长。",
          "indirectText": "他缓缓拨动佛珠，没有再说话，仿佛你不存在。",
          "pushEvidence": ["monk_identity_scroll", "poison_residue_sample"]
        },
        {
          "level": 1,
          "moodHint": "〔他的手在佛珠上停了一下。〕",
          "text": "那瓶药……是老方子，二十年前的配方。你从哪里得来的？",
          "indirectText": "他睁开眼，看了你手中的东西一眼，又闭上了，但呼吸明显急促了一分。",
          "pushEvidence": ["monk_identity_scroll"]
        },
        {
          "level": 2,
          "moodHint": "〔他长叹一口气，放下了佛珠。〕",
          "text": "罢了。我是天机阁旧人，法号之前的名字叫韩朔。那批药方是我配的，是为了救人，不是害人。宋怀义死的那晚，我不在场——但那瓶毒，我认得，是有人故意仿照天机阁旧方炮制的，为的是嫁祸于我。",
          "grants": { "flags": ["wujue_tianji_revealed", "wujue_identity_confirmed"] }
        }
      ]
    }
```

- [ ] **Step 6.4：TypeScript 编译验证**

```bash
npx tsc --noEmit
```
期望：0 errors

- [ ] **Step 6.5：运行 chapter2 数据完整性测试**

```bash
npx vitest run tests/data/chapter2Integrity.test.ts
```
期望：全部 PASS

- [ ] **Step 6.6：Commit**

```bash
git add src/data/npcs/chapter2.json
git commit -m "data: add interrogation config to ch2 NPCs (scout, li_mao, wujue)"
```

---

## Task 7：第三章关键 NPC 审讯数据

**Files:** Modify `src/data/npcs/chapter3.json`，`src/data/npcs/chapter1.json`

- [ ] **Step 7.1：npc_wujue（ch3 context）添加第二套 interrogation 层级**

无迹和尚的 interrogation 已在 Task 6 中设为 ch2 context（triggerFlag: "wujue_suspicious"）。对于 ch3，他有更深的秘密需要不同的对话。

在 `src/data/npcs/chapter3.json` 的 `npc_wujue` 对象（或其在 chapter3.json 中的 override）中，由于 loader 使用 last-in-wins，在 chapter3.json 中添加带 ch3 triggerFlag 的 wujue 条目只会覆盖 ch2 版本。

**改为**：修改 chapter2.json 中 npc_wujue 的 `triggerFlag` 改为兼容写法，并在 chapter3.json 中的 npc_wujue（已有多条对话）添加 interrogation：

检查 chapter3.json 是否已有 npc_wujue：
```bash
grep -n '"npc_wujue"' src/data/npcs/chapter3.json | head -3
```

若 chapter3.json 有 npc_wujue（有 ch3 专属对话），在其 dialogues 后添加：

```json
,
    "interrogation": {
      "enabled": true,
      "triggerFlag": "chapter3_started",
      "levels": [
        {
          "level": 0,
          "moodHint": "〔他比上次见面时苍老了许多，但眼神更平静了。〕",
          "text": "你又来了。这次，你想知道什么？",
          "indirectText": "他没有催你，只是静静地等着，佛珠一颗一颗地拨过。",
          "pushEvidence": ["tianji_founding_scroll", "monk_identity_scroll"]
        },
        {
          "level": 1,
          "moodHint": "〔他看了那件东西很久，然后抬起头。〕",
          "text": "这个……你找到了。那我没有什么可以继续瞒着你的了。",
          "indirectText": "他沉默了很长时间，「有些事，不是时候说。」",
          "pushEvidence": ["tianji_founding_scroll", "leyou_inscription"]
        },
        {
          "level": 2,
          "moodHint": "〔他站起来，走到窗边，背对着你说话。〕",
          "text": "二十年前那次事故，不是事故。那批货在路上出了问题，是因为有人故意安排的。那个人知道每一个经手人的名字，知道运送时间，知道内容。他至今还在长安。我保护了他这么久，因为他也在保护某些人——但那些人，已经死的差不多了。",
          "grants": { "flags": ["wujue_accident_truth_known", "wujue_ch3_full_confession"] }
        }
      ]
    }
```

- [ ] **Step 7.2：npc_tianji_contact 添加 interrogation**

在 `src/data/npcs/chapter3.json` 的 `npc_tianji_contact` 对象的 dialogues 后添加：

```json
,
    "interrogation": {
      "enabled": true,
      "triggerFlag": "tianji_safehouse_location_known",
      "levels": [
        {
          "level": 0,
          "moodHint": "〔他看着墙上的地图，没有立刻转身。〕",
          "text": "你来了。名单的事，我已经听说了。但你拿什么证明你值得信任？",
          "indirectText": "他缓缓转过身，用一种评估的眼神看着你，没有说话。",
          "pushEvidence": ["tianji_founding_scroll", "dafei_inner_token"]
        },
        {
          "level": 1,
          "moodHint": "〔他的表情松动了一点，但仍然戒备。〕",
          "text": "你知道的比我以为的多。那份名单——飞爷带着它，但他身边有人在监视他，我们联系不上。",
          "indirectText": "他背过身去，重新看那张地图，「有些事，我不能说。」",
          "pushEvidence": ["tianji_founding_scroll", "leyou_inscription"]
        },
        {
          "level": 2,
          "moodHint": "〔他在地图上标了一个点，转过身来。〕",
          "text": "好。飞爷现在在曲江亭，每天傍晚。他一直在等一个能把这件事收尾的人。那个监视他的人，是廷尉府的线人——但廷尉主事本人不知道这件事。",
          "grants": { "flags": ["tianji_trust_gained", "fei_ye_location_known"] }
        }
      ]
    }
```

- [ ] **Step 7.3：npc_fei_ye（ch3 context）添加 interrogation**

`npc_fei_ye` 定义在 `chapter1.json`。在其 dialogues 末尾已有 ch3 对话（pavilion_tension 等）。在其 interrogation 字段（Task 5 未添加 fei_ye，现在添加 ch3 版本）：

找到 chapter1.json 的 npc_fei_ye 的 dialogues 数组末尾，在整个对象末尾插入：

```json
,
    "interrogation": {
      "enabled": true,
      "triggerFlag": "fei_ye_identity_confirmed",
      "levels": [
        {
          "level": 0,
          "moodHint": "〔他靠着亭柱，看着池水，没有看你。〕",
          "text": "你来了。二十年——我以为不会有人能走到这里来。",
          "indirectText": "他沉默了很久，风吹过池面，他才开口：「有些话，要等时机。」",
          "pushEvidence": ["tianji_founding_scroll", "leyou_inscription"]
        },
        {
          "level": 1,
          "moodHint": "〔他终于转过头，正视着你。〕",
          "text": "名单——你要名单，是为了救那些人，还是另有用途？",
          "indirectText": "他重新看向池水，「这个问题，你不用回答我。但你要想清楚。」",
          "pushEvidence": ["tianji_founding_scroll", "case_reopened_receipt", "leyou_inscription"]
        },
        {
          "level": 2,
          "moodHint": "〔他从怀中取出一个册子，放在亭中石桌上。〕",
          "text": "这是完整的名单。廷尉府当年追杀的那些人，活下来的，都在这里。还有一件事——那个二十年前出卖我们的人，我知道他是谁。他现在仍然活着，仍然在长安，仍然在某个人的庇护之下。我选择了这么多年不说，因为说出来会死更多人。但你来了，这件事，由你来决定怎么处置。",
          "grants": { "flags": ["fei_ye_name_list_given", "fei_ye_final_secret_known"], "items": ["tianji_founding_scroll"] }
        }
      ]
    }
```

- [ ] **Step 7.4：TypeScript 编译验证**

```bash
npx tsc --noEmit
```
期望：0 errors

- [ ] **Step 7.5：运行 chapter3 数据完整性测试**

```bash
npx vitest run tests/data/chapter3Integrity.test.ts
```
期望：全部 PASS

- [ ] **Step 7.6：运行全量测试**

```bash
npx vitest run
```
期望：全部 PASS（数量 ≥ 228）

- [ ] **Step 7.7：Commit**

```bash
git add src/data/npcs/chapter3.json src/data/npcs/chapter1.json
git commit -m "data: add interrogation config to ch3 NPCs (wujue_ch3, tianji_contact, fei_ye_ch3)"
```

---

## Task 8：最终验证 + Push

- [ ] **Step 8.1：构建验证**

```bash
npm run build
```
期望：Build successful，0 errors

- [ ] **Step 8.2：Push**

```bash
git push origin main
```
