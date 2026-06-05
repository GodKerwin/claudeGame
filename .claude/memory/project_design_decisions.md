---
name: project-design-decisions
description: 游戏设计决策：天赋机制、UI约定、数据字段说明、视觉设计规范
metadata: 
  node_type: memory
  type: project
  originSessionId: ced97cdc-a339-4152-9636-569551b706a8
---

## 天赋设计
| 天赋 | 职业 | 机制 |
|---|---|---|
| 官威 | 捕快 | 身份威慑，NPC 更配合 |
| 望气观相 | 道士 | 观察气机，感知隐藏信息 |
| 耳报神 | 说书人 | NPC 主动分享情报 |
| 望闻断骨 | 游方医 | 法医检查，为 NPC 治伤换信任 |
| 三教九流 | 飞贼 | 黑市人脉，地下情报网络 |

天赋通过 `condition.talent` 字段触发特殊分支，conditionEvaluator 精确匹配。

## 探查选项循序渐进系统
- **isActionVisible(condition, ctx)**：核心函数
  - flag/物品条件未满足 → 完全隐藏
  - 仅属性/天赋未满足 → 置灰显示（告知玩家路径存在）
- 事件级 `requires` 在 Game.tsx actions useMemo 里强制检查
- 完成后动作通过 `isCompleted()` 检测（需有 `flags_absent` 字段）
- 已完成动作显示「✓ 原文案」（ink/20，line-through）

## 探查树状布局
- CenterPanel 按 `eventId` 分组（Map 维护插入顺序）
- 渲染：父标题行 + `border-l-2 border-gold/20` 子列表
- 固定高度 `max-h-48` + scrollbar-thin 滚动

## UI 约定
- CenterPanel：顶部可滚动故事区（地点氛围背景渐变）+ 底部固定操作区（带渐变背景）
- 房间名：居中 + 左右 gradient 横线装饰
- 行动区标题：小圆点 + 「行动」+ 横线（三件套）
- Tab 激活：`border-b border-gold/45 -mb-px`（无背景填充）
- 提示文字：左侧竖条 `w-[2px] bg-gold/25`
- 所有操作按钮悬停时左侧出现 `bg-gold/40` 竖光条

## 数据条件字段说明
```json
{
  "requires": {
    "wisdom": 6,           // 属性阈值（锁定时置灰）
    "talent": "望闻断骨",  // 天赋精确匹配（锁定时置灰）
    "flags": ["flag_a"],   // 必须已有（锁定时隐藏）
    "flags_absent": ["flag_b"], // 必须没有（锁定时隐藏，通常标记完成后消失）
    "has": ["item_id"],    // 背包物品（锁定时隐藏）
    "timeOfDay": ["night", "dusk"]  // 时段门控
  }
}
```

**重要**：`has` 检查背包（inventoryStore），`flags` 检查 scene flags。两者不可混用。

## 物品 vs 线索
- `grants.items` → 进入 inventoryStore，`has` 条件可检查
- `grants.clues` → 进入 sceneStore.clues，右侧面板展示，`has` 条件**无法**检查
- 需要条件检查的关键物品必须同时放在 `grants.items`
- 所有 clue 类道具必须有 `"isClue": true`（否则数据不规范，虽不影响 clues 数组功能）

## 三层推理裁定系统
- **Layer 1**：结局行动的 `requires.flags` 中加入 `synth_xxx` flag，强制先合成关键推断
- **Layer 2**：`src/data/verdicts/chapter{n}.json` 定义推理裁定问答，在结局事件前拦截，答错可重选
- **Layer 3**：结局行动上加 `evidenceGate` 字段，要求出示特定证物（复用审讯 UI）

## 合成系统
- 配方：`src/data/syntheses/chapter{n}.json`，每条定义 itemA + itemB + result + hint + grants
- `pivotal: true` 标记核心推断合成（当前章节的主推理链）
- 在 RightPanel 推理 tab 中操作：选 A → 选 B → 自动运算，◉ 指示符标记与持有物的可合成对
- 发现的合成存于 `sceneStore.foundSynthesisIds`（持久化到存档）

