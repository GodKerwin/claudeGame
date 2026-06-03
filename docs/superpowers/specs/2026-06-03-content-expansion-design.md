# 三章内容扩容设计文档

**目标：** 填充二三章内容密度差距，为全三章添加属性成长系统，清理第一章孤儿道具，新增 6 个地点，并保证所有剧情路径可达。

**架构：** 纯数据扩容为主，引擎代码改动极少（仅 CenterPanel 渲染属性成长提示样式），其余全部为 JSON 数据新增/修改与测试用例补充。

**技术栈：** React 18 + TypeScript + Zustand + Vitest，数据层 JSON，引擎层 `conditionEvaluator.ts` / `hintEngine.ts`

---

## 一、属性成长系统

### 机制

现有基础架构已就位：`PlayerStats`（strength/agility/wisdom/constitution）、`incrementStat`、`ActionGrant` 的属性字段、`conditionEvaluator` 的属性门槛判断。**无需改动引擎**，只需在数据层填充内容，并在 CenterPanel 识别成长提示格式。

### 提示渲染格式

成长触发时，`grants.storyText` 追加一条特殊前缀文字（如 `[GROWTH]…`），CenterPanel 识别后以淡金色斜体小字渲染，与正文区分。不出现属性名称或数字，纯叙事短句。

示例：
> *此番经历，令你对人心的把握更深了一分。*

### 全三章成长节点总表

| 章节 | 触发位置 | 触发条件 | 属性 | 提示文字 |
|------|---------|---------|------|---------|
| 第一章 | 大堂 revisitEvent | `synth_double_kill` flag | 智慧 +1 | 死亡的真相往往藏在两件事的交叠处。你开始习惯这种目光。 |
| 第一章 | 废弃宅院 revisitEvent | `synth_tianji_motive` flag | 智慧 +1 | 十年前的棋局，今日才露出轮廓。这种感知，将在日后派上用场。 |
| 第一章 | 读《无痕步》残本 | 持有 `wuxue_wuhen_bu` | 敏捷 +1 | 步法无痕，在于心先于足。你将这句话记在了身体里。 |
| 第一章 | 读《鬼步连环》秘籍 | 持有 `wuxue_gui_bu_lianhuan` | 体质 +1 | 连环之势，以不动应万动。你感到骨骼与呼吸之间多了一分从容。 |
| 第二章 | 永宁坊夜市 | 成功尾随探子进入（`agility >= 7` 或持有 `langpeng_hideout_intel`） | 敏捷 +1 | 暗处跟人，靠的不是速度，是对方的节奏。你已学会听那个节奏。 |
| 第二章 | 御史台外街 | 捕快读完完整旧档（官威行动完成） | 智慧 +1 | 那些被刻意遗忘的名字，此刻在你脑海中清晰起来。 |
| 第二章 | 朱雀大街茶肆 | 持有 `li_mao_rumor_record` + `missing_persons_notice` 推理成功 | 智慧 +1 | 碎片开始成形，你看见了那张网更大的轮廓。 |
| 第三章 | 乐游原 | 任意职业静读石刻（道士望气优先） | 智慧 +1 | 站在高处，你第一次看见了这件事的全貌——不是一桩命案，是一代人的选择。 |
| 第三章 | 廷尉府外院 | 甩脱跟踪者（`constitution >= 7` 或 `agility >= 7`） | 体质 +1 | 你察觉到那双眼睛的瞬间，身体已经先于思维做出了反应。 |
| 第三章 | 天机旧宅·复归 | 读飞爷未寄出的信 | 智慧 +1 | 二十年。他一直在等一个足够聪明的人，走到这里来。 |

**全局上限：** 三章合计最多 +9（实际因路径差异约 +6~9）。单属性上限 12，初始值 6，不会破坏职业差异平衡。

### 属性门槛行动（跨章反馈）

