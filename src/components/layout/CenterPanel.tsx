import { TypewriterText } from '../ui/TypewriterText';
import { ActionButton } from '../ui/ActionButton';

interface ActionItem {
  id: string;
  label: string;
  available: boolean;
  completed: boolean;
  hint: string;
  variant?: 'default' | 'danger' | 'special';
}

interface Props {
  roomName: string;
  roomDescription: string;
  storyTexts: string[];
  actions: ActionItem[];
  onAction: (actionId: string) => void;
  pendingChoices?: boolean;
}

export function CenterPanel({ roomName, roomDescription, storyTexts, actions, onAction, pendingChoices = false }: Props) {
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
      </div>

      <div className="border-t border-gold/10 px-5 py-3">
        <p className="text-gold/40 text-xs mb-2 tracking-widest">
          {pendingChoices ? '── 如何回应 ──' : '── 操作 ──'}
        </p>
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
      </div>
    </div>
  );
}
