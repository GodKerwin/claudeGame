# 第二、三章内容扩充 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复游方医/飞贼两个职业的结局可达性漏洞，并将第二、三章叙事密度提升至与第一章对齐。

**Architecture:** 纯数据驱动——所有修改集中在 JSON 数据文件中。npc_wujue 第二章专属对话添加至 chapter3.json（以 `flags_absent: ["chapter3_started"]` 区分），npc_fei_ye 第三章新对话添加至 chapter1.json（已有定义处）。新 NPC 分别添加到 chapter2.json 和 chapter3.json。地图 interactables 最后统一更新。

**Tech Stack:** JSON 数据文件，Vitest 测试（TypeScript）

---

## 文件清单

| 操作 | 文件 |
|------|------|
| 修改 | `src/data/items/chapter2.json` — 新增 owner_testimony |
| 修改 | `src/data/items/chapter3.json` — 新增 unsent_letter |
| 修改 | `src/data/events/chapter2.json` — 修复可达性 + 新增 3 个事件 |
| 修改 | `src/data/events/chapter3.json` — 新增 2 个事件 |
| 修改 | `src/data/npcs/chapter1.json` — npc_fei_ye 新增 5 条对话 |
| 修改 | `src/data/npcs/chapter2.json` — 新增 npc_huichuntang_owner + 扩充 npc_langpeng_scout / npc_li_mao |
| 修改 | `src/data/npcs/chapter3.json` — npc_wujue 新增 4 条 ch2 专属对话 + npc_tianji_contact 新增 3 条 + 新增 npc_temple_novice |
| 修改 | `src/data/maps/chapter2.json` — 更新 4 个房间 interactables |
| 修改 | `src/data/maps/chapter3.json` — 更新 3 个房间 interactables |
| 修改 | `tests/data/chapter2Integrity.test.ts` — 更新计数断言 + 新增可达性断言 |
| 修改 | `tests/data/chapter3Integrity.test.ts` — 更新计数断言 + 新增断言 |

---

## Task 1: 新增道具（chapter2 + chapter3 items JSON）

**Files:**
- Modify: `src/data/items/chapter2.json`
- Modify: `src/data/items/chapter3.json`

- [ ] **Step 1.1: 在 chapter2.json items 末尾追加 owner_testimony、langpeng_hideout_intel（langpeng_hideout_intel 已存在，仅追加 owner_testimony）**

在 `src/data/items/chapter2.json` 数组末尾（最后一个 `}` 之后，`]` 之前）追加：

```json
  ,
  {
    "id": "owner_testimony",
    "name": "老板娘证词",
    "description": "回春堂老板娘在追问下透露的话：无迹和尚在此坐诊并非偶然，是有人安排他在此地保持低调，这个安排来自十年前，出自一个她从未见过正脸的委托人。",
    "isClue": true
  }
```

- [ ] **Step 1.2: 在 chapter3.json items 末尾追加 unsent_letter**

在 `src/data/items/chapter3.json` 数组末尾追加：

```json
  ,
  {
    "id": "unsent_letter",
    "name": "未寄出的信",
    "description": "飞爷书桌抽屉里发现的一封折叠信笺，收信人处只写了「韩朔」两字，正文只有一句：「若你看到此信，说明我已不在，名单交予来人。若来人值得信任——你判断。飞」笔迹镇定，像是写了许多年的字帖。",
    "isClue": true
  }
```

- [ ] **Step 1.3: 运行测试确认无破坏**

```bash
npx vitest run tests/data/chapter2Integrity.test.ts tests/data/chapter3Integrity.test.ts 2>&1 | tail -10
```

预期：两个测试文件通过（owner_testimony 尚未被测试，不影响现有断言）

- [ ] **Step 1.4: Commit**

```bash
git add src/data/items/chapter2.json src/data/items/chapter3.json
git commit -m "data: add owner_testimony and unsent_letter items"
```

---

## Task 2: 可达性修复——poison_residue_sample（chapter2 events）

**Files:**
- Modify: `src/data/events/chapter2.json` — `evt_medicine_shelf` 新增 2 个动作

- [ ] **Step 2.1: 在 evt_medicine_shelf 的 actions 数组末尾追加两个动作**

找到 `evt_medicine_shelf` 事件，在其 `actions` 数组的最后一个动作（`sense_poison_qi`）之后追加：

```json
      ,
      {
        "id": "constitution_smell",
        "label": "以强健的体质，直接凭气味鉴定毒药成分",
        "requires": { "constitution": 6, "flags_absent": ["poison_matched"] },
        "result": "你的鼻腔从小就被各种气味磨砺过，对毒物尤其敏感。凑近一闻，记忆里某次见过的气味立刻浮现——砒霜特有的酸腥气，还混着一股淡淡的草木香……曼陀罗。你取下这格药，已经可以确定：这就是害死宋怀义的毒的来源。",
        "grants": { "flags": ["poison_matched"], "items": ["poison_residue_sample"] }
      },
      {
        "id": "thief_poison_sniff",
        "label": "以走江湖的经验，辨认毒药种类（三教九流）",
        "requires": { "talent": "三教九流", "flags_absent": ["poison_matched"] },
        "result": "黑市上跑过的路子，见过的毒不止一种。你拨开药架，凑近那几格新旧混杂的药材，在旁人看来只是随手翻找，实则每一格你都嗅了个仔细。砒霜混着曼陀罗，这个配法你见过——是专门针对有解毒经验者的烈性组合，坊间难觅，黑市上偶有流通。取下这格药，就是那毒的来源。",
        "grants": { "flags": ["poison_matched", "poison_source_known"], "items": ["poison_residue_sample"] }
      }
```

- [ ] **Step 2.2: 运行测试确认无破坏**

```bash
npx vitest run tests/data/chapter2Integrity.test.ts 2>&1 | tail -8
```

预期：PASS（测试只检查动作存在性，新动作不影响现有断言）