| 位置 | 条件 | 解锁内容 |
|------|------|---------|
| 第二章 御史台外街 | `wisdom >= 7` | 读出旧档深层含义，获得 `imperial_pursuit_order` 完整版本 |
| 第三章 无迹和尚 | `wisdom >= 8` | 新对话 `wujue_deepest_secret`：二十年前事故是人为制造 |
| 第三章 飞爷 | `wisdom >= 8` + 持有 `leyou_inscription` | 新对话 `fei_ye_upper_truth`：飞爷说出更上层那个人的存在 |
| 第三章 廷尉府外院 | `constitution >= 7` 或 `agility >= 7` | 甩脱跟踪者，体质 +1，否则需付出其他代价（flag 标记） |

---

## 二、第一章孤儿道具清理

### 新增合成（3 个）

**`synth_scroll_fragments`**
- itemA: `cellar_fragment`（密室残卷碎片）
- itemB: `forest_fragment`（树林残卷碎片）
- result: 地窖与树林的残卷碎片拼合，还原宋怀义此行携带的完整情报——他带来的不止名单，还有天机阁建阁档案节选。这份内容，正是「鸢」此行真正要销毁的东西。
- hint: 密室碎片 × 树林碎片
- pivotal: false

**`synth_crime_scene_full`**
- itemA: `footprint_clue`（双重脚印分析）
- itemB: `blood_pattern_sketch`（血迹分布手绘）
- result: 脚印走向与血迹分布完整重建凶案动线：凶手从门口进入，宋怀义先向后退跌倒，随后被制住。整个过程不超过一刻钟——与 synth_double_kill 互补，形成完整现场还原。
- hint: 脚印分析 × 血迹手绘
- pivotal: false

**`synth_medical_premeditation`**
- itemA: `medical_report`（验尸诊断书）
- itemB: `fiber_match_evidence`（布料纤维比对结论）
- result: 验尸报告与纤维比对交叉印证：宋怀义挣扎时间极短，凶手体型壮硕且受过专业训练，不是普通帮派打手。结合浪鹏帮探子的胆怯表现——动手的那个人，来自更深处。
- hint: 验尸报告 × 纤维比对
- pivotal: false

### 接入属性成长

- `wuxue_wuhen_bu`：获得后可触发"阅读"行动，grants 敏捷 +1（见成长节点表）
- `wuxue_gui_bu_lianhuan`：获得后可触发"阅读"行动，grants 体质 +1（见成长节点表）

### 接入跨章条件

- `drunk_testimony`（醉汉证词）：第二章朱雀大街茶肆，持有时说书人对话多一个选项，提早获得 `li_mao_cleansing_intel`
- `extortion_note`（勒索纸条）：第二章永宁坊夜市，持有时销赃掌柜认出浪鹏帮手法，无需飞贼天赋也可开口

### 删除道具（3 个）

以下道具无任何下游引用，直接从 `src/data/items/chapter1.json` 删除：
- `wine_jar_iron_plate`（酒坛底铁片）
- `forest_direction_mark`（树皮刀痕记号）
- `killer_footprint_analysis`（凶手步法分析）

删除前需验证这 3 个 ID 不在任何 `requires.has` 或 `grants.items` 字段中（已确认无下游引用）。

---

## 三、第二章新增地点

### 地点一：永宁坊夜市 `yongning_nightmarket`

**类型：** 可选  
**叙事定位：** 浪鹏帮的线下销赃场所，暗货流通之地。玩家追查浪鹏帮资金链时自然引入。  
**入口：** 东市入口新增出口，需 `langpeng_discovered` flag  
**出口：** 回东市入口

**NPC：** `npc_nightmarket_fence`（销赃掌柜）
- 对话1 `fence_first_meet`：默认冷淡，不接待生人
- 对话2 `fence_thief_open`：requires talent=`三教九流`，接头用语打开话匣子
- 对话3 `fence_extortion_open`：requires `has: [extortion_note]`，认出浪鹏帮勒索风格，主动开口
- 对话4 `fence_ledger_trade`：requires `fence_talk_opened` flag，交换信息获得暗账
- 对话5 `fence_langpeng_backstory`：requires `nightmarket_ledger` 在 inventory，补充李邈委托链条

**道具：**
- `nightmarket_ledger`（夜市暗账）：浪鹏帮近期销赃记录，天机令牌流转痕迹，`clue: true`
- `concealed_dagger`（袖中短刃）：飞贼专属可购入，后续行动道具

