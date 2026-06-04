# 跨章蝴蝶效应 Design Spec

## Goal

让第一章的三条结局路（真相/以力/归隐）在第二、三章产生可感知的差异，第二章结局再影响第三章一条关键对话。不新增地点，零引擎改动，纯 JSON 数据层实现。

## Architecture

**数据层**：`requires.flags` / `requires.flags_absent`、`revisitEvents`、NPC `dialogues` 条件分支均已原生支持，无需修改引擎。

**展示层**：ChapterEnd 页面新增一处条件渲染（Ch1 truth_ending → Ch3 结局专属文字）。

## Effect Matrix

### Ch1 → Ch2（3处）

| Ch1 结局 flag | 位置 | 类型 | 效果 |
|---|---|---|---|
| `chapter1_truth_ending` | `east_market_entrance` revisitEvent | 新增 | 书吏认出你，grants `clue_li_mao_official_tip`，降低某审讯 requires |
| `chapter1_force_ending` | `npc_langpeng` dialogue 最高层 | 修改 | 郎鹏拒绝配合，锁死一个审讯选项（requires 不可能满足的 flag） |
| `chapter1_hermit_ending` | `npc_li_mao` dialogue 早期层 | 修改 | 李邈嘲讽"本想置身事外"，无反驳选项 |

### Ch2 → Ch3（3处）

| Ch2 结局 flag | 位置 | 类型 | 效果 |
|---|---|---|---|
| `chapter2_arrest_ending` | `npc_fei_ye` 对质前对话 | 修改 | 飞爷提到李邈落网，暗示深层关系 |
| `chapter2_release_ending` | `leyou_plain` revisitEvent | 新增 | 蒙面线人留消息，grants `clue_kite_true_identity` |
| `chapter2_join_ending` | `npc_fei_ye` 对话 | 修改 | 飞爷态度软化，解锁额外审讯选项 |

### Ch1 → Ch3 长线呼应（1处）

| Ch1 结局 flag | 位置 | 类型 | 效果 |
|---|---|---|---|
| `chapter1_truth_ending` | ChapterEnd（Ch3 真相结局） | 修改 | 条件渲染额外文字："从那家客栈的走廊开始，你就没有回过头。" |

## Detailed Content

### ① east_market_entrance revisitEvent（新增）

