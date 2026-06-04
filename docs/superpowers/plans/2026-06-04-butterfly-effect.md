# 跨章蝴蝶效应 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让第一章三条结局路在第二、三章产生可感知差异，共 7 处新内容，零引擎改动，纯 JSON 数据 + 1 处 TSX 条件渲染。

**Architecture:** 复用现有 `revisitEvents[].requires`（地图层）和 NPC `dialogues[].condition`（NPC 层）做条件控制；ChapterEnd.tsx 新增一个 flag 条件渲染块。所有新 item/clue 需同步写入对应 items JSON 文件，否则 integrity tests 会失败。

**Tech Stack:** TypeScript + React 18 + Zustand；数据格式参考 `src/data/maps/chapter2.json`（revisitEvents）和 `src/data/npcs/chapter2.json`（dialogues condition 字段）。

---

## 文件清单

| 操作 | 文件 |
|---|---|
| 修改 | `src/data/maps/chapter2.json`（east_market_entrance.revisitEvents 追加） |
| 修改 | `src/data/maps/chapter3.json`（leyou_plain.revisitEvents 追加） |
| 修改 | `src/data/npcs/chapter2.json`（npc_langpeng_scout、npc_li_mao dialogues 追加） |
| 修改 | `src/data/npcs/chapter1.json`（npc_fei_ye dialogues 追加，fei_ye 跨章复用） |
| 修改 | `src/data/items/chapter2.json`（追加 clue_li_mao_official_tip） |
| 修改 | `src/data/items/chapter3.json`（追加 clue_kite_true_identity） |
| 修改 | `src/pages/ChapterEnd/ChapterEnd.tsx`（条件渲染额外文字） |

---

## 重要格式说明（implementer 必读）

**revisitEvents** 条件字段格式（`src/data/maps/chapter2.json` 惯例）：
```json
{
  "id": "rev_xxx",
  "requires": { "flags": ["flag_a"], "flags_absent": ["flag_b"] },
  "text": "〔…〕",
  "grants": { "flags": ["flag_b"], "clues": ["clue_id"] }
}
```

**NPC dialogues** 条件字段格式（`src/data/npcs/chapter2.json` 惯例）：
```json
{
  "id": "dialogue_id",
  "condition": { "flags": ["flag_a"], "flags_absent": ["flag_b"] },
  "text": "…",
  "choices": [...],
  "grants": { "flags": ["..."] }
}
```

注意：revisitEvents 用 `requires`，NPC dialogues 用 `condition`，两者不能混用。

---

## Task 1：Ch2 items + east_market_entrance revisitEvent

**Files:**
- Modify: `src/data/items/chapter2.json`
- Modify: `src/data/maps/chapter2.json`

- [ ] **Step 1.1：在 chapter2 items 追加新线索**

打开 `src/data/items/chapter2.json`，在数组末尾（最后一个 `}` 之后、`]` 之前）追加：

```json
,
{
  "id": "clue_li_mao_official_tip",
  "name": "调令线索纸条",
  "description": "一个廷尉府书吏悄悄塞给你的。上面只有几个字：「郎鹏，天宝十二载，调令存档，御史台」。"
}
```

- [ ] **Step 1.2：在 east_market_entrance 的 revisitEvents 追加新事件**

打开 `src/data/maps/chapter2.json`，找到 `"id": "east_market_entrance"` 的 room 对象，找到其 `"revisitEvents"` 数组，在现有事件之后追加（注意保留数组结构，在末尾元素 `}` 后加逗号再追加）：

```json
,
{
  "id": "rev_east_market_official_tip",
  "requires": {
    "flags": ["chapter1_truth_ending", "chapter2_started"],
    "flags_absent": ["li_mao_official_tip_received"]
  },
  "text": "〔一个穿公服的书吏走近你，压低声音：「你就是破了客栈案子的那位？李参军与郎鹏之间，有一份调令，你若能找到……」他把一张折叠的纸塞进你手里，转身消失在人群中。〕",
  "grants": {
    "clues": ["clue_li_mao_official_tip"],
    "flags": ["li_mao_official_tip_received"]
  }
}
```

- [ ] **Step 1.3：JSON 格式验证**

```bash
npx vitest run tests/data/chapter2Integrity.test.ts
```

期望：全部 pass（新 clue ID 已在 items 中注册）

- [ ] **Step 1.4：Commit**

```bash
git add src/data/items/chapter2.json src/data/maps/chapter2.json
git commit -m "data: Ch1 truth→Ch2 书吏线索 revisitEvent + clue item"
```

---

## Task 2：Ch2 NPCs — 郎鹏力量封锁 + 李邈归隐嘲讽

**Files:**
- Modify: `src/data/npcs/chapter2.json`

- [ ] **Step 2.1：给 npc_langpeng_scout 追加 force_ending 封锁对话**

打开 `src/data/npcs/chapter2.json`，找到 `"id": "npc_langpeng_scout"` 的对象，在其 `"dialogues"` 数组末尾追加：