**Events：**
- `evt_nightmarket_tail`：尾随浪鹏帮探子进入夜市。requires `langpeng_discovered`。
  - 行动1（默认）：贴墙跟进 → grants `fence_talk_opened` flag
  - 行动2（requires agility >= 7 OR has: langpeng_hideout_intel）：精准尾随不被察觉 → grants `fence_talk_opened` + `agility_growth_nightmarket` flag（触发敏捷+1）

**revisitEvents：** `rev_nightmarket_langpeng_return`（requires `langpeng_trail` flag）：再次来访时夜市气氛变化，掌柜透露浪鹏帮已开始撤人

**影响结局：** 持有 `nightmarket_ledger` + `black_channel_intel` 时，`chapter2_join_ending` 结局增加"你已摸清这张网的边缘"段落

---

### 地点二：御史台外街 `censorate_street`

**类型：** 可选  
**叙事定位：** 官方追查压力的具象化场所，廷尉府旧案档案所在地。  
**入口：** 皇城茶馆新增出口，需 `li_mao_background` flag  
**出口：** 回皇城茶馆

**NPC：** `npc_archive_clerk`（档案小吏）
- 对话1 `clerk_first_meet`：官僚气重，不理闲人
- 对话2 `clerk_intimidate`：requires talent=`官威`，直接进入档案室
- 对话3 `clerk_qi_warning`：requires talent=`望气观相`，感知到档案室有人暗中监视，触发隐藏叙事段落
- 对话4 `clerk_bribe`：其他职业，贿赂后获得部分信息（旧档残缺版本）
- 对话5 `clerk_after_file`：requires `censorate_old_file` 在 inventory，补充旧案背景

**道具：**
- `censorate_old_file`（廷尉旧档）：二十年前天机旧案官方记录，被刻意归档遗忘，`clue: true`
- `imperial_pursuit_order`（追查令副本）：证明廷尉府当年主动追杀天机成员。捕快获得完整版（requires wisdom >= 7），其他职业获得残缺版

**Events：**
- `evt_archive_room`：进入档案室（捕快专属）→ 获得完整旧档 + 触发智慧+1
- `evt_qi_surveillance`：道士专属感知事件 → 发现监视者，触发隐藏叙事，grants `surveillance_detected` flag

**影响结局：** 持有完整版 `imperial_pursuit_order` → `chapter2_arrest_ending` 增加"廷尉府自身难辞其咎"段落

---

### 地点三：朱雀大街茶肆 `zhuque_teahouse_st`

**类型：** 可选（无前置条件，第二章最早可达）  
**叙事定位：** 长安消息最灵通的地方，街谈巷议里藏着李邈的另一面。  
**入口：** 东市入口直接可达（无需 flag）  
**出口：** 回东市入口

**NPC：** `npc_street_storyteller`（街头说书人）
- 对话1 `storyteller_first_meet`：热情但信息零散
- 对话2 `storyteller_peer`：requires talent=`耳报神`，同行相认，主动透露 `li_mao_cleansing_intel`
- 对话3 `storyteller_drunk_ref`：requires `has: [drunk_testimony]`，认出往事客栈相关，额外开口
- 对话4 `storyteller_reward`：needs `reward_notice` 在 inventory，结合告示讨论画像特征
- 对话5 `storyteller_synthesis`：requires `li_mao_rumor_record` + `missing_persons_notice` 均在 inventory，触发推理合成条件

**道具：**
- `li_mao_rumor_record`（李邈风评录）：坊间传言拼凑的李邈人脉网络，`clue: true`
- `missing_persons_notice`（失踪告示）：近期天机旧部特征吻合的失踪者名单，`clue: true`

**Events：**
- `evt_teahouse_synthesis`：requires `li_mao_rumor_record` + `missing_persons_notice`，触发推理行动 → grants `li_mao_cleansing_confirmed` flag + 智慧+1

**影响结局：** 持有 `missing_persons_notice` 时，`chapter2_release_ending` 增加"那些失踪的名字，你没能救到"叙事层

---

### 第二章地图出口更新

```
东市入口
  ├── 回春堂（原有）
  ├── 西市古玩铺（原有）
  ├── 朱雀大街茶肆（新，无前置）
  └── 永宁坊夜市（新，needs langpeng_discovered）

皇城茶馆（原有）
  └── 御史台外街（新，needs li_mao_background）
```

