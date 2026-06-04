# 《天机残卷》全剧情攻略

> 版本：基于三层推理裁定系统上线前的完整数据（第一~三章）

---

## 目录

1. [基础机制说明](#基础机制说明)
2. [第一章：往事客栈命案](#第一章往事客栈命案)
3. [第二章：东市追查](#第二章东市追查)
4. [第三章：鸢归何处](#第三章鸢归何处)

---

## 基础机制说明

### 属性体系

| 属性 | 用途 |
|---|---|
| 力量 | 强行进入、搬移重物 |
| 智慧 | 推理分析、破解密码 |
| 敏捷 | 追踪、翻越、窃取 |
| 根骨 | 以身试毒、抵抗伤害 |

### 天赋（选一）

| 天赋 | 特性 |
|---|---|
| 望闻断骨 | 医者视角，验尸/诊断额外线索 |
| 官威 | 出示官牒震慑、强制配合 |
| 三教九流 | 江湖暗语、识别帮派、黑市渠道 |
| 望气观相 | 道家气感，察气机残留 |
| 耳报神 | 说书人耳力，抓取只言片语 |

### 三层推理裁定系统（结局前必经）

**Layer 1 — 合成前置**：非真相结局需完成核心推理合成（如`synth_double_kill`），否则选项不显示。

**Layer 2 — 推理裁定问答**：进入最终对质事件后，先答3道单选题，全部答对方可继续；答错题目高亮显示，可重选重提交。

**Layer 3 — 证据出示门**：真相结局出手前，必须出示指定关键物证，否则无法推进。

### 合成系统

背包中选两件线索/道具，点击合成，生成新的推断线索，部分合成是结局的前置条件（标注★为关键合成）。

---

## 第一章：往事客栈命案

### 地点地图

```
二楼走廊（起始）
  ├─ 二〇三号房（你的房间）
  └─ 二〇二号房（案发现场）

客栈大堂（任意时刻可去）
  ├─ 后厨（需：掌柜已交谈）
  │   └─ 地窖（需：掌柜信任）
  ├─ 城郊树林（需：发现逃跑线索）
  │   └─ 城郊后巷
  └─ 废弃宅院（需：血书令牌+砒霜+密室碎片）
```

---

### 第一步：二〇三号房 — 起始线索

**事件：回想昨夜动静**
- `仔细回想昨夜的动静` → 获得昨夜有拖拽声的记忆
- 若有天赋**耳报神** → 追加精确推断案发时辰

**事件：察看走廊地板**
- `蹲下细察走廊地板` → 发现凶手行进路线压痕
- 若有天赋**三教九流** → 识别为翻墙入室专业步法（`intruder_skilled_confirmed`）

---

### 第二步：二〇二号房 — 现场勘察（核心）

**事件：检查尸体**（获取关键线索）

| 行动 | 前置 | 获得 |
|---|---|---|
| 俯身细察伤处 | — | `wound_examined`, `body_examined` |
| 掀枕搜寻 | — | ★ `blood_letter`（染血令牌）+ `clue_blood_letter_found` |
| 翻查死者双手 | 智慧≥6 + `body_examined` | ★ `cloth_fiber_clue`（布料纤维） |
| 以医者之眼检查 | 天赋「望闻断骨」 | 一次获得多个关键 flag + `medical_report` |
| 持官牒封存现场 | 天赋「官威」 | `cloth_fiber_clue` + `wound_examined` |

**事件：搜查房间**

| 行动 | 前置 | 获得 |
|---|---|---|
| 翻检死者行囊 | — | `partial_letter`（半截密信） |
| 俯身察看地板 | 敏捷≥5 + `room_searched` | `footprint_clue` |
| 推窗察看 | `room_searched` | `window_checked` |

**事件：勘察案发现场**（202号房）

| 行动 | 前置 | 获得 |
|---|---|---|
| 纵目环观察看全局 | — | ★ `blood_pattern_sketch`（血迹手绘）+ `magnifying_glass` |
| 推演死亡经过 | 智慧≥6 + `scene_202_surveyed` | `murder_sequence_deduced` |
| 细察案旁茶盅 | `scene_202_surveyed` | `poison_tea_confirmed` |

**事件：调查门锁与出入口**

| 行动 | 前置 | 获得 |
|---|---|---|
| 俯身细察门闩锁扣 | — | ★ `door_lock_scraping` |
| 探身察看窗台外壁 | 敏捷≥4 | `rope_burn_cloth` |
| 综合推演进出路线 | 智慧≥7 + 以上两项 | `entry_route_deduced` |

**事件：翻查死者秘密遗物**

| 行动 | 前置 | 获得 |
|---|---|---|
| 开启行旅箱笼 | — | `chest_202_opened` |
| 撬开箱底夹层 | `chest_202_opened` | `account_book` + ★ `tianji_jade_token`（天机玉令） |
| 破译账本末页隐码 | 智慧≥6 + `false_bottom_found` | `account_decoded`（指向东市回春堂） |

---

### 第三步：客栈大堂

**NPC：掌柜李福**

1. 初次对话 → `innkeeper_met` + `innkeeper_talked`（进入后厨权限）
2. 展示`blood_letter` → 触发隐藏对话 → 获得`innkeeper_trusted`（地窖权限）
3. 信任后可询问：
   - 天机阁身份（`li_fu_tianji_confirmed`）
   - 驿字玉牌（获得`innkeeper_jade` + 回春堂接头线索）
   - 「鸢」的情报（`kite_group_known`）

> **深度审讯（需出示证物）**：出示`blood_letter` / `tianji_jade_token` / `tianji_roster` → 解锁最深层对话，获得`left_hand_scar_known`（凶手左手有旧疤）

**NPC：醉汉张三**（大堂）

1. 初次对话 → `drunk_talked` + ★ `found_escape_clue`（发现逃跑线索，解锁树林/后巷）
2. 追问外貌/方向/时辰（三个选项分别获得不同细节）
3. 展示铜铃残片（需先在后巷发现）→ 确认蓝衫人是浪鹏帮

> 天赋**耳报神** → 一次获得外貌+铜铃+浪鹏帮全部情报（无需喂酒）
> 天赋**三教九流** → 获得浪鹏帮额外情报

**事件：公告板**

- 读告示 → 浏览所有内容
- 需智慧≥6 → 破解藏头诗「大飞」→ 获得 `broken_copper_badge`（铜牌）+ 大飞帮任务
- 天赋**望气观相** → 直接识别藏头诗

**事件：住客册**

| 行动 | 获得 |
|---|---|
| 随手翻看 | `guest_register_checked` |
| 仔细比对近日登记 | `suspicious_guest_entry`（发现可疑住客「周文远」） |
| 辨认字迹 | `register_handwriting_noted`（字迹异常整齐） |

---

### 第四步：后厨（需掌柜信任）

**NPC：厨娘王氏**

1. 初次对话 → `cook_talked`（目击黑衣人进后厨）
2. 询问砒霜 → 知道砒霜是当晚出现的
3. 追问细节（选「那人在后厨做了什么」）→ `cook_details_asked` + `tunnel_confirmed_by_cook`
4. 展示`murder_sequence_deduced`（推断死亡经过）→ 触发特殊对话 → 追问毒茶来源 → 获得 ★ `premade_tea_testimony`（预制毒茶证词）

> 天赋**望闻断骨** → 为王氏诊治，获得`poison_wine_method`额外线索

> **深度审讯**：出示`arsenic_evidence` / `premade_tea_testimony` → 获得`left_hand_scar_known`（凶手左手旧疤，与李福信息吻合）

**事件：检查砒霜痕迹**

| 行动 | 前置 | 获得 |
|---|---|---|
| 凑近嗅辨粉末 | — | ★ `arsenic_evidence` + `clue_arsenic_found` |
| 以指拈取微量尝之 | 根骨≥7 | `arsenic_highgrade`（高纯度砒霜）+ `arsenic_evidence` |
| 以官牒征调仵作存档 | 天赋「官威」 | `arsenic_evidence`（含回春堂档案） |

**事件：寻找密道**

| 行动 | 前置 | 获得 |
|---|---|---|
| 搬开柴垛细察其后 | 力量≥5 | ★ `secret_tunnel_map` |
| 以指叩墙侧耳听声 | 智慧≥6 | `tunnel_location_detected`（仍需力量搬移） |

---

### 第五步：地窖（需掌柜完全信任）

**事件：密室机关**（进入密室的方式）

| 方式 | 前置 |
|---|---|
| 推演铜环纹路机理 | 智慧≥8 |
| 运力硬撞木门 | 力量≥8（会有动静） |
| 翻越侧窗悄然入内 | 敏捷≥6 |
| 屏息疾穿毒烟 | 根骨≥8 |
| 持官牒强制开启 | 天赋「官威」 |
| 飞贼手法拨弄机关 | 天赋「三教九流」 |

**事件：密室锦盒**
- `启开锦盒` → ★ `cellar_fragment`（密室碎片，含第五代传人信息）

---

### 第六步：城郊树林（需`found_escape_clue`）

**NPC：白衣人**

> 前提：先在树林初遇（`white_stranger_met`），再推进对话。

1. 初次见面 → `white_stranger_met`
2. 询问三个问题 → `stranger_questioned`
3. 出示核心物证（`tianji_roster` / `kite_letter` / `ear_room_ledger` / `cellar_fragment`）→ 解锁深度对话
4. 选「你觉得我该怎么做？」→ ★ `white_stranger_trust` + `huichuntang_password_known`（接头暗语「归鸟问津」）
5. 信任后赠予 **《无痕步》**（`wuxue_wuhen_bu`）+ 解锁隐士结局

**事件：追踪脚印**

| 行动 | 前置 | 获得 |
|---|---|---|
| 顺迹追踪而去 | 敏捷≥5 | `abandoned_cloth`（黑布条） |
| 驻足察看四周迹象 | 智慧≥6 | `forest_direction_mark` |
| 以江湖经验辨步法 | 天赋「三教九流」 | `killer_footprint_analysis` |

---

### 第七步：城郊后巷（需`found_escape_clue`）

**NPC：后巷老乞丐**

1. 初次对话 → `beggar_first_talked`
2. 给酒（`tavern_wine`）→ 讲述浪鹏帮情报（`langpeng_discovered`）
3. 天赋**三教九流** → 不需给酒，直接获得更详细情报

**NPC：周药商**

1. 提到墙上刻记 → `merchant_zhou_talked` + `extortion_note`（浪鹏帮勒索条）

**事件：查看墙上刻记**

- `凝神推敲刻痕寓意`（智慧≥6）或`扫眼看了看` → `alley_rubbing`（拓印）+ `langpeng_discovered`

**事件：追查蓝衫人踪迹**（需`blue_shirt_registered`）

- `搜寻巷道角落` → ★ `copper_bell_fragment`（铜铃残片，浪鹏帮帮徽）

---

### 第八步：废弃宅院（需三件关键物）

> **入场条件**：`clue_blood_letter_found` + `clue_arsenic_found` + `cellar_fragment_obtained`

**事件：天机阁档案**

| 行动 | 获得 |
|---|---|
| 翻阅旧年档录 | ★ `tianji_roster`（天机阁名录，含「宋怀义·线人·叛」） |
| 深挖箱底（智慧≥7） | ★ `kite_letter`（鸢字密信）+ `kite_identity_clue` |

**事件：发现隐秘耳室**（需`tianji_records_found`）

- `沿墙缝寻找机括` → `ear_room_found`
- `翻阅耳室档录` → `ear_room_ledger`（残存半页档案）
- `推断被撕去内容`（智慧≥8）→ `kite_identity_confirmed`

**事件：枯井**（需`dafei_address_obtained`）

> **解锁路径**：大堂公告板破解藏头诗 → 找卖符老人对话（需铜牌+暗语「云散见青天」）→ 获得废宅地址

- `顺绳下至井底`（敏捷≥5）→ 进入井底
- `拨弄铜轮解锁`（需三件物证提供数字325）→ `dafei_lock_solved` → 见到飞爷

**NPC：飞爷**（废弃宅院枯井底）

1. 解锁入帮 → 获得**《鬼步连环》**（`wuxue_gui_bu_lianhuan`）+ `dafei_secret_intel`
2. 展示拓印 → 获得`fei_ye_trust_deepened`
3. 追问真实目的/浪鹏帮/鸢的身份 → 获得 `kite_identity_clue`（★真相结局需要）

---

### 第一章关键合成 ★

| 合成 | 材料 | 效果 | 是否必需 |
|---|---|---|---|
| ★★ 双重作案手法 `synth_double_kill` | 砒霜证据 × 血迹手绘 | 揭示「先毒后勒」 | **所有结局前置（Layer 1）** |
| ★★ 天机动机 `synth_tianji_motive` | 染血令牌 × 天机名录 | 揭示杀人动机 | **真相结局需要** |
| 挣扎证实 | 布料纤维 × 门锁划痕 | 宋怀义死前抓住了凶手 | 加深线索 |
| 进出路线 | 密道地图 × 窗台绳痕 | 还原凶手路线 | 可选 |
| 探子身份 | 可疑住客记录 × 铜铃残片 | 确认浪鹏帮监视 | 可选 |
| 残卷任务 | 半截密信 × 天机玉令 | 宋怀义是来交接情报的 | 可选 |
| 预谋证实 | 预制毒茶证词 × 砒霜证据 | 蓄意谋杀，提前布局 | 可选 |

---

### 第一章推理裁定问答（Layer 2）

> 进入 `evt_final_confrontation`（废弃宅院正堂），持有核心 flag 后自动触发。

| 问题 | 正确答案 |
|---|---|
| 宋怀义遇害的方式是？ | **毒茶先致昏，再遭勒毙——双重手法** |
| 凶手的根本作案动机是？ | **夺回天机阁名单，灭口知情人** |
| 凶手如何进出案发现场？ | **密道入室，翻窗越墙而出** |

---

### 第一章结局选择

> **前提**：完成 `synth_double_kill` 合成 → 通过推理裁定问答 → 才能看到结局选项

#### 结局A：真相结局
**前置条件**：
- `kite_identity_clue`（飞爷处获得）
- `cloth_fiber_found`
- `tianji_records_found`
- `synth_double_kill` ★（Layer 1）
- `synth_tianji_motive` ★
- `cook_talked` + `drunk_talked`
- `ch1_clues_sufficient`（收集足够线索后自动获得）

**Layer 3 证据出示**：选「我知道是谁干的了」后，出示以下任一物证：
- `arsenic_evidence`（砒霜证据）
- `medical_report`（验尸报告，天赋望闻断骨专属）
- `blood_letter`（染血令牌）

→ 揭露双重手法、天机动机、凶手身份，官府到来，故事进入第二章。

#### 结局B：莽夫路线
**前置条件**：力量≥7 + `synth_double_kill`（Layer 1）

→ 抓错人，真凶逃脱，获知「东市回春堂」线索。

#### 结局C：隐士路线
**前置条件**：`white_stranger_trust` + `learned_wuhen_bu` + `synth_double_kill`（Layer 1）

→ 选择隐退，带着真相离开，不揭露。

---

## 第二章：东市追查

### 起始位置：东市入口

**第二章可用地点**（部分需解锁）：
- 东市入口（告示墙、茶摊）
- 回春堂（药铺）
- 古玩铺
- 慈恩寺（需访问回春堂）
- 平康巷据点（需追踪浪鹏帮）
- 皇城茶馆（最终对质）

---

### 关键NPC：无迹和尚（慈恩寺）

**推进路径**：
1. 回春堂查药架 → 获得`poison_residue_sample`
2. 回春堂方剂簿 → 获得`wujue_prescription`（无迹方笺）
3. 前往慈恩寺见到无迹（`wujue_met`）
4. 搜查僧房 → 取得 ★ `monk_identity_scroll`（僧籍密卷，含真实身份「韩朔·天机阁风字组」）
5. 慈恩寺偏院壁画 → 获得 `tianji_signal_record`（天机暗号册）

> 天赋**望闻断骨** → 为和尚诊治右腕旧伤，获得僧籍密卷（不需敏捷/力量）
> 天赋**官威** → 出示官牒强制配合，获得僧籍密卷

---

### 关键合成（第二章）

| 合成 | 材料 | 是否必需 |
|---|---|---|
| ★★ 李邈指挥浪鹏帮 `synth_ch2_li_mao_commands_langpeng` | 浪鹏调令 × 被俘信函 | **所有结局前置（Layer 1）** |
| ★★ 无迹共谋 `synth_ch2_wujue_complicit` | 无迹方笺 × 无迹医诊证词 | **逮捕结局需要** |
| 毒药溯源 | 毒药残样 × 无迹方笺 | 可选 |
| 情报网络重建 | 买家往来账 × 天机暗号册 | 可选 |

---

### 获取关键道具

**`langpeng_dispatch_order`（浪鹏调令）** — 三种方式任选：

1. **平康巷据点搜查**：
   - 敏捷≥7（细查砖缝）或 力量≥8（破门强搜）或 智慧≥6（拼合纸屑）
   - 天赋**官威** → 震慑帮众直接交出

2. **黑市情报购买**（天赋**三教九流** + `langpeng_discovered`）

3. **据点帮众审讯**：进入据点后审讯被俘线人

**`captive_letter`（被俘信函）** — 平康巷据点正堂：
- `捡起信函阅读` → `langpeng_trail` + `captive_letter`

**`wujue_testimony`（无迹医诊证词）** — 与无迹和尚深度对话后获得

---

### 第二章推理裁定问答（Layer 2）

> 进入 `evt_li_mao_encounter`（皇城茶馆终局），持有核心 flag 后自动触发。

| 问题 | 正确答案 |
|---|---|
| 浪鹏帮在长安行动的幕后指挥是？ | **李邈——浪鹏帮是他手中的工具** |
| 无迹和尚在此案中的角色是？ | **天机阁旧部，毒剂配方来源，被人利用而非主谋** |
| 宋怀义来长安的真正目的是？ | **交接天机阁名单，完成情报传递** |

---

### 第二章结局选择

#### 结局A：逮捕结局（chapter2_arrest_ending）
**前置条件**：
- 持有：`poison_residue_sample` + `monk_identity_scroll` + `langpeng_dispatch_order`
- `synth_ch2_li_mao_commands_langpeng` ★（Layer 1）
- `synth_ch2_wujue_complicit` ★
- `wujue_tianji_revealed`（无迹透露天机阁身份）
- `ch2_clues_sufficient`

**Layer 3 证据出示**：必须出示 `langpeng_dispatch_order`（李邈手书调令）

→ 三件证物并陈，李邈被捕，故事进入第三章。

#### 结局B：放走结局（chapter2_release_ending）
**前置条件**：
- `langpeng_trail` + `synth_ch2_li_mao_commands_langpeng`（Layer 1）
- 持有：`langpeng_dispatch_order`

→ 以调令为筹码逼问李邈，换取情报，放他离开。获得皇城茶馆入场牌。

#### 结局C：加入天机阁（chapter2_join_ending）
**前置条件**：
- `tianji_recruit_offered`（李邈提出招募）
- `synth_ch2_li_mao_commands_langpeng`（Layer 1）

→ 加入天机阁，第三章起点变为天机安宅。

---

## 第三章：鸢归何处

### 起始位置

| 第二章结局 | 第三章起点 |
|---|---|
| 逮捕/放走 | 大雁塔下 |
| 加入天机阁 | 天机安宅 |

---

### 路线A：大雁塔出发

**事件：无名碑**
- `拂去碑上苔痕细看` → `stele_seen`
- 智慧≥6 → `decode_tianji` → ★ `tianji_founding_scroll`（天机创立卷）
- 持有`tianji_signal_record` → 直接用暗号册破译
- 天赋**望气观相** → 气感识别隐藏结构 → `tianji_founding_scroll`
- 天赋**三教九流** → 向江湖人打听，碑后夹缝取出卷轴

**事件：塔影踪迹**
- `环顾四周` → `qujiang_invitation`（曲江亭邀请信）
- 天赋**耳报神** → 听香客议论，找到邀请信

---

### 路线B：天机安宅出发（仅join结局）

**事件：任务令**
- `拆开阅读` → `target_profile`（追查令，目标竟是飞爷）
- 天赋**耳报神** → 辨析笔迹，发现任务令出自鸢手（飞爷自己发了追查自己的令）

**事件：安宅暗壁**（需`tianji_mission_started`）
- 智慧≥8 / 敏捷≥7 → ★ `tianji_founding_scroll`
- 取得信任：展示功夫或情报 → `tianji_trust_gained`（第三章join结局需要）
- 天赋**官威** → 官牒震慑，获得`tianji_trust_gained`

---

### 飞爷旧居（feiyes_manor）

**事件：废弃内室**
- `翻检桌上物件` → `manor_entered` + `deeper_threat_evidence`（廷尉府密函）
- 天赋**望闻断骨** → 医者察看桌椅磨损 → `fei_ye_identity_confirmed`（直接确认飞爷身份）

**事件：旧画像壁**（需`manor_entered`）
- `细看画像` → ★ `name_list_fragment`（名单残页）+ `feiyes_manor_searched`
- 持有`stele_decoded` → `match_markings` → `fei_ye_identity_confirmed`
- 持有`fei_ye_suspect` → 对照追查令 → `fei_ye_identity_confirmed`
- 天赋**官威** → 对照官府通缉存档 → `fei_ye_identity_confirmed`

**事件：书桌抽屉**（需`manor_study_found`）
- `拉开抽屉` → `unsent_letter`（写给无迹和尚韩朔的未寄信）

---

### 关键合成（第三章）

| 合成 | 材料 | 是否必需 |
|---|---|---|
| ★★ 飞爷身份确认 `synth_ch3_fei_ye_confirmed` | 天机创立卷 × 名单残页 | **所有结局前置（Layer 1）** |
| ★★ 上游威胁实质化 `synth_ch3_deeper_threat_scale` | 廷尉府密函 × 名单残页 | **真相结局需要** |
| 令从本人起草 | 追查令 × 令纸鸢字暗记 | 可选（揭示飞爷自导自演） |
| 两段孤独守候 | 和尚的告白 × 旧居伤痕诊断 | 可选 |

---

### 第三章推理裁定问答（Layer 2）

> 进入 `evt_fei_ye_confrontation`（曲江亭终局），持有核心 flag 后自动触发。

| 问题 | 正确答案 |
|---|---|
| 飞爷的真实身份是？ | **天机阁创立者，代号「鸢」** |
| 真正威胁天机阁遗留成员的势力是？ | **廷尉府某一层级，追杀名单上的人** |
| 飞爷为何主动安排了这次相遇？ | **需要一个可信任的人来帮他收尾这件旧案** |

---

### 第三章结局选择

> **前提**：完成 `synth_ch3_fei_ye_confirmed` 合成 → 通过推理裁定问答 → 才可选择结局

#### 结局A：真相结局（chapter3_truth_ending）
**前置条件**：
- 持有：`tianji_founding_scroll`
- `deeper_threat_revealed`（从飞爷或大飞帮档案处获知）
- `synth_ch3_fei_ye_confirmed` ★（Layer 1）
- `synth_ch3_deeper_threat_scale` ★
- `ch3_clues_sufficient`

**Layer 3 证据出示**：出示 `tianji_founding_scroll`（天机创立卷）

→ 将证据公之于众，名单上的人曝光，但可以自己选择命运。

#### 结局B：对峙结局（chapter3_standoff_ending）
**前置条件**：
- `fei_ye_identity_confirmed` + `synth_ch3_fei_ye_confirmed`（Layer 1）

→ 听完真相，但没有足够物证。各守一段真相，分道扬镳。

#### 结局C：合作结局（chapter3_join_ending）
**前置条件**：
- `chapter2_join_ending`（第二章选择加入天机阁）
- `tianji_trust_gained`
- `synth_ch3_fei_ye_confirmed`（Layer 1）

→ 烧掉追查令，选择与飞爷一起守护名单。

---

## 附录：属性成长事件

### 第一章
| 事件 | 获得 | 前置 |
|---|---|---|
| 大堂「以气势压人」 | 力量+1 | 力量≥5 |
| 大堂「反复推敲案情」 | 智慧+1 | `body_examined`+`innkeeper_met` |
| 大堂（回访·`synth_double_kill`后） | 智慧+1 | `synth_double_kill` |
| 废宅（回访·`synth_tianji_motive`后） | 智慧+1 | `synth_tianji_motive` |
| 研习《无痕步》（白衣人赠予） | 敏捷+1 | `learned_wuhen_bu` |
| 研习《鬼步连环》（飞爷赠予） | 根骨+1 | `dafei_joined` |

### 第二章
| 事件 | 获得 | 前置 |
|---|---|---|
| 研习毒物·以身试毒 | 根骨+1 | 根骨≥5 |
| 穿街追踪 | 敏捷+1 | 敏捷≥4 + `langpeng_discovered` |
| 夜市入口精准尾随 | 敏捷+1（额外）| 敏捷≥7 |
| 线索拼合（李邈+失踪名单） | 智慧+1 | 持有两件物证 |

### 第三章
| 事件 | 获得 | 前置 |
|---|---|---|
| 破解密语 | 智慧+1 | 智慧≥6 |
| 枯坐冥想 | 根骨+1 | — |
| 旧居清障 | 力量+1 | 力量≥5 |
| 大雁塔壁道攀登 | 敏捷+1 | 敏捷≥5 |
| 乐游原石碑拓印 | 智慧+1 | — |
| 飞爷旧居书桌（读信） | 智慧+1 | `manor_study_found` |
| 廷尉府附近甩脱跟踪 | 根骨+1 | 根骨≥7 或 敏捷≥7 |

---

## 附录：全结局条件速查

| 章节 | 结局 | 关键条件 |
|---|---|---|
| 第一章 | 真相结局 | 鸢身份线索+布料纤维+天机名录+双重手法合成+天机动机合成 |
| 第一章 | 莽夫路线 | 力量≥7+双重手法合成 |
| 第一章 | 隐士路线 | 白衣人信任+无痕步+双重手法合成 |
| 第二章 | 逮捕结局 | 三件证物+李邈指挥合成+无迹共谋合成 |
| 第二章 | 放走结局 | 浪鹏踪迹+李邈指挥合成+持有调令 |
| 第二章 | 加入天机阁 | 天机招募+李邈指挥合成 |
| 第三章 | 真相结局 | 创立卷+廷尉府威胁+飞爷确认合成+上游威胁合成 |
| 第三章 | 对峙结局 | 飞爷身份确认+飞爷确认合成 |
| 第三章 | 合作结局 | 第二章加入+天机信任+飞爷确认合成 |
