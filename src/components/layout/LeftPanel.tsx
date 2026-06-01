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

// 与 CenterPanel 保持一致的氛围字符
const ROOM_GLYPHS: Record<string, { glyph: string; color: string }> = {
  room_203:            { glyph: '▲', color: 'rgba(201,168,76,0.5)' },
  room_202:            { glyph: '▲', color: 'rgba(139,26,26,0.6)' },
  lobby:               { glyph: '▲', color: 'rgba(201,168,76,0.4)' },
  kitchen:             { glyph: '▲', color: 'rgba(201,168,76,0.35)' },
  cellar:              { glyph: '▼', color: 'rgba(201,168,76,0.3)' },
  forest:              { glyph: '◌', color: 'rgba(58,122,90,0.6)' },
  old_mansion:         { glyph: '◌', color: 'rgba(201,168,76,0.3)' },
  back_alley:          { glyph: '◌', color: 'rgba(201,168,76,0.3)' },
  east_market_entrance:{ glyph: '◈', color: 'rgba(201,168,76,0.45)' },
  huichuntang:         { glyph: '▲', color: 'rgba(58,122,90,0.5)' },
  antique_shop:        { glyph: '▲', color: 'rgba(201,168,76,0.4)' },
  cien_temple:         { glyph: '☽', color: 'rgba(201,168,76,0.4)' },
  pingkang_hideout:    { glyph: '◌', color: 'rgba(139,26,26,0.45)' },
  imperial_teahouse:   { glyph: '▲', color: 'rgba(201,168,76,0.5)' },
  dayan_pagoda:        { glyph: '☽', color: 'rgba(201,168,76,0.4)' },
  tianji_safehouse:    { glyph: '▲', color: 'rgba(201,168,76,0.35)' },
  feiyes_manor:        { glyph: '◌', color: 'rgba(201,168,76,0.3)' },
  qujiang_pavilion:    { glyph: '◌', color: 'rgba(58,122,90,0.5)' },
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

  const roomGlyph = ROOM_GLYPHS[currentRoomId];

  return (
    <div className="flex flex-col h-full text-sm relative overflow-hidden">
      {/* 顶部装饰线 */}
      <div className="h-px mx-3 mt-3 mb-0" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.2), transparent)' }} />

      <div className="flex flex-col h-full p-3 gap-4">
        {/* 当前地点 */}
        <div>
          <p className="text-gold/30 text-[9px] mb-2 tracking-[0.35em] px-1">所在之处</p>
          <div
            className="px-2.5 py-2.5 border border-gold/18 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.04) 0%, transparent 60%)' }}
          >
            {/* 左侧色条 */}
            {roomGlyph && (
              <div
                className="absolute left-0 top-0 bottom-0 w-[2px]"
                style={{ background: roomGlyph.color }}
              />
            )}
            <div className="flex items-center gap-2 pl-1">
              {roomGlyph && (
                <span style={{ color: roomGlyph.color, fontSize: '11px', lineHeight: 1, flexShrink: 0 }}>
                  {roomGlyph.glyph}
                </span>
              )}
              <p className="text-ink/88 text-sm leading-snug tracking-wide">
                {room?.name ?? '—'}
              </p>
            </div>
          </div>
        </div>

        {/* 可前往 */}
        <div className="flex-1">
          <p className="text-gold/30 text-[9px] mb-1.5 tracking-[0.35em] px-1">前往</p>
          <div className="flex flex-col gap-0.5">
            {exits.map((r) => {
              const glyph = ROOM_GLYPHS[r.id];
              return (
                <button
                  key={r.id}
                  onClick={() => onNavigate(r.id)}
                  className="text-left text-ink/55 hover:text-ink/88 text-xs py-1.5 px-2 border border-transparent hover:border-gold/18 hover:bg-gold/3 transition-all duration-150 group flex items-center gap-2 cursor-pointer"
                >
                  <span
                    className="text-[10px] shrink-0 transition-colors"
                    style={{ color: glyph ? glyph.color : undefined }}
                  >
                    {glyph ? glyph.glyph : '▸'}
                  </span>
                  <span className="group-hover:text-gold/85 transition-colors">{r.name}</span>
                </button>
              );
            })}
            {lockedExits.map((r) => {
              const req = r.requires as Record<string, unknown> | null;
              const flagHint = (req?.flags as string[] | undefined)?.map((f) => FLAG_HINTS[f]).find(Boolean);
              return (
                <div
                  key={r.id}
                  className="text-ink/18 text-xs py-1.5 px-2 cursor-not-allowed flex items-start gap-2"
                  title={flagHint ?? '条件未达成'}
                >
                  <span className="text-[10px] text-ink/12 shrink-0 mt-0.5">▸</span>
                  <div>
                    <span className="line-through decoration-ink/12">{r.name}</span>
                    {flagHint && <p className="text-ink/15 text-[10px] leading-tight mt-0.5">{flagHint}</p>}
                  </div>
                </div>
              );
            })}
            {exits.length === 0 && lockedExits.length === 0 && (
              <p className="text-ink/15 text-xs px-2 py-1 italic">无可前往之处</p>
            )}
          </div>
        </div>

        {/* 足迹 */}
        {visitedRoomNames.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.12))' }} />
              <p className="text-gold/22 text-[9px] tracking-[0.25em] shrink-0">足迹</p>
            </div>
            <ul className="space-y-0.5">
              {visitedRoomNames.map((r) => r && (
                <li key={r.id} className="text-[10px] text-ink/22 px-2 flex items-center gap-1.5">
                  <span style={{ color: ROOM_GLYPHS[r.id]?.color ?? 'rgba(201,168,76,0.15)', fontSize: '9px' }}>
                    {ROOM_GLYPHS[r.id]?.glyph ?? '·'}
                  </span>
                  <span>{r.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 底部装饰线 */}
      <div className="h-px mx-3 mb-3" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.12), transparent)' }} />
    </div>
  );
}
