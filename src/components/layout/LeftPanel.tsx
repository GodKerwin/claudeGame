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
    player.name, player.template, player.strength, player.agility,
    player.wisdom, player.constitution, player.talent, items, flags,
  ]);

  const exits = useMemo(() => (room ? getAvailableExits(room, ctx, ALL_ROOMS) : []), [room, ctx]);
  const lockedExits = useMemo(() => (room ? getLockedExits(room, ctx, ALL_ROOMS) : []), [room, ctx]);

  const currentChapterRoomIds = useMemo(() => new Set(
    MAPS.find((m) => m.rooms.some((r) => r.id === currentRoomId))?.rooms.map((r) => r.id) ?? []
  ), [currentRoomId]);

  const visitedRoomNames = useMemo(() => visitedRooms
    .map((id) => getRoom(id))
    .filter(Boolean)
    .filter((r) => r!.id !== currentRoomId && currentChapterRoomIds.has(r!.id)),
  [visitedRooms, currentRoomId, currentChapterRoomIds]);

  return (
    <div className="flex flex-col h-full p-3 gap-5 text-sm">
      {/* 当前地点 */}
      <div>
        <p className="text-gold/35 text-[10px] mb-1.5 tracking-[0.3em]">所在</p>
        <p className="text-ink/90 text-sm leading-snug pl-2 border-l-2 border-gold/50">
          {room?.name ?? '—'}
        </p>
      </div>

      {/* 可前往 */}
      <div className="flex-1">
        <p className="text-gold/35 text-[10px] mb-2 tracking-[0.3em]">前往</p>
        <div className="flex flex-col gap-0.5">
          {exits.map((r) => (
            <button
              key={r.id}
              onClick={() => onNavigate(r.id)}
              className="text-left text-ink/60 hover:text-gold text-xs py-1.5 px-2 border border-transparent hover:border-gold/20 hover:bg-gold/3 transition-all duration-150 group flex items-center gap-1.5 cursor-pointer"
            >
              <span className="text-gold/30 group-hover:text-gold/60 transition-colors text-[10px]">▸</span>
              <span>{r.name}</span>
            </button>
          ))}
          {lockedExits.map((r) => {
            const req = r.requires as Record<string, unknown> | null;
            const flagHint = (req?.flags as string[] | undefined)?.map((f) => FLAG_HINTS[f]).find(Boolean);
            return (
              <div
                key={r.id}
                className="text-ink/18 text-xs py-1.5 px-2 cursor-not-allowed flex items-start gap-1.5"
                title={flagHint ?? '条件未达成'}
              >
                <span className="text-[10px] text-ink/15 shrink-0 mt-0.5">▸</span>
                <div>
                  <span className="line-through decoration-ink/15">{r.name}</span>
                  {flagHint && <p className="text-ink/15 text-[10px] leading-tight mt-0.5">{flagHint}</p>}
                </div>
              </div>
            );
          })}
          {exits.length === 0 && lockedExits.length === 0 && (
            <p className="text-ink/15 text-xs px-2 py-1">无可前往之处</p>
          )}
        </div>
      </div>

      {/* 已探索 */}
      {visitedRoomNames.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="flex-1 h-px bg-gold/10" />
            <p className="text-gold/25 text-[10px] tracking-[0.2em] shrink-0">足迹</p>
          </div>
          <ul className="space-y-0.5">
            {visitedRoomNames.map((r) => r && (
              <li key={r.id} className="text-[11px] text-ink/25 px-2 flex items-center gap-1.5">
                <span className="text-gold/15">·</span>
                {r.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