- [ ] **Step 2.3: Commit**

```bash
git add src/data/events/chapter2.json
git commit -m "fix: add constitution/thief paths to poison_residue_sample for all builds"
```

---

## Task 3: 可达性修复——kite_identity_clue（chapter2 events + npcs）

**Files:**
- Modify: `src/data/events/chapter2.json` — `evt_buyer_ledger` 新增 1 个动作
- Modify: `src/data/npcs/chapter2.json` — `npc_langpeng_scout` 新增 1 条对话

- [ ] **Step 3.1: 在 evt_buyer_ledger 末尾追加 decode_kite_mark 动作**

找到 `evt_buyer_ledger`，在 `trace_entries_agi` 动作之后追加：

```json
      ,
      {
        "id": "decode_kite_mark",
        "label": "辨认账本中隐藏的暗记符号（三教九流）",
        "requires": { "talent": "三教九流", "flags_absent": ["kite_identity_clue"] },
        "result": "跑黑市的人练就了认暗记的眼力。你翻着账本，在几笔金额旁发现了极细微的勾画——那是黑市江湖里某个老牌组织的标记方式，以「鸢」字为核心的变体符。你见过这符号，但一直不知道它背后的组织叫什么，如今对照账本里的往来记录，答案浮现：鸢字组，天机阁内部一个特殊的部门。这个「委托人」，正是鸢字组的人。",
        "grants": { "flags": ["kite_identity_clue", "kite_ledger_found"] }
      }
```

- [ ] **Step 3.2: 在 npc_langpeng_scout 对话数组末尾追加 kite_clue_exchange**

找到 `npc_langpeng_scout`，在 `thief_exchange` 对话之后追加：

```json
      ,
      {
        "id": "kite_clue_exchange",
        "condition": { "flags": ["hideout_trust_gained"], "flags_absent": ["kite_identity_clue"] },
        "text": "探子朝四周看了看，压低声音：「既然你是自己人，我告诉你个更大的事。李爷真正在找的，不只是那份名单——他要的是名单背后一个叫「鸢字组」的东西。这帮人在长安暗中经营了二十年，换了好几张脸，李爷一直没抓到根子。」\n\n他拍了拍你的肩膀：「你若查到「鸢」这个字眼，那就是到核心了。」",
        "grants": { "flags": ["kite_identity_clue", "langpeng_kite_mentioned"] }
      }
```

- [ ] **Step 3.3: 运行测试**

```bash
npx vitest run tests/data/chapter2Integrity.test.ts 2>&1 | tail -8
```

预期：PASS

- [ ] **Step 3.4: Commit**

```bash
git add src/data/events/chapter2.json src/data/npcs/chapter2.json
git commit -m "fix: add kite_identity_clue paths for 三教九流 and trust-based scout dialogue"
```

---

## Task 4: npc_wujue 第二章专属对话（chapter3.json NPCs）

> 注意：npc_wujue 定义在 chapter3.json，chapter2.json 若再添加同 ID NPC 会被覆盖。ch2 专属对话通过 `flags_absent: ["chapter3_started"]` 条件区分。

**Files:**
- Modify: `src/data/npcs/chapter3.json` — npc_wujue dialogues 新增 4 条

- [ ] **Step 4.1: 在 npc_wujue 的 dialogues 数组末尾追加 4 条第二章专属对话**

找到 chapter3.json 中 npc_wujue 的 `medical_healing` 对话（最后一条），在其后追加：

```json
      ,
      {
        "id": "ch2_cold_reception",
        "condition": { "flags": ["wujue_met"], "flags_absent": ["chapter3_started", "ch2_wujue_opened"] },
        "text": "「你又来了。」无迹和尚合掌，目光平静，「贫僧已说的，无可再补。若施主有话要问，直接问，贫僧酌情作答。」\n\n他转回去捻动佛珠，背影透着一种漫长等待后沉淀下来的疲惫。",
        "grants": { "flags": ["ch2_wujue_opened"] }
      },
      {
        "id": "ch2_poison_confirm",
        "condition": { "flags": ["wujue_met", "poison_matched"], "flags_absent": ["chapter3_started", "poison_source_known"] },
        "text": "你把在药架发现的东西告诉他。\n\n无迹和尚沉默了很长时间，然后缓缓道：「那批药……是贫僧的。」他没有为自己辩解，「贫僧是从前留下的，二十年了，没想到还被人找到。」\n\n他抬眼看你：「你想知道那毒从哪来，贫僧告诉你——是天机阁当年的配方，非市售之物，在下是当年的知情者之一。」",
        "grants": { "flags": ["poison_source_known"] }
      },
      {
        "id": "ch2_identity_pressed",
        "condition": { "has": ["monk_identity_scroll"], "flags_absent": ["chapter3_started", "wujue_tianji_revealed"] },
        "text": "「你找到那卷东西了。」\n\n无迹和尚放下佛珠，看着你手中的密卷，沉默了半晌。\n\n「韩朔，天机阁风字组。二十年前，贫僧用那个名字行事。」他闭目，「施主若想知道更多，贫僧可以说。但贫僧要先问你一句：你查这件事，是为了真相，还是只为了结案？」\n\n——他等着你的回答，但无论你怎么说，他还是开了口：「天机阁的那段旧事，必须有人知道，贫僧已等了太久了。」",
        "grants": { "flags": ["wujue_tianji_revealed"] }
      },
      {
        "id": "ch2_final_warning",
        "condition": { "flags": ["wujue_tianji_revealed"], "flags_absent": ["chapter3_started", "wujue_ch2_warned"] },
        "text": "「李邈不是终点。」\n\n无迹和尚在你准备离开时开口，声音低沉，「施主去茶馆见他，要有心理准备——他背后还有一层，他自己也不全知道那一层是什么。」\n\n「有些事，等你到了第三章……」他顿住，像是察觉到了什么，「等你查完李邈，会知道的。去吧。」",
        "grants": { "flags": ["wujue_ch2_warned"] }
      }
```

