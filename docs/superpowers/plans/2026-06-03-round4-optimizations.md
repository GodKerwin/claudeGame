# 第四轮优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复游戏内7项中低影响 bug 并完善细节——任务获取无反馈、故事文本分隔符截断、三个NPC缺档案、时间线计数器、存档时间戳与覆盖确认、合成提示格式不一致、平板断点缺失。

**Architecture:** 每个任务改动独立——sceneStore/Game.tsx 处理任务反馈，profiles JSON 添加NPC档案，RightPanel 添加时间线统计，SaveLoadModal 改时间戳和覆盖逻辑，chapter1 合成 JSON 规范化，GameLayout 断点调整。

**Tech Stack:** React 18 + TypeScript + Zustand + TailwindCSS v3 + Vitest + Vite

---

## 文件结构

- Modify: `src/store/sceneStore.ts` — 分隔符截断修复
- Modify: `src/pages/Game/Game.tsx` — 任务获取 SFX + 故事文字通知
- Modify: `src/data/profiles/chapter1.json` — 补充三个NPC档案
- Modify: `src/components/layout/RightPanel.tsx` — 时间线已见/总数计数器
- Modify: `src/components/save/SaveLoadModal.tsx` — 年份时间戳 + 覆盖确认
- Modify: `src/data/syntheses/chapter1.json` — hint 格式规范化为 `×`
- Modify: `src/components/layout/GameLayout.tsx` — 平板断点 md→lg

---

### Task 1: 故事文本分隔符截断 Bug 修复

**背景：** `sceneStore.addStoryText` 在 storyText 超过50条时执行 `slice(-50)`，若第50条之前几条都是 `---SEPARATOR---`，截断后首行会变成分隔符，渲染成孤立横线。

**Files:**
- Modify: `src/store/sceneStore.ts:53-57`
- Test: `tests/store/sceneStore.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
// 在 tests/store/sceneStore.test.ts 中，追加到现有 describe 块内
it('strips leading separators after trimming at 50 entries', () => {
  useSceneStore.getState().reset();
  // 先加 3 条分隔符
  for (let i = 0; i < 3; i++) useSceneStore.getState().addStoryText('---SEPARATOR---');
  // 再加 48 条普通文本，总共 51 条，触发裁剪
  for (let i = 0; i < 48; i++) useSceneStore.getState().addStoryText(`text${i}`);
  const st = useSceneStore.getState().storyText;
  expect(st.length).toBeLessThanOrEqual(50);
  expect(st[0]).not.toBe('---SEPARATOR---');
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd /Users/xuli/claudeGame
npx vitest run tests/store/sceneStore.test.ts
```
Expected: FAIL — 最后的 assert 会失败，因为当前实现不剥离开头分隔符。

- [ ] **Step 3: 修复 sceneStore.ts**

将 `src/store/sceneStore.ts` 第 53-57 行（`addStoryText` 实现）改为：

```typescript
addStoryText: (text) =>
  set((s) => {
    const next = [...s.storyText, text];
    let trimmed = next.length > 50 ? next.slice(-50) : next;
    while (trimmed.length > 0 && trimmed[0] === '---SEPARATOR---') trimmed = trimmed.slice(1);
    return { storyText: trimmed };
  }),
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run tests/store/sceneStore.test.ts
```
Expected: 5 tests pass（原4条 + 新增1条）

- [ ] **Step 5: 运行全量测试确保无回归**

```bash
npx vitest run
```
Expected: All tests pass.

- [ ] **Step 6: 提交**

```bash
git add src/store/sceneStore.ts tests/store/sceneStore.test.ts
git commit -m "fix: strip leading separators after storyText slice(-50) trim"
```

---

### Task 2: 任务获取 SFX + 故事文字通知

**背景：** `applyGrants` 在 `Game.tsx` 中处理 quests 时只调用 `scene.addQuest(q)`，没有音效也没有故事文字，玩家不知道任务更新了。其他 grants（clues/items）都有对应 SFX。

**Files:**
- Modify: `src/pages/Game/Game.tsx:39-59`

- [ ] **Step 1: 在 Game.tsx 顶部 import 区之后，`SceneOps` 类型之前，添加任务名称映射**

