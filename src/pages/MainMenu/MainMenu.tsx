import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { useSaveStore } from '../../store/saveStore';
import { loadFromSlot, loadAllSlots } from '../../engine/saveEngine';
import { getSeenEndings } from '../../engine/endingRecord';
import { MountainBackground } from '../../components/ui/MountainBackground';
import { audioEngine } from '../../engine/audioEngine';

const inkParticles = [
  { left: '12%', size: 5, delay: '0s',   duration: '9s'  },
  { left: '28%', size: 3, delay: '2.4s', duration: '12s' },
  { left: '45%', size: 4, delay: '5.1s', duration: '10s' },
  { left: '61%', size: 6, delay: '1.2s', duration: '14s' },
  { left: '74%', size: 3, delay: '7.3s', duration: '11s' },
  { left: '87%', size: 5, delay: '3.8s', duration: '8s'  },
  { left: '21%', size: 4, delay: '9.0s', duration: '13s' },
  { left: '55%', size: 3, delay: '6.6s', duration: '9.5s'},
];

/** 淡月轮 */
function InkMoon() {
  return (
    <svg
      className="fixed pointer-events-none"
      viewBox="0 0 140 140"
      style={{ top: '6%', right: '7%', width: 'clamp(88px, 13vw, 155px)', zIndex: 1 }}
    >
      <circle cx="70" cy="70" r="62" fill="rgba(201,168,76,0.032)" stroke="rgba(201,168,76,0.13)" strokeWidth="1" />
      <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(201,168,76,0.06)" strokeWidth="0.6" />
      <circle cx="70" cy="70" r="44" fill="none" stroke="rgba(201,168,76,0.04)" strokeWidth="0.4" />
    </svg>
  );
}

/** 大雁群 —— 远近错落 */
function FlyingGeese() {
  const birds = [
    { x: 120, y: 70,  w: 14, op: 0.22 },
    { x: 240, y: 50,  w: 11, op: 0.17 },
    { x: 335, y: 82,  w:  9, op: 0.14 },
    { x: 510, y: 42,  w: 13, op: 0.20 },
    { x: 648, y: 68,  w: 10, op: 0.16 },
    { x: 788, y: 34,  w:  8, op: 0.13 },
    { x: 900, y: 58,  w:  9, op: 0.15 },
    { x: 968, y: 80,  w:  6, op: 0.11 },
  ];
  return (
    <svg
      className="fixed pointer-events-none"
      viewBox="0 0 1060 140"
      style={{ top: 0, left: 0, width: '100%', height: '38vh', zIndex: 1 }}
      preserveAspectRatio="xMidYMid meet"
    >
      {birds.map(({ x, y, w, op }, i) => (
        <path
          key={i}
          d={`M${x},${y} Q${x - w * 0.52},${y - w * 0.42} ${x - w},${y - w * 0.07}
              M${x},${y} Q${x + w * 0.52},${y - w * 0.42} ${x + w},${y - w * 0.07}`}
          stroke="rgba(201,168,76,1)"
          strokeWidth={w * 0.14}
          fill="none"
          strokeLinecap="round"
          opacity={op}
        />
      ))}
    </svg>
  );
}

