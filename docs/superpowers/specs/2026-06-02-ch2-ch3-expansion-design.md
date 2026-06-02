# 第二、三章内容扩充设计文档

**日期：** 2026-06-02  
**范围：** chapter2.json / chapter3.json（events、npcs）+ chapter1.json（npcs，fei_ye 补充）  
**目标：** 修复可达性漏洞 + 将两章叙事密度对齐第一章水平

---

## 一、可达性修复（强制项）

### 1.1 kite_identity_clue 缺口

**问题：** 游方医（wisdom=6）和飞贼（wisdom=4）无法通过 `evt_tianji_records/deep_search`（需 wisdom≥7）获得 `kite_identity_clue`，导致这两个职业在第二章无法触发「卧底结局」，在第三章也无法触发「同守结局」。

**修复：**  
在 `src/data/npcs/chapter2.json` 的 `npc_langpeng_scout` 新增一条对话 `kite_clue_exchange`：
- 条件：`flags: ['hideout_trust_gained']`，`flags_absent: ['kite_identity_clue']`
- 内容：探子在受到信任后主动透露「鸢字组」的存在
- 授权：`flags: ['kite_identity_clue', 'langpeng_kite_mentioned']`

同时在 `src/data/events/chapter2.json` 的 `evt_buyer_ledger` 新增一个动作 `decode_kite_mark`：
- 条件：`talent: '三教九流'`，`flags_absent: ['kite_identity_clue']`
- 内容：飞贼以江湖经验辨认出账本中隐藏的鸢字暗记
- 授权：`flags: ['kite_identity_clue', 'kite_ledger_found']`

### 1.2 poison_residue_sample 缺口

**问题：** 捕快（wisdom=7，无望气/医术天赋）、游方医（wisdom=6）、飞贼（wisdom=4）获取 `poison_residue_sample` 只能依赖第一章的 `account_book`。若第一章未拿到该道具则逮捕结局无路可走。

**修复：**  
在 `src/data/events/chapter2.json` 的 `evt_medicine_shelf` 新增两个动作：
- `constitution_smell`：条件 `constitution≥6`，内容：体质过人者凭嗅觉直接鉴定毒药。授权：`items: ['poison_residue_sample']`，`flags: ['poison_matched']`（游方医 constitution=9 天然满足）
- `thief_poison_sniff`：条件 `talent: '三教九流'`，内容：飞贼走江湖时见过此毒。授权：`items: ['poison_residue_sample']`，`flags: ['poison_matched', 'poison_source_known']`

---

## 二、第二章内容扩充

### 2.1 新 NPC：回春堂老板娘 npc_huichuntang_owner

**位置：** huichuntang  
**角色定位：** 知情旁观者，守口如瓶但有破防点  
**对话设计（3条）：**

| ID | 条件 | 内容要点 | 授权 |
|----|------|---------|------|
| `first_meeting` | 无 | 打发调查者，声称只是普通药铺 | `flags: ['owner_met']` |
| `under_pressure` | `strength≥7` 或 `talent: '官威'` | 在压力下透露无迹和尚的特殊身份——他不是普通僧人 | `flags: ['owner_cracked', 'wujue_suspicious']` |
| `final_truth` | `flags: ['wujue_tianji_revealed']` | 确认无迹和尚在此坐诊是有人安排的，暗指有人长期保护他 | `flags: ['owner_told_truth']` |

### 2.2 npc_wujue 第二章专属对话

无迹和尚在第二章语境下的对话应该和第三章语境不同。在 `chapter2.json` NPCs 中新增独立的对话条目（通过 `flags_absent: ['chapter3_started']` 与第三章区分）：

