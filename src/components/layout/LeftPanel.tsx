import { useSceneStore } from '../../store/sceneStore';
import { getRoom, ALL_ROOMS } from '../../data/loader';
import { getAvailableExits } from '../../engine/mapEngine';
import { usePlayerStore } from '../../store/playerStore';
import { useInventoryStore } from '../../store/inventoryStore';
import type { EvalContext } from '../../engine/conditionEvaluator';

interface Props {
  onNavigate: (roomId: string) => void;
}

export function LeftPanel({ onNavigate }: Props) {
  const { currentRoomId, flags } = useSceneStore();
  const player = usePlayerStore();
  const { items } = useInventoryStore();

  const room = getRoom(currentRoomId);
  const ctx: EvalContext = {
    player: {
      name: player.name,
      template: player.template,
      strength: player.strength,
      agility: player.agility,
      wisdom: player.wisdom,
      constitution: player.constitution,
      talent: player.talent,
    },
    inventory: items,
    flags,
  };
  const exits = room ? getAvailableExits(room, ctx, ALL_ROOMS) : [];

  return (
    <div className="flex flex-col h-full p-3 gap-4 text-sm">
      <div>
        <p className="text-gold/60 text-xs mb-1 tracking-widest">【当前地点】</p>
        <p className="text-ink font-bold leading-snug">{room?.name ?? '—'}</p>
      </div>

      <div>
        <p className="text-gold/60 text-xs mb-2 tracking-widest">【可前往】</p>
        <div className="flex flex-col gap-1">
          {exits.map((r) => (
            <button
              key={r.id}
              onClick={() => onNavigate(r.id)}
              className="text-left text-ink/80 hover:text-gold text-xs py-1 px-2 border border-transparent hover:border-gold/20 transition-colors"
            >
              ▶ {r.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto">
        <p className="text-gold/40 text-xs tracking-widest">【小地图】</p>
        <div className="mt-1 h-16 border border-gold/10 flex items-center justify-center text-ink/20 text-xs">
          长安城
        </div>
      </div>
    </div>
  );
}