- [ ] **Step 4.2: 运行测试**

```bash
npx vitest run tests/data/chapter2Integrity.test.ts tests/data/chapter3Integrity.test.ts 2>&1 | tail -8
```

预期：PASS

- [ ] **Step 4.3: Commit**

```bash
git add src/data/npcs/chapter3.json
git commit -m "data: add 4 ch2-specific wujue dialogues (flags_absent chapter3_started)"
```

---

## Task 5: 新 NPC npc_huichuntang_owner（chapter2.json NPCs）

**Files:**
- Modify: `src/data/npcs/chapter2.json` — 在数组末尾追加新 NPC

- [ ] **Step 5.1: 在 chapter2.json NPCs 末尾追加 npc_huichuntang_owner**

在 `npc_li_mao` 对象之后、数组 `]` 之前追加：

```json
  ,
  {
    "id": "npc_huichuntang_owner",
    "name": "回春堂老板娘",
    "description": "一个四十多岁的妇人，面容平静，眼神警觉，捣药的手从未停过，像是用忙碌来隔绝任何追问。",
    "dialogues": [
      {
        "id": "owner_first_meet",
        "condition": { "flags_absent": ["owner_met"] },
        "text": "「客官是看诊还是抓药？」她头也不抬，「铺子里只有常见草药，疑难杂症请去太医署。」她的语气不算冷淡，但明显不欢迎闲聊。",
        "grants": { "flags": ["owner_met"] }
      },
      {
        "id": "owner_under_pressure",
        "condition": { "flags": ["owner_met"], "flags_absent": ["owner_cracked"] },
        "text": "强势追问之下，老板娘放下药杵，抬眼看你。\n\n「那个和尚……不是普通的和尚。」她压低声音，「他坐在这里，从不主动开口，但有人来问他，他必然会答——不管那人说什么。十年了，从没有例外。」\n\n她重新低下头，「我不知道他在等什么，但那个「什么」，迟早会来。」",
        "condition": { "flags": ["owner_met"], "flags_absent": ["owner_cracked"] },
        "grants": { "flags": ["owner_cracked", "wujue_suspicious"] }
      },
      {
        "id": "owner_final_truth",
        "condition": { "flags": ["wujue_tianji_revealed", "owner_cracked"] },
        "text": "「你知道他是谁了，」老板娘看着你，不再遮掩，「那我告诉你一件事：他在这里不是偶然。十年前有个人来找过我，付了一年的药铺租金，说让一个和尚在此坐诊，不许我多问，不许让他离开。那个人的面孔我从没看清，来了一次，再没有出现过。」\n\n她顿了顿，「那个人，左手有一道旧疤。」",
        "grants": { "flags": ["owner_told_truth"], "items": ["owner_testimony"] }
      }
    ]
  }
```

- [ ] **Step 5.2: 运行测试**

```bash
npx vitest run tests/data/chapter2Integrity.test.ts 2>&1 | tail -8
```

预期：PASS（新 NPC 不在现有断言中，不影响通过）

- [ ] **Step 5.3: Commit**

```bash
git add src/data/npcs/chapter2.json
git commit -m "data: add npc_huichuntang_owner with 3 dialogues (ch2)"
```

---

## Task 6: npc_langpeng_scout + npc_li_mao 扩充（chapter2.json NPCs）

**Files:**
- Modify: `src/data/npcs/chapter2.json`

- [ ] **Step 6.1: 在 npc_langpeng_scout 的 kite_clue_exchange（Task 3 已添加）之后追加 2 条对话**

> kite_clue_exchange 已在 Task 3 添加。在其之后再追加：

```json
      ,
      {
        "id": "scared_confession",
        "condition": { "flags": ["langpeng_scared"], "flags_absent": ["langpeng_full_confession"] },
        "text": "「你别动手……我说，我全说。」他哆嗦着，「李爷不只让我们盯宋怀义。他还有另一条线——回春堂的和尚。和尚身边有人替李爷守着，监视他，不让他乱走。我只是跑腿的，但我看过那份名单，上头写的不只是宋怀义一个人——名单上的人，一个都没漏。」",
        "grants": { "flags": ["langpeng_full_confession"], "clues": ["langpeng_hideout_intel"] }
      },
      {
        "id": "dispatch_recognition",
        "condition": { "has": ["langpeng_dispatch_order"], "flags_absent": ["langpeng_dispatch_confirmed"] },
        "text": "你将调令递到他面前，他一眼认出，喃喃：「这是李爷的字……他亲笔写的。我见过他下令的样子，就坐在据点正堂，笔划得快，旁边两个护卫站着。那不是临时起意，是早就计划好的。」\n\n他抬头看你：「你有这个，李爷就赖不掉了。」",
        "grants": { "flags": ["langpeng_dispatch_confirmed"] }
      }
```

- [ ] **Step 6.2: 在 npc_li_mao 的 recruitment_offer 对话之后追加 3 条对话**

