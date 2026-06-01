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

  useEffect(() => { scrollToBottom(); }, [storyTexts, scrollToBottom]);

  useEffect(() => {
    const hasUnreadNpc = actions.some((a) => a.group === 'npc' && a.available && !a.completed);
    setActiveTab(hasUnreadNpc ? 'npc' : 'event');
  }, [roomName]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (pendingChoices) setActiveTab('npc'); }, [pendingChoices]);

  useEffect(() => {
    if (!pendingChoices && !hasNpc) setActiveTab('event');
  }, [pendingChoices, hasNpc]);

  const renderTabContent = () => {
    if (activeTab === 'npc') {
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
      <div className="space-y-4">
        {groups.map(({ eventId, title, actions: groupActions }) => (
          <div key={eventId}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gold/45 text-[10px] tracking-widest shrink-0 select-none">{title}</span>
              <div className="flex-1 h-px bg-gold/10" />
            </div>
            <div className="pl-2.5 border-l border-gold/20 space-y-1.5">
              {groupActions.map((a) =>
                a.completed ? (
                  <div key={a.id} className="flex items-center gap-1.5 py-0.5 pl-1 select-none">
                    <span className="text-gold/20 text-[10px] shrink-0">✓</span>
                    <span className="text-ink/20 text-xs line-through decoration-ink/12">{a.label}</span>
                  </div>
                ) : (
                  <ActionButton
                    key={a.id}
                    label={a.label}
                    onClick={() => onAction(a.id)}
                    disabled={!a.available}
                    completed={false}
                    hint={a.hint}
                    variant={a.variant}
                  />
                )
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* 房间标题 */}
      <div className="px-5 py-3 border-b border-gold/10 flex items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gold/15" />
        <h2 className="text-gold/85 text-sm tracking-[0.2em] shrink-0">{roomName}</h2>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gold/15" />
      </div>

      {/* 故事文本区（可滚动） */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-thin">
        <p className="text-ink/50 leading-[1.9] text-sm border-l-2 border-gold/10 pl-3">{roomDescription}</p>
        {storyTexts.map((text, i) => (
          <div key={i} className="border-l-2 border-gold/25 pl-3">
            {i === storyTexts.length - 1 ? (
              <TypewriterText
                text={text}
                className="text-ink/90 leading-[1.9] text-sm"
                onUpdate={scrollToBottom}
              />
            ) : (
              <span className="text-ink/85 leading-[1.9] text-sm">{text}</span>
            )}
          </div>
        ))}
      </div>

      {/* 操作区 */}
      <div className="border-t border-gold/10 px-4 pt-3 pb-3" style={{ background: 'linear-gradient(to bottom, rgba(20,13,4,0) 0%, rgba(20,13,4,0.4) 100%)' }}>
        {/* 标题行 + 提示按钮 */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-px bg-gold/25" />
            <p className="text-gold/30 text-[10px] tracking-[0.3em]">行动</p>
            <div className="w-3 h-px bg-gold/25" />
          </div>
          {onToggleHint && (
            <button
              onClick={onToggleHint}
              className={`text-[11px] px-2.5 py-0.5 border tracking-wider transition-colors cursor-pointer ${
                showHint
                  ? 'border-gold/40 text-gold/65 bg-gold/5'
                  : 'border-ink/10 text-ink/25 hover:border-gold/25 hover:text-gold/35'
              }`}
            >
              提示
            </button>
          )}
        </div>

        {/* 提示文字 */}
        {hint && (
          <div className="mb-2.5 flex gap-2 items-start">
            <div className="w-[2px] self-stretch bg-gold/25 shrink-0 rounded-full" />
            <p className="text-ink/38 text-xs leading-relaxed italic">{hint}</p>
          </div>
        )}

        {/* Tab 切换栏 */}
        <div className="flex border-b border-gold/10 mb-3">
          <button
            onClick={() => { if (!pendingChoices && hasNpc) setActiveTab('npc'); }}
            disabled={!hasNpc || pendingChoices}
            className={`flex-1 text-center py-1.5 text-xs tracking-widest transition-all duration-150 ${
              activeTab === 'npc'
                ? 'text-gold/85 border-b border-gold/45 -mb-px'
                : !hasNpc || pendingChoices
                ? 'text-ink/15 cursor-default'
                : 'text-ink/30 hover:text-ink/55 cursor-pointer'
            }`}
          >
            {pendingChoices ? '如何回应' : '交谈'}
            {pendingChoices && choiceBadge > 0 && (
              <span className="ml-1 text-[9px] bg-gold/15 text-gold/65 px-1 rounded-full">{choiceBadge}</span>
            )}
            {!pendingChoices && npcBadge > 0 && (
              <span className="ml-1 text-[9px] bg-gold/15 text-gold/65 px-1 rounded-full">{npcBadge}</span>
            )}
          </button>

          <button
            onClick={() => { if (!pendingChoices && hasEvent) setActiveTab('event'); }}
            disabled={!hasEvent || pendingChoices}
            className={`flex-1 text-center py-1.5 text-xs tracking-widest transition-all duration-150 ${
              activeTab === 'event'
                ? 'text-gold/85 border-b border-gold/45 -mb-px'
                : !hasEvent || pendingChoices
                ? 'text-ink/15 cursor-default'
                : 'text-ink/30 hover:text-ink/55 cursor-pointer'
            }`}
          >
            探查
            {!pendingChoices && eventBadge > 0 && (
              <span className="ml-1 text-[9px] bg-gold/15 text-gold/65 px-1 rounded-full">{eventBadge}</span>
            )}
          </button>
        </div>

        {/* Tab 内容（固定高度，超出滚动） */}
        <div className="overflow-y-auto scrollbar-thin max-h-48 pb-1">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