在 `src/pages/Game/Game.tsx` 中，找到 `interface SceneOps` 定义（约第39行），在其前面添加：

```typescript
const QUEST_NOTIFICATION: Record<string, string> = {
  quest_main_murder: '调查客栈命案',
  quest_dafei_gang:  '大飞帮隐藏线索',
  quest_li_mao_case: '追查李邈',
  quest_find_kite:   '追寻「鸢」的身份',
};
```

- [ ] **Step 2: 扩展 SceneOps 接口**

将 `SceneOps` 接口（约第39行）改为：

```typescript
interface SceneOps {
  addFlag: (f: string) => void;
  addClue: (c: string) => void;
  addQuest: (q: string) => void;
  addStoryText: (text: string) => void;
  questLog: string[];
}
```

- [ ] **Step 3: 修改 applyGrants 中的 quests 处理逻辑**

将 `applyGrants` 函数（约第42-59行）中这一行：

```typescript
  grants.quests?.forEach((q) => scene.addQuest(q));
```

改为：

```typescript
  grants.quests?.forEach((q) => {
    if (!scene.questLog.includes(q)) {
      const name = QUEST_NOTIFICATION[q] ?? q;
      scene.addStoryText(`（新任务已开启：【${name}】）`);
      audioEngine.playSFX('discover');
    }
    scene.addQuest(q);
  });
```

- [ ] **Step 4: 修复 applyGrants 的4个调用点，传入 scene（已包含 addStoryText 和 questLog）**

检查 `applyGrants` 在 Game.tsx 中的所有调用，确认它们已经传入 `scene`（来自 `useSceneStore()`）。查看约第 273、297、327、359 行的调用：

```typescript
applyGrants(choice.grants, scene, addItem, removeItem, player);  // 273
applyGrants(action.grants, scene, addItem, removeItem, player);  // 297
applyGrants(d.grants, scene, addItem, removeItem, player);       // 327
applyGrants(grants, scene, addItem, removeItem, player);         // 359
```

这些调用传入的 `scene` 来自 `useSceneStore()`，已包含 `addStoryText` 和 `questLog`，无需修改调用点。

- [ ] **Step 5: 更新 applyGrants 函数签名中的 scene 参数类型**

确认 `applyGrants` 第二个参数类型为 `SceneOps`（已在 Step 2 扩展）。函数签名应为：

```typescript
function applyGrants(
  grants: Grants | undefined,
  scene: SceneOps,
  addItem: (id: string) => void,
  removeItem: (id: string) => void,
  player: PlayerOps,
) {
```

- [ ] **Step 6: 类型检查**