```json
,
{
  "id": "langpeng_blocked_by_force",
  "condition": {
    "flags": ["chapter1_force_ending"],
    "flags_absent": ["langpeng_blocked_shown"]
  },
  "text": "郎鹏看你一眼，眼神收紧。「我听说过你的手段。」他不再开口，往后退了半步，一句话也不肯多说。",
  "choices": [
    {
      "id": "choice_back_off",
      "label": "他不肯开口",
      "condition": { "flags": ["__never__"] },
      "result": "此路不通。",
      "grants": null
    }
  ],
  "grants": { "flags": ["langpeng_blocked_shown"] }
}
```

> `__never__` 是一个永远不会被赋予的 flag，使该选项在视觉上存在但无法触发（locked 样式）。

- [ ] **Step 2.2：给 npc_li_mao 追加 hermit_ending 嘲讽对话**

在同一文件，找到 `"id": "npc_li_mao"` 的对象，在 `"dialogues"` 数组**开头**（第一个元素之前）插入（作为第一条，确保优先触发）：

```json
{
  "id": "li_mao_taunt_hermit",
  "condition": {
    "flags": ["chapter1_hermit_ending"],
    "flags_absent": ["li_mao_hermit_taunt_shown"]
  },
  "text": "李邈斜眼看你，嘴角微扬：「听说上一桩案子，你本想置身事外？」他没有等你回答，转过身去。「可你还是来了。」",
  "choices": [],
  "grants": { "flags": ["li_mao_hermit_taunt_shown"] }
},
```

> `choices: []` 表示无选项，玩家只能看完——强化被迫卷入的无力感。

- [ ] **Step 2.3：运行测试**

```bash
npx vitest run tests/data/chapter2Integrity.test.ts
```

期望：全部 pass

- [ ] **Step 2.4：Commit**

```bash
git add src/data/npcs/chapter2.json
git commit -m "data: Ch1 force→郎鹏封锁 / Ch1 hermit→李邈嘲讽"
```

---

## Task 3：Ch3 items + leyou_plain 线人包裹

**Files:**
- Modify: `src/data/items/chapter3.json`
- Modify: `src/data/maps/chapter3.json`

- [ ] **Step 3.1：在 chapter3 items 追加新线索**

打开 `src/data/items/chapter3.json`，在数组末尾追加：

```json
,
{
  "id": "clue_kite_true_identity",
  "name": "无名纸条",
  "description": "「鸢，非一人。」——字迹潦草，像是仓皇中留下的。"
}
```

- [ ] **Step 3.2：在 leyou_plain 的 revisitEvents 追加线人事件**

打开 `src/data/maps/chapter3.json`，找到 `"id": "leyou_plain"` 的 room，在其 `"revisitEvents"` 数组末尾追加：

```json
,
{
  "id": "rev_leyou_kite_message",
  "requires": {
    "flags": ["chapter2_release_ending", "chapter3_started"],
    "flags_absent": ["kite_message_received"]
  },
  "text": "〔高地的石缝里压着一个布包。没有署名。里面是一张薄纸，上面只有一行字——「鸢，非一人。」〕",
  "grants": {
    "clues": ["clue_kite_true_identity"],
    "flags": ["kite_message_received"]
  }
}
```

- [ ] **Step 3.3：运行测试**

```bash
npx vitest run tests/data/chapter3Integrity.test.ts
```

期望：全部 pass

- [ ] **Step 3.4：Commit**

```bash
git add src/data/items/chapter3.json src/data/maps/chapter3.json
git commit -m "data: Ch2 release→乐游原线人 revisitEvent + clue item"
```

---

## Task 4：npc_fei_ye Ch2 结局反馈对话

**Files:**
- Modify: `src/data/npcs/chapter1.json`（fei_ye 跨章复用，对话存于此文件）

- [ ] **Step 4.1：追加 chapter2_arrest_ending 对话**

打开 `src/data/npcs/chapter1.json`，找到 `"id": "npc_fei_ye"` 的对象，在 `"dialogues"` 数组末尾追加：

```json
,
{
  "id": "fei_ye_li_mao_arrested",
  "condition": {
    "flags": ["chapter2_arrest_ending", "chapter3_started"],
    "flags_absent": ["fei_ye_arrest_reaction_shown"]
  },
  "text": "飞爷没有立刻说话。停了片刻，他才道：「李邈进了廷尉府……」他没说完，但眼神里有某种东西一闪而过。「他不该走那条路的。」",
  "choices": [
    {
      "id": "choice_ask_why",
      "label": "他们是什么关系？",
      "condition": null,
      "result": "飞爷摇摇头。「你破了案，该知道的你都知道了。」",
      "grants": { "flags": ["fei_ye_arrest_reaction_shown"] }
    }
  ]
}
```

- [ ] **Step 4.2：追加 chapter2_join_ending 对话**

在同一 npc_fei_ye 的 dialogues 末尾继续追加：

```json
,
{
  "id": "fei_ye_insider",
  "condition": {
    "flags": ["chapter2_join_ending", "chapter3_started"],
    "flags_absent": ["fei_ye_insider_shown"]
  },
  "text": "飞爷看你一眼，语气比往常少了几分锋芒：「你算是自己人……但自己人也不能什么都知道。」",
  "choices": [
    {
      "id": "choice_insider_ask",
      "label": "那名单上的人，你都认识？",
      "condition": null,
      "result": "「认识的。」他停顿了一下，「所以才难办。」",
      "grants": { "flags": ["fei_ye_insider_shown"] }
    }
  ]
}
```

