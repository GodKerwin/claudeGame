import { useRef, useEffect, useState, useCallback } from 'react';
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
  eventId?: string;
  eventTitle?: string;
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('npc');

  const scrollToBottom = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      const el = scrollContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
      rafRef.current = null;
    });
  }, []);

  const npcActions = actions.filter((a) => a.group === 'npc');
  const eventActions = actions.filter((a) => a.group === 'event');
  const choiceActions = actions.filter((a) => a.group === 'choice');

  const hasNpc = npcActions.length > 0;
  const hasEvent = eventActions.length > 0;

  const npcBadge = npcActions.filter((a) => a.available && !a.completed).length;
  const eventBadge = eventActions.filter((a) => a.available && !a.completed).length;
  const choiceBadge = choiceActions.filter((a) => a.available && !a.completed).length;

  // 新文本加入时立刻滚底
  useEffect(() => {
    scrollToBottom();
  }, [storyTexts, scrollToBottom]);

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

  // pendingChoices が解除されて npc タブにコンテンツがない場合は探査へフォールバック
  useEffect(() => {
    if (!pendingChoices && !hasNpc) setActiveTab('event');
  }, [pendingChoices, hasNpc]);

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

    // 按事件分组，保持原始顺序
    const groups: Array<{ eventId: string; title: string; actions: ActionItem[] }> = [];
    const groupMap = new Map<string, ActionItem[]>();
    for (const a of eventActions) {
      const eid = a.eventId ?? a.id;
      if (!groupMap.has(eid)) {
        const list: ActionItem[] = [];
        groupMap.set(eid, list);
        groups.push({ eventId: eid, title: a.eventTitle ?? '', actions: list });
      }
      groupMap.get(eid)!.push(a);
    }

    return (
      <div className="space-y-3.5">
        {groups.map(({ eventId, title, actions: groupActions }) => (
          <div key={eventId}>
            {/* 事件标题行 */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-gold/55 text-[10px] tracking-widest shrink-0 select-none">
                {title}
              </span>
              <div className="flex-1 h-px bg-gold/12" />
            </div>
            {/* 子动作列表，左侧竖线体现层级 */}
            <div className="pl-2 border-l-2 border-gold/20 space-y-1.5">
              {groupActions.map((a) => (
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
          </div>
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
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin">
        <p className="text-ink/80 leading-loose text-sm">{roomDescription}</p>
        {storyTexts.map((text, i) => (
          <div key={i} className="border-l-2 border-gold/20 pl-3">
            {i === storyTexts.length - 1 ? (
              <TypewriterText
                text={text}
                className="text-ink/90 leading-loose text-sm"
                onUpdate={scrollToBottom}
              />
            ) : (
              <span className="text-ink/90 leading-loose text-sm">{text}</span>
            )}
          </div>
        ))}
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
            {pendingChoices && choiceBadge > 0 && (
              <span className="ml-1 text-[9px] bg-gold/15 text-gold/70 px-1 rounded-full">
                {choiceBadge}
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
