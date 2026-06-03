import { useMemo, useState, useEffect } from 'react';
import { useSceneStore } from '../../store/sceneStore';
import { MAPS } from '../../data/loader';
import { getAvailableExits } from '../../engine/mapEngine';
import { usePlayerStore } from '../../store/playerStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { evaluate } from '../../engine/conditionEvaluator';
import { CHAPTER_LAYOUTS, LOCK_MESSAGES } from '../../data/mapLayouts';
import type { EvalContext } from '../../engine/conditionEvaluator';

// NODE dimensions (viewBox units) — viewBox width = 220
const NW = 68;
const NH = 24;

interface Props {
  onNavigate: (roomId: string) => void;
}

export function LeftPanel({ onNavigate }: Props) {
  const { currentRoomId, flags, visitedRooms } = useSceneStore();
  const player = usePlayerStore();
  const { items } = useInventoryStore();
  const [lockMsg, setLockMsg] = useState<{ id: string; msg: string } | null>(null);

  // Auto-dismiss lock message
  useEffect(() => {
    if (!lockMsg) return;
    const t = setTimeout(() => setLockMsg(null), 1800);
    return () => clearTimeout(t);
  }, [lockMsg]);

  // Dismiss lock message on room change
  useEffect(() => { setLockMsg(null); }, [currentRoomId]);

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
  }), [player.name, player.template, player.strength, player.agility,
      player.wisdom, player.constitution, player.talent, items, flags]);

  // Find current chapter layout
  const currentMap = useMemo(
    () => MAPS.find((m) => m.rooms.some((r) => r.id === currentRoomId)),
    [currentRoomId]
  );
  const layout = currentMap ? CHAPTER_LAYOUTS[currentMap.id] : null;

  const visitedSet = useMemo(() => new Set(visitedRooms), [visitedRooms]);

  const currentRoom = useMemo(
    () => currentMap?.rooms.find((r) => r.id === currentRoomId),
    [currentMap, currentRoomId]
  );
  const availableExitIds = useMemo(() => {
    if (!currentRoom || !currentMap) return new Set<string>();
    return new Set(getAvailableExits(currentRoom, ctx, currentMap.rooms).map((r) => r.id));
  }, [currentRoom, currentMap, ctx]);

  // All locked rooms in the chapter (requires condition not met)
  const lockedRoomIds = useMemo(() => {
    if (!currentMap) return new Set<string>();
    return new Set(
      currentMap.rooms
        .filter((r) => r.requires && !evaluate(r.requires, ctx))
        .map((r) => r.id)
    );
  }, [currentMap, ctx]);

  const visitedInChapter = useMemo(() =>
    (currentMap?.rooms ?? [])
      .filter((r) => visitedSet.has(r.id) && r.id !== currentRoomId),
    [currentMap, visitedSet, currentRoomId]
  );

  if (!layout || !currentMap) {
    return (
      <div className="flex flex-col h-full p-3 text-xs text-ink/25 italic">
        <p>无地图数据</p>
      </div>
    );
  }

  const { nodes, edges, viewBoxHeight } = layout;

  const getNodeState = (id: string): 'current' | 'available' | 'visited' | 'locked' | 'other' => {
    if (id === currentRoomId) return 'current';
    if (lockedRoomIds.has(id)) return 'locked';
    if (availableExitIds.has(id)) return visitedSet.has(id) ? 'visited' : 'available';
    if (visitedSet.has(id)) return 'visited';
    return 'other';
  };

  const handleNodeClick = (id: string) => {
    if (id === currentRoomId) return;
    if (lockedRoomIds.has(id)) {
      const msg = LOCK_MESSAGES[id] ?? '暂时无法前往此处。';
      setLockMsg({ id, msg });
      return;
    }
    if (availableExitIds.has(id)) {
      onNavigate(id);
    }
  };

  return (
    <div className="flex flex-col h-full text-sm relative overflow-hidden">
      {/* 顶部装饰线 */}
      <div className="h-px mx-3 mt-3" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.2), transparent)' }} />

      <div className="flex flex-col h-full p-3 gap-3 overflow-y-auto scrollbar-thin">
        {/* 章节名 */}
        <p className="text-gold/30 text-[9px] tracking-[0.35em] px-1">
          {currentMap.name}
        </p>

        {/* SVG 节点地图 */}
        <div className="relative">
          <svg
            width="100%"
            viewBox={`0 0 220 ${viewBoxHeight}`}
            style={{ overflow: 'visible' }}
          >
            {/* ClipPaths for node labels */}
            <defs>
              {nodes.map((node) => (
                <clipPath key={`clip-${node.id}`} id={`clip-${node.id}`}>
                  <rect
                    x={node.cx - NW / 2 + 2}
                    y={node.cy - NH / 2 + 1}
                    width={NW - 4}
                    height={NH - 2}
                  />
                </clipPath>
              ))}
            </defs>

            {/* Edges */}
            {edges.map((e) => {
              const fromNode = nodes.find((n) => n.id === e.from);
              const toNode   = nodes.find((n) => n.id === e.to);
              if (!fromNode || !toNode) return null;
              const toLocked = lockedRoomIds.has(e.to) || lockedRoomIds.has(e.from);
              return (
                <line
                  key={`${e.from}-${e.to}`}
                  x1={fromNode.cx} y1={fromNode.cy}
                  x2={toNode.cx}   y2={toNode.cy}
                  stroke={toLocked ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.22)'}
                  strokeWidth="1"
                  strokeDasharray={toLocked ? '3,3' : undefined}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const state = getNodeState(node.id);
              const isClickable = state === 'available' || state === 'visited' || state === 'locked';
              const isLocked    = state === 'locked';
              const isCurrent   = state === 'current';
              const isVisited   = state === 'visited';
              const isShowingMsg = lockMsg?.id === node.id;

              const stroke = isCurrent
                ? 'rgba(201,168,76,0.70)'
                : isLocked
                  ? 'rgba(255,255,255,0.12)'
                  : isVisited
                    ? 'rgba(201,168,76,0.22)'
                    : 'rgba(201,168,76,0.38)';

              const fill = isCurrent
                ? 'rgba(201,168,76,0.14)'
                : isLocked
                  ? 'rgba(10,6,2,0.60)'
                  : 'rgba(14,9,3,0.70)';

              const textFill = isCurrent
                ? 'rgba(201,168,76,0.95)'
                : isLocked
                  ? 'rgba(255,255,255,0.18)'
                  : isVisited
                    ? 'rgba(230,210,150,0.45)'
                    : 'rgba(230,210,150,0.80)';

              return (
                <g
                  key={node.id}
                  style={{ cursor: isClickable ? (isLocked ? 'not-allowed' : 'pointer') : 'default' }}
                  onClick={() => handleNodeClick(node.id)}
                >
                  <rect
                    x={node.cx - NW / 2}
                    y={node.cy - NH / 2}
                    width={NW}
                    height={NH}
                    rx="2"
                    fill={fill}
                    stroke={isShowingMsg ? 'rgba(139,26,26,0.6)' : stroke}
                    strokeWidth={isCurrent ? 1.5 : 1}
                    strokeDasharray={isLocked ? '3,2' : undefined}
                  />
                  {isCurrent && (
                    <rect
                      x={node.cx - NW / 2 + 1}
                      y={node.cy - NH / 2 + 1}
                      width={NW - 2}
                      height={NH - 2}
                      rx="1.5"
                      fill="none"
                      stroke="rgba(201,168,76,0.20)"
                      strokeWidth="0.5"
                    />
                  )}
                  <g clipPath={`url(#clip-${node.id})`}>
                    <text
                      x={node.cx}
                      y={node.cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={textFill}
                      fontSize="9"
                      fontFamily="serif"
                    >
                      {isCurrent ? `● ${node.label}` : isVisited ? `${node.label} ·` : node.label}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* 锁定文案浮层 */}
          {lockMsg && (() => {
            const node = nodes.find((n) => n.id === lockMsg.id);
            if (!node) return null;
            const pctX = (node.cx / 220) * 100;
            const pctY = Math.min(((node.cy + NH / 2 + 4) / viewBoxHeight) * 100, 85);
            return (
              <div
                className="absolute z-10 max-w-[130px] px-2 py-1.5 text-[10px] italic text-ink/60 border border-gold/20 leading-snug"
                style={{
                  left: `${Math.min(Math.max(pctX, 10), 70)}%`,
                  top: `${pctY}%`,
                  transform: 'translateX(-50%)',
                  background: 'rgba(14,9,3,0.94)',
                  pointerEvents: 'none',
                }}
              >
                {lockMsg.msg}
              </div>
            );
          })()}
        </div>

        {/* 足迹（已访问的本章其他房间） */}
        {visitedInChapter.length > 0 && (
          <div className="mt-1">
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.12))' }} />
              <p className="text-gold/22 text-[9px] tracking-[0.25em] shrink-0">足迹</p>
            </div>
            <ul className="space-y-0.5">
              {visitedInChapter.map((r) => (
                <li key={r.id} className="text-[10px] text-ink/22 px-2 flex items-center gap-1.5">
                  <span className="text-[8px] text-gold/20">·</span>
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