- [ ] **Step 4.3：运行测试**

```bash
npx vitest run tests/data/chapter1Integrity.test.ts
```

期望：全部 pass

- [ ] **Step 4.4：Commit**

```bash
git add src/data/npcs/chapter1.json
git commit -m "data: Ch2 arrest/join→飞爷专属对话反馈"
```

---

## Task 5：ChapterEnd.tsx — Ch1 真相路长线呼应

**Files:**
- Modify: `src/pages/ChapterEnd/ChapterEnd.tsx`

- [ ] **Step 5.1：读取文件，定位修改位置**

打开 `src/pages/ChapterEnd/ChapterEnd.tsx`，找到 `const isChapter3 = scene.flags.includes('chapter3_started');` 这行（约第 91 行），以及 `const endingText = ...` 块。

- [ ] **Step 5.2：在 endingText 计算块之后追加条件额外文字**

找到这段（约第 99-105 行）：
```typescript
  const endingText = endingFlag
    ? isChapter3
      ? CHAPTER3_ENDINGS[endingFlag]
      : isChapter2
      ? CHAPTER2_ENDINGS[endingFlag]
      : CHAPTER1_ENDINGS[endingFlag]
    : '';
```

在其之后追加：
```typescript
  const ch3TruthEcho =
    endingFlag === 'chapter3_truth_ending' && scene.flags.includes('chapter1_truth_ending')
      ? '从那家客栈的走廊开始，你就没有回过头。'
      : null;
```

- [ ] **Step 5.3：在 lines 数组中插入 ch3TruthEcho**

找到 `const lines = useMemo(` 块：
```typescript
  const lines = useMemo(
    () =>
      [
        chapterTitle,
        endingText,
        ...(clueItems.length > 0 ? ['【你所掌握的线索】'] : []),
        ...clueItems.map((item) => `· ${item.name}`),
      ].filter(Boolean),
    [chapterTitle, endingText, clueItems]
  );
```

改为：
```typescript
  const lines = useMemo(
    () =>
      [
        chapterTitle,
        endingText,
        ...(ch3TruthEcho ? [ch3TruthEcho] : []),
        ...(clueItems.length > 0 ? ['【你所掌握的线索】'] : []),
        ...clueItems.map((item) => `· ${item.name}`),
      ].filter(Boolean),
    [chapterTitle, endingText, ch3TruthEcho, clueItems]
  );
```

- [ ] **Step 5.4：给 ch3TruthEcho 行加专属样式**

在 lines.map 渲染块中，找到 `const isClueHeader = line === '【你所掌握的线索】';` 这行，在下方追加：

```typescript
            const isEcho = line === ch3TruthEcho;
```

然后在 `<p>` 的 className 判断链中，在 `isClueHeader` 分支之前插入 isEcho 分支：

```typescript
                  isEcho
                    ? 'text-gold/45 text-[12px] tracking-[0.15em] italic text-center'
                    :
```

- [ ] **Step 5.5：TypeScript 编译验证**

```bash
npx tsc --noEmit
```

期望：0 errors

- [ ] **Step 5.6：运行全量测试**

```bash
npx vitest run
```

期望：228 tests passed（或更多，如 integrity tests 新增了项目）

- [ ] **Step 5.7：Commit**

```bash
git add src/pages/ChapterEnd/ChapterEnd.tsx
git commit -m "feat: Ch3 真相结局 + Ch1 真相路长线呼应文字"
```

---

## Task 6：Push + 手动验证清单

- [ ] **Step 6.1：Push**

```bash
git push origin main
```

- [ ] **Step 6.2：手动验证（浏览器）**

**Ch1 → Ch2 效果：**
- [ ] 以 `chapter1_truth_ending` 进入第二章 → 进入东市入口 → 出现书吏文字事件，触发后背包有「调令线索纸条」
- [ ] 以 `chapter1_force_ending` 进入第二章 → 与郎鹏审讯 → 某层出现"他不肯开口"锁定选项（无法点击）
- [ ] 以 `chapter1_hermit_ending` 进入第二章 → 与李邈对话 → 首次出现嘲讽台词，无反驳选项

**Ch2 → Ch3 效果：**
- [ ] 以 `chapter2_release_ending` 进入第三章 → 乐游原出现石缝布包事件，触发后有「无名纸条」线索
- [ ] 以 `chapter2_arrest_ending` 进入第三章 → 飞爷对话出现李邈落网反应（"他不该走那条路"）
- [ ] 以 `chapter2_join_ending` 进入第三章 → 飞爷对话出现"自己人"专属对话

**Ch1 → Ch3 长线：**
- [ ] 同时持有 `chapter1_truth_ending` + 达成 `chapter3_truth_ending` → ChapterEnd 页面结局文字下方出现斜体行："从那家客栈的走廊开始，你就没有回过头。"