```json
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

新增线索 `clue_li_mao_official_tip`（`src/data/items/chapter2.json`）：
```json
{ "id": "clue_li_mao_official_tip", "name": "调令线索纸条", "description": "一个廷尉府书吏悄悄塞给你的。上面只有几个字：「郎鹏，天宝十二载，调令存档，御史台」。" }
```

持有该线索后，`npc_langpeng` 某审讯 requires 由 `interrogation_level_2` 降为 `interrogation_level_1`（在 langpeng 的 dialogues 中加 `requires.clues: ["clue_li_mao_official_tip"]` 分支）。

### ② npc_langpeng 审讯封锁（修改）

在 `npc_langpeng` dialogues 最高审讯层新增一条分支：

```json
{
  "id": "langpeng_blocked_by_force",
  "requires": {
    "flags": ["chapter1_force_ending"],
    "interrogationLevel": 3
  },
  "text": "郎鹏看你一眼，眼神收紧。「我听说过你的手段。」他不再开口。",
  "choices": [
    {
      "id": "choice_back_off",
      "label": "他不肯开口",
      "requires": { "flags": ["__never__"] },
      "result": "此路不通。",
      "grants": null
    }
  ]
}
```

`__never__` 是一个永远不会被授予的 flag，使该选项视觉上存在但无法点击（locked 样式）。

### ③ npc_li_mao 嘲讽（修改）

在 `npc_li_mao` dialogues 第一层新增条件分支（优先于普通对话展示）：

```json
{
  "id": "li_mao_taunt_hermit",
  "requires": {
    "flags": ["chapter1_hermit_ending"]
  },
  "text": "李邈斜眼看你，嘴角微扬：「听说上一桩案子，你本想置身事外？」他没有等你回答，转过身去。「可你还是来了。」",
  "choices": []
}
```

无选项——强制玩家"听完"，无法反驳。

### ④ npc_fei_ye 李邈落网（修改）

在 `npc_fei_ye` 对质前 dialogues 新增条件分支：

```json
{
  "id": "fei_ye_li_mao_arrested",
  "requires": {
    "flags": ["chapter2_arrest_ending"]
  },
  "text": "飞爷没有立刻说话。停了片刻，他才道：「李邈进了廷尉府……」他没说完，但眼神里有某种东西一闪而过。「他不该走那条路的。」",
  "choices": [
    {
      "id": "choice_ask_why",
      "label": "他们是什么关系？",
      "requires": null,
      "result": "飞爷摇摇头。「你破了案，该知道的你都知道了。」"
    }
  ]
}
```

### ⑤ leyou_plain 蒙面线人（新增 revisitEvent）

```json
{
  "id": "rev_leyou_kite_message",
  "requires": {
    "flags": ["chapter2_release_ending", "chapter3_started"],
    "flags_absent": ["kite_message_received"]
  },
  "text": "〔原野的石缝里压着一个布包。没有署名。里面是一张薄纸，上面只有一行字——「鸢，非一人。」〕",
  "grants": {
    "clues": ["clue_kite_true_identity"],
    "flags": ["kite_message_received"]
  }
}
```

新增线索 `clue_kite_true_identity`（`src/data/items/chapter3.json`）：
```json
{ "id": "clue_kite_true_identity", "name": "无名纸条", "description": "「鸢，非一人。」——字迹潦草，像是仓皇中留下的。" }
```

### ⑥ npc_fei_ye 自己人（修改）

在 `npc_fei_ye` dialogues 新增条件分支，`chapter2_join_ending` 时解锁额外选项：

```json
{
  "id": "fei_ye_insider",
  "requires": {
    "flags": ["chapter2_join_ending"]
  },
  "text": "飞爷看你一眼，语气比往常少了几分锋芒：「你算是自己人……但自己人也不能什么都知道。」",
  "choices": [
    {
      "id": "choice_insider_ask",
      "label": "那名单上的人，你都认识？",
      "requires": null,
      "result": "「认识的。」他停顿了一下，「所以才难办。」",
      "grants": { "flags": ["fei_ye_insider_dialogue_seen"] }
    }
  ]
}
```

### ⑦ ChapterEnd Ch3 真相专属文字（修改）

在 `ChapterEnd.tsx` 的 `CHAPTER3_ENDINGS` 展示逻辑中，当结局为 `chapter3_truth_ending` 且持有 `chapter1_truth_ending` flag 时，在结局文字下方追加一行：

> "从那家客栈的走廊开始，你就没有回过头。"

实现方式：在 ChapterEnd 组件中读取 `scene.flags`，条件渲染额外 `<p>` 标签。

## Files to Modify

| 操作 | 文件 |
|---|---|
| 修改 | `src/data/maps/chapter2.json`（east_market_entrance revisitEvents） |
| 修改 | `src/data/maps/chapter3.json`（leyou_plain revisitEvents） |
| 修改 | `src/data/npcs/chapter2.json`（npc_langpeng、npc_li_mao dialogues） |
| 修改 | `src/data/npcs/chapter3.json`（npc_fei_ye dialogues） |
| 修改 | `src/data/items/chapter2.json`（新增 clue_li_mao_official_tip） |
| 修改 | `src/data/items/chapter3.json`（新增 clue_kite_true_identity） |
| 修改 | `src/pages/ChapterEnd/ChapterEnd.tsx`（条件渲染额外文字） |

## Testing

现有 integrity tests 会自动验证新 item/clue ID 不悬空。需手动验证：
- Ch1 truth 路进 Ch2 → east_market 出现书吏事件
- Ch1 force 路进 Ch2 → 郎鹏审讯有锁死选项
- Ch1 hermit 路进 Ch2 → 李邈有嘲讽台词
- Ch2 release 路进 Ch3 → 乐游原出现线人包裹
- Ch2 join 路进 Ch3 → 飞爷有"自己人"对话
- Ch3 真相结局 + Ch1 truth flag → ChapterEnd 有额外一行文字
