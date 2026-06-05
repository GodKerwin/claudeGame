---
name: project-key-files
description: 关键文件路径和职责速查（含视觉设计文件）
metadata: 
  node_type: memory
  type: reference
  originSessionId: ced97cdc-a339-4152-9636-569551b706a8
---

## 引擎层
| 文件 | 职责 |
|---|---|
| src/engine/conditionEvaluator.ts | evaluate() + isActionVisible()：条件判断核心 |
| src/engine/eventEngine.ts | getActionResults()：返回 available/completed/visible/hint |
| src/engine/storyEngine.ts | getAvailableDialogues()：NPC 对话过滤 |
| src/engine/hintEngine.ts | getHint()：天赋感知的提示系统 |
| src/engine/saveEngine.ts | saveToSlot() / loadAllSlots() |
| src/engine/mapEngine.ts | getAvailableExits() / getLockedExits() |
| src/engine/audioEngine.ts | Web Audio API BGM（古琴/二胡/木鱼/风声）+ 7种SFX |

## 状态管理
| 文件 | 内容 |
|---|---|
| src/store/playerStore.ts | 角色属性、天赋、incrementStat |
| src/store/sceneStore.ts | 当前房间、flags、clues、storyText、seenDialogues、visitedRooms、timeOfDay、foundSynthesisIds |
| src/store/inventoryStore.ts | 物品列表 |
| src/store/saveStore.ts | 存档槽位 |

## 主要页面
| 文件 | 功能 |
|---|---|
| src/pages/Game/Game.tsx | 游戏主页面，actions useMemo，handleAction，firstRun 教程弹窗 |
| src/pages/CharacterCreate/CharacterCreate.tsx | 角色创建；读 sessionStorage `tianji-chapter-select` 实现章节回放 |
| src/pages/Prologue/Prologue.tsx | 序幕（职业专属台词、点击跳过、Y轴入场动画） |
| src/pages/ChapterEnd/ChapterEnd.tsx | 章节结束，案情还原卡片，再试本章按钮，handleContinue/handleRetry |
| src/pages/MainMenu/MainMenu.tsx | 主菜单，选章重玩（hasAnyEnding 时显示） |
| src/pages/EndingGallery/EndingGallery.tsx | 结局图鉴，9/9 全通关庆祝横幅 |
| src/pages/Credits/Credits.tsx | 题记页 |

## UI 组件
| 文件 | 功能 |
|---|---|
| src/components/layout/GameLayout.tsx | 三栏布局（desktop lg:flex）+ 移动端单栏底部标签（safe-area-inset-bottom） |
| src/components/layout/CenterPanel.tsx | 故事区（地点氛围背景渐变）+ 操作区；推理裁定面板；pendingInterrogation |
| src/components/layout/RightPanel.tsx | 四标签：人物/物品（合成◉提示）/推理（合成板）/脉络；onSettings ⚙ 按钮 |
| src/components/layout/LeftPanel.tsx | SVG 节点地图；底部设置 ⚙ 按钮（onSettings prop） |
| src/components/settings/SettingsModal.tsx | 字体/音频/存档/快捷键一览（Esc/1-4/Ctrl±） |
| src/components/save/SaveLoadModal.tsx | 存读档 4 槽位 |
| src/components/ui/TypewriterText.tsx | 打字机动画，BATCH=4 |
| src/components/ui/ActionButton.tsx | 操作按钮（悬停左侧金色竖条） |
| src/components/ui/StatBar.tsx | 属性条（圆角轨道，高值发光） |
| src/components/ui/ChapterIntro.tsx | 章节切换全屏水墨过渡，sessionStorage 防重复 |

## 数据文件
| 目录/文件 | 内容 |
|---|---|
| src/data/maps/chapter{1-3}.json | 房间结构、revisitEvents |
| src/data/events/chapter{1-3}.json | 事件及 action（含 evidenceGate，timeCost） |
| src/data/npcs/chapter{1-3}.json | NPC 及对话（ch3 版本覆盖 ch2，需包含所有对话） |
| src/data/items/chapter{1-3}.json | 道具（isClue 字段，所有 clue 必须有 isClue:true） |
| src/data/syntheses/chapter{1-3}.json | 合成配方（Ch1:10, Ch2:10, Ch3:8） |
| src/data/verdicts/chapter{1-3}.json | Layer 2 推理裁定题（3题/章） |
| src/data/profiles/chapter{1-3}.json | 疑犯档案（facts 数组，flag 触发显示） |
| src/data/templates.json | 职业模板（含 prologueLines） |
| src/data/talents.json | 天赋定义 |
| src/data/loader.ts | 数据加载入口，getSynthesisResult(), getVerdict(), getProfile() |

## 测试
| 文件 | 内容 |
|---|---|
| src/tests/anti-softlock.test.ts | 防卡关测试（覆盖五职业×三章通路） |
| tests/data/chapter{1-3}Integrity.test.ts | 数据完整性（item/flag/synthesis 引用检查） |
| tests/engine/*.test.ts | 引擎单元测试（conditionEvaluator, eventEngine, mapEngine, saveEngine, sceneStore） |

总计：15个测试文件，328个用例

## 配置
| 文件 | 内容 |
|---|---|
| tailwind.config.ts | 颜色（paper/ink/gold/blood/jade），字体栈 |
| index.html | jsDelivr 加载霞鹜文楷；viewport-fit=cover（iOS safe-area） |
| src/index.css | body font-size:16px，scrollbar-thin，fade-up，glow-pulse |

## sessionStorage 键
| Key | 用途 |
|---|---|
| tianji-chapter-select | '1'/'2'/'3'，CharacterCreate 读取后删除，实现章节回放 |
| tianji-intro-shown | 已展示的最大章节号，防止 ChapterIntro 重复出现 |

## localStorage 键
| Key | 用途 |
|---|---|
| tianji-firstrun-seen | '1' 表示首次运行教程已看过 |
| tianji-audio | 音量设置持久化 |
| tianji-font-size | 字体大小设置 |
| tianji-endings | 已解锁结局列表（JSON array） |