```json
      ,
      {
        "id": "defensive_denial",
        "condition": { "flags": ["entered_teahouse"], "flags_absent": ["li_mao_exposed", "li_mao_denial_used"] },
        "text": "「你凭什么断定是我？」李邈端起茶杯，声音平稳，「长安城里姓李的官员数以百计，凭一个字就来找我，这算哪门子证据？」\n\n他放下杯子，目光锐利：「我在这里等你，是因为有人告诉我，有个调查者在四处打听，走得很深。我想看看你掌握了多少。——现在看来，还不够。」",
        "grants": { "flags": ["li_mao_denial_used"] }
      },
      {
        "id": "cornered_negotiation",
        "condition": { "flags": ["li_mao_cornered"], "flags_absent": ["li_mao_true_position_revealed"] },
        "text": "李邈沉默了一段时间。\n\n「你掌握的比我想象的多。」他抬起头，语气变了，多了几分真实，「我告诉你一件事——我也不过是颗棋子。发令的那个人，不是我。我只是传话的那一环。」\n\n他低下眼，「名单的事，比你看到的要深得多。宋怀义死了，但那份名单背后的人还在——而且，在等着任何知道内情的人死掉。包括你，包括我。」",
        "grants": { "flags": ["li_mao_true_position_revealed"] }
      },
      {
        "id": "tianji_background",
        "condition": { "flags": ["li_mao_exposed", "tianji_seal_read"] },
        "text": "「天机阁的东西你已经找到了，」李邈扫了一眼你手边，「那我不妨多说一点。天机阁在长安的最后一个据点，在城东一条不起眼的巷子里。门面是茶水铺。」\n\n「去那里，说「归鸟问津」。他们会接你。去了，你才能知道这件事有多深——以及，你有没有力气走完最后一段路。」",
        "grants": { "flags": ["ch3_intel_from_li_mao", "tianji_safehouse_location_known"] }
      }
```

- [ ] **Step 6.3: 运行测试**

```bash
npx vitest run tests/data/chapter2Integrity.test.ts 2>&1 | tail -8
```

预期：PASS

- [ ] **Step 6.4: Commit**

```bash
git add src/data/npcs/chapter2.json
git commit -m "data: expand langpeng_scout (+2) and li_mao (+3) dialogues with depth and reachability"
```

---

## Task 7: 第二章新事件（chapter2.json events）

**Files:**
- Modify: `src/data/events/chapter2.json` — 末尾追加 3 个新事件

- [ ] **Step 7.1: 在 chapter2 events 数组末尾追加 evt_bounty_investigation**

在最后一个事件（`evt_ch2_blackmarket_intel`）之后追加：

```json
  ,
  {
    "id": "evt_bounty_investigation",
    "title": "深查悬赏令",
    "description": "这张悬赏令是谁发的？画师是谁？为什么发布时间如此之快？",
    "actions": [
      {
        "id": "trace_artist",
        "label": "向坊官打听悬赏令的发布渠道",
        "requires": { "flags": ["market_entry"], "flags_absent": ["li_mao_description_known"] },
        "result": "你找到坊官，称是官府协查。坊官翻出登记本，告知这张悬赏令由长安府主簿亲署，下令日期在宋怀义死亡当夜，发布速度异乎寻常。你把「长安府主簿」这四个字默记于心。",
        "grants": { "flags": ["li_mao_description_known", "li_mao_official_id_known"] }
      },
      {
        "id": "official_inquiry",
        "label": "以官身问询坊官，取得完整告示档案（官威）",
        "requires": { "talent": "官威", "flags_absent": ["li_mao_description_known"] },
        "result": "你亮出官牒，坊官立刻起身恭候。档案显示，这张悬赏令由长安府主簿李邈亲批，还附有一份手写的「嫌疑人体貌特征补充说明」，与往事客栈那个白衣人的特征一字不差。发令时间比案发早了足足四个时辰——这根本不是案后紧急通缉，是提前准备好的。",
        "grants": { "flags": ["li_mao_description_known", "li_mao_official_id_known", "li_mao_premeditated_notice"] }
      }
    ]
  },
  {
    "id": "evt_hidden_safe",
    "title": "古玩铺后室",
    "description": "掌柜打发走你之后，铺子里有一扇半掩的门通往后室，透出一股旧纸气息。",
    "actions": [
      {
        "id": "search_back_room",
        "label": "趁掌柜不注意，溜进后室翻查",
        "requires": { "agility": 7, "flags_absent": ["antique_back_searched"] },
        "result": "后室不大，码着十几只木箱。你快速翻查，在最里面的一只箱底发现一叠夹页——几份往来账单，收款方一概以代号代替，其中一笔金额尤大，备注处写着「鸢字组旧档，一批，已交付」。这份东西说明古玩铺不只是中转站，还在主动购买天机阁的内部档案。",
        "grants": { "flags": ["antique_back_searched", "deeper_network_known"], "items": ["second_killer_evidence"] }
      },
      {
        "id": "intimidate_dealer",
        "label": "以气势逼迫掌柜带你进后室",
        "requires": { "strength": 8, "flags_absent": ["antique_back_searched"] },
        "result": "你盯着掌柜，不说话，只是站着，那种久经江湖练出来的压迫感让掌柜的笑容渐渐僵住。他颤声道：「后……后室可以看，您随便看。」\n\n里头的东西没让你失望——一批往来账单，一笔标注「鸢字组旧档」的大额交易，证明有人在系统性收购天机阁的内部档案。",
        "grants": { "flags": ["antique_back_searched", "deeper_network_known"], "items": ["second_killer_evidence"] }
      },
      {
        "id": "gang_code_unlock",
        "label": "以帮派暗语从掌柜处套出后室底细（三教九流）",
        "requires": { "flags": ["gang_culture_known"], "flags_absent": ["antique_back_searched"] },
        "result": "你说了几个江湖切口，掌柜的眼神一变，戒备瞬间松动——他认出你是行里人。他带你进后室，低声说：「自己人就直说吧，那批东西早被取走了，留下的这些是副本。委托人三个月没来取，我也不知道事情出了什么变故。」\n\n副本里的信息足够多——鸢字组旧档的买家，比想象中更有组织。",
        "grants": { "flags": ["antique_back_searched", "deeper_network_known", "antique_gang_opened"], "items": ["second_killer_evidence"] }
      }
    ]
  },
  {
    "id": "evt_prisoner_testimony",
    "title": "据点线人",
    "description": "据点里有一个被关押着的人，手脚被绑，看见你走过来时眼神里出现了恐惧和希望交织的复杂神情。",
    "actions": [
      {
        "id": "interrogate_prisoner",
        "label": "审讯被关押的线人",
        "requires": { "flags": ["hideout_entered"], "flags_absent": ["prisoner_interrogated"] },
        "result": "那人颤声道：「我只是普通线人，帮浪鹏帮传话的……李爷下令盯的，不只是宋怀义一个人——名单上的另外几个人，在长安城各处，都有人盯着。」他喘了口气，「调令不止一份，据点灶台后面只是其中一份。还有一份，在李爷自己手上，内容是另外一批目标。我没见过那份，但我知道它存在。」",
        "grants": { "flags": ["prisoner_interrogated"], "clues": ["langpeng_hideout_intel"] }
      },
      {
        "id": "medical_treat_prisoner",
        "label": "为受伤线人施救，换取口供（望闻断骨）",
        "requires": { "talent": "望闻断骨", "flags_absent": ["prisoner_healed"] },
        "result": "那人右肩有脱臼，脸上有两处淤伤，但不致命。你利落地复位，施了几针止痛，他疼得倒抽了口凉气，然后看着你，眼神变了。\n\n「你……是游方医？」他沉默片刻，「行，你待我好，我也不能亏你。告诉你一件事：李爷安排了人，专门在客栈周围蹲守，手里有一份名单，名单上的人一旦出现，立刻上报。宋怀义死那一夜，蹲守的人撤了——是有人通知他们撤的，那个人不是李爷。」\n\n他勉强坐起来：「幕后有两个人，不只一个。」",
        "grants": { "flags": ["prisoner_healed", "prisoner_grateful", "prisoner_interrogated"], "clues": ["langpeng_hideout_intel"], "items": ["second_killer_evidence"] }
      }
    ]
  }
```