---

## 四、第三章新增地点

### 第三章现有NPC补充

**无迹和尚**新增对话 `wujue_deepest_secret`：
- requires: `wisdom >= 8`
- 内容：无迹主动说出二十年前那批货出事的真正原因——不是意外，是有人故意制造的。这句话为 `chapter3_truth_ending` 增加分量。

**飞爷**新增对话 `fei_ye_upper_truth`：
- requires: `wisdom >= 8` + `has: [leyou_inscription]`
- 内容：飞爷第一次用平等的语气说话，承认他知道更上层的人是谁，但选择保护那个人——因为那个人也在保护某些人。
- 影响：`chapter3_standoff_ending` 和 `chapter3_join_ending` 各增加一段更深的收尾文字

---

### 地点一：乐游原 `leyou_plain`

**类型：** 可选  
**叙事定位：** 长安东南高地，俯瞰全城。天机阁某位创立者留下的石刻，记录立阁真实动机。第三章的节奏缓冲点。  
**入口：** 飞爷故居新增出口，无前置条件  
**出口：** 回飞爷故居

**NPC：** `npc_leyou_wanderer`（过路隐者）
- 对话1 `wanderer_brief`：短暂出现，说一句意味深长的话后离去（不可再触发）
- 仅一次性出现，无条件对话

**道具：**
- `leyou_inscription`（乐游石刻拓印）：天机阁创立者亲笔，记录"吾辈所护，非权非财，乃不该死之人"，`clue: true`
- `leyou_vista_note`（望城手记）：道士专属，望气感知长安气场异常聚集点（指向廷尉府方向），`clue: true`

**Events：**
- `evt_stone_inscription`：静读石刻
  - 行动1（所有职业）：拓印碑文 → grants `leyou_inscription` + 智慧+1
  - 行动2（requires talent=`望气观相`）：加做望气 → 额外 grants `leyou_vista_note`
- `evt_leyou_overlook`：俯瞰长安，纯叙事事件，grants `leyou_overlooked` flag

**影响结局：** 持有 `leyou_inscription` 解锁飞爷 `fei_ye_upper_truth` 对话；`chapter3_truth_ending` 结局增加石刻原文作为收尾

---

### 地点二：廷尉府外院 `censorate_outer`

**类型：** 强推荐（`chapter3_truth_ending` 路径的关键节点，其他路径可绕过）  
**叙事定位：** 提交天机创立卷，推动旧案官方重启。  
**入口：** 天机安宅新增出口，需 `chapter3_truth_path` flag（truth ending 前置行动完成后自动获得）  
**出口：** 回天机安宅

**NPC：** `npc_censorate_senior`（廷尉主事）
- 对话1 `senior_first_meet`：老练谨慎，不轻易表态
- 对话2 `senior_official_channel`：requires talent=`官威`，直接谈判，承诺"此案绝不压下"
- 对话3 `senior_submit`：其他职业，通过中间人递交，措辞更模糊但结果相同
- 对话4 `senior_receipt`：grants `case_reopened_receipt`

**道具：**
- `case_reopened_receipt`（重启案件凭证）：提交创立卷后获得，证明旧案进入官方程序，`clue: true`

**Events：**
- `evt_censorate_ambush`：在廷尉府附近被人跟踪
  - 行动1（requires constitution >= 7 OR agility >= 7）：成功甩脱 → grants `tail_evaded` flag + 体质+1
  - 行动2（默认）：被迫迂回绕路 → grants `tail_noticed` flag（影响结局文字，不卡线）

**影响结局：** 持有 `case_reopened_receipt` → `chapter3_truth_ending` 结局增加两段，名单上的人"终于可以不再躲藏"有具体官方背书

---

### 地点三：天机旧宅·复归 `tianji_ruins_ch3`

**类型：** 可选（情感性地点，全游戏情感高点之一）  
**叙事定位：** 第一章的废弃宅院（第三章新建独立房间，描述回到同一地点），飞爷在此留下一封从未寄出的信。  
**入口：** 飞爷故居新增出口，需 `fei_ye_identity_confirmed` flag  
**出口：** 回飞爷故居

