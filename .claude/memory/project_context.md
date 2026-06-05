---
name: project-context
description: 天机残卷游戏项目架构、技术栈、当前进度和已修复 Bug 列表
metadata: 
  node_type: memory
  type: project
  originSessionId: ced97cdc-a339-4152-9636-569551b706a8
---

## 项目简介
**天机残卷** — 唐代风格推理文字游戏，共三章，玩家扮演不同职业调查命案。

## 技术栈
- React 19 + TypeScript + Tailwind CSS + Vite
- Zustand 状态管理（playerStore / sceneStore / inventoryStore / saveStore）
- Vitest 测试（15个测试文件，328个用例，全部通过）
- 字体：**霞鹜文楷 LXGW WenKai**（jsDelivr 加载）+ fallback 楷体系列，不使用 Google Fonts
- 基础字号：`font-size: 16px`（body 全局设置）

## 核心架构

### 数据驱动
所有游戏内容存储在 JSON 文件中：
- `src/data/maps/chapter{1-3}.json` — 房间结构、出口、interactables
- `src/data/events/chapter{1-3}.json` — 可交互事件及 action
- `src/data/npcs/chapter{1-3}.json` — NPC 及对话
- `src/data/items/chapter{1-3}.json` — 道具（isClue/普通）
- `src/data/syntheses/chapter{1-3}.json` — 合成配方（Ch1:10个, Ch2:10个, Ch3:8个）
- `src/data/verdicts/chapter{1-3}.json` — 推理裁定题（Layer 2）
- `src/data/profiles/chapter{1-3}.json` — 疑犯档案
- `src/data/templates.json` — 5个职业模板（含 prologueLines 序幕台词）
- `src/data/talents.json` — 5个天赋

### 关键引擎
- `conditionEvaluator.ts`：evaluate() + isActionVisible()
  - **isActionVisible**：flag/物品锁定 → 隐藏；属性/天赋锁定 → 置灰显示
- `eventEngine.ts`：getActionResults()，返回 available/completed/visible/hint
- `hintEngine.ts`：按章节、天赋、属性给出游戏提示
- `storyEngine.ts`：getAvailableDialogues()，filter + nextUnseen 逻辑
- `audioEngine.ts`：Web Audio API 合成 BGM（古琴/二胡/木鱼/风声）+ 7种 SFX

### Loader 重要特性
`src/data/loader.ts` 使用 Map 构建索引，**后出现的同 id 覆盖前面的**。
- `NPCS = [...ch1, ...ch2, ...ch3]`，因此 ch3 定义的 npc_wujue 会覆盖 ch2 版本
- 修复方案：ch3/npcs 文件需包含所有对话（已补回 storyteller_rumor / medical_healing）

## 五个职业
| id | 名称 | 天赋 | strength | agility | wisdom | constitution |
|---|---|---|---|---|---|---|
| bukai | 捕快 | 官威 | 8 | 5 | 7 | 4 |
| daoshi | 道士 | 望气观相 | 3 | 5 | 9 | 7 |
| shuoshuren | 说书人 | 耳报神 | 3 | 7 | 8 | 4 |
| youfangyi | 游方医 | 望闻断骨 | 4 | 5 | 6 | 9 |
| feizei | 飞贼 | 三教九流 | 7 | 10 | 4 | 4 |

## 当前进度（截至 2026-06-05）

### 已完成功能（完整列表）
- 三章完整剧情（NPC 对话、事件、地图、物品）
- 探查选项循序渐进显示（flag 锁定隐藏，属性锁定置灰）
- NPC 独立区块（「人物」区在「探索」上方，始终可点击，●/○状态指示）
- 右侧面板四标签页（人物 / 物品 / 推理 / 脉络）
- 职业专属序幕文本、全局 Hint 系统
- 结局画面印章动画（seal-drop）+ 氛围色调叠层（各结局不同颜色）
- 结局图鉴小印章图标 + 9/9 全解锁庆祝横幅
- 主菜单漂浮水墨粒子动画 + 大雁群 + 淡月轮
- 左侧导航面板氛围字符
- 自动存档 + 手动存档（4 个槽位）
- 防卡关测试套件（vitest，328 个用例，15 文件）
- SVG 节点地图（手工定位，锁定提示，折叠按钮）
- 推理门槛系统（Layer 1 合成前置 + Layer 2 裁定问答 + Layer 3 证据出示）
- 时段系统（寅/辰/午/申/酉/亥，门控地点/行动）
- 跨章蝴蝶效应（7处差异内容）
- 属性成长系统（10个成长节点）
- 深层审讯系统（三级情绪状态机，施压/迂回/出示证据）
- **章节回放**（MainMenu 选章按钮 + CharacterCreate sessionStorage 跳转）
- **合成提示 UI**（物品/线索旁 ◉ 指示符 + 展开后 hint 文字）
- **LeftPanel 设置按钮**（底部 ⚙，移动端可用）
- **移动端优化**（safe-area-inset-bottom，48px 最小点击区，激活金点）
- **ChapterEnd 再试本章**（结局按钮下方小字，直接重玩当前章节）
- **首次运行教程**（入局须知：左中右+推理+提示+时段 六条说明）
- **设置弹窗快捷键一览**（Esc / 1-4 / Ctrl+/−）
- **地点氛围背景**（故事区顶部渐变，凶案血红/树林绿/室内金，0.4s 过渡）
- **案情还原卡片**（真相/缉拿结局后展示凶手/手法/动机/幕后）
- **Ch2/Ch3 合成扩充**（Ch2+2个→共10个，Ch3+3个→共8个）
- **攻略文档** docs/walkthrough.md（三章全通关+全结局+所有推理裁定答案）

### 数据量对比
| | 事件行数 | NPC行数 | 合成数 | 道具数 |
|---|---|---|---|---|
| 第一章 | 875 | 784 | 10 | 34 |
| 第二章 | 618 | 388 | 10 | 20 |
| 第三章 | 532 | 333 | 8 | 16 |

## 重要 Bug 修复历史

### 本会话完成（2026-06-05）
- 修复 `clue_kite_true_identity`（无名纸条）缺少 `isClue: true` 字段
- Ch2 新增合成：synth_ch2_government_collusion + synth_ch2_disappearances_pattern
- Ch3 新增合成：synth_ch3_fei_ye_anticipated_end + synth_ch3_founding_purpose_confirmed + synth_ch3_two_guardians

### 本会话完成（2026-06-04，深层审讯系统）
- 审讯系统全量完成并 push：类型定义、sceneStore 状态、Game.tsx 处理、CenterPanel UI、6个 NPC 审讯数据
- Bug 修复：Game.tsx 本地 Grants 类型补 storyText；useSettings zoom 改双重 as
- 228个测试全部通过，build 成功

### 本会话扩充（2026-06-03，第五批——ch2/ch3 内容扩充）
- 可达性修复：游方医/飞贼 poison_residue_sample 路径（constitution_smell + thief_poison_sniff）
- 可达性修复：游方医/飞贼 kite_identity_clue 路径（decode_kite_mark + kite_clue_exchange）
- 新 NPC：npc_huichuntang_owner（3条对话，owner_testimony 物品）
- npc_wujue：4条第二章专属对话（flags_absent: chapter3_started 保证仅ch2触发）

### 历史修复
- npc_fei_ye 在 old_mansion 缺失、地窖密室力量要求 9→8、各种 flag 授权缺失
- Google Fonts 被墙→移除、getTemplate 未 import、多处 NPC grants 为空
- npc_wujue ch3 覆盖 ch2 版本丢失对话→补回
