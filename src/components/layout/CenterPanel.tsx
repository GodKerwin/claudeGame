import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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
  entityName?: string;
}

interface Entity {
  id: string;
  name: string;
  type: 'npc' | 'event' | 'choice';
  actions: ActionItem[];
  hasNew: boolean;
  allDone: boolean;
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const scrollToBottom = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      const el = scrollContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
      rafRef.current = null;
    });
  }, []);

  const npcActions = useMemo(() => actions.filter((a) => a.group === 'npc'), [actions]);
  const eventActions = useMemo(() => actions.filter((a) => a.group === 'event'), [actions]);
  const choiceActions = useMemo(() => actions.filter((a) => a.group === 'choice'), [actions]);

  const eventGroups = useMemo(() => {
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
    return groups;
  }, [eventActions]);

  // Build entity list: choices > NPCs > events
  const entities = useMemo<Entity[]>(() => {
    if (pendingChoices) {
      return [{
        id: '__choices__',
        name: '如何回应',
        type: 'choice',
        actions: choiceActions,
        hasNew: true,
        allDone: false,
      }];
    }
    const result: Entity[] = [];
    for (const a of npcActions) {
      result.push({
        id: a.id.split(':')[0],
        name: a.entityName ?? a.label,
        type: 'npc',
        actions: [a],
        hasNew: a.available && !a.completed,
        allDone: a.completed,
      });
    }
    for (const g of eventGroups) {
      const hasNew = g.actions.some((a) => a.available && !a.completed);
      const allDone = g.actions.length > 0 && g.actions.every((a) => a.completed);
      result.push({
        id: g.eventId,
        name: g.title,
        type: 'event',
        actions: g.actions,
        hasNew,
        allDone,
      });
    }
    return result;
  }, [npcActions, eventGroups, choiceActions, pendingChoices]);

  useEffect(() => { scrollToBottom(); }, [storyTexts, scrollToBottom]);

  // Auto-expand first entity with new actions on room change
  useEffect(() => {
    const first = entities.find((e) => e.hasNew) ?? entities[0];
    setExpandedId(first?.id ?? null);
  }, [roomName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-expand choices when they appear
  useEffect(() => {
    if (pendingChoices) setExpandedId('__choices__');
  }, [pendingChoices]);

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="flex flex-col h-full">
      {/* 房间标题 */}
      <div className="px-5 py-3 border-b border-gold/10 flex items-center gap-2">
        <div
          className="w-[5px] h-[5px] bg-gold/20 shrink-0"
          style={{ transform: 'rotate(45deg)' }}
        />
        <div className="flex-1 h-px bg-gradient-to-r from-gold/15 to-transparent" />
        <h2 className="text-gold/85 text-sm tracking-[0.2em] shrink-0">{roomName}</h2>
        <div className="flex-1 h-px bg-gradient-to-l from-gold/15 to-transparent" />
        <div
          className="w-[5px] h-[5px] bg-gold/20 shrink-0"
          style={{ transform: 'rotate(45deg)' }}
        />
      </div>

      {/* 故事文本区（可滚动） */}
      <div ref={scrollContainerRef} className="flex-[3] min-h-0 overflow-y-auto px-5 py-5 space-y-4 scrollbar-thin">
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
      <div
        className="flex-[2] min-h-0 flex flex-col border-t border-gold/10 px-4 pt-3 pb-3"
        style={{
          background: `
            repeating-linear-gradient(
              135deg,
              transparent,
              transparent 20px,
              rgba(201,168,76,0.015) 20px,
              rgba(201,168,76,0.015) 21px
            ),
            linear-gradient(to bottom, rgba(20,13,4,0) 0%, rgba(20,13,4,0.4) 100%)
          `,
        }}
      >
        {/* 标题行 + 提示按钮 */}
        <div className="flex items-center justify-between mb-2">
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
          <div className="mb-2 flex gap-2 items-start">
            <div className="w-[2px] self-stretch bg-gold/25 shrink-0 rounded-full" />
            <p className="text-ink/38 text-xs leading-relaxed italic">{hint}</p>
          </div>
        )}

        {/* 实体折叠列表 */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
          {entities.length === 0 && (
            <p className="text-ink/20 text-xs px-2 py-2 italic">此处无可交互之物</p>
          )}
          {entities.map((entity) => {
            const isExpanded = expandedId === entity.id;
            const newCount = entity.actions.filter((a) => a.available && !a.completed).length;

            return (
              <div key={entity.id}>
                {/* 实体行 */}
                <button
                  onClick={() => toggle(entity.id)}
                  className={`w-full flex items-center gap-2 px-1.5 py-2 text-left transition-colors duration-100 cursor-pointer group ${
                    isExpanded ? 'text-gold/80' : 'text-ink/50 hover:text-ink/75'
                  }`}
                >
                  <span className={`text-[9px] shrink-0 transition-colors ${isExpanded ? 'text-gold/50' : 'text-ink/25 group-hover:text-ink/40'}`}>
                    {isExpanded ? '▾' : '▸'}
                  </span>
                  <span className="text-xs flex-1 tracking-wide">{entity.name}</span>
                  {newCount > 0 && (
                    <span className="text-[9px] bg-gold/12 text-gold/55 px-1.5 py-0.5 rounded-full shrink-0 leading-none">
                      {newCount}
                    </span>
                  )}
                  {newCount === 0 && entity.allDone && (
                    <span className="text-[9px] text-ink/18 shrink-0">已探</span>
                  )}
                </button>

                {/* 展开的动作列表 */}
                {isExpanded && (
                  <div className="ml-3 pl-3 border-l border-gold/12 pb-1.5 space-y-0.5">
                    {entity.type === 'choice'
                      ? entity.actions.map((a) => (
                          <ActionButton
                            key={a.id}
                            label={a.label}
                            onClick={() => onAction(a.id)}
                            disabled={!a.available}
                            completed={a.completed}
                            hint={a.hint}
                            variant={a.variant}
                          />
                        ))
                      : entity.actions.map((a) =>
                          a.completed ? (
                            <div key={a.id} className="flex items-center gap-1.5 py-0.5 px-1 select-none opacity-40">
                              <span className="text-gold/50 text-[9px] shrink-0">✓</span>
                              <span className="text-ink/60 text-[11px]">{a.label}</span>
                            </div>
                          ) : (
                            <button
                              key={a.id}
                              onClick={() => onAction(a.id)}
                              disabled={!a.available}
                              className={`w-full text-left text-[11px] py-1 px-1 transition-colors duration-100 leading-snug ${
                                a.available
                                  ? 'text-ink/60 hover:text-gold/80 cursor-pointer'
                                  : 'text-ink/22 cursor-not-allowed'
                              }`}
                            >
                              {a.label}
                              {!a.available && a.hint && (
                                <span className="ml-1.5 text-ink/28 text-[10px]">（{a.hint}）</span>
                              )}
                            </button>
                          )
                        )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