**NPC：** 无

**道具：**
- `fei_ye_letter_ch3`（飞爷未寄出的信）：收信人写着"韩朔"。正文只有一句："若你看到此信，说明我已不在，名单交予来人。"与现有 `unsent_letter` 印证，但这封是更早的版本。`clue: true`
- `old_mansion_revisit_clue`（旧宅重访线索）：道士专属，望气感知旧宅残留气场，发现二十年前此处事件与宋怀义案的直接关联，`clue: true`

**Events：**
- `evt_fei_ye_letter`：在书桌底部发现信件
  - 行动1（所有职业）：取出阅读 → grants `fei_ye_letter_ch3` + 智慧+1
  - 行动2（requires talent=`望气观相`）：加做望气 → 额外 grants `old_mansion_revisit_clue`
- `evt_ruins_atmosphere`：纯叙事环境事件，感受旧宅氛围

**影响结局：** 持有 `fei_ye_letter_ch3` 时，三个第三章结局在印章出现前各增加一行飞爷信中原文，作为全故事情感收束

---

### 第三章地图出口更新

```
大雁塔下（原有）
  └── 天机安宅（原有）
        ├── 飞爷故居（原有）
        │     ├── 乐游原（新，无前置）
        │     └── 天机旧宅·复归（新，needs fei_ye_identity_confirmed）
        └── 廷尉府外院（新，needs chapter3_truth_path）

曲江亭（原有，最终对决）
```

---

## 五、测试策略

### 新建文件

**`tests/data/endingReachability.test.ts`**

验证所有 6 个结局从初始状态出发路径可达，含：
- 最短路径（不走任何可选地点）可达验证
- 完整路径（经过所有相关可选地点）可达验证
- `chapter3_truth_ending` 必须经过 `censorate_outer`，否则测试失败
- 每个结局测试覆盖至少 2 种职业（捕快 + 飞贼）

**`tests/engine/statGrowth.test.ts`**

- `incrementStat` 不超过上限 12
- 三章合计成长不超过 10（防止数据配置错误）
- 属性门槛行动在恰好满足/不满足临界值时 `evaluate()` 结果正确
- GROWTH 提示文字格式校验

### 扩展现有文件

**`tests/data/chapter1Integrity.test.ts`**
- 3 个新合成的 itemA/itemB 均存在于 chapter1 items
- 武学秘籍 grants 格式验证
- 删除的 3 个道具 ID 不再出现在任何 requires/has 条件中

**`tests/data/chapter2Integrity.test.ts`**
- 3 个新房间出口 `to` 字段指向存在的房间 ID
- 新道具 ID 在 items 数组中存在
- revisitEvents sentinel flag 格式正确
- 属性门槛行动 requires 字段格式验证

**`tests/data/chapter3Integrity.test.ts`**
- 3 个新房间完整性检查
- `fei_ye_upper_truth` 和 `wujue_deepest_secret` 条件格式验证
- 新道具 ID 存在验证

---

## 六、扩容规模总览

| 类别 | 数量 |
|------|------|
| 新增房间 | 6（二章 ×3，三章 ×3） |
| 新增道具 | 约 17 个 |
| 新增NPC | 5 个 |
| 新增NPC对话条数 | 约 25 条 |
| 新增Events | 约 12 个 |
| 属性成长节点 | 10 次（一章 4，二章 3，三章 3） |
| 属性门槛行动 | 6 处 |
| 新增合成 | 3 个 |
| 删除道具 | 3 个 |
| 新/扩展测试文件 | 5 个 |

---

## 七、实现约束

- 所有新地点房间 ID 不得与现有 ID 冲突
- 属性成长提示使用 `[GROWTH]` 前缀约定，CenterPanel 识别并以独立样式渲染
- 跨章道具（`drunk_testimony`、`extortion_note`）已在第一章 items 中定义，第二章仅在 `has` 条件里引用，不重复定义
- `tianji_ruins_ch3` 与第一章 `old_mansion` 是独立房间，叙事上描述为"同一地点"，技术上分属不同章节地图文件
- 删除道具前须运行现有测试套件确认无引用遗漏
