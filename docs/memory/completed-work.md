# 已完成工作记录

> 按时间倒序。每次大型修改后在此追加。

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
