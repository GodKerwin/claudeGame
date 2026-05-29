# 第二章·暗渡陈仓 Design Spec

## Overview

**Goal:** Implement Chapter 2 of 天机残卷, continuing the investigation into Chang'an proper. Players follow leads from Chapter 1 endings, uncover the double-killer truth, and confront Li Mao (白衣人) at the imperial teahouse.

**Narrative premise:** All three Chapter 1 endings converge at the East Market entrance. 顾凌霜 only administered the drug — a second killer did the strangling. The player must identify the second killer and decide how to handle Li Mao (李邈).

---

## Architecture

### New Files

| File | Purpose |
|---|---|
| `src/data/maps/chapter2.json` | 6 rooms with exits and interactables |
| `src/data/events/chapter2.json` | ~18 events with multi-stat actions |
| `src/data/npcs/chapter2.json` | 4 new NPCs with branching dialogues |
| `src/data/items/chapter2.json` | ~15 new items (clue + non-clue) |
| `src/pages/ChapterEnd/ChapterEnd.tsx` | Chapter transition screen |

### Modified Files

| File | Change |
|---|---|
| `src/data/loader.ts` | Load chapter2 data; add `CHAPTER` selector or flag-based switching |
| `src/data/events/chapter1.json` | Add `nextChapter: true` to all 3 ending events |
| `src/App.tsx` or router | Add `/chapter-end` route |
| `src/engine/gameEngine.ts` | Detect `nextChapter` flag and redirect to `/chapter-end` |

### Chapter Transition Flow

```
Chapter 1 ending event
  → sets ending flag (force_ending / truth_ending / hermit_ending)
  → nextChapter: true → game engine navigates to /chapter-end
    → ChapterEnd page renders (reads flags + inventory)
    → player clicks "踏入第二章"
    → navigate to /game with chapter2 data loaded
```

---

## Chapter Break Screen (`/chapter-end`)

- Black background, gold text "第一章·完" centered
- Lines fade in sequentially (same animation as Prologue)
- Context line based on ending achieved:
  - `force_ending` → "你以力破局，真相却仍藏于刀锋之后。"
  - `truth_ending` → "真相已在掌中，但棋局远未终止。"
  - `hermit_ending` → "你选择了另一条路，却发现路的尽头仍是同一扇门。"
- Clue summary: lists player's `isClue` items collected in Chapter 1
- Button "踏入第二章" → loads Chapter 2, navigates to `/game`

---

## Chapter 2 Map

### Rooms

| Room ID | Name | Description |
|---|---|---|
| `east_market_entrance` | 东市入口 | Starting room; converge point for all Ch1 endings |
| `huichuntang` | 回春堂药铺 | 无迹和尚's base; poison investigation |
| `antique_shop` | 西市古玩铺 | Mysterious buyer contact; token appraisal |
| `cien_temple` | 慈恩寺偏院 | Hidden monk identity clues |
| `pingkang_hideout` | 平康坊据点 | Langpeng Gang remnants; Li Mao's orders |
| `imperial_teahouse` | 皇城茶馆 | Li Mao confrontation; chapter climax |

### Connections

```
east_market_entrance ←→ huichuntang ←→ antique_shop
        ↓
  cien_temple ←→ pingkang_hideout
                        ↓
     imperial_teahouse  (requires flag: langpeng_trail OR tianji_seal_read)
```

---

## NPCs

### `npc_wujue` — 无迹和尚
Location: `huichuntang` / `cien_temple`

| Dialogue ID | Condition | Grants |
|---|---|---|
| `first_meet` | none | flag: `wujue_met` |
| `poison_knowledge` | has `dafei_inner_token` OR wisdom≥7 | flag: `poison_source_known` |
| `true_identity` | has `wujue_prescription` + `monk_identity_scroll` | flag: `wujue_tianji_revealed` |
| `alley_drug_origin` | has `alley_rubbing` | item: `wujue_prescription` |

