# 操作列表 Tab 化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 CenterPanel 底部操作区改为「交谈 | 探查」Tab 切换布局，消除滚动条，对话选项内嵌交谈 Tab。

**Architecture:** 仅修改 `CenterPanel.tsx`，用 `activeTab` state 驱动 Tab 渲染；`actions` prop 数据结构不变（沿用 `group: 'npc' | 'event' | 'choice'`）；去掉 `overflow-y-auto max-h-48` 限制和 ResizeObserver 脚手架。

**Tech Stack:** React 19, TypeScript, Tailwind CSS

---

## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/layout/CenterPanel.tsx` | 修改 | 唯一需要改动的文件 |

---

## Task 1: 完整替换 CenterPanel.tsx

**Files:**
- Modify: `src/components/layout/CenterPanel.tsx`

### 背景知识

`actions` prop 有三种 group 值：
- `'npc'`：NPC 对话按钮（「与李福交谈」等）
- `'event'`：事件探查按钮（「检查尸体」等）
- `'choice'`：对话分支选项——**仅在 pendingChoices=true 时出现**，此时 actions 里只有 choice 项

`pendingChoices` 为 true 时，Game.tsx 传入的 `actions` 中只含 group='choice' 的项，npc/event 项为空。

### Tab 行为规则

| 场景 | 交谈 Tab | 探查 Tab | 自动激活 |
|------|---------|---------|---------|
| 正常 + 有未读 NPC | 列出 NPC 按钮 | 列出事件按钮 | 交谈 |
| 正常 + 无未读 NPC | 列出 NPC 按钮（可能全灰） | 列出事件按钮 | 探查 |
| pendingChoices=true | 显示对话选项，标签改「如何回应」 | 禁用 | 交谈 |
| 无 NPC 的房间（hasNpc=false） | 禁用（text-ink/15，不可点） | 列出事件按钮 | 探查 |

- [ ] **Step 1: 用下方完整代码替换 `src/components/layout/CenterPanel.tsx`**

