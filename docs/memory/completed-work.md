# 已完成工作记录

> 按时间倒序。每次大型修改后在此追加。

---

## 2026-06-02（第三轮十项优化）

### Bug 修复
- hintEngine 第一章重复规则清理（死代码 5 条）；第三章 expose_truth 路径提示补全
- 章节结算页：第二、三章线索列表改用 scene.clues，不再为空
- 进入新房间触发 revisit 事件时补加分隔符

### 交互细节
- 物品/线索点击展开内联描述（替代 hover-only tooltip）
- 任务日志按章分组（第一章·旧案 / 第二章·追查 / 第三章·终局）
- 推理面板：矛盾条目自动置顶显示
- 推理面板：展开 NPC 档案同时显示角色描述文字
- 统计标签页角标：显示活跃任务数量
- 左侧地图导航：已访问出口显示 ·访 标记
- 动作区：房间全部探查完毕时显示"此处探查已尽"提示

### 技术
- hintEngine 新增 1 条 Vitest 用例（expose_truth 路径）；总计 167 用例

---

## 2026-06-02（第二轮十项优化）

### 交互细节
- 物品标签新内容红点提示（items/clues 数量增长时显示）
- 推理面板：新发现高亮 + ✦ 新推论标签（3秒）
- 故事面板：每次新交互前插入细线分隔符
- 键盘快捷键 1–4 切换右侧面板四个标签

### 人物设计
- 嫌疑人档案：标题栏显示已知事实数 "N/M"
- 任务日志：章节结束后任务标记为已结案状态

### 剧情
- 飞爷（npc_fei_ye）第三章嫌疑人档案（6条事实）
- 无迹和尚第三章事实追加至第二章档案（2条）

### 技术
- hintEngine 单元测试：三章共12条核心规则断言
- 更新 completed-work.md 与 project-overview.md

---

## 2026-06-02（首轮十项优化）

### 交互细节
- SVG gradient ID 冲突修复（React useId）
- 推理面板：甲选中时高亮可合成物品
- 首次游戏引导更新（4标签 + 推理说明）
- 房间切换淡入动画（panel-fade-in keyframes + key prop）
- 推理面板：动态步骤提示文字（选甲→选乙→完成）

### 人物设计
- 天赋专属动作结果前缀（【天赋·×××】）

### 剧情
- 章节结算页：线索/推理/走访三项数据汇总
- 第二章嫌疑人档案（无迹、李邈、浪鹏探子、古玩掌柜）
- 第三章嫌疑人档案（天机联络人）

### 技术
- foundSynthesisIds 存档全链路（sceneStore → useAutoSave → saveEngine → SaveLoadModal）
- sceneStore 单元测试（4条）；profilesIntegrity 测试（3条）

---

## 2026-06-01（最新）

### GitHub Pages 部署
- `vite.config.ts` 添加 `base: '/claudeGame/'`
- `App.tsx` 改 `BrowserRouter` → `HashRouter`（避免刷新404）
- 新增 `.github/workflows/deploy.yml`（push to main 自动构建部署）
- 用户需手动在 repo Settings > Pages 设置 Source = GitHub Actions

### Credits 制作人页
- 新增 `src/pages/Credits/Credits.tsx`
- 制作人：风雪久；技术实现：Claude Sonnet 4.6
- 主菜单新增"关于"按钮

### UX 优化
- Esc 键打开设置（Game.tsx + SettingsModal.tsx 各加 keydown 监听）
- 首次游戏弹出引导提示（localStorage `tianji-firstrun-seen`）
- 动作区分组：>4条混合动作时显示 ── 交谈 ── / ── 探查 ── 分隔
- CenterPanel：ResizeObserver 检测溢出，底部渐变遮罩

### README 中文化
- 完整中文介绍，含游戏背景、玩法说明表格、技术栈、制作人

---

## 2026-05-29（游戏设计优化 + 性能优化）

### 性能优化
- `Game.tsx`：ctx / buildActions / handleAction 用 useMemo/useCallback
- `LeftPanel.tsx`：ctx / exits / lockedExits 用 useMemo
- `loader.ts`：6个 getter 全改为 Map.get() O(1) 查找
- `sceneStore.ts`：storyText 保留最后50条
- `useAutoSave.ts`：依赖改为 scene.flags/clues 引用（非 .length）

### 无障碍
- `ActionButton.tsx`：添加 focus-visible:ring 样式
- `SettingsModal.tsx`：添加 role="dialog" aria-label="设置"
- `SaveLoadModal.tsx`：操作后1500ms 状态提示

### 游戏设计修复
- **隐士结局**：移除武功≥7要求，对话改为"不拘武学根底"
- **释放结局**：需要 `langpeng_dispatch_order`（调令文书）才能触发
- **天机安全屋**：`requires` 改为 `null`（所有第二章路径均可进入）
- **孤儿物品修复**：`teahouse_token` 和 `dafei_secret_intel` 在第三章对峙中有了用途
- **NPC 丰富化**：纸商/老乞丐加了个性对话；吴绝加了愧疚和结局对话
- **跨章记忆**：李邈在第二章根据第一章真相结局有专属对话
- **事件引擎**：缺少条件时显示具体物品名（玉佩、调令文书）

### hintEngine 更新
- 隐士结局提示（不再提武功要求）
- 释放结局提示（需要调令文书）
- 帮派文化、茶楼令牌、安全屋提示

---

## 2026-05-28（第一章扩展 + Bug修复）

- 完善第一章 NPC 对话深度和个性
- 白衣人武功赠予逻辑修复
- 帮派暗语系统（gang_code_insight）
- 存档/读档 UI 修复
- 章节结束页面路由

---

## 2026-05-27（初始实现）

- 游戏引擎搭建（eventEngine, hintEngine, sceneStore）
- 第一章完整内容
- 角色创建（五套职业+属性+天赋）
- 序章、主菜单、结局图鉴
- 105个 Vitest 测试用例
