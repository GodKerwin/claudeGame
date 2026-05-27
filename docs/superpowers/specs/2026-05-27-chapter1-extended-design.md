# 天机残卷·第一章扩展设计文档

**目标**：在不改动现有主线的前提下，新增「城郊后巷」地点与两条独立支线，引入浪鹏帮作为隐藏背景势力，增加游玩时长约 30-40%。

**架构原则**：纯 JSON 数据驱动，不改动任何引擎代码。所有新内容通过新增 room、events、npcs、items 条目实现，旗标系统管理解锁逻辑。

---

## 新地点：城郊后巷（back_alley）

**解锁条件**：`found_escape_clue`（张三已提供线索，即已触发城郊树林入口）

**在地图中的位置**：`city outskirts` 区域，从 `forest`（城郊树林）新增出口 `back_alley`。

**房间定义**：
```json
{
  "id": "back_alley",
  "name": "城郊后巷",
  "description": "客栈后侧延伸出去的一条窄巷，青砖墙壁上留着各色痕迹。白日里少有人走，只有偶尔路过的乞丐和来往的货商。",
  "interactables": ["npc_old_beggar", "npc_merchant_zhou", "evt_alley_marks", "evt_cargo_remnants"],
  "exits": ["forest"],
  "requires": { "flags": ["found_escape_clue"] }
}
```

---

## 支线一：飞爷的暗敌

### 背景叙事
飞爷（大飞帮）入住客栈前已发觉有人盯梢，但抓不到人影。后巷是对方的观察点。三年前大飞帮截了浪鹏帮一条漕运线，两帮从此结怨，浪鹏帮一直在找机会报复。

### 流程

**步骤 1**：`evt_alley_marks`（查看墙上刻记）
- 无条件可触发
- 结果文本：描述墙角处一组奇怪的刻痕，像是某种暗记
- 智慧 ≥ 6：辨认出是帮派标记风格，获得 `alley_rubbing`（巷中拓印），旗标 `alley_marks_found`
- 智慧 < 6：获得提示「可以找懂行的人看看」，获得 `alley_rubbing`，但无旗标

**步骤 2**：`npc_old_beggar`（老乞丐）对话
- 初次对话：含糊说见过刻记的人
- 需要 `has: ["tavern_wine"]`（一碗好酒）才触发关键信息
- 给酒后透露：「穿蓝衫、腰挂铜铃，是浪鹏帮的探子，最近常在这里转」
- 旗标：`beggar_told_langpeng`、`langpeng_discovered`

**步骤 3**：回找飞爷（`npc_fei_ye` 新增对话分支）
- 条件：`has: ["alley_rubbing"]` + `langpeng_discovered`（由 beggar 对话触发）
- 飞爷反应：神色一沉，说出两帮恩怨起源（漕运线争夺）
- 奖励：`dafei_inner_token`（大飞帮内部令牌），旗标 `fei_ye_trust_deepened`
- 此令牌为后续章节预留道具，本章无实际用途，仅附描述文本

### 新增内容清单
- NPC：`npc_old_beggar`（3 条对话线）
- 事件：`evt_alley_marks`
- 道具：`alley_rubbing`（线索）、`dafei_inner_token`（非线索）
- 旗标：`alley_marks_found`、`beggar_told_langpeng`、`langpeng_discovered`、`fei_ye_trust_deepened`

---

## 支线二：失踪的货单

### 背景叙事
药商周掌柜的货车昨夜在后巷被劫，时间与宋怀义遇害同一晚。劫匪翻遍货物只找一样东西——货单夹层中藏着一份天机阁相关人员名册的抄本，说明浪鹏帮也在追查同一份名单。

### 流程

**步骤 1**：`npc_merchant_zhou`（周药商）初次对话
- 无条件可见，但只说「货被劫了」
- 需要 `alley_marks_found` 旗标，才能追问「是浪鹏帮干的？」
- 松口后透露：劫匪留下纸条「名单交出来，货还你」
- 获得 `extortion_note`（勒索纸条），旗标 `merchant_zhou_talked`

