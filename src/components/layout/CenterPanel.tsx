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

export function CenterPanel({ roomName, roomDescription, storyTexts, actions, onAction, pendingChoices = false, hint, onToggleHint, showHint }: Props) {
  const storyEndRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [storyTexts]);

  useEffect(() => {
    const el = actionsRef.current;
    if (!el) return;
    const check = () => setHasOverflow(el.scrollHeight > el.clientHeight);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [actions]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b border-gold/10">
        <h2 className="text-gold text-base tracking-wider">{roomName}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <p className="text-ink/80 leading-loose text-sm">{roomDescription}</p>
        {storyTexts.map((text, i) => (
          <div key={i} className="border-l-2 border-gold/20 pl-3">
            <TypewriterText text={text} className="text-ink/90 leading-loose text-sm" />
          </div>
        ))}
        <div ref={storyEndRef} />
      </div>

      <div className="border-t border-gold/10 px-5 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gold/40 text-xs tracking-widest">
            {pendingChoices ? '── 如何回应 ──' : '── 操作 ──'}
          </p>
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
        {hint && (
          <p className="text-ink/40 text-xs leading-relaxed mb-2 italic border-l border-gold/20 pl-2">
            {hint}
          </p>
        )}
        <div className="relative">
          <div ref={actionsRef} className="overflow-y-auto max-h-48">
            {(() => {
              const hasNpc = actions.some((a) => a.group === 'npc');
              const hasEvent = actions.some((a) => a.group === 'event');
              const useGrouped = !pendingChoices && hasNpc && hasEvent && actions.length > 4;

              if (useGrouped) {
                const npcActions = actions.filter((a) => a.group === 'npc');
                const eventActions = actions.filter((a) => a.group === 'event');
                return (
                  <>
                    <p className="text-gold/30 text-xs tracking-widest mb-1 mt-2">── 交谈 ──</p>
                    <div className="grid grid-cols-2 gap-2">
                      {npcActions.map((a) => (
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
                    <p className="text-gold/30 text-xs tracking-widest mb-1 mt-2">── 探查 ──</p>
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
                  </>
                );
              }

              return (
                <div className="grid grid-cols-2 gap-2">
                  {actions.map((a) => (
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
            })()}
          </div>
          {hasOverflow && (
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-paper to-transparent pointer-events-none" />
          )}
        </div>
      </div>
    </div>
  );
}