### `npc_langpeng_scout` — 浪鹏帮探子
Location: `pingkang_hideout`

| Dialogue ID | Condition | Grants |
|---|---|---|
| `first_meet` | none | — |
| `intimidate` | strength≥8 | flag: `langpeng_trail` |
| `tail` | agility≥8 | flag: `langpeng_trail` |
| `probe` | wisdom≥7 | flag: `langpeng_trail` |

### `npc_buyer_contact` — 神秘买家联络人
Location: `antique_shop`

| Dialogue ID | Condition | Grants |
|---|---|---|
| `first_meet` | none | — |
| `token_inquiry` | has `tianji_jade_token` | flag: `tianji_seal_read`; item: `buyer_transaction_record` |
| `hidden_client` | flag: `tianji_seal_read` + wisdom≥8 | flag: `buyer_identity_hinted` |

### `npc_li_mao` — 李邈
Location: `imperial_teahouse`

| Dialogue ID | Condition | Grants |
|---|---|---|
| `first_meet` | flag: `langpeng_trail` OR `tianji_seal_read` | — |
| `tianji_accusation` | has `kite_identity_clue` | flag: `li_mao_exposed` |
| `langpeng_evidence` | flag: `langpeng_trail` + has `langpeng_dispatch_order` | flag: `li_mao_cornered` |
| `full_evidence` | has `tianji_jade_token` + `ear_room_ledger` | flag: `double_killer_truth`; triggers ending branch |
| `recruitment_offer` | flag: `li_mao_exposed` | flag: `tianji_recruit_offered` |

---

## Events

### `east_market_entrance`
- **`evt_market_notice`** — 告示栏
  - `read_notice` (no condition): grants item `reward_notice`, flag `market_entry`
  - `examine_carefully` (wisdom≥6): grants flag `li_mao_description_known`

- **`evt_merchant_gossip`** — 茶摊闲聊
  - `listen_gossip` (no condition): grants flag `east_market_rumor`
  - `buy_information` (wisdom≥7): grants flag `langpeng_sighting`

### `huichuntang`
- **`evt_medicine_shelf`** — 药架检查
  - `browse_shelf` (no condition): grants flag `medicine_browsed`
  - `compare_poison` (has `account_book`): grants item `poison_residue_sample`, flag `poison_matched`
  - `deep_analysis` (wisdom≥8): grants item `poison_residue_sample`, flag `poison_source_known`

- **`evt_prescription_book`** — 方剂簿
  - `flip_through` (no condition): grants flag `prescription_seen`
  - `recognize_handwriting` (wisdom≥7 OR flag `wujue_met`): grants item `wujue_prescription`

### `antique_shop`
- **`evt_appraise_token`** — 鉴定令牌
  - requires: has `tianji_jade_token`
  - `casual_appraisal` (no condition): grants flag `token_appraised`
  - `expert_appraisal` (wisdom≥7): grants flag `tianji_seal_read`, item `tianji_signal_record`

- **`evt_buyer_ledger`** — 交易账本
  - `skim_ledger` (no condition): grants flag `ledger_seen`
  - `trace_entries` (wisdom≥6 OR agility≥7): grants item `buyer_transaction_record`

### `cien_temple`
- **`evt_monk_cell`** — 僧房搜查
  - `search_cell` (no condition): grants flag `cell_searched`
  - `find_hidden_compartment` (agility≥7 OR wisdom≥8): grants item `monk_identity_scroll`
  - `force_open` (strength≥8): grants item `monk_identity_scroll`

- **`evt_temple_mural`** — 壁画暗语
  - `observe_mural` (no condition): grants flag `mural_seen`
  - `decode_pattern` (wisdom≥7 OR flag `wujue_tianji_revealed`): grants flag `tianji_signal_known`

### `pingkang_hideout`
- **`evt_hideout_search`** — 据点搜查
  - `quick_search` (no condition): grants flag `hideout_entered`
  - `thorough_search` (agility≥7): grants item `langpeng_dispatch_order`
  - `break_through` (strength≥8): grants item `langpeng_dispatch_order`

