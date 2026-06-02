# 项目概览

**项目名**：天机残卷（claudeGame）  
**类型**：大唐背景文字推理解谜 RPG，三章完结（实现了，完整游戏规划为五章）  
**制作人**：风雪久  
**GitHub**：https://github.com/GodKerwin/claudeGame  
**线上地址**：https://godkerwin.github.io/claudeGame/

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18 | UI 框架 |
| TypeScript | - | 类型安全 |
| Vite | - | 构建工具，base: '/claudeGame/' |
| TailwindCSS | v3 | 样式 |
| Zustand | v4 | 状态管理 |
| React Router | v6 | 路由（HashRouter，兼容 GitHub Pages） |
| Vitest | - | 测试（172 用例，13 文件） |

---

## 关键文件结构

```
src/
  App.tsx                    # HashRouter + 所有路由
  pages/
    MainMenu/MainMenu.tsx    # 主菜单，含"关于"按钮
    CharacterCreate/         # 角色创建（五套职业）
    Prologue/                # 序章
    Game/Game.tsx            # 主游戏页（useMemo/useCallback 优化）
    ChapterEnd/ChapterEnd.tsx
    EndingGallery/           # 结局图鉴
    Credits/Credits.tsx      # 制作人页（风雪久 / Claude Sonnet 4.6）
  components/
    layout/
      LeftPanel.tsx          # 地点面板（useMemo 优化）
      CenterPanel.tsx        # 中央区域，动作分组（交谈/探查）
      RightPanel.tsx         # 属性/日志/物品
    ui/
      ActionButton.tsx       # 动作按钮，含 focus-visible 无障碍
    settings/SettingsModal.tsx  # Esc 键触发，role=dialog
    save/SaveLoadModal.tsx      # 存读档，状态提示1500ms
  store/
    sceneStore.ts            # 场景状态，storyText 保留最后50条
  engine/
    eventEngine.ts           # 事件引擎，缺少条件显示具体物品名
    hintEngine.ts            # 提示引擎
  hooks/
    useAutoSave.ts           # 自动存档，依赖 scene.flags/clues/questLog
  data/
    loader.ts                # 所有 getter 用 Map.get() O(1) 查找
    events/chapter{1,2,3}.json
    npcs/chapter{1,2,3}.json
    maps/chapter{1,2,3}.json
    items/chapter{1,2,3}.json
    talents.json
    templates.json
tests/
  data/chapter3Integrity.test.ts  # safehouse 测试 requires===null
  engine/hintEngine.test.ts
  store/sceneStore.test.ts
  data/profilesIntegrity.test.ts
.github/workflows/deploy.yml     # GitHub Actions 自动部署
vite.config.ts                   # base: '/claudeGame/'
```

---

## 游戏路由

| 路径 | 页面 |
|------|------|
| / | 主菜单 |
| /create | 角色创建 |
| /prologue | 序章 |
| /game | 游戏主页 |
| /chapter-end | 章节结束 |
| /endings | 结局图鉴 |
| /credits | 制作人页 |

---

## 游戏内容（已实现三章）

- **第一章**：往事客栈·密室谋杀案，引出天机阁残卷线索
- **第二章**：长安内城·追踪"鸢"，浪鹏帮争夺残卷
- **第三章**：大雁塔·飞爷身份揭露，残卷终局

**九种结局**：隐士/释放/逮捕/真相/投诚/逃亡/合谋/守秘/复仇  
**五套角色**：游侠、谋士、刺客、药师、全能客  
**天赋系统**：察言观色、过目不忘、江湖老千等影响可用选项

---

## 部署

- GitHub Pages（免费版需 public 仓库）
- 部署源：GitHub Actions
- 触发：push to main
- 工作流：`.github/workflows/deploy.yml`
- 注意：必须用 HashRouter（BrowserRouter 在 Pages 刷新会 404）