- [ ] **Step 7.2: 运行测试**

```bash
npx vitest run tests/data/chapter2Integrity.test.ts 2>&1 | tail -8
```

预期：PASS（新事件不在现有事件计数断言中，不影响现有测试）

- [ ] **Step 7.3: Commit**

```bash
git add src/data/events/chapter2.json
git commit -m "data: add 3 new ch2 events (bounty_investigation, hidden_safe, prisoner_testimony)"
```

---

## Task 8: 第二章地图更新（chapter2.json maps）

**Files:**
- Modify: `src/data/maps/chapter2.json`

- [ ] **Step 8.1: east_market_entrance interactables 添加 evt_bounty_investigation**

找到 `east_market_entrance` 房间的 `interactables` 数组，在 `"evt_merchant_gossip"` 之后追加 `"evt_bounty_investigation"`：

```json
"interactables": ["evt_market_notice", "evt_merchant_gossip", "evt_bounty_investigation"],
```

- [ ] **Step 8.2: antique_shop interactables 添加 evt_hidden_safe**

```json
"interactables": ["evt_appraise_token", "evt_buyer_ledger", "npc_buyer_contact", "evt_hidden_safe"],
```

- [ ] **Step 8.3: pingkang_hideout interactables 添加 evt_prisoner_testimony**

```json
"interactables": ["evt_hideout_search", "evt_captive_note", "npc_langpeng_scout", "evt_ch2_agility_growth", "evt_ch2_blackmarket_intel", "evt_prisoner_testimony"],
```

- [ ] **Step 8.4: huichuntang interactables 添加 npc_huichuntang_owner**

```json
"interactables": ["evt_medicine_shelf", "evt_prescription_book", "npc_wujue", "evt_ch2_constitution_growth", "npc_huichuntang_owner"],
```

- [ ] **Step 8.5: 运行测试**

```bash
npx vitest run tests/data/chapter2Integrity.test.ts 2>&1 | tail -8
```

预期：PASS（interactable 引用检查会验证新 ID 存在）

- [ ] **Step 8.6: Commit**

```bash
git add src/data/maps/chapter2.json
git commit -m "data: wire new ch2 events and npc_huichuntang_owner into room interactables"
```

---

## Task 9: npc_fei_ye 第三章对话扩充（chapter1.json NPCs）

**Files:**
- Modify: `src/data/npcs/chapter1.json` — npc_fei_ye 新增 5 条对话

- [ ] **Step 9.1: 在 npc_fei_ye 的 undercover_bond 之后追加 5 条对话**

找到 chapter1.json 中 `npc_fei_ye` 的 `undercover_bond` 对话（最后一条），在其后追加：

```json
      ,
      {
        "id": "pavilion_tension",
        "condition": { "flags": ["fei_ye_pavilion_met"], "flags_absent": ["fei_ye_identity_confirmed", "pavilion_tension_played"] },
        "text": "「你来找我，」飞爷没有回头，「说明你已经查到了某处。问吧。」\n\n他的声音平静，没有防御，也没有讨好，像是一个等待结果的人——而不是一个被追问的人。\n\n「你知道的是哪一段？」他问。",
        "grants": { "flags": ["pavilion_tension_played"] }
      },
      {
        "id": "twenty_years_monologue",
        "condition": { "flags": ["fei_ye_admitted"], "flags_absent": ["fei_ye_story_told"] },
        "text": "「你想知道为什么。」\n\n他看着池水，「二十年前，天机阁垮了。名单上的人，是我答应过会保护的——答应的时候，我以为自己有能力。」\n\n他停了很长时间。\n\n「后来我发现我没有那个能力。但我不想让他们知道。所以我换了一张脸，在这座城里藏着，等一个比我更能保住那份名单的人出现。」\n\n他回头看你：「你，就是那个人吗？」",
        "grants": { "flags": ["fei_ye_story_told"] }
      },
      {
        "id": "truth_ending_dialogue",
        "condition": { "flags": ["chapter3_truth_ending"] },
        "text": "「你选了最难的一条路。」飞爷看着你，「把真相公之于众，意味着名单上的每个人都将曝光——有些人会得救，有些人不会。」\n\n他平静地说：「但这是他们应该得到的东西。知道自己的处境，然后自己选择。」\n\n「谢谢你，」他最后说，「等了二十年，我现在才说这句话。」"
      },
      {
        "id": "standoff_ending_dialogue",
        "condition": { "flags": ["chapter3_standoff_ending"] },
        "text": "飞爷看了你很久，然后轻轻点头。\n\n「各守一段真相，也许是眼下最好的结局。」他站起来，「你守住查到的，我守住剩下的——这样，无论哪一边出了问题，还有另一边在。」\n\n他走向池边，声音落在水面上：「下次见面，不知是哪一年了。但你若回来，曲江亭，我还在这里。」"
      },
      {
        "id": "join_ending_dialogue",
        "condition": { "flags": ["chapter3_join_ending"] },
        "text": "任务令在池水里散开，墨迹洇染，最终看不出字迹。\n\n飞爷看着那团湿纸，很长时间没有说话。\n\n「我知道这不是结束，」他开口，「名单上还有很多人，廷尉府的那一层还在。但是……」他顿了顿，「至少今天，我不是一个人了。」\n\n他第一次真正地看向你，眼神里有一种二十年都藏着的东西，刚刚松动了一点。"
      }
```