| ID | 条件 | 内容要点 | 授权 |
|----|------|---------|------|
| `ch2_first_encounter` | `flags_absent: ['wujue_met', 'chapter3_started']` | 和尚在药铺打坐，态度冷淡，不愿多谈 | `flags: ['wujue_met']` |
| `ch2_poison_hint` | `flags: ['wujue_met', 'poison_matched']`，`flags_absent: ['poison_source_known', 'chapter3_started']` | 和尚察觉到调查方向，主动给出线索但不吐露身份 | `flags: ['poison_source_known']` |
| `ch2_identity_pressed` | `has: ['monk_identity_scroll']`，`flags_absent: ['wujue_tianji_revealed', 'chapter3_started']` | 被僧籍密卷质问时，和尚沉默良久后承认旧身份 | `flags: ['wujue_tianji_revealed']` |
| `ch2_final_warning` | `flags: ['wujue_tianji_revealed']`，`flags_absent: ['chapter3_started']` | 和尚警告：李邈不是终点，背后还有更大的危险 | `flags: ['wujue_final_warning_given']` |

### 2.3 npc_langpeng_scout 扩充

在现有 7 条对话基础上新增：

| ID | 条件 | 内容要点 | 授权 |
|----|------|---------|------|
| `kite_clue_exchange` | `flags: ['hideout_trust_gained']`，`flags_absent: ['kite_identity_clue']` | 探子透露「鸢字组」，解锁 kite_identity_clue（修复游方医/飞贼缺口） | `flags: ['kite_identity_clue', 'langpeng_kite_mentioned']` |
| `scared_confession` | `flags: ['langpeng_scared']`，`flags_absent: ['langpeng_full_confession']` | 被吓到的探子透露浪鹏帮与李邈之间的更多细节 | `flags: ['langpeng_full_confession']`，`clues: ['langpeng_hideout_intel']` |
| `dispatch_recognition` | `has: ['langpeng_dispatch_order']` | 看到调令后探子认出李邈笔迹，进一步坐实指挥关系 | `flags: ['langpeng_dispatch_confirmed']` |

### 2.4 npc_li_mao 扩充

| ID | 条件 | 内容要点 | 授权 |
|----|------|---------|------|
| `defensive_denial` | `flags: ['entered_teahouse']`，`flags_absent: ['li_mao_exposed']` | 李邈强装镇定，以官威压人，否认一切 | `flags: ['li_mao_denial_used']` |
| `cornered_negotiation` | `flags: ['li_mao_cornered']`，`flags_absent: ['recruitment_offered_personal']` | 被铁证逼到墙角后，李邈摊牌——他本人也只是棋子，愿意合作换取出路 | `flags: ['recruitment_offered_personal', 'li_mao_true_position_revealed']` |
| `tianji_background` | `flags: ['li_mao_exposed', 'tianji_seal_read']` | 李邈透露天机阁残余在长安的情报布局，提供第三章关键情报 | `flags: ['ch3_intel_from_li_mao']` |

### 2.5 新事件

**evt_bounty_investigation**（东市入口）
- 动作1 `trace_artist`：无条件，追查悬赏令画师，获取李邈的外貌描述
  - 授权：`flags: ['li_mao_description_known']`
- 动作2 `official_inquiry`：`talent: '官威'`，以官身问询坊官
  - 授权：`flags: ['li_mao_description_known', 'li_mao_known_to_authorities']`

**evt_hidden_safe**（古玩铺）
- 动作1 `search_back_room`：`agility≥7`，翻查后室
  - 授权：`items: ['second_killer_evidence']`，`flags: ['antique_back_searched']`
- 动作2 `intimidate_dealer`：`strength≥8`，威慑掌柜
  - 授权：`items: ['second_killer_evidence']`，`flags: ['antique_back_searched']`
- 动作3 `gang_code_unlock`：`flags: ['hideout_trust_gained']`，以暗语套出底细
  - 授权：`items: ['second_killer_evidence']`，`flags: ['antique_back_searched', 'deeper_network_known']`

**evt_prisoner_testimony**（平康坊据点）
- 动作1 `interrogate_prisoner`：`flags: ['hideout_entered']`，审讯被困的线人
  - 授权：`clues: ['langpeng_hideout_intel']`，`flags: ['prisoner_interrogated']`