- **`evt_captive_note`** — 被俘信函
  - requires flag: `hideout_entered`
  - `read_note` (no condition): grants item `captive_letter`, flag `langpeng_trail`
  - `analyze_seal` (wisdom≥7): additionally grants flag `li_mao_handwriting_known`

### `imperial_teahouse`
- **`evt_teahouse_ambush`** — 伏兵迹象
  - `enter_directly` (no condition): grants flag `entered_teahouse`
  - `scout_first` (agility≥7): grants flag `ambush_detected`, `entered_teahouse`

- **`evt_li_mao_encounter`** — 李邈现身（触发结局分支）
  - requires flag: `entered_teahouse`
  - Result determined by flags at time of trigger:
    - `double_killer_truth` → 擒凶结局
    - `li_mao_cornered` (without full evidence) → 放虎结局
    - `tianji_recruit_offered` + agility≥8 → 同流结局

---

## Items (Chapter 2)

### Clue Items (isClue: true)
| ID | Name | Description |
|---|---|---|
| `poison_residue_sample` | 毒药残样 | 与宋怀义尸身毒素吻合的残留 |
| `wujue_prescription` | 无迹方笺 | 无迹和尚亲笔，记有配毒之法 |
| `monk_identity_scroll` | 僧籍密卷 | 记载无迹和尚真实天机阁身份 |
| `langpeng_dispatch_order` | 浪鹏调令 | 李邈手书，命令暗杀宋怀义 |
| `buyer_transaction_record` | 买家往来账 | 神秘买家收购天机令牌的记录 |
| `tianji_signal_record` | 天机暗号册 | 天机阁内部联络暗语 |
| `captive_letter` | 被俘信函 | 浪鹏帮据点发现的密信 |
| `second_killer_evidence` | 第二凶手证据 | 综合物证，指向真正动手者 |

### Non-Clue Items
| ID | Name | Description |
|---|---|---|
| `reward_notice` | 东市悬赏令 | 官府悬赏通缉令，含李邈画像 |
| `teahouse_token` | 皇城茶馆入场牌 | 进入茶馆内室的凭证 |

---

## Chapter 2 Endings

### 擒凶结局 — 证据确凿
**Condition:** flag `double_killer_truth` (requires `poison_residue_sample` + `monk_identity_scroll` + `langpeng_dispatch_order`)
**Narrative:** 玩家在茶馆出示证据，联合暗中候命的衙役当场拿下李邈。无迹和尚的真实身份随之曝光，天机阁开始瓦解。

### 放虎结局 — 证据不足
**Condition:** flag `li_mao_cornered` (without `double_killer_truth`)
**Narrative:** 李邈承认部分事实，以"第三章关键情报"换取脱身。玩家得到一枚天机令牌残片，通往第三章。

### 同流结局 — 加入天机阁
**Condition:** flag `tianji_recruit_offered` + agility≥8 OR flag `ambush_detected`
**Narrative:** 玩家接受李邈招募，以卧底身份加入天机阁，解锁第三章隐藏路线。

---

## Completion Guarantee

All 5 templates can reach at least one Chapter 2 ending:

| Template | STR | AGI | WIS | Accessible Endings |
|---|---|---|---|---|
| 游侠 | 8 | 7 | 5 | 擒凶（STR路线）/ 放虎 |
| 谋士 | 3 | 5 | 10 | 擒凶（WIS路线）/ 放虎 |
| 刺客 | 5 | 10 | 5 | 同流（AGI≥8）/ 放虎 |
| 药师 | 4 | 5 | 6 | 放虎（via 无迹+scout路线）|
| 全能客 | 6 | 6 | 6 | 放虎 / 擒凶（marginal）|

**药师/全能客 guarantee:** Both can reach 放虎结局 via `li_mao_cornered` flag (obtainable through `langpeng_trail` from scout dialogue with WIS≥7, which both have).