export default function MainMenu() {
  const navigate = useNavigate();
  const player = usePlayerStore();
  const scene = useSceneStore();
  const { loadItems } = useInventoryStore();
  const { setSlots } = useSaveStore();

  // 首次用户交互后启动 BGM（浏览器策略要求）
  useEffect(() => {
    const start = () => audioEngine.startBGM();
    document.addEventListener('click', start, { once: true });
    return () => document.removeEventListener('click', start);
  }, []);

  const slots = loadAllSlots();
  const autoSave = slots.find((s) => s.id === 0);
  const hasContinue = !!autoSave?.data;
  const hasAnyEnding = getSeenEndings().length > 0;

  const saveSubtitle = (() => {
    const f: string[] = autoSave?.data?.flags ?? [];
    if (f.includes('chapter3_started')) return '第三章·鸢归何处';
    if (f.includes('chapter2_started')) return '第二章·东市风云';
    return '第一章·长安往事';
  })();

  const handleContinue = () => {
    const data = loadFromSlot(0);
    if (!data) return;
    player.setPlayer(data.player);
    scene.loadState({
      currentRoomId: data.currentRoomId,
      flags: data.flags ?? [],
      clues: data.clues ?? [],
      questLog: data.questLog ?? [],
      storyText: (data.storyText ?? []).slice(-20),
      seenDialogues: data.seenDialogues ?? [],
      visitedRooms: data.visitedRooms ?? [data.currentRoomId],
      timeOfDay: data.timeOfDay ?? 'morning',
    });
    loadItems(data.inventory);
    setSlots(loadAllSlots());
    navigate('/game');
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center relative overflow-hidden select-none">

      <MountainBackground opacity={1} />
      <InkMoon />
      <FlyingGeese />

      {inkParticles.map((p, i) => (
        <span key={i} className="ink-particle" style={{
          left: p.left, bottom: `${10 + (i % 3) * 8}%`,
          width: p.size, height: p.size * 1.3,
          animationDelay: p.delay, animationDuration: p.duration, opacity: 0,
        }} />
      ))}

      {/* ── 主内容：标题 + 菜单合为一块，整体居中偏上 ── */}
      <div className="relative z-10 flex flex-col items-center text-center w-full"
        style={{ marginTop: 'clamp(56px, 12vh, 108px)' }}>

        {/* 题眉 */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 sm:w-14 h-px bg-gold/28" />
          <span className="text-gold/45 text-[10px] tracking-[0.45em]">大唐开元年间</span>
          <div className="w-8 sm:w-14 h-px bg-gold/28" />
        </div>

        {/* 主标题 */}
        <div className="flex items-end gap-2 sm:gap-3 my-2" style={{ lineHeight: 1 }}>
          {[
            { char: '天', dy: -14, rot: -2.2, delay: '0s',    size: 'clamp(2.6rem, 8.5vw, 4.5rem)' },
            { char: '机', dy:  10, rot:  1.5, delay: '0.32s', size: 'clamp(2.3rem, 7.5vw, 4.0rem)' },
            { char: '残', dy:  -6, rot: -1.0, delay: '0.64s', size: 'clamp(2.7rem, 9vw,   4.7rem)' },
            { char: '卷', dy:  16, rot:  2.0, delay: '0.96s', size: 'clamp(2.2rem, 7.2vw, 3.8rem)' },
          ].map(({ char, dy, rot, delay, size }) => (
            <span key={char} className="ink-reveal" style={{
              fontFamily: "'Ma Shan Zheng', '华文行楷', 'STXingkai', '霞鹜文楷', serif",
              fontSize: size, color: 'rgba(201,168,76,0.90)', lineHeight: 1,
              display: 'inline-block',
              transform: `translateY(${dy}px) rotate(${rot}deg)`,
              animationDelay: delay,
              textShadow: '0 0 55px rgba(201,168,76,0.55), 0 0 20px rgba(201,168,76,0.28), 2px 5px 16px rgba(0,0,0,0.97)',
            }}>
              {char}
            </span>
          ))}
        </div>

        {/* 副题 */}
        <p className="text-ink/28 text-xs tracking-[0.32em] mt-4">
          往事客栈 · 一夜风雨 · 三章奇局
        </p>

        {/* 推理文字游戏 */}
        <div className="flex items-center gap-2 mt-3">
          <div className="w-10 h-px bg-gold/15" />
          <span className="text-gold/18 text-[8px] tracking-[0.35em]">推理文字游戏</span>
          <div className="w-10 h-px bg-gold/15" />
        </div>

        {/* 标题与菜单之间的分隔 */}
        <div className="flex items-center gap-4 mt-9 mb-7" style={{ width: '180px' }}>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.18))' }} />
          <span style={{ color: 'rgba(201,168,76,0.22)', fontSize: '8px', letterSpacing: '0.3em' }}>◈</span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.18))' }} />
        </div>

        {/* ── 菜单按钮 —— 延迟淡入 ── */}
        <div className="flex flex-col items-center w-full max-w-[240px]"
          style={{ animation: 'fade-up 0.7s ease-out 1.1s both' }}>

          {/* 续翻残卷 */}
          {hasContinue && autoSave?.data && (
            <button onClick={handleContinue}
              className="group flex flex-col items-center mb-7 cursor-pointer">
              <span className="text-breathe text-sm tracking-[0.42em] mb-2 transition-colors duration-200"
                style={{ color: 'rgba(201,168,76,0.90)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#c9a84c')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(201,168,76,0.90)')}>
                续翻残卷
              </span>
              <span className="block h-px origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                style={{ width: '5rem', background: 'rgba(201,168,76,0.40)' }} />
              <span className="text-[10px] tracking-[0.25em] mt-2"
                style={{ color: 'rgba(232,213,163,0.24)' }}>
                {autoSave.data.player.name} · {saveSubtitle}
              </span>
            </button>
          )}

          {/* 执笔入局 */}
          <button onClick={() => navigate('/create')}
            className="group flex flex-col items-center mb-9 cursor-pointer">
            <span className="text-sm tracking-[0.42em] mb-2 transition-colors duration-200"
              style={{ color: hasContinue ? 'rgba(232,213,163,0.35)' : 'rgba(201,168,76,0.90)' }}
              onMouseEnter={e => (e.currentTarget.style.color = hasContinue ? 'rgba(232,213,163,0.62)' : '#c9a84c')}
              onMouseLeave={e => (e.currentTarget.style.color = hasContinue ? 'rgba(232,213,163,0.35)' : 'rgba(201,168,76,0.90)')}>
              执笔入局
            </span>
            <span className="block h-px origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
              style={{ width: '4rem', background: hasContinue ? 'rgba(232,213,163,0.20)' : 'rgba(201,168,76,0.40)' }} />
          </button>

          {/* 次级菜单 */}
          <div className="flex items-center gap-4">
            {hasAnyEnding && (
              <>
                <button onClick={() => navigate('/endings')}
                  className="text-[11px] tracking-[0.38em] cursor-pointer transition-colors duration-200"
                  style={{ color: 'rgba(232,213,163,0.20)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(232,213,163,0.46)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,213,163,0.20)')}>
                  天机图录
                </button>
                <span style={{ color: 'rgba(201,168,76,0.14)', fontSize: '7px' }}>·</span>
              </>
            )}
            <button onClick={() => navigate('/credits')}
              className="text-[11px] tracking-[0.38em] cursor-pointer transition-colors duration-200"
              style={{ color: 'rgba(232,213,163,0.20)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(232,213,163,0.46)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,213,163,0.20)')}>
              题记
            </button>
          </div>

        </div>
      </div>

      <p className="absolute bottom-4 text-ink/12 text-[10px] tracking-[0.4em] z-10">三章完结</p>
    </div>
  );
}