- 动作2 `medical_treat_prisoner`：`talent: '望闻断骨'`，为重伤线人施救换取口供
  - 授权：`clues: ['langpeng_hideout_intel']`，`flags: ['prisoner_healed', 'prisoner_grateful']`，`items: ['second_killer_evidence']`

---

## 三、第三章内容扩充

### 3.1 飞爷对话完整重写（chapter1.json npc_fei_ye）

将现有 pavilion_opening / identity_admitted / list_confrontation / undercover_bond 扩充并补充以下对话：

| ID | 条件 | 内容要点 | 授权 |
|----|------|---------|------|
| `pavilion_opening` | `flags: ['chapter3_started', 'entered_pavilion']` | （已有）飞爷开场白，平静中透着沧桑 | `flags: ['fei_ye_pavilion_met']` |
| `pavilion_tension` | `flags: ['fei_ye_pavilion_met']`，`flags_absent: ['fei_ye_identity_confirmed']` | 飞爷不承认也不否认，用问题回答问题，逼玩家亮出证据 | `flags: ['pavilion_tension_played']` |
| `identity_admitted` | `flags: ['chapter3_started', 'fei_ye_identity_confirmed']` | （已有）承认身份，但态度依然平静 | `flags: ['fei_ye_admitted']` |
| `twenty_years_monologue` | `flags: ['fei_ye_admitted']`，`flags_absent: ['fei_ye_story_told']` | 飞爷讲述二十年的选择：为什么藏身、为什么不走、为什么等 | `flags: ['fei_ye_story_told']`，`clues: ['deeper_threat_evidence']` |
| `list_confrontation` | `flags: ['chapter3_started']`，`has: ['tianji_founding_scroll']` | （已有）出示创立卷，飞爷揭示上游威胁 | `flags: ['deeper_threat_revealed']` |
| `undercover_bond` | `flags: ['chapter3_started', 'chapter2_join_ending', 'tianji_trust_gained']` | （已有）卧底路线的专属场景，两人有旧情 | `flags: ['final_choice_unlocked']` |
| `truth_ending_dialogue` | `flags: ['chapter3_truth_ending']` | 铁证公开后飞爷的最后一句话，结局收尾 | — |
| `standoff_ending_dialogue` | `flags: ['chapter3_standoff_ending']` | 各守半段真相，分别离去 | — |
| `join_ending_dialogue` | `flags: ['chapter3_join_ending']` | 任务令付之一炬，一起守名单 | — |

### 3.2 npc_tianji_contact 扩充

| ID | 条件 | 内容要点 | 授权 |
|----|------|---------|------|
| `fei_ye_location_hint` | `flags: ['tianji_trust_gained']`，`flags_absent: ['fei_ye_sighted']` | 联络人给出飞爷在长安最后出没的地点 | `flags: ['fei_ye_sighted', 'qujiang_location_known']` |
| `upstream_warning` | `flags: ['tianji_trust_gained', 'tianji_network_seen']` | 联络人低声提醒：追查飞爷的不止他们，上面还有一双眼睛 | `flags: ['upstream_threat_warned']` |
| `ending_reaction` | `flags: ['fei_ye_identity_confirmed']`，flags 覆盖三种结局 | 三种结局后联络人的不同反应（真相/对峙/同守） | — |

### 3.3 新 NPC：寺院小僧 npc_temple_novice

**位置：** dayan_pagoda（大雁塔下）  
**角色定位：** 无迹和尚的服侍小僧，知道飞爷的行踪但不知道自己知道  
**对话设计（3条）：**

