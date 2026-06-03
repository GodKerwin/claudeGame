# 深层审讯系统 — Design Spec

**日期：** 2026-06-03  
**目标：** 为 9 个关键 NPC（每章 3 人）引入「情绪状态机 + 行动选项」审讯系统，让玩家在对话中感受到博弈张力，NPC 有抵抗、有崩溃，信息获取需要付出策略代价。

---

## 一、核心机制

### 情绪层级（3 级）

每个审讯 NPC 有隐藏情绪状态，持久化于 `sceneStore.interrogationLevels`：

| 层级 | 名称 | 含义 |
|------|------|------|
| 0 | 警惕 | NPC 防守，信息最少 |
| 1 | 动摇 | NPC 开始松动，透露部分 |
| 2 | 招供 | NPC 全盘托出，授予关键 flag/道具 |

层级状态跨房间持久，重置仅在章节切换时发生。

### 玩家行动（3 种）

| 行动 | 规则 |
|------|------|
| 施压 | 检查玩家持有 `pushEvidence` 中任意证物 → 成功：层级 +1；无证据 → 失败：层级 -1（最低 0）|
| 迂回试探 | 永远安全，层级不变，NPC 说 `indirectText`（侧面信息，无实质进展）|
| 出示证据 | 玩家主动选择证物 → 与 `pushEvidence` 匹配则层级 +1；不匹配则无效（不惩罚）|

层级上限 2，到达后不再显示行动按钮（审讯完成）。

---

## 二、UI 设计

### 进入审讯

点击有 `interrogation.enabled` 配置且满足 `triggerFlag` 的 NPC 时，进入审讯模式——不再走「下一条未见对话」流程，改为显示当前层级状态。

### 审讯面板（替换操作区）

```
┌──────────────────────────────────┐
│ 〔审讯 · NPC名〕                  │
│ 情绪：●○○  警惕                   │
├──────────────────────────────────┤
│ 〔情绪暗示文字，斜体弱金色〕        │
│ NPC 台词（TypewriterText）        │
├──────────────────────────────────┤
│ [施压]  [迂回试探]  [出示证据 ▾]   │
├──────────────────────────────────┤
│ 暂时先问到这里                     │
└──────────────────────────────────┘
```

- 情绪指示：`●○○` / `●●○` / `●●●`（无文字标签，减少过度提示）
- 情绪暗示文字：`〔…〕` 格式（已有渲染支持）
- 出示证据展开后显示相关证物列表（复用 pendingInterrogation 组件）
- 层级 2 时：仅显示台词 + grants，无行动按钮

### 行动反馈（追加故事文本）

- 施压成功：`〖他沉默了片刻，表情松动了一丝。〗`（成长格式）
- 施压失败：`〔他的神情骤然收紧，不再看你。〕`（心理格式）
- 迂回：不加特殊文字，仅显示 `indirectText`

---

## 三、数据结构

### game.ts 扩展

```typescript
export interface InterrogationLevelData {
  level: 0 | 1 | 2;
  moodHint: string;         // 〔情绪暗示〕
  text: string;             // NPC 主要台词
  indirectText?: string;    // 迂回行动时的台词
  pushEvidence?: string[];  // 哪些证物可以推进
  grants?: ActionGrant;     // 到达此层时授予（通常只有 level 2）
}

export interface NPCInterrogation {
  enabled: boolean;
  triggerFlag?: string;                // 需持有此 flag 才能进入审讯
  levels: InterrogationLevelData[];
}

// 在 NPC interface 末尾新增：
// interrogation?: NPCInterrogation;
```

### sceneStore 扩展

```typescript
interrogationLevels: Record<string, number>;  // npcId → 0|1|2
setInterrogationLevel: (npcId: string, level: number) => void;
```

### NPC JSON 扩展示例

```json
{
  "id": "npc_innkeeper_li_fu",
  "interrogation": {
    "enabled": true,
    "triggerFlag": "innkeeper_met",
    "levels": [
      {
        "level": 0,
        "moodHint": "〔他擦着柜台，眼神没有停在你身上。〕",
        "text": "不知道，我只是个开店的，什么都不清楚。",
        "indirectText": "你随口问了几句食宿的事，他答得滴水不漏——这人见过各种场面。",
        "pushEvidence": ["blood_letter"]
      },
      {
        "level": 1,
        "moodHint": "〔他的手微微一顿，重新低头擦起柜台。〕",
        "text": "那块令牌……我见过类似的东西，但那不是我的事。",
        "indirectText": "他看了看你手里的东西，没有说话，目光却有些不稳。",
        "pushEvidence": ["innkeeper_jade", "tianji_roster"]
      },
      {
        "level": 2,
        "moodHint": "〔他放下了抹布，长叹一口气。〕",
        "text": "好，我说。这块玉牌是天机阁的信物。宋怀义来这里，是来交接一件东西的，我是中转人——已经十年了。他出事，我早就知道是迟早的事。",
        "grants": { "flags": ["innkeeper_secret_revealed"], "clues": ["innkeeper_jade"] }
      }
    ]
  }
}
```

---

## 四、9 个关键 NPC 列表

| NPC | 章节 | 触发条件 | Level 2 授予 |
|-----|------|----------|--------------|
| npc_innkeeper_li_fu | Ch1 | innkeeper_met | innkeeper_secret_revealed |
| npc_cook_wang | Ch1 | cook_talked | cook_full_testimony, left_hand_scar_known |
| npc_fei_ye | Ch1 | dafei_contact_made | fei_ye_trust_deepened, kite_identity_clue |
| npc_langpeng_scout | Ch2 | langpeng_discovered | langpeng_full_confession, langpeng_trail |
| npc_li_mao | Ch2 | langpeng_trail | li_mao_exposed, tianji_deeper_intel |
| npc_wujue | Ch2 | wujue_suspicious | wujue_tianji_revealed |
| npc_wujue | Ch3 | chapter3_started | wujue_accident_truth_known |
| npc_tianji_contact | Ch3 | tianji_safehouse_location_known | tianji_trust_gained |
| npc_fei_ye | Ch3 | fei_ye_identity_confirmed | deeper_threat_revealed |

---

## 五、文件改动

| 操作 | 文件 | 说明 |
|------|------|------|
| 修改 | `src/types/game.ts` | 新增 InterrogationLevelData, NPCInterrogation，NPC 加可选字段 |
| 修改 | `src/store/sceneStore.ts` | 新增 interrogationLevels + setter |
| 修改 | `src/pages/Game/Game.tsx` | NPC 点击分流 + handleInterrogationAction |
| 修改 | `src/components/layout/CenterPanel.tsx` | 审讯面板渲染 |
| 修改 | `src/data/npcs/chapter1.json` | 3 个 NPC 加 interrogation 字段 |
| 修改 | `src/data/npcs/chapter2.json` | 3 个 NPC 加 interrogation 字段 |
| 修改 | `src/data/npcs/chapter3.json` | 3 个 NPC 加 interrogation 字段（wujue + tianji_contact；fei_ye 在 ch1.json）|

---

## 六、不做的事

- 不加 NPC「说谎」检测（C 方案，后续扩展）
- 不改非关键 NPC 的对话逻辑
- 不做审讯失败的永久信息封锁（B 方案：降级而非封锁）
- 审讯层级不计入结局判断（现有 flag 体系覆盖）