```tsx
import { useRef, useEffect, useState } from 'react';
import { TypewriterText } from '../ui/TypewriterText';
import { ActionButton } from '../ui/ActionButton';

interface ActionItem {
  id: string;
  label: string;
  available: boolean;
  completed: boolean;
  hint: string;
  variant?: 'default' | 'danger' | 'special';
  group?: 'npc' | 'event' | 'choice';
}

interface Props {
  roomName: string;
  roomDescription: string;
  storyTexts: string[];
  actions: ActionItem[];
  onAction: (actionId: string) => void;
  pendingChoices?: boolean;
  hint?: string | null;
  onToggleHint?: () => void;
  showHint?: boolean;
}

type ActiveTab = 'npc' | 'event';

export function CenterPanel({
  roomName,
  roomDescription,
  storyTexts,
  actions,
  onAction,
  pendingChoices = false,
  hint,
  onToggleHint,
  showHint,
}: Props) {
  const storyEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('npc');

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [storyTexts]);

  // 换房间时自动选 Tab：有未读 NPC → 交谈，否则 → 探查
  useEffect(() => {
    const hasUnreadNpc = actions.some(
      (a) => a.group === 'npc' && a.available && !a.completed
    );
    setActiveTab(hasUnreadNpc ? 'npc' : 'event');
  }, [roomName]); // eslint-disable-line react-hooks/exhaustive-deps

  // pendingChoices 触发时切换到交谈 Tab
  useEffect(() => {
    if (pendingChoices) setActiveTab('npc');
  }, [pendingChoices]);

  const npcActions = actions.filter((a) => a.group === 'npc');
  const eventActions = actions.filter((a) => a.group === 'event');
  const choiceActions = actions.filter((a) => a.group === 'choice');

  const npcBadge = npcActions.filter((a) => a.available && !a.completed).length;
  const eventBadge = eventActions.filter((a) => a.available && !a.completed).length;

  const hasNpc = npcActions.length > 0;
  const hasEvent = eventActions.length > 0;

  const renderTabContent = () => {
    if (activeTab === 'npc') {
      // pendingChoices 时显示对话选项
      const items = pendingChoices ? choiceActions : npcActions;
      return (
        <div className="space-y-1.5">
          {items.map((a) => (
            <ActionButton
              key={a.id}
              label={a.label}
              onClick={() => onAction(a.id)}
              disabled={!a.available}
              completed={a.completed}
              hint={a.hint}
              variant={a.variant}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-2">
        {eventActions.map((a) => (
          <ActionButton
            key={a.id}
            label={a.label}
            onClick={() => onAction(a.id)}
            disabled={!a.available}
            completed={a.completed}
            hint={a.hint}
            variant={a.variant}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* 房间标题 */}
      <div className="px-5 py-3 border-b border-gold/10">
        <h2 className="text-gold text-base tracking-wider">{roomName}</h2>
      </div>

      {/* 故事文本区（可滚动） */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <p className="text-ink/80 leading-loose text-sm">{roomDescription}</p>
        {storyTexts.map((text, i) => (
          <div key={i} className="border-l-2 border-gold/20 pl-3">
            <TypewriterText text={text} className="text-ink/90 leading-loose text-sm" />
          </div>
        ))}
        <div ref={storyEndRef} />
      </div>

      {/* 操作区（固定底部，无滚动） */}
      <div className="border-t border-gold/10 px-5 pt-3 pb-3">
        {/* 标题行 + 提示按钮 */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-gold/40 text-xs tracking-widest">── 操作 ──</p>
          {onToggleHint && (
            <button
              onClick={onToggleHint}
              className={`text-xs px-2 py-0.5 border transition-colors cursor-pointer ${
                showHint
                  ? 'border-gold/40 text-gold/60'
                  : 'border-ink/15 text-ink/30 hover:border-gold/30 hover:text-gold/40'
              }`}
            >
              提示
            </button>
          )}
        </div>

        {/* 提示文字 */}
        {hint && (
          <p className="text-ink/40 text-xs leading-relaxed mb-2 italic border-l border-gold/20 pl-2">
            {hint}
          </p>
        )}

        {/* Tab 切换栏 */}
        <div className="flex border-b border-gold/10 mb-3">
          {/* 交谈 Tab */}
          <button
            onClick={() => {
              if (!pendingChoices && hasNpc) setActiveTab('npc');
            }}
            disabled={!hasNpc || pendingChoices}
            className={`flex-1 text-center py-1.5 text-xs tracking-widest transition-colors ${
              activeTab === 'npc'
                ? 'text-gold/85 border-b-2 border-gold/60 -mb-px'
                : !hasNpc || pendingChoices
                ? 'text-ink/15 cursor-default'
                : 'text-ink/30 hover:text-ink/50 cursor-pointer'
            }`}
          >
            {pendingChoices ? '如何回应' : '交谈'}
            {pendingChoices && (
              <span className="ml-1 text-[9px] bg-gold/15 text-gold/70 px-1 rounded-full">
                {choiceActions.length}
              </span>
            )}
            {!pendingChoices && npcBadge > 0 && (
              <span className="ml-1 text-[9px] bg-gold/15 text-gold/70 px-1 rounded-full">
                {npcBadge}
              </span>
            )}
          </button>

          {/* 探查 Tab */}
          <button
            onClick={() => {
              if (!pendingChoices && hasEvent) setActiveTab('event');
            }}
            disabled={!hasEvent || pendingChoices}
            className={`flex-1 text-center py-1.5 text-xs tracking-widest transition-colors ${
              activeTab === 'event'
                ? 'text-gold/85 border-b-2 border-gold/60 -mb-px'
                : !hasEvent || pendingChoices
                ? 'text-ink/15 cursor-default'
                : 'text-ink/30 hover:text-ink/50 cursor-pointer'
            }`}
          >
            探查
            {!pendingChoices && eventBadge > 0 && (
              <span className="ml-1 text-[9px] bg-gold/15 text-gold/70 px-1 rounded-full">
                {eventBadge}
              </span>
            )}
          </button>
        </div>

        {/* Tab 内容 */}
        {renderTabContent()}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 运行类型检查确认无错误**

```bash
npx tsc --noEmit
```

期望：无输出（零错误）

- [ ] **Step 3: 运行全量测试确认无回归**

```bash
npm test
```

期望：全部通过（现有 119 条测试，无新增）

- [ ] **Step 4: 启动开发服务器，视觉验证**

```bash
npm run dev
```

逐项验证：

**4a. 客栈大堂（有 NPC + 有事件）**
- 默认激活「交谈」tab（因为李福未读）
- 交谈 tab：显示 NPC 对话按钮，有未读徽标
- 探查 tab：切换后显示 2 列事件按钮
- 无滚动条，操作区高度自然撑开

**4b. 无 NPC 的房间（地窖 / 后厨）**
- 默认激活「探查」tab
- 「交谈」tab 显示但文字颜色极淡，不可点击

**4c. 触发 NPC 对话选项时（与李福交谈 → 出现对话分支）**
- Tab 自动切换到「交谈」
- 「交谈」标签变为「如何回应」，显示选项数量徽标
- 「探查」tab 变淡禁用
- 选完后恢复正常 Tab

**4d. 切换房间**
- 进入有未读 NPC 的房间 → 自动激活「交谈」
- 进入已全部对话的房间 → 自动激活「探查」

- [ ] **Step 5: 提交**

```bash
git add src/components/layout/CenterPanel.tsx
git commit -m "feat: 操作列表改为交谈/探查Tab切换，消除滚动条"
```
