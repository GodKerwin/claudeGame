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