- [ ] **Step 9.2: 运行测试**

```bash
npx vitest run tests/data/chapter3Integrity.test.ts 2>&1 | tail -8
```

预期：PASS

- [ ] **Step 9.3: Commit**

```bash
git add src/data/npcs/chapter1.json
git commit -m "data: expand npc_fei_ye with 5 ch3 dialogues (tension/monologue/3 ending closures)"
```

---

## Task 10: npc_tianji_contact 扩充 + npc_temple_novice（chapter3.json NPCs）

**Files:**
- Modify: `src/data/npcs/chapter3.json`

- [ ] **Step 10.1: 在 npc_tianji_contact 的最后一条对话（thief_old_acquaintance）之后追加 3 条对话**

找到 chapter3.json 中 `npc_tianji_contact` 的 `thief_old_acquaintance`，在其后追加：

```json
      ,
      {
        "id": "fei_ye_location_hint",
        "condition": { "flags": ["tianji_trust_gained"], "flags_absent": ["fei_ye_sighted", "qujiang_location_known"] },
        "text": "「你想找到他，」联络人不是在问，「他最近几日在曲江池一带。每当事情接近结局，他都会去那里。」\n\n他顿了顿，「他在等的那个人，到底是什么样子的——我见过你，我觉得，也许就是你。」",
        "grants": { "flags": ["fei_ye_sighted", "qujiang_location_known"] }
      },
      {
        "id": "upstream_warning",
        "condition": { "flags": ["tianji_trust_gained", "tianji_network_seen"], "flags_absent": ["upstream_threat_warned"] },
        "text": "「还有一件事要告诉你。」他的声音降低了，「追查飞爷的不只是我们。有一双眼睛，在我们之上——他们比天机阁更早知道名单的存在，比浪鹏帮更安静，比李邈更有耐心。」\n\n「你去见飞爷，要有这个准备：那双眼睛，也在等着飞爷开口的那一刻。」",
        "grants": { "flags": ["upstream_threat_warned"] }
      },
      {
        "id": "ending_reaction",
        "condition": { "flags": ["fei_ye_identity_confirmed"] },
        "text": "联络人沉默了一会儿。\n\n「你已经走到这里了。」他看着你，「接下来的那步，只有你能走，我给不了你指引。」\n\n「去找他。」"
      }
```

- [ ] **Step 10.2: 在 npc_tianji_contact 之后追加新 NPC npc_temple_novice**

在 npc_tianji_contact 对象之后、数组 `]` 之前追加：

```json
  ,
  {
    "id": "npc_temple_novice",
    "name": "寺院小僧",
    "description": "一个十五六岁的小沙弥，正用扫帚打扫庭院，见到来人微微躬身，神情纯朴但眼神机灵。",
    "dialogues": [
      {
        "id": "novice_greeting",
        "condition": { "flags_absent": ["novice_met"] },
        "text": "「施主请了。」小僧放下扫帚合掌，「本寺偏院少有人来，施主若是礼佛，正殿在东侧。若是找无迹大师，他在药铺里，今日或许下午回来。」",
        "grants": { "flags": ["novice_met"] }
      },
      {
        "id": "fei_ye_sighting_novice",
        "condition": { "flags": ["stele_decoded", "novice_met"], "flags_absent": ["fei_ye_sighted"] },
        "text": "「那块碑……」小僧若有所思，「前几日确实有位施主在碑前站了很久。白衣，年纪不大不小，左手——」他想了想，「左手好像有一道旧疤，他看碑的时候，手摸着碑角，一直没放。」\n\n小僧指了指东南方向：「他离开时，往那边走的，那条路通往曲江池。」",
        "grants": { "flags": ["fei_ye_sighted", "qujiang_direction_known"] }
      },
      {
        "id": "wujue_testimony_ref",
        "condition": { "flags": ["wujue_guilt_revealed"], "flags_absent": ["novice_wujue_words"] },
        "text": "「无迹大师……」小僧的表情变得认真，「他前两日跟我说了一句话，说得很奇怪，我一直记着。」\n\n「他说：「有些罪，念多少经都还不清楚，只有说出来，才能真正还。」」\n\n小僧低头，「我不懂他说的是什么，但他说完就轻松了一些，好像放下了什么东西。」",
        "grants": { "flags": ["novice_wujue_words"] }
      }
    ]
  }
```

- [ ] **Step 10.3: 运行测试**

```bash
npx vitest run tests/data/chapter3Integrity.test.ts 2>&1 | tail -8
```

预期：PASS

- [ ] **Step 10.4: Commit**

```bash
git add src/data/npcs/chapter3.json
git commit -m "data: expand npc_tianji_contact (+3) and add npc_temple_novice (ch3)"
```

---

## Task 11: 第三章新事件（chapter3.json events）

**Files:**
- Modify: `src/data/events/chapter3.json`

