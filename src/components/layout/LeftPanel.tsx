import { useMemo } from 'react';
import { useSceneStore } from '../../store/sceneStore';
import { getRoom, ALL_ROOMS, MAPS } from '../../data/loader';
import { getAvailableExits, getLockedExits } from '../../engine/mapEngine';
import { usePlayerStore } from '../../store/playerStore';
import { useInventoryStore } from '../../store/inventoryStore';
import type { EvalContext } from '../../engine/conditionEvaluator';

const FLAG_HINTS: Record<string, string> = {
  fei_ye_identity_confirmed: '确认飞爷身份后可前往',
  chapter2_join_ending: '仅限卧底路线',
  chapter2_started: '第二章方可前往',
  chapter3_started: '第三章方可前往',
};

interface Props {
  onNavigate: (roomId: string) => void;
}

export function LeftPanel({ onNavigate }: Props) {
  const { currentRoomId, flags, visitedRooms } = useSceneStore();
  const player = usePlayerStore();
  const { items } = useInventoryStore();

  const room = getRoom(currentRoomId);

  const ctx = useMemo<EvalContext>(() => ({
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
  }), [
    player.name,
    player.template,
    player.strength,
    player.agility,
    player.wisdom,
    player.constitution,
    player.talent,
    items,
    flags,
  ]);

  const exits = useMemo(
    () => (room ? getAvailableExits(room, ctx, ALL_ROOMS) : []),
    [room, ctx]
  );
  const lockedExits = useMemo(
    () => (room ? getLockedExits(room, ctx, ALL_ROOMS) : []),
    [room, ctx]
  );

  const currentChapterRoomIds = new Set(
    MAPS.find((m) => m.rooms.some((r) => r.id === currentRoomId))?.rooms.map((r) => r.id) ?? []
  );

  const visitedRoomNames = visitedRooms
    .map((id) => getRoom(id))
    .filter(Boolean)
    .filter((r) => r!.id !== currentRoomId && currentChapterRoomIds.has(r!.id));

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
          {lockedExits.map((r) => {
            const req = r.requires as Record<string, unknown> | null;
            const flagHint = (req?.flags as string[] | undefined)?.map((f) => FLAG_HINTS[f]).find(Boolean);
            return (
              <div
                key={r.id}
                className="text-left text-ink/25 text-xs py-1 px-2 cursor-not-allowed"
                title={flagHint ?? '条件未达成'}
              >
                ▷ {r.name}
                {flagHint && <span className="block text-ink/20 text-[10px] leading-tight pl-3">{flagHint}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {visitedRoomNames.length > 0 && (
        <div>
          <p className="text-gold/40 text-xs mb-1 tracking-widest">【已探索】</p>
          <ul className="space-y-0.5">
            {visitedRoomNames.map((r) => r && (
              <li key={r.id} className="text-xs text-ink/40 py-0.5 px-2">
                · {r.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