```bash
cd /Users/xuli/claudeGame
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 7: 运行全量测试**

```bash
npx vitest run
```
Expected: All tests pass.

- [ ] **Step 8: 提交**

```bash
git add src/pages/Game/Game.tsx
git commit -m "feat: add SFX and story notification when quest is granted"
```

---

### Task 3: 第一章三个 NPC 嫌疑人档案

**背景：** `src/data/profiles/chapter1.json` 中缺少 `npc_paper_seller`（卖符老人）、`npc_old_beggar`（后巷老乞丐）、`npc_merchant_zhou`（周药商）三个档案。NPC 档案在推理面板展开时显示人物已知事实。

**档案格式参考：** 见文件现有内容（前5个条目）。每个档案包含 `npcId`, `name`, `role`, `suspicion`, `facts` 数组。每条 fact 包含 `flag`（对应 scene.flags 中的标记，条件满足时显示）、`text`（显示文本）、`type`（`"known"` 或 `"contradiction"`）。

**Files:**
- Modify: `src/data/profiles/chapter1.json`
- Test: `tests/data/profilesIntegrity.test.ts`

- [ ] **Step 1: 写失败测试**

在 `tests/data/profilesIntegrity.test.ts` 的 `describe` 块内追加：

```typescript
it('chapter 1 includes profiles for npc_paper_seller, npc_old_beggar, npc_merchant_zhou', () => {
  const ids = SUSPECT_PROFILES.map((p) => p.npcId);
  expect(ids).toContain('npc_paper_seller');
  expect(ids).toContain('npc_old_beggar');
  expect(ids).toContain('npc_merchant_zhou');
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run tests/data/profilesIntegrity.test.ts
```
Expected: FAIL — 3个 ID 均不在列表中。

- [ ] **Step 3: 在 chapter1.json 末尾追加三个档案**

打开 `src/data/profiles/chapter1.json`，在末尾的 `]` 之前（紧接最后一个条目的 `}` 后）添加：

```json
,
  {
    "npcId": "npc_paper_seller",
    "name": "卖符老人",
    "role": "符牌摊主，大飞帮外线",
    "suspicion": "中间人——知情不语",
    "facts": [
      { "flag": "dafei_contact_made", "text": "以暗语「云散见青天」相认——是大飞帮在往事客栈附近的接头人之一。", "type": "known" },
      { "flag": "dafei_address_obtained", "text": "提供了大飞帮据点的具体方向，叮嘱你不要声张。", "type": "known" },
      { "flag": "gang_culture_known", "text": "对帮派暗语了如指掌，在这条街摆摊已逾十年，见多识广。", "type": "known" },
      { "flag": "chapter2_started", "text": "二三十年的江湖历练让他保持沉默——这张普通的脸藏着不普通的见识。", "type": "known" }
    ]
  },
  {
    "npcId": "npc_old_beggar",
    "name": "后巷老乞丐",
    "role": "后巷流浪者，旧时帮派眼线",
    "suspicion": "边缘目击者——知情",
    "facts": [
      { "flag": "beggar_first_talked", "text": "目光锐利，对往来行人观察入微，绝非普通乞丐。", "type": "known" },
      { "flag": "beggar_told_langpeng", "text": "目击昨夜二更浪鹏帮探子在后巷守候整夜，是案发当晚的关键目击者。", "type": "known" },
      { "flag": "langpeng_discovered", "text": "二十年前曾做过浪鹏帮眼线，因出了人命事件后脱离，流落长安至今。", "type": "known" },
      { "flag": "beggar_thief_talked", "text": "以行里暗语相认后，主动补充了浪鹏帮探子的更多行动细节。", "type": "known" }
    ]
  },
  {
    "npcId": "npc_merchant_zhou",
    "name": "周药商",
    "role": "东市行商，货物被劫受害者",
    "suspicion": "无辜受害者——意外牵连",
    "facts": [
      { "flag": "merchant_zhou_first_met", "text": "货车昨夜在后巷被劫，三车药材尽失，正焦急寻求帮助。", "type": "known" },
      { "flag": "merchant_zhou_talked", "text": "认出后巷刻记为浪鹏帮暗记，主动提供了货单——是卷入此案的无辜受害者。", "type": "known" },
      { "flag": "langpeng_discovered", "text": "货单背面藏有要紧线索：浪鹏帮此行并非劫货，而是在追查某个特定人物。", "type": "known" }
    ]
  }
