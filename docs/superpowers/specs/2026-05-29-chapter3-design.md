# 第三章·鸢归何处 Design Spec

## Overview

**Goal:** Implement Chapter 3 of 天机残卷, the final chapter. Players trace the identity of「鸢」back to 飞爷——the 大飞帮 leader who recruited them in Chapter 1 and has been manipulating their investigation from the start. The chapter ends with a confrontation at 曲江亭 and three possible conclusions to the story.

**Narrative premise:** 飞爷 is「鸢」, the founder of 天机阁's 鸢字组. He built the entire organization to protect a list of people being hunted by a faction within the imperial court. The name list is not a weapon — it is a shield. Players must decide what to do with this truth.

---

## Architecture

### New Files

| File | Purpose |
|---|---|
| `src/data/maps/chapter3.json` | 4 rooms with exits and interactables |
| `src/data/events/chapter3.json` | 8 events |
| `src/data/npcs/chapter3.json` | 3 NPCs (fei_ye updated + wujue updated + new tianji_contact) |
| `src/data/items/chapter3.json` | 5 items |

### Modified Files

| File | Change |
|---|---|
| `src/data/loader.ts` | Load chapter3 data; merge into existing exports |
| `src/data/events/chapter1.json` | No change needed |
| `src/pages/ChapterEnd/ChapterEnd.tsx` | Add chapter3 endings map; update `handleContinue` to set conditional starting room based on ch2 ending flag |

### Chapter Transition

`ChapterEnd.tsx` currently hardcodes `scene.setRoom('east_market_entrance')` for chapter 2. For chapter 3, the starting room depends on the chapter 2 ending:

```
chapter2_join_ending  →  setRoom('tianji_safehouse')
otherwise             →  setRoom('dayan_pagoda')
```

This requires a one-line conditional in `handleContinue`.

---

## Chapter 3 Map

### Rooms

| Room ID | Name | Description |
|---|---|---|
| `dayan_pagoda` | 大雁塔下 | 外线入口；慈恩寺旁，无名碑藏有天机阁隐语；无迹和尚在此 |
| `tianji_safehouse` | 天机安宅 | 卧底入口；天机阁长安据点；玩家接受追查飞爷的任务 |
| `feiyes_manor` | 飞爷故居 | 两路汇合；废弃旧居藏有飞爷身份的物证与名单残页 |
| `qujiang_pavilion` | 曲江亭 | 终局；飞爷在此等候；三个结局在此触发 |

### Connections

```
dayan_pagoda ─────────────────────────┐
（外线入口，requires: null）           ├──→ feiyes_manor ──→ qujiang_pavilion
tianji_safehouse ─────────────────────┘                  （requires: fei_ye_identity_confirmed）
（卧底入口，requires: chapter2_join_ending）
```

- `dayan_pagoda` exits: `feiyes_manor`
- `tianji_safehouse` exits: `feiyes_manor`
- `feiyes_manor` exits: `dayan_pagoda`, `tianji_safehouse`, `qujiang_pavilion`
- `qujiang_pavilion` exits: `feiyes_manor`
- `qujiang_pavilion` requires: `{ flags: ["fei_ye_identity_confirmed"] }`

---

## NPCs

### `npc_fei_ye` — 飞爷（终章）
Location: `qujiang_pavilion`

| Dialogue ID | Condition | Grants |
|---|---|---|
| `pavilion_opening` | flag `entered_pavilion` | — |
| `identity_admitted` | flag `fei_ye_identity_confirmed` | flag `fei_ye_admitted` |
| `list_confrontation` | has `tianji_founding_scroll` | flag `deeper_threat_revealed` |
| `undercover_bond` | flag `chapter2_join_ending` + flag `tianji_trust_gained` | flag `final_choice_unlocked` |

**Character note:** 飞爷 does not flee or deny. He chose this location and waited. His arc is not a villain's downfall — it is a founder's reckoning. The name list protects people; what matters is who ends up holding it.

### `npc_wujue` — 无迹和尚（终章）
Location: `dayan_pagoda` + `feiyes_manor`

| Dialogue ID | Condition | Grants |
|---|---|---|
| `stele_reading` | null | flag `stele_decoded`, item `tianji_founding_scroll` |
| `fei_ye_origin` | flag `wujue_tianji_revealed` OR wisdom≥7 | flag `fei_ye_tianji_origin_known` |
| `final_testimony` | flag `feiyes_manor_searched` | flag `fei_ye_identity_confirmed` |

**Character note:** 韩朔 is the only person who has known the full truth from the beginning. His last line: "他没走，因为他在等一个人来找他。"

### `npc_tianji_contact` — 天机联络人
Location: `tianji_safehouse`

| Dialogue ID | Condition | Grants |
|---|---|---|
| `mission_briefing` | flag `chapter2_join_ending` | flag `tianji_mission_started`, item `target_profile` |
| `target_details` | flag `tianji_mission_started` | flag `fei_ye_suspect` |
| `insider_warning` | flag `fei_ye_suspect` + wisdom≥7 | flag `fei_ye_identity_confirmed` |

---

## Events

### `dayan_pagoda`

- **`evt_nameless_stele`** — 无名碑
  - `observe_stele`（null）→ flag `stele_seen`
  - `decode_tianji`（wisdom≥6 OR flag `wujue_tianji_revealed`）→ flag `stele_decoded`, item `tianji_founding_scroll`

- **`evt_pagoda_shadow`** — 塔影踪迹
  - `look_around`（null）→ flag `qujiang_location_known`, item `qujiang_invitation`
  - `track_footprints`（agility≥7）→ flag `fei_ye_sighted`

### `tianji_safehouse`

