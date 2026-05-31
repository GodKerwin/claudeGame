# 操作列表 Tab 化设计文档

**日期：** 2026-05-31
**范围：** CenterPanel 操作区 UI 重构，将现有滚动列表改为 Tab 切换布局

---

## 背景

当前操作列表存在两个问题：
1. `overflow-y-auto max-h-48` 产生系统原生滚动条，视觉不协调
2. 交谈 + 探查操作同时堆叠，内容过多时体验差

---

## 设计方案

### 整体布局

操作区底部固定两个 Tab：**「交谈」** 和 **「探查」**。

- 去掉 `max-h-48` 和 `overflow-y-auto`，内容自然撑开，不产生滚动条
- Tab 徽标（badge）显示该组**未完成且可用**的操作数量（`available && !completed` 的计数）
- 两个 Tab 始终渲染，即使某组为空

### Tab 默认选择（进入房间时）

| 条件 | 默认激活 Tab |
|------|------------|
| 有未读 NPC 对话（存在 `available && !completed` 的 npc 操作） | 交谈 |
| 无未读 NPC 对话，或房间无 NPC | 探查 |

切换房间时重置为上述默认规则，不记忆用户上次选的 tab。

### 交谈 Tab

**正常状态：**
- 列出所有 NPC 对话按钮
- 已完成项（`completed: true`）灰显保留，视觉上可见历史

**pendingChoices 激活时（C3 方案）：**
- Tab 标题改为「如何回应」，tab 徽标显示选项数量
- Tab 内容替换为对话选项列表（样式同现有 choice 按钮）
- 「探查」tab 禁用（`pointer-events: none`，颜色变淡）
- 选完选项后，恢复正常状态，默认激活「交谈」tab

### 探查 Tab

- 列出所有 event 类操作
- 已完成项灰显，条件不足项禁用（样式与现有 ActionButton 保持一致）
- 现有 2 列网格布局保留

### 空 Tab 处理（D2 方案）

无 NPC 的房间（如地窖、密室）：
- 「交谈」tab 显示但样式为禁用态（文字颜色 `text-ink/15`，无下划线高亮，不可点击）
- 自动激活「探查」tab

无事件的房间（理论上不存在，但保留兜底）：
- 「探查」tab 禁用态
- 自动激活「交谈」tab

### Tab 样式规格

```
激活态：文字 text-gold/85，底部 border-b-2 border-gold/60
普通态：文字 text-ink/30，无下划线
禁用态：文字 text-ink/15，pointer-events: none
```

徽标（badge）：`text-[9px] bg-gold/15 text-gold/70 px-1 rounded-full`，数量为 0 时隐藏

### pendingChoices 标题变化

| 状态 | 标题文字 |
|------|---------|
| 正常 | `── 操作 ──` |
| pendingChoices 激活 | `── 如何回应 ──`（现有逻辑保持） |

---

## 受影响文件

| 文件 | 操作 |
|------|------|
| `src/components/layout/CenterPanel.tsx` | 修改：重构操作区为 Tab 结构 |

**不受影响：**
- `ActionButton.tsx`：样式不变
- `Game.tsx`：actions 数据结构不变，`group` 字段（`'npc' | 'event' | 'choice'`）复用
- 所有 store、engine、data 文件：无需修改

---

## 不在范围内

- 移动端 Tab 样式（已有移动端底部导航，操作区 Tab 在移动端行为与桌面一致）
- 自定义滚动条样式（直接去掉滚动限制，无需 scrollbar-hide）
- Tab 切换动画（不引入额外复杂度）