- [ ] **Step 11.1: 在 chapter3 events 数组末尾追加 evt_hidden_letter**

在最后一个事件（`evt_ch3_agility_growth`）之后追加：

```json
  ,
  {
    "id": "evt_hidden_letter",
    "title": "书桌抽屉",
    "description": "书桌的最底层抽屉比其他的更紧，不是上了锁，是长期没有人动，木头涨了。",
    "actions": [
      {
        "id": "find_unsent_letter",
        "label": "拉开抽屉，查看里面的东西",
        "requires": { "flags": ["manor_study_found"], "flags_absent": ["unsent_letter_found"] },
        "result": "抽屉里只有一封折叠的信，收信人处写着「韩朔」——就是无迹和尚的俗名。你打开来：「若你看到此信，说明我已不在，名单交予来人。若来人值得信任——你判断。飞」\n\n字迹镇定，像是写了许多年的习惯，而不是仓促留书。这封信，被写好后放在这里，从来没有被送出去。",
        "grants": { "flags": ["unsent_letter_found"], "items": ["unsent_letter"] }
      },
      {
        "id": "healer_decipher",
        "label": "以医者眼光辨析笔迹的书写状态（望闻断骨）",
        "requires": { "talent": "望闻断骨", "flags": ["manor_study_found"], "flags_absent": ["unsent_letter_found"] },
        "result": "你拿着信细看——笔画的压力均匀，没有停顿痕迹，是一个习惯了书写的人在平静状态下写的。但信纸的折痕被展开过不止一次，说明写信的人曾经多次取出来重读，又重新折好放回去。\n\n写给无迹和尚的字，被反复重读了许多年。这封信，对写信的人来说，不只是交代，是一种陪伴。\n\n你将信放入怀中，心里的某些疑问，有了答案的方向。",
        "grants": { "flags": ["unsent_letter_found", "fei_ye_identity_confirmed"], "items": ["unsent_letter"] }
      }
    ]
  },
  {
    "id": "evt_pavilion_final_choice",
    "title": "曲江亭·最终抉择",
    "description": "飞爷已将一切托出，现在该你说了。这一刻，三章的调查走向，汇聚在这一个决定里。",
    "actions": [
      {
        "id": "pause_before_deciding",
        "label": "沉默片刻，回顾三章来时的路",
        "requires": { "flags": ["fei_ye_story_told"], "flags_absent": ["pavilion_final_moment"] },
        "result": "〔往事客栈的那个清晨，走廊里的血腥气，掌柜额角的汗……一路走来的每一步，都在引向这里。飞爷在等，等你说出那个字。〕\n\n你深呼一口气，做出了你的决定。",
        "grants": { "flags": ["pavilion_final_moment"] }
      }
    ]
  }
```

- [ ] **Step 11.2: 运行测试**

```bash
npx vitest run tests/data/chapter3Integrity.test.ts 2>&1 | tail -8
```

预期：PASS

- [ ] **Step 11.3: Commit**

```bash
git add src/data/events/chapter3.json
git commit -m "data: add evt_hidden_letter and evt_pavilion_final_choice (ch3)"
```

---

## Task 12: 第三章地图更新（chapter3.json maps）

**Files:**
- Modify: `src/data/maps/chapter3.json`

- [ ] **Step 12.1: dayan_pagoda interactables 添加 npc_temple_novice**

```json
"interactables": ["evt_nameless_stele", "evt_pagoda_shadow", "npc_wujue", "evt_ch3_constitution_growth", "npc_temple_novice"],
```

- [ ] **Step 12.2: feiyes_manor interactables 添加 evt_hidden_letter**

```json
"interactables": ["evt_abandoned_room", "evt_portrait_wall", "npc_wujue", "evt_hidden_letter"],
```

- [ ] **Step 12.3: qujiang_pavilion interactables 添加 evt_pavilion_final_choice**

```json
"interactables": ["evt_pavilion_approach", "evt_fei_ye_confrontation", "npc_fei_ye", "evt_pavilion_final_choice"],
```

- [ ] **Step 12.4: 运行测试**

```bash
npx vitest run tests/data/chapter3Integrity.test.ts 2>&1 | tail -8
```

预期：PASS

- [ ] **Step 12.5: Commit**

```bash
git add src/data/maps/chapter3.json
git commit -m "data: wire npc_temple_novice and new ch3 events into room interactables"
```

---

## Task 13: 测试更新——覆盖新内容 + 可达性断言

**Files:**
- Modify: `tests/data/chapter2Integrity.test.ts`
- Modify: `tests/data/chapter3Integrity.test.ts`

- [ ] **Step 13.1: 更新 chapter2Integrity.test.ts**

将文件全量替换为以下内容（注：此处仅列关键变更项，完整文件保留所有原有断言）：

**更改点 1**：`'all 10 chapter2 items exist'` 改为 `'all 11 chapter2 items exist'`，将断言数组改为：

```typescript
  it('all 11 chapter2 items exist', () => {
    const expected = [
      'poison_residue_sample', 'wujue_prescription', 'monk_identity_scroll',
      'langpeng_dispatch_order', 'buyer_transaction_record', 'tianji_signal_record',
      'captive_letter', 'second_killer_evidence', 'reward_notice', 'teahouse_token',
      'owner_testimony',
    ];
    for (const id of expected) {
      expect(allItemIds.has(id), `missing item: ${id}`).toBe(true);
    }
  });
```

**更改点 2**：`'all 12 chapter2 events exist'` 改为 `'all 15 chapter2 events exist'`，断言数组追加：

```typescript
      'evt_bounty_investigation', 'evt_hidden_safe', 'evt_prisoner_testimony',
```

**更改点 3**：`'all 4 chapter2 npcs exist'` 改为 `'all 5 chapter2 npcs exist'`，断言数组追加：

```typescript
      'npc_huichuntang_owner',
```

**新增断言**（在最后一个 `it` 之后追加）：

