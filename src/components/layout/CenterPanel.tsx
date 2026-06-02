import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { TypewriterText } from '../ui/TypewriterText';
import { ActionButton } from '../ui/ActionButton';

const ROOM_ATMOSPHERE: Record<string, { glyph: string; color: string; label: string }> = {
  room_203:           { glyph: '▲', color: 'rgba(201,168,76,0.45)', label: '室内·夜' },
  room_202:           { glyph: '▲', color: 'rgba(139,26,26,0.55)', label: '凶案现场' },
  lobby:              { glyph: '▲', color: 'rgba(201,168,76,0.35)', label: '室内' },
  kitchen:            { glyph: '▲', color: 'rgba(201,168,76,0.30)', label: '后厨' },
  cellar:             { glyph: '▼', color: 'rgba(201,168,76,0.25)', label: '地下' },
  forest:             { glyph: '◌', color: 'rgba(58,122,90,0.55)', label: '林间·户外' },
  old_mansion:        { glyph: '◌', color: 'rgba(201,168,76,0.25)', label: '废弃·户外' },
  back_alley:         { glyph: '◌', color: 'rgba(201,168,76,0.25)', label: '巷道·夜' },
  east_market_entrance:{ glyph: '◈', color: 'rgba(201,168,76,0.40)', label: '东市·晨' },
  huichuntang:        { glyph: '▲', color: 'rgba(58,122,90,0.45)', label: '药铺·室内' },
  antique_shop:       { glyph: '▲', color: 'rgba(201,168,76,0.35)', label: '古玩铺' },
  cien_temple:        { glyph: '☽', color: 'rgba(201,168,76,0.35)', label: '寺院偏院' },
  pingkang_hideout:   { glyph: '◌', color: 'rgba(139,26,26,0.40)', label: '据点·险' },
  imperial_teahouse:  { glyph: '▲', color: 'rgba(201,168,76,0.45)', label: '茶馆·室内' },
  dayan_pagoda:       { glyph: '☽', color: 'rgba(201,168,76,0.35)', label: '塔下·晨' },
  tianji_safehouse:   { glyph: '▲', color: 'rgba(201,168,76,0.30)', label: '安宅·室内' },
  feiyes_manor:       { glyph: '◌', color: 'rgba(201,168,76,0.25)', label: '旧居·午后' },
  qujiang_pavilion:   { glyph: '◌', color: 'rgba(58,122,90,0.45)', label: '曲江·傍晚' },
};

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

interface InterrogationProps {
  npcName: string;
  prompt: string;
  allItems: { id: string; name: string; isClue: boolean }[];
  onPresent: (itemId: string) => void;
  onCancel: () => void;
}

interface Props {
  roomName: string;
  roomId?: string;
  roomDescription: string;
  storyTexts: string[];
  actions: ActionItem[];
  onAction: (actionId: string) => void;
  pendingChoices?: boolean;
  hint?: string | null;
  onToggleHint?: () => void;
  showHint?: boolean;
  pendingInterrogation?: InterrogationProps | null;
}