**步骤 2**：`evt_cargo_remnants`（检查残余货物）
- 条件：`merchant_zhou_talked`
- 在货箱夹层发现 `merchant_manifest`（药商货单）
- 智慧 ≥ 7：发现货单背面墨迹，是人名抄录，其中两个名字与天机阁名录重合，旗标 `manifest_decoded`
- 智慧 < 7：只看出是普通货单，提示「似乎有什么被藏在里面」，获得道具但无 `manifest_decoded`

**步骤 3**：持货单求证（任选其一）
- 找 `npc_innkeeper_li_fu`（新增对话分支）：
  - 条件：`has: ["merchant_manifest"]`
  - 李福沉默，说「这些名字你最好忘掉」，旗标 `merchant_clue_confirmed`、`langpeng_active`
- 找 `npc_white_stranger`（新增对话分支）：
  - 条件：`has: ["merchant_manifest"]`
  - 白衣人道破：「浪鹏帮和大飞帮在抢同一样东西，而那样东西就在这客栈里待过」
  - 旗标 `merchant_clue_confirmed`、`langpeng_active`，同时解锁白衣人隐藏对话（关于自身立场）

### 新增内容清单
- NPC：`npc_merchant_zhou`（3 条对话线）
- 事件：`evt_cargo_remnants`
- 道具：`extortion_note`（线索）、`merchant_manifest`（线索）
- 旗标：`merchant_zhou_talked`、`manifest_decoded`、`merchant_clue_confirmed`、`langpeng_active`（两条求证路线均设置）

---

## 双线完成触发文本

**条件**：`langpeng_discovered` + `langpeng_active`（两条支线均完成）

**在后巷自动显示**（作为 storyText，无需交互）：
> 你回望这条巷子：墙上的暗记、翻乱的货箱、老乞丐含混的眼神。
>
> 大飞帮在这里，浪鹏帮也在这里。他们都知道那份名单的存在。
>
> 而你，夹在中间。

---

## 完整新增清单

| 类型 | ID | 名称 | 说明 |
|------|----|------|------|
| 地图房间 | `back_alley` | 城郊后巷 | 从 forest 解锁 |
| NPC | `npc_old_beggar` | 后巷老乞丐 | 需要好酒才肯说话 |
| NPC | `npc_merchant_zhou` | 周药商 | 被劫货物的苦主 |
| 事件 | `evt_alley_marks` | 查看墙上刻记 | 浪鹏帮暗记 |
| 事件 | `evt_cargo_remnants` | 检查残余货物 | 发现货单夹层 |
| 道具 | `alley_rubbing` | 巷中拓印 | 线索，引导找飞爷 |
| 道具 | `dafei_inner_token` | 大飞帮内部令牌 | 非线索，后续章节预留 |
| 道具 | `extortion_note` | 勒索纸条 | 线索 |
| 道具 | `merchant_manifest` | 药商货单 | 线索，含天机阁人名 |
| 对话分支 | — | 飞爷新分支 | 需 alley_rubbing |
| 对话分支 | — | 李福新分支 | 需 merchant_manifest |
| 对话分支 | — | 白衣人新分支 | 需 merchant_manifest |

## 不改动的内容

- 所有引擎代码（conditionEvaluator、eventEngine、mapEngine、saveEngine）
- 现有主线事件与结局逻辑
- 现有 NPC 基础对话结构（只追加新 dialogue 条目）
- 现有道具与旗标

## 后续章节钩子

- `dafei_inner_token`：第二章大飞帮线验证身份用
- `langpeng_active` 旗标：第二章浪鹏帮势力出场的解锁条件
- 白衣人隐藏对话中留下的「浪鹏帮帮主号称『浪王』，从不露面」——为后续主线埋线