```typescript
  it('reachability: kite_identity_clue available to 三教九流 via evt_buyer_ledger', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_buyer_ledger');
    const action = evt?.actions.find((a) => a.id === 'decode_kite_mark');
    expect(action, 'decode_kite_mark action missing from evt_buyer_ledger').toBeDefined();
    expect(action?.requires?.talent).toBe('三教九流');
    expect(action?.grants?.flags).toContain('kite_identity_clue');
  });

  it('reachability: kite_identity_clue available via trust-based scout dialogue', () => {
    const npc = NPCS.find((n) => n.id === 'npc_langpeng_scout');
    const d = npc?.dialogues.find((d) => d.id === 'kite_clue_exchange');
    expect(d, 'kite_clue_exchange dialogue missing').toBeDefined();
    expect(d?.grants?.flags).toContain('kite_identity_clue');
  });

  it('reachability: poison_residue_sample available via constitution>=6', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_medicine_shelf');
    const action = evt?.actions.find((a) => a.id === 'constitution_smell');
    expect(action, 'constitution_smell action missing').toBeDefined();
    expect(action?.requires?.constitution).toBeLessThanOrEqual(6);
    expect(action?.grants?.items).toContain('poison_residue_sample');
  });

  it('reachability: poison_residue_sample available via 三教九流', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_medicine_shelf');
    const action = evt?.actions.find((a) => a.id === 'thief_poison_sniff');
    expect(action, 'thief_poison_sniff action missing').toBeDefined();
    expect(action?.requires?.talent).toBe('三教九流');
    expect(action?.grants?.items).toContain('poison_residue_sample');
  });
```

- [ ] **Step 13.2: 更新 chapter3Integrity.test.ts**

在现有断言基础上追加以下断言（在文件末尾对应 describe 块内）：

```typescript
  it('all 10 chapter3 items exist', () => {
    const expected = [
      'tianji_founding_scroll', 'target_profile', 'name_list_fragment',
      'deeper_threat_evidence', 'qujiang_invitation', 'wujue_confession',
      'qi_trace_clue', 'orders_kite_mark', 'manor_medical_evidence',
      'unsent_letter',
    ];
    for (const id of expected) {
      expect(allItemIds.has(id), `missing item: ${id}`).toBe(true);
    }
  });

  it('npc_temple_novice exists with fei_ye_sighting dialogue', () => {
    const npc = NPCS.find((n) => n.id === 'npc_temple_novice');
    expect(npc, 'npc_temple_novice missing').toBeDefined();
    const d = npc?.dialogues.find((d) => d.id === 'fei_ye_sighting_novice');
    expect(d).toBeDefined();
    expect(d?.grants?.flags).toContain('fei_ye_sighted');
  });

  it('npc_fei_ye has three ending closure dialogues', () => {
    const npc = NPCS.find((n) => n.id === 'npc_fei_ye');
    expect(npc?.dialogues.find((d) => d.id === 'truth_ending_dialogue')).toBeDefined();
    expect(npc?.dialogues.find((d) => d.id === 'standoff_ending_dialogue')).toBeDefined();
    expect(npc?.dialogues.find((d) => d.id === 'join_ending_dialogue')).toBeDefined();
  });

  it('evt_hidden_letter exists and grants unsent_letter', () => {
    const evt = EVENTS.find((e) => e.id === 'evt_hidden_letter');
    expect(evt, 'evt_hidden_letter missing').toBeDefined();
    const action = evt?.actions.find((a) => a.id === 'find_unsent_letter');
    expect(action?.grants?.items).toContain('unsent_letter');
  });
```

- [ ] **Step 13.3: 运行全套测试**

```bash
npx vitest run 2>&1 | tail -15
```

预期：
```
 Test Files  12 passed (12)
 Tests       ≥180 passed
```

如有 FAIL，根据报错修正对应 JSON 或测试断言。

- [ ] **Step 13.4: TypeScript 编译检查**

```bash
npx tsc --noEmit 2>&1
```

预期：无输出（零错误）

- [ ] **Step 13.5: Commit**

```bash
git add tests/data/chapter2Integrity.test.ts tests/data/chapter3Integrity.test.ts
git commit -m "test: update ch2/ch3 integrity tests for new content and reachability assertions"
```

---

## Task 14: 最终推送

- [ ] **Step 14.1: 确认 git log**

```bash
git log --oneline -8
```

应看到 Task 1–13 的 commit 依次排列。

- [ ] **Step 14.2: 运行全套测试最后一次**

```bash
npx vitest run 2>&1 | grep -E "passed|failed"
```

预期：全部 passed，0 failed。

- [ ] **Step 14.3: Push**

```bash
git push origin main
```

---

## 自检——Spec 覆盖确认

| Spec 要求 | 对应 Task |
|-----------|-----------|
| 游方医/飞贼 kite_identity_clue 修复 | Task 3 |
| 捕快/游方医/飞贼 poison_residue_sample 修复 | Task 2 |
| npc_huichuntang_owner 新增（3条对话） | Task 5 |
| npc_wujue ch2 专属对话（4条） | Task 4 |
| npc_langpeng_scout +2条、dispatch_recognition | Task 6 |
| npc_li_mao +3条 | Task 6 |
| evt_bounty_investigation | Task 7 |
| evt_hidden_safe | Task 7 |
| evt_prisoner_testimony | Task 7 |
| 第二章地图 interactables 更新 | Task 8 |
| npc_fei_ye +5条（三结局收尾） | Task 9 |
| npc_tianji_contact +3条 | Task 10 |
| npc_temple_novice（3条对话） | Task 10 |
| evt_hidden_letter | Task 11 |
| evt_pavilion_final_choice | Task 11 |
| 第三章地图 interactables 更新 | Task 12 |
| 新道具 owner_testimony + unsent_letter | Task 1 |
| 防卡关测试断言 | Task 13 |