export function CenterPanel({
  roomName,
  roomId,
  roomDescription,
  storyTexts,
  actions,
  onAction,
  pendingChoices = false,
  hint,
  onToggleHint,
  showHint,
  pendingInterrogation,
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

  const allExplored = useMemo(() => {
    if (pendingChoices) return false;
    const nonChoice = [...npcActions, ...eventActions];
    return nonChoice.length > 0 && nonChoice.every((a) => a.completed);
  }, [npcActions, eventActions, pendingChoices]);

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
      <div className="px-5 py-3 border-b border-gold/10 flex flex-col items-center gap-1">
        <div className="w-full flex items-center gap-2">
          <div className="w-[5px] h-[5px] bg-gold/20 shrink-0" style={{ transform: 'rotate(45deg)' }} />
          <div className="flex-1 h-px bg-gradient-to-r from-gold/15 to-transparent" />
          <h2 className="text-gold/85 text-sm tracking-[0.2em] shrink-0">{roomName}</h2>
          <div className="flex-1 h-px bg-gradient-to-l from-gold/15 to-transparent" />
          <div className="w-[5px] h-[5px] bg-gold/20 shrink-0" style={{ transform: 'rotate(45deg)' }} />
        </div>
        {roomId && ROOM_ATMOSPHERE[roomId] && (
          <div className="flex items-center gap-1">
            <span style={{ color: ROOM_ATMOSPHERE[roomId].color, fontSize: '10px', lineHeight: 1 }}>{ROOM_ATMOSPHERE[roomId].glyph}</span>
            <span className="text-ink/22 text-[10px] tracking-[0.15em]">{ROOM_ATMOSPHERE[roomId].label}</span>
          </div>
        )}
      </div>

      {/* 故事文本区（可滚动） */}
      <div key={roomName} ref={scrollContainerRef} className="flex-[3] min-h-0 overflow-y-auto px-5 py-5 space-y-4 scrollbar-thin panel-fade-in">
        <p className="text-ink/45 leading-[1.9] text-sm border-l-2 border-gold/10 pl-3 italic">{roomDescription}</p>
        {storyTexts.map((text, i) => {
          if (text === '---SEPARATOR---') {
            return <div key={i} className="border-t border-gold/8 my-1 mx-1 opacity-60" />;
          }
          const isLatest = i === storyTexts.length - 1;
          const isRecent = i >= storyTexts.length - 3;
          const isNpcSpeech = text.startsWith('【') && text.includes('】');
          const isPlaceholder = text.startsWith('（') && text.endsWith('。）');
          const isPsychHint = text.startsWith('〔') && text.endsWith('〕');
          // 渐进透明：越旧的记录越淡
          const opacity = isLatest ? 'text-ink/92' : isRecent ? 'text-ink/75' : 'text-ink/45';
          const borderColor = isNpcSpeech
            ? 'border-jade/40'
            : isPsychHint
            ? 'border-gold/22'
            : isPlaceholder
            ? 'border-gold/10'
            : 'border-gold/30';
          const textClass = isPsychHint
            ? 'text-gold/38 italic text-[13px]'
            : `${opacity} text-sm`;
          return (
            <div key={i} className={`border-l-2 ${borderColor} pl-3 transition-opacity duration-500`}>
              {isLatest ? (
                <TypewriterText
                  text={text}
                  className={`${textClass} leading-[1.9]`}
                  onUpdate={scrollToBottom}
                />
              ) : (
                <span className={`${textClass} leading-[1.9]`}>{text}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 操作区 */}
      <div
        key={`action-${roomName}`}
        className="flex-[1.5] min-h-0 flex flex-col border-t border-gold/10 px-4 pt-3 pb-3 panel-fade-in"
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
        {/* ── 审讯博弈模式 ── */}
        {pendingInterrogation ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-px bg-blood/40" />
              <p className="text-blood/60 text-[10px] tracking-[0.3em]">审讯·出示证据</p>
              <div className="w-3 h-px bg-blood/40" />
            </div>
            <div className="mb-3 border-l-2 border-jade/35 pl-3">
              <p className="text-[11px] text-gold/55 tracking-wide mb-0.5">{pendingInterrogation.npcName}</p>
              <p className="text-ink/70 text-xs leading-relaxed">{pendingInterrogation.prompt}</p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin space-y-0.5 mb-2">
              {pendingInterrogation.allItems.length === 0 ? (
                <p className="text-ink/25 text-xs italic px-1">暂无可出示之物</p>
              ) : (
                pendingInterrogation.allItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => pendingInterrogation.onPresent(item.id)}
                    className="w-full text-left flex items-center gap-2 px-2 py-1.5 border-l-2 border-gold/20 text-ink/65 hover:text-gold hover:border-gold/55 transition-colors cursor-pointer group"
                  >
                    <span className={`text-[9px] shrink-0 ${item.isClue ? 'text-gold/50' : 'text-ink/25'}`}>
                      {item.isClue ? '◈' : '◇'}
                    </span>
                    <span className="text-[13px] flex-1">{item.name}</span>
                    <span className="text-[9px] text-gold/35 shrink-0 tracking-widest group-hover:text-gold/60">出示</span>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={pendingInterrogation.onCancel}
              className="w-full text-center text-[11px] text-ink/25 hover:text-ink/45 py-1 tracking-widest cursor-pointer transition-colors border-t border-gold/8 pt-2"
            >
              算了，暂不出示
            </button>
          </div>
        ) : (
          <>
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

        {/* ── 人物区块（NPC，直接点击对话）── */}
        {entities.filter((e) => e.type === 'npc').length > 0 && !pendingChoices && (
          <div className="mb-2">
            <div className="flex items-center gap-1.5 mb-1.5 px-1">
              <span className="text-[9px] text-gold/30 tracking-[0.25em]">人物</span>
              <div className="flex-1 h-px bg-gold/10" />
            </div>
            <div className="flex flex-col gap-0.5">
              {entities.filter((e) => e.type === 'npc').map((entity) => {
                const a = entity.actions[0];
                const hasNew = !a.completed;
                return (
                  <button
                    key={entity.id}
                    onClick={() => onAction(a.id)}
                    className={`w-full text-left flex items-center gap-2 px-2 py-1.5 transition-colors duration-100 cursor-pointer group border-l-2 ${
                      hasNew
                        ? 'border-gold/45 text-ink/80 hover:text-gold'
                        : 'border-gold/12 text-ink/35 hover:text-ink/55 hover:border-gold/25'
                    }`}
                  >
                    <span className={`text-[9px] shrink-0 transition-colors ${hasNew ? 'text-gold/60' : 'text-ink/20'}`}>
                      {hasNew ? '●' : '○'}
                    </span>
                    <span className="text-[13px] flex-1 tracking-wide leading-snug">{entity.name}</span>
                    {hasNew && (
                      <span className="text-[9px] text-gold/50 shrink-0 tracking-widest">对话</span>
                    )}
                    {!hasNew && (
                      <span className="text-[9px] text-ink/18 shrink-0">已对话</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 探索区块（事件、选项，可折叠）── */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
          {allExplored && (
            <p className="text-ink/18 text-[11px] px-2 py-3 italic text-center leading-relaxed">
              此处探查已尽<br />
              <span className="text-[10px] tracking-wide">可前往其他地点继续调查</span>
            </p>
          )}
          {entities.filter((e) => e.type !== 'npc').length === 0 && entities.filter((e) => e.type === 'npc').length === 0 && (
            <p className="text-ink/20 text-xs px-2 py-2 italic">此处无可交互之物</p>
          )}
          {entities.filter((e) => e.type !== 'npc').length > 0 && (
            <>
              {entities.filter((e) => e.type === 'npc').length > 0 && !pendingChoices && (
                <div className="flex items-center gap-1.5 mb-1.5 px-1">
                  <span className="text-[9px] text-gold/30 tracking-[0.25em]">探索</span>
                  <div className="flex-1 h-px bg-gold/10" />
                </div>
              )}
              {entities.filter((e) => e.type !== 'npc').map((entity) => {
                const isExpanded = expandedId === entity.id;
                const newCount = entity.actions.filter((a) => a.available && !a.completed).length;

                return (
                  <div key={entity.id} className="border-b border-gold/8 last:border-0">
                    <button
                      onClick={() => toggle(entity.id)}
                      className={`w-full flex items-center gap-2 px-1.5 py-2 text-left transition-colors duration-100 cursor-pointer group ${
                        isExpanded ? 'text-gold/80' : 'text-ink/50 hover:text-ink/75'
                      }`}
                      style={isExpanded ? { background: 'linear-gradient(to right, rgba(201,168,76,0.07), transparent)' } : undefined}
                    >
                      <span className={`text-[9px] shrink-0 transition-colors ${isExpanded ? 'text-gold/50' : 'text-ink/25 group-hover:text-ink/40'}`}>
                        {isExpanded ? '▾' : '▸'}
                      </span>
                      <span className="text-[13px] flex-1 tracking-wide">{entity.name}</span>
                      {newCount > 0 && (
                        <span className="text-[9px] bg-gold/12 text-gold/55 px-1.5 py-0.5 rounded-full shrink-0 leading-none">
                          {newCount}
                        </span>
                      )}
                      {newCount === 0 && entity.allDone && (
                        <span className="text-[9px] text-ink/18 shrink-0">已探</span>
                      )}
                    </button>

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
                                <div key={a.id} className="flex items-center gap-1.5 py-0.5 px-1 select-none">
                                  <span className="text-gold/30 text-[9px] shrink-0 leading-none">✓</span>
                                  <span className="text-ink/25 text-[12px] leading-snug">{a.label}</span>
                                </div>
                              ) : a.available ? (
                                <button
                                  key={a.id}
                                  onClick={() => onAction(a.id)}
                                  className="w-full text-left text-[13px] py-1.5 px-1 text-ink/65 hover:text-gold/85 cursor-pointer transition-colors duration-100 leading-snug"
                                >
                                  {a.label}
                                </button>
                              ) : (
                                <div
                                  key={a.id}
                                  className="pl-2 pr-1 py-1.5 border-l border-gold/12 ml-px select-none"
                                >
                                  <p className="text-[13px] text-ink/28 leading-snug">{a.label}</p>
                                  {a.hint && (
                                    <p className="text-[11px] text-gold/30 mt-0.5 tracking-wide leading-snug">{a.hint}</p>
                                  )}
                                </div>
                              )
                            )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
