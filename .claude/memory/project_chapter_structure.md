---
name: project-chapter-structure
description: 三章故事结构、关键 flag、NPC、结局条件
metadata: 
  node_type: memory
  type: project
  originSessionId: ced97cdc-a339-4152-9636-569551b706a8
---

## 第一章：往事客栈命案

### 起始状态
- 房间：room_203（二楼客房）
- 初始 quest：quest_main_murder

### 关键地点
| 地点 | requires |
|---|---|
| room_203 起始房 | 无 |
| lobby 大堂 | 无 |
| kitchen 后厨 | innkeeper_talked |
| cellar 地窖 | innkeeper_trusted |
| forest 城郊树林 | found_escape_clue |
| back_alley 后巷 | found_escape_clue |
| old_mansion 废弃宅院 | clue_blood_letter_found + clue_arsenic_found + cellar_fragment_obtained |

### 关键 NPC
- npc_innkeeper_li_fu（掌柜李福）
- npc_drunk_zhang_san（醉客张三）
- npc_cook_wang（厨娘王氏）
- npc_white_stranger（白衣人）
- npc_old_beggar（老乞丐）
- npc_fei_ye（飞爷）— 在 old_mansion，需先做 evt_dry_well→solve_lock 获得 dafei_lock_solved

### 三种结局
- chapter1_truth_ending：需 kite_identity_clue + cloth_fiber_found + tianji_records_found
- chapter1_force_ending：需 strength≥8
- chapter1_hermit_ending：需 white_stranger_trust + learned_wuhen_bu

---

## 第二章：东市追查

### 起始状态
- 房间：east_market_entrance

### 关键地点
- huichuntang 回春堂、antique_shop 古玩铺、cien_temple 慈恩寺
- pingkang_hideout 平康巷据点、imperial_teahouse 皇城茶馆

### 关键 NPC
- npc_wujue（无迹和尚）— 多处出现
- npc_li_mao（李邈）— 最终对质
- npc_langpeng_scout（浪鹏帮探子）

### 三种结局
- chapter2_arrest_ending：逮捕李邈
- chapter2_release_ending：放走
- chapter2_join_ending：加入天机阁（影响第三章起始位置）

---

## 第三章：鸢归何处

### 起始状态
- 非 join 结局：dayan_pagoda 大雁塔下
- chapter2_join_ending：tianji_safehouse 天机安宅

### 关键地点
- dayan_pagoda、tianji_safehouse、feiyes_manor 飞爷故居
- qujiang_pavilion 曲江亭（需 fei_ye_identity_confirmed）

### 获得 fei_ye_identity_confirmed 的路径（任一）
1. feiyes_manor → examine_portraits → feiyes_manor_searched → 与无迹和尚对话 → final_testimony
2. dayan_pagoda npc_wujue → stele_reading（获 stele_decoded）→ 故居 match_markings
3. tianji_safehouse → 读任务令 → 与联络人对话 3 次 → insider_warning
4. 游方医天赋 + feiyes_manor_searched → healing_final_testimony

### 三种结局
- chapter3_truth_ending：需 tianji_founding_scroll + deeper_threat_revealed
- chapter3_standoff_ending：默认对话
- chapter3_join_ending：需 chapter2_join_ending + tianji_trust_gained
