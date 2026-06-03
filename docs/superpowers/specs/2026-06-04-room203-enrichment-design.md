# room_203 内容扩充 Design Spec

**日期：** 2026-06-04  
**目标：** 为第一章二〇三号客房（玩家起始房间）新增两个事件 + 一个 revisitEvent，平衡与二〇二号房（凶案现场）的内容密度，并在两个房间之间建立跨场景印证关系。

---

## 背景

room_203 目前只有 2 个 interactable：

| 事件 | 内容 |
|---|---|
| `evt_window_look` | 望向后院：脚印、翻墙痕迹（2 个 action） |
| `evt_ch1_wisdom_growth` | 属性成长（requires body_examined + innkeeper_met） |

room_202 有 5 个事件、15+ 个 action，密度严重失衡。

---

## 设计原则

1. **203 的证物不重复 202**：`cloth_fiber_clue` 来自尸体，不在走廊重复授予；新事件给**独立信息**。
2. **跨房间印证**：203 的发现能和 202 的证物产生呼应（revisitEvent 串联）。
3. **天赋分配不集中**：两个事件分别给耳报神（说书人）和三教九流（飞贼）各一条专属路径，避免某个职业独享全部 203 内容。
4. **基础可达性**：每个事件的第一个 action 无属性/天赋前置，所有职业均可发现基础信息。

---

## 新增内容

### Event 1：`evt_wall_sounds`（回想昨夜动静）

```
title: "回想昨夜动静"
description: "薄薄的一道墙，隔着另一个人的死亡。你仔细回想昨夜听到过什么。"
requires: null
```

#### Actions

**1.1 `recall_night_sounds`**（无前置）
- label: `仔细回想昨夜的动静`
- requires: `{ flags_absent: ["heard_sounds_203"] }`
- result: 三更前后隔壁有低沉的拖拽声，以为是邻人翻身，没有在意。现在回想，那声音太重，不像翻身——像是有什么沉重的东西被移动了。
- grants: `flags: ["heard_sounds_203"]`

**1.2 `recall_precise_timing`**（耳报神专属）
- label: `「以耳力细辨声音的节奏与时序」`
- requires: `{ talent: "耳报神", flags: ["heard_sounds_203"], flags_absent: ["death_time_estimated"] }`
- result: 三更过约一刻——钟楼刚响过三下，你翻了个身。拖拽声之后有踩踏声；再之后是窗棂轻响，开合各一次，前后不超过一炷香。【推断：案发时辰确认】
- grants: `flags: ["death_time_estimated", "death_time_203_confirmed"]`

> 与望闻断骨的 `medical_time_analysis` 等价，给说书人一条独立的时间推断路。

---

### Event 2：`evt_corridor_traces`（察看走廊地板）

```
title: "察看走廊地板"
description: "命案就发生在这道走廊的另一头。昨夜那人，一定从这里经过。"
requires: null
```

#### Actions

**2.1 `check_corridor_floor`**（无前置）
- label: `蹲下细察走廊地板`
- requires: `{ flags_absent: ["corridor_checked"] }`
- result: 木板地上有几道浅浅的压痕，步伐均匀，直指二〇二号房方向。其中有一道痕迹靠着墙边——内侧轻、外侧重，像是惯于贴着暗处走的人留下的习惯。
- grants: `flags: ["corridor_checked"]`

**2.2 `read_tracks_thief`**（三教九流专属）
- label: `「以江湖眼力辨认步法特征」`
- requires: `{ talent: "三教九流", flags: ["corridor_checked"], flags_absent: ["intruder_skilled_confirmed"] }`
- result: 靠墙走、内侧轻——翻墙入室的人的脚掌习惯。再结合 202 窗台的绳痕和铁丝锁痕，可以确认：此人是走惯了夜路的熟手，不是临时起意。
- grants: `flags: ["intruder_skilled_confirmed", "intruder_thief_method_confirmed"]`

> 与 room_202 atmosphericHint（三教九流）中「被同行光顾过」的判断形成跨房间印证。

---

### room_203 新增 revisitEvent

**`rev_room203_cloth_fiber`**
- requires: `flags: ["cloth_fiber_found", "corridor_checked"], flags_absent: ["corridor_cloth_corroborated"]`
- text: 「走廊门框的木刺里……果然，同样的黑色纤维，极细，嵌在木纹里。凶手的衣物在经过这里时也留下了痕迹。」
- grants: `flags: ["corridor_cloth_corroborated"]`

> 把 202 尸体手中的 `cloth_fiber_clue` 和 203 走廊踪迹联系起来，给玩家跨场景的发现感。

---

## 文件改动清单

| 操作 | 文件 | 内容 |
|---|---|---|
| 修改 | `src/data/maps/chapter1.json` | room_203 的 interactables 追加 2 个事件；追加 revisitEvent |
| 修改 | `src/data/events/chapter1.json` | 新增 `evt_wall_sounds` 和 `evt_corridor_traces` 两个事件对象 |

不新增 items、不新增测试用例（无新物品/线索 ID，仅 flags）。

---

## 验证标准

- `npx tsc --noEmit`：0 errors
- `npx vitest run`：228 tests passed（无回归）
- 游戏内验证：
  - 进入 room_203 可见两个新事件
  - 说书人职业：recall_precise_timing 可见，death_time_estimated 正确授予
  - 飞贼职业：read_tracks_thief 可见，intruder_skilled_confirmed 正确授予
  - 获得 cloth_fiber_found + corridor_checked 后重回 203，revisitEvent 正确触发