| ID | 条件 | 内容要点 | 授权 |
|----|------|---------|------|
| `novice_greeting` | 无 | 小僧打扫庭院，礼貌但警惕 | `flags: ['novice_met']` |
| `fei_ye_sighting` | `flags: ['stele_decoded']` | 小僧提起"前几日有个白衣的施主"在此驻足，留意脚印方向 | `flags: ['fei_ye_sighted', 'qujiang_direction_known']` |
| `wujue_testimony_ref` | `flags: ['wujue_guilt_revealed']` | 小僧转述无迹和尚说过的一句话，印证和尚的告白 | `flags: ['novice_wujue_words']` |

### 3.4 新事件

**evt_hidden_letter**（飞爷故居）
- 动作1 `find_unsent_letter`：`flags: ['manor_study_found']`，发现书桌抽屉里一封未寄出的信
  - 授权：`clues: ['wujue_confession']`（或新道具 `unsent_letter`），`flags: ['unsent_letter_found']`
- 动作2 `healer_decipher`：`talent: '望闻断骨'`，以医者眼光辨认笔迹压力和日期
  - 授权：`flags: ['unsent_letter_found', 'letter_date_known', 'fei_ye_identity_confirmed']`

**evt_pavilion_final_choice**（曲江亭）
- 动作1 `pause_before_deciding`：`flags: ['fei_ye_story_told']`，在做最终决定前沉默片刻
  - 内容：一段心理独白（〔〕格式），回顾三章调查历程
  - 授权：`flags: ['pavilion_final_moment']`（后续解锁三个结局选项）

---

## 四、数据新增道具

| id | name | isClue | 用途 |
|----|------|--------|------|
| `owner_testimony` | 老板娘证词 | true | npc_huichuntang_owner 对话产出，强化毒药来源链 |
| `unsent_letter` | 未寄出的信 | true | evt_hidden_letter 产出，飞爷内心独白物证 |

---

## 五、体量目标

| 章节 | 当前对话/动作数 | 目标 |
|------|--------------|------|
| 第二章 NPC 对话 | ~16 条 | ~35 条（+19） |
| 第二章事件动作 | ~42 个 | ~60 个（+18） |
| 第三章 NPC 对话 | ~21 条 | ~40 条（+19） |
| 第三章事件动作 | ~28 个 | ~38 个（+10） |

---

## 六、修改文件清单

| 文件 | 操作 |
|------|------|
| `src/data/npcs/chapter1.json` | npc_fei_ye 新增 5 条对话 |
| `src/data/npcs/chapter2.json` | 新增 npc_huichuntang_owner；扩充 npc_wujue ch2 对话 4 条；npc_langpeng_scout +3 条；npc_li_mao +3 条 |
| `src/data/npcs/chapter3.json` | npc_tianji_contact +3 条；新增 npc_temple_novice 3 条 |
| `src/data/events/chapter2.json` | evt_medicine_shelf +2 动作；evt_buyer_ledger +1 动作；evt_hideout_search 补充；新增 evt_bounty_investigation、evt_hidden_safe、evt_prisoner_testimony |
| `src/data/events/chapter3.json` | 新增 evt_hidden_letter、evt_pavilion_final_choice |
| `src/data/maps/chapter2.json` | huichuntang/antique_shop/pingkang_hideout 添加新 NPC/事件 interactables |
| `src/data/maps/chapter3.json` | dayan_pagoda 添加 npc_temple_novice；feiyes_manor/qujiang_pavilion 添加新事件 |
| `src/data/items/chapter2.json` | 新增 owner_testimony |
| `src/data/items/chapter3.json` | 新增 unsent_letter |

---

## 七、防卡关测试要求

实现完成后需验证以下路径：
1. 游方医走完全流程（第二章逮捕结局 + 第三章真相结局）
2. 飞贼走完全流程（第二章卧底结局 + 第三章同守结局）
3. 捕快不带 account_book 进第二章，仍可完成逮捕结局
4. 三种第三章结局均可由至少一个职业正常触达

如有新增 flag/item 依赖关系，须在 `tests/data/chapter2Integrity.test.ts` 和 `tests/data/chapter3Integrity.test.ts` 中补充对应断言。