## 地点氛围系统
- `ROOM_ATMOSPHERE` 在 CenterPanel.tsx 定义，每个 roomId 对应 `{ glyph, color, label }`
- **color** 同时用于：①房间标题旁的氛围符号颜色；②故事文本区顶部渐变背景（opacity 替换为 0.07）
- 背景渐变：`linear-gradient(180deg, rgba(..., 0.07) 0%, transparent 35%)`，切房间有 0.4s 过渡
- 代表颜色：凶案现场血红 `rgba(139,26,26,...)` / 户外绿 `rgba(58,122,90,...)` / 室内金 `rgba(201,168,76,...)`

## 案情还原卡片
- 触发条件：`endingFlag` 为 `chapter1_truth_ending` / `chapter2_arrest_ending` / `chapter3_truth_ending`
- 位置：ChapterEnd.tsx 统计数字（线索/推理/地点）之后，操作按钮之前
- 样式：金色分隔线标题「案情还原」+ 4条 label/content 行，与入局须知风格一致

## 章节回放机制
- MainMenu 有结局记录（`getSeenEndings().length > 0`）时显示「选章重玩」展开区
- 点击章节按钮 → `sessionStorage.setItem('tianji-chapter-select', '1'|'2'|'3')` → navigate('/create')
- CharacterCreate.tsx 在 `handleStart()` 中读取并清除该 key：
  - Ch1：正常流程（navigate('/prologue')）
  - Ch2：setRoom('east_market_entrance') + addFlag('chapter2_started') + addQuest('quest_li_mao_case') → navigate('/game')
  - Ch3：setRoom('dayan_pagoda') + addFlag('chapter3_started') + addQuest('quest_find_kite') → navigate('/game')

## 移动端布局
- `<1024px`：单栏 + 底部三标签（地图/故事/状态），AnimatePresence 0.15s 淡入切换
- 标签栏底部：`paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))'`
- 标签按钮最小高度 48px（`min-h-[3rem]`），激活时上方显示金色小点
- 内容区：`paddingTop: 'env(safe-area-inset-top)'`
- index.html viewport：`viewport-fit=cover`

## 视觉设计规范（2026-06-01 确立）
### 颜色系统
| 变量 | 值 | 用途 |
|---|---|---|
| paper | #1a1208 | 背景 |
| paper-mid | #221a0a | 面板、卡片背景 |
| paper-light | #2a2010 | 选中状态背景 |
| ink | #e8d5a3 | 主文字 |
| gold | #c9a84c | 金色强调 |
| gold-bright | #dfc06a | 高亮金色 |
| blood | #8b1a1a | 危险/特殊 |
| jade | #3a7a5a | 备用（未大量使用） |

### 字体
- 霞鹜文楷（LXGW WenKai）via jsDelivr，fallback 楷体系列
- 基础字号 16px（body 全局）

### 常用透明度约定
- 主文字：`text-ink/80~90`
- 辅助文字：`text-ink/50~60`
- 极淡/完成：`text-ink/20~25`
- 金色标题：`text-gold/85~90`
- 金色辅助：`text-gold/40~55`
- 分隔线：`border-gold/10~20`

## 美术组件（2026-06-01 新增）
- `ChapterIntro.tsx`：章节切换时全屏水墨过渡，3秒自动消失，点击跳过。用 sessionStorage 追踪已展示章节防重复
- `MountainBackground.tsx`：远山/中山加 CSS keyframe 漂移动画（mistDrift/mistDriftSlow）
- `RightPanel TalentSeal`：天赋显示为红色 SVG 印章（28/36px，依字数自适应）
- `MainMenu`：水墨粒子 + SVG 大雁群 + SVG 淡月轮

## 序幕结构
- 前 5 行：通用剧情（所有职业）
- 后 2 行：职业专属台词（来自 templates.json prologueLines）
- 点击任意处可跳过，Y 轴渐入动画，装饰竖线

## 存档系统
- slot 0：自动存档（currentRoomId/flags/clues/questLog 变化时触发）
- slot 1-3：手动存档
- 内容：player stats + scene state + inventory + clues + flags + questLog + storyText + seenDialogues + visitedRooms + foundSynthesisIds + timeOfDay