```

- [ ] **Step 4: 验证 JSON 格式**

```bash
python3 -c "import json; data=json.load(open('src/data/profiles/chapter1.json')); print(f'总档案数: {len(data)}')"
```
Expected: `总档案数: 8`（原5 + 新增3）

- [ ] **Step 5: 运行测试确认通过**

```bash
npx vitest run tests/data/profilesIntegrity.test.ts
```
Expected: 4 tests pass（原3条 + 新增1条）

- [ ] **Step 6: 运行全量测试**

```bash
npx vitest run
```
Expected: All tests pass.

- [ ] **Step 7: 提交**

```bash
git add src/data/profiles/chapter1.json tests/data/profilesIntegrity.test.ts
git commit -m "feat: add chapter1 suspect profiles for npc_paper_seller, npc_old_beggar, npc_merchant_zhou"
```

---

### Task 4: 时间线标签已见/总数计数器

**背景：** `RightPanel.tsx` 的 `lore` 标签已有章节分组（DiamondDivider），但缺少每章已解锁条目数与总数的统计（如 `3/11`）。玩家无法知道当前章节还有多少时间线节点未触发。

**Files:**
- Modify: `src/components/layout/RightPanel.tsx:654-710`

- [ ] **Step 1: 阅读当前 lore 渲染代码**

定位 `src/components/layout/RightPanel.tsx` 第 654-710 行的 `{tab === 'lore' && (...)}` 块。关键变量：
- `timelineEntries`：已触发的条目（第168行：`TIMELINE_FLAGS.filter(e => flags.includes(e.flag))`）
- `TIMELINE_FLAGS`：全部时间线条目（第50行开始）
- 章节渲染在第670-703行的 `.map((ch) => ...)` 中

- [ ] **Step 2: 在 lore 标签顶部添加整体进度，并在每章 DiamondDivider 处显示章节计数**

将第 654-710 行的 `{tab === 'lore' && (...)}` 整块替换为：

```tsx
{tab === 'lore' && (
  <div className="space-y-5">
    {/* 整体进度 */}
    <div className="flex items-center justify-between px-1">
      <span className="text-ink/30 text-[10px] tracking-wider">案情脉络</span>
      <span className={`text-[10px] tabular-nums ${timelineEntries.length === TIMELINE_FLAGS.length ? 'text-gold/70' : 'text-ink/30'}`}>
        {timelineEntries.length}/{TIMELINE_FLAGS.length}
      </span>
    </div>
    {timelineEntries.length > 0 && (() => {
      const CHAPTER_LABELS: Record<1 | 2 | 3, string> = {
        1: '第一章·旧案',
        2: '第二章·追查',
        3: '第三章·终局',
      };
      const groups = new Map<1 | 2 | 3, typeof timelineEntries>([
        [1, []], [2, []], [3, []],
      ]);
      for (const entry of timelineEntries) {
        groups.get(entry.chapter)!.push(entry);
      }
      const chapterTotals: Record<1 | 2 | 3, number> = {
        1: TIMELINE_FLAGS.filter((e) => e.chapter === 1).length,
        2: TIMELINE_FLAGS.filter((e) => e.chapter === 2).length,
        3: TIMELINE_FLAGS.filter((e) => e.chapter === 3).length,
      };
      let globalIdx = 0;
      const totalCount = timelineEntries.length;
      return ([1, 2, 3] as const).map((ch) => {
        const entries = groups.get(ch)!;
        if (entries.length === 0) return null;
        const chapterStart = globalIdx;
        globalIdx += entries.length;
        return (
          <div key={ch}>
            <div className="flex items-center justify-between mb-1">
              <DiamondDivider label={CHAPTER_LABELS[ch]} />
              <span className={`text-[10px] tabular-nums shrink-0 ml-2 ${entries.length === chapterTotals[ch] ? 'text-gold/60' : 'text-ink/25'}`}>
                {entries.length}/{chapterTotals[ch]}
              </span>
            </div>
            <ol className="space-y-1.5 relative pl-3">
              <div className="absolute left-[5px] top-1 bottom-1 w-px bg-gold/10" />
              {entries.map((entry, i) => {
                const absIdx = chapterStart + i;
                const isLast = absIdx === totalCount - 1;
                return (
                  <li key={entry.flag} className="flex items-start gap-2">
                    <span
                      className={`shrink-0 mt-[3px] w-[6px] h-[6px] border transition-colors ${
                        isLast
                          ? 'border-gold/55 bg-gold/25'
                          : 'border-gold/20 bg-transparent'
                      }`}
                      style={{ transform: 'rotate(45deg)' }}
                    />
                    <span className={`text-[11px] leading-snug ${
                      isLast ? 'text-ink/60' : 'text-ink/30'
                    }`}>
                      {entry.text}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      });
    })()}
    {timelineEntries.length === 0 && (
      <p className="text-ink/20 text-xs pl-3 italic">案情尚无头绪</p>
    )}
  </div>
)}
```

- [ ] **Step 3: 类型检查**

```bash
cd /Users/xuli/claudeGame
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 4: 运行全量测试**

```bash
npx vitest run
```
Expected: All tests pass.

- [ ] **Step 5: 提交**

```bash
git add src/components/layout/RightPanel.tsx
git commit -m "feat: add seen/total chapter counters to lore timeline tab"
```

---

### Task 5: 存档时间戳加年份 + 覆盖确认对话框

**背景：** `SaveLoadModal.tsx` 中：
1. 时间格式 `{ month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }` 缺少年份，同一存档不同年份无法区分
2. 覆盖已有存档时直接执行，无确认步骤，容易误操作

**Files:**
- Modify: `src/components/save/SaveLoadModal.tsx`

- [ ] **Step 1: 阅读当前 SaveLoadModal.tsx**

定位以下关键行：
- 第 23 行：`const [statusMsg, setStatusMsg] = useState<string>('');`
- 第 35-61 行：`handleSave` 函数
- 第 136 行：`toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', ...})`

- [ ] **Step 2: 修复时间戳格式**

将第 136 行的：
```typescript
{new Date(slot.timestamp).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
```
改为：
```typescript
{new Date(slot.timestamp).toLocaleDateString('zh-CN', { year: '2-digit', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
```

- [ ] **Step 3: 添加 confirmOverwrite 状态**

在第 23 行 `const [statusMsg, ...]` 后，添加：

```typescript
const [confirmOverwrite, setConfirmOverwrite] = useState<number | null>(null);
```

- [ ] **Step 4: 修改 handleSave 加入覆盖检测**

将第 35-61 行的 `handleSave` 函数改为：

```typescript
const handleSave = (slotId: number) => {
  if (slotId === 0) return;
  const slot = slots.find((s) => s.id === slotId);
  if (slot?.data && confirmOverwrite !== slotId) {
    setConfirmOverwrite(slotId);
    return;
  }
  setConfirmOverwrite(null);
  const data: SaveData = {
    player: {
      name: player.name,
      template: player.template,
      strength: player.strength,
      agility: player.agility,
      wisdom: player.wisdom,
      constitution: player.constitution,
      talent: player.talent,
    },
    currentRoomId: scene.currentRoomId,
    inventory: items,
    clues: scene.clues,
    flags: scene.flags,
    questLog: scene.questLog,
    storyText: scene.storyText,
    seenDialogues: scene.seenDialogues,
    visitedRooms: scene.visitedRooms,
    foundSynthesisIds: scene.foundSynthesisIds,
  };
  const saved = saveToSlot(slotId, data);
  updateSlot(saved);
  setStatusMsg('已保存');
  setTimeout(() => { setStatusMsg(''); onClose(); }, 1200);
};
```

- [ ] **Step 5: 在状态消息区域之前，添加覆盖确认 UI**

在第 148-151 行（`{/* 状态消息 */}` 注释区）之前，插入：

```tsx
{/* 覆盖确认 */}
{mode === 'save' && confirmOverwrite !== null && (
  <div className="mb-4 px-1 py-2 border border-blood/30 bg-blood/5">
    <p className="text-[11px] text-ink/60 text-center mb-2 leading-snug">
      此槽已有存档，确认覆盖？
    </p>
    <div className="flex gap-2">
      <button
        onClick={() => handleSave(confirmOverwrite)}
        className="flex-1 py-1.5 text-xs text-blood/70 border border-blood/25 hover:border-blood/55 hover:bg-blood/8 transition-colors cursor-pointer"
      >
        覆盖
      </button>
      <button
        onClick={() => setConfirmOverwrite(null)}
        className="flex-1 py-1.5 text-xs text-ink/40 border border-gold/15 hover:border-gold/35 transition-colors cursor-pointer"
      >
        取消
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 6: 类型检查**

```bash
cd /Users/xuli/claudeGame
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 7: 运行全量测试**

```bash
npx vitest run
```
Expected: All tests pass.

- [ ] **Step 8: 提交**

```bash
git add src/components/save/SaveLoadModal.tsx
git commit -m "feat: add year to save slot timestamp and overwrite confirmation dialog"
```

---

### Task 6: 合成提示文案格式规范化

**背景：** `src/data/syntheses/chapter1.json` 中所有 `hint` 字段使用 `+` 作分隔符（如 `"毒药 + 血迹分布"`），而 chapter2/chapter3 使用 `×`（如 `"毒药残样 × 无迹方笺"`）。RightPanel 推理面板直接展示 hint 字段内容——格式不统一。

**Files:**
- Modify: `src/data/syntheses/chapter1.json`

- [ ] **Step 1: 查看当前 hint 列表**

```bash
grep '"hint"' /Users/xuli/claudeGame/src/data/syntheses/chapter1.json
```
Expected: 10 行，全部使用 `+` 分隔符。

- [ ] **Step 2: 批量替换 ` + ` 为 ` × ` 并优化文案**

将 `src/data/syntheses/chapter1.json` 中所有 hint 字段改为下列内容（完整替换列表，确保格式统一）：

| id | 新 hint |
|----|---------|
| synth_double_kill | `毒药砒霜 × 血迹分布` |
| synth_struggle_confirmed | `布料纤维 × 门锁划痕` |
| synth_tianji_motive | `染血令牌 × 天机阁名录` |
| synth_entry_exit_route | `密道地图 × 窗台绳痕` |
| synth_spy_role | `可疑住客记录 × 铜铃残片` |
| synth_scroll_mission | `半截密信 × 天机玉令` |
| synth_kite_two_steps | `鸢字密信 × 鸢组旧档` |
| synth_innkeeper_role | `宋怀义账本 × 驿字玉牌` |
| synth_langpeng_hunt | `药商货单 × 巷中拓印` |
| synth_premeditated | `预制毒茶证词 × 砒霜证据` |

逐条编辑 `src/data/syntheses/chapter1.json`，将每个 `"hint": "... + ..."` 改为对应的 `"hint": "... × ..."` 版本。

- [ ] **Step 3: 验证修改**

```bash
grep '"hint"' /Users/xuli/claudeGame/src/data/syntheses/chapter1.json
```
Expected: 10 行，全部使用 `×` 分隔符，无 `+`。

- [ ] **Step 4: 运行全量测试**

```bash
npx vitest run
```
Expected: All tests pass.

- [ ] **Step 5: 提交**

```bash
git add src/data/syntheses/chapter1.json
git commit -m "fix: standardize chapter1 synthesis hints to use × separator (matches ch2/ch3)"
```

---

### Task 7: 平板响应式断点修复（768-1024px）

**背景：** `GameLayout.tsx` 使用 `md:` 断点（≥768px）切换到三栏桌面布局。在768-1024px平板上，左侧栏176px + 右侧栏210px只剩约380px给中间故事区域，布局过于拥挤。最简修复：将桌面布局阈值从 `md`（768px）提升到 `lg`（1024px），使平板复用已有的手机单栏布局。

**Files:**
- Modify: `src/components/layout/GameLayout.tsx`

- [ ] **Step 1: 阅读当前 GameLayout.tsx**

定位 `src/components/layout/GameLayout.tsx` 中的两处断点：
- `hidden md:flex` — 桌面三栏（约第29行）
- `flex md:hidden` — 手机单栏（约第40行）

- [ ] **Step 2: 将所有 `md:` 断点改为 `lg:`**

将 `src/components/layout/GameLayout.tsx` 中：
- `"hidden md:flex w-full h-full"` → `"hidden lg:flex w-full h-full"`
- `"flex md:hidden flex-col w-full h-full"` → `"flex lg:hidden flex-col w-full h-full"`

**完整替换列表（共2处）：**

第一处（桌面三栏容器，约第29行）：
```tsx
<div className="hidden lg:flex w-full h-full">
```

第二处（移动端单栏容器，约第40行）：
```tsx
<div className="flex lg:hidden flex-col w-full h-full">
```

- [ ] **Step 3: 类型检查**

```bash
cd /Users/xuli/claudeGame
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 4: 运行全量测试**

```bash
npx vitest run
```
Expected: All tests pass.

- [ ] **Step 5: 提交**

```bash
git add src/components/layout/GameLayout.tsx
git commit -m "fix: raise desktop layout breakpoint from md(768px) to lg(1024px) for tablet usability"
```

---

## 完成后验证

```bash
cd /Users/xuli/claudeGame
npx vitest run
```
Expected: All tests pass (≥177 tests, 12 files).

```bash
git push origin main
```