- **`evt_mission_orders`** — 任务令
  - `read_orders`（null）→ flag `tianji_mission_started`, item `target_profile`
  - `study_target`（wisdom≥7）→ flag `fei_ye_suspect`

- **`evt_safehouse_wall`** — 安宅暗壁（requires flag `tianji_mission_started`）
  - `examine_wall`（null）→ flag `tianji_network_seen`
  - `find_archive`（wisdom≥8 OR agility≥7）→ item `tianji_founding_scroll`
  - `earn_trust`（agility≥8）→ flag `tianji_trust_gained`

### `feiyes_manor`

- **`evt_abandoned_room`** — 废弃内室
  - `search_room`（null）→ flag `manor_entered`, item `deeper_threat_evidence`
  - `find_hidden_access`（agility≥7 OR strength≥8）→ flag `manor_study_found`

- **`evt_portrait_wall`** — 旧画像壁（requires flag `manor_entered`）
  - `examine_portraits`（null）→ flag `feiyes_manor_searched`, item `name_list_fragment`
  - `match_markings`（flag `stele_decoded` OR flag `fei_ye_suspect`）→ flag `fei_ye_identity_confirmed`

### `qujiang_pavilion`

- **`evt_pavilion_approach`** — 曲江亭外
  - `enter_directly`（null）→ flag `entered_pavilion`
  - `scout_first`（agility≥7）→ flag `entered_pavilion`, flag `exit_route_planned`

- **`evt_fei_ye_confrontation`** — 终局·飞爷（requires flag `entered_pavilion`）
  - `expose_truth`（has `tianji_founding_scroll` + flag `deeper_threat_revealed`）→ flag `chapter3_truth_ending`
  - `demand_answers`（flag `fei_ye_identity_confirmed`）→ flag `chapter3_standoff_ending`
  - `join_forces`（flag `chapter2_join_ending` + flag `tianji_trust_gained`）→ flag `chapter3_join_ending`

---

## Items

### Clue Items (isClue: true)

| ID | Name | Description |
|---|---|---|
| `tianji_founding_scroll` | 天机创立卷 | 天机阁创立密档，以飞爷真名立册，记有建阁缘由与鸢字组成立始末 |
| `target_profile` | 追查令 | 天机阁内部追查文书，目标描述——四十出头、面容普通、惯用左手——正是飞爷 |
| `name_list_fragment` | 名单残页 | 宋怀义携带名单的一页，上有飞爷真名及其在天机阁的代号：鸢 |
| `deeper_threat_evidence` | 上游密函 | 来历不明的威胁信，措辞显示发信人在朝廷内部，且知晓天机阁的全部成员 |

### Non-Clue Items

| ID | Name | Description |
|---|---|---|
| `qujiang_invitation` | 曲江约信 | 约在曲江亭见面的信条，笔迹与飞爷一致 |

---

## Chapter 3 Endings

### 真相结局·公诸于众
**Condition:** flag `chapter3_truth_ending`（requires `tianji_founding_scroll` + flag `deeper_threat_revealed`）
**Narrative:** 玩家将天机创立卷与名单残页一同公开。飞爷被带走，但名单上的人得到了保护。朝中那股暗流暂时收手。天机阁瓦解，而那个更深处的威胁，只是退回了阴影里。

### 对决结局·各执一端
**Condition:** flag `chapter3_standoff_ending`（flag `fei_ye_identity_confirmed`，无完整物证）
**Narrative:** 飞爷承认一切，但名单没有交出。他说：名单在的地方，那些人就安全一天。你没有足够的证据拿他，他也没有理由信任你。两人在曲江亭对坐到天明，各自带走了一半真相。

### 同行结局·两鸢
**Condition:** flag `chapter3_join_ending`（flag `chapter2_join_ending` + flag `tianji_trust_gained`）
**Narrative:** 飞爷问你：你是来执行任务的，还是来帮我的？你没有回答，但你把追查令烧了。他将名单的存放之处告诉了你。两个人，一张网，对抗同一个还没有名字的敌人。

---

## Completion Guarantee

All 5 templates can reach at least `chapter3_standoff_ending`:

| Template | STR | AGI | WIS | Path to `fei_ye_identity_confirmed` |
|---|---|---|---|---|
| 游侠 | 8 | 7 | 5 | `evt_portrait_wall.examine_portraits`（null）→ `npc_wujue.final_testimony` |
| 谋士 | 3 | 5 | 10 | `evt_nameless_stele.decode_tianji`（WIS≥6）OR `npc_wujue` path |
| 刺客 | 5 | 10 | 5 | `evt_portrait_wall.examine_portraits`（null）→ `npc_wujue.final_testimony` |
| 药师 | 4 | 5 | 6 | `evt_nameless_stele.decode_tianji`（WIS≥6）OR `npc_wujue` path |
| 全能客 | 6 | 6 | 6 | `evt_nameless_stele.decode_tianji`（WIS≥6）OR `npc_wujue` path |

**保底路径：** `evt_portrait_wall.examine_portraits`（null）→ flag `feiyes_manor_searched` → `npc_wujue.final_testimony`（requires `feiyes_manor_searched`，null stat condition）→ flag `fei_ye_identity_confirmed`。无属性要求，全部模板可达。

**真相结局保底（外线）：** `npc_wujue.stele_reading`（null condition）→ item `tianji_founding_scroll`。无属性要求，全部外线玩家可达。

**真相结局（卧底）：** `evt_safehouse_wall.find_archive`（AGI≥7）→ `tianji_founding_scroll`。游侠、刺客可达。

**同行结局：** 仅限 `chapter2_join_ending` 玩家；`evt_safehouse_wall.earn_trust`（AGI≥8）→ `tianji_trust_gained`。刺客主要路线。
