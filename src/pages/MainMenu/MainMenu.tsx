import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { useSaveStore } from '../../store/saveStore';
import { loadFromSlot, loadAllSlots } from '../../engine/saveEngine';
import { getSeenEndings } from '../../engine/endingRecord';
import { MountainBackground } from '../../components/ui/MountainBackground';

// 繁星：固定位置，避免 SSR/水合差异
const STARS = [
  { x:  7, y:  5, r: 1.0, o: 0.55 }, { x: 13, y: 11, r: 0.7, o: 0.40 },
  { x: 19, y:  3, r: 1.2, o: 0.35 }, { x: 25, y:  8, r: 0.8, o: 0.50 },
  { x: 31, y: 14, r: 0.6, o: 0.30 }, { x: 37, y:  4, r: 1.0, o: 0.45 },
  { x: 43, y:  9, r: 0.7, o: 0.38 }, { x: 49, y:  2, r: 1.3, o: 0.28 },
  { x: 55, y: 13, r: 0.8, o: 0.42 }, { x: 60, y:  6, r: 0.6, o: 0.55 },
  { x: 66, y: 16, r: 1.0, o: 0.32 }, { x: 72, y:  4, r: 0.7, o: 0.48 },
  { x: 78, y: 10, r: 1.1, o: 0.36 }, { x: 83, y:  2, r: 0.6, o: 0.52 },
  { x: 89, y:  7, r: 0.9, o: 0.40 }, { x: 93, y: 15, r: 0.7, o: 0.30 },
  { x: 10, y: 20, r: 0.6, o: 0.25 }, { x: 22, y: 22, r: 0.8, o: 0.28 },
  { x: 35, y: 18, r: 0.7, o: 0.22 }, { x: 47, y: 24, r: 0.6, o: 0.20 },
  { x: 58, y: 19, r: 0.9, o: 0.26 }, { x: 70, y: 21, r: 0.6, o: 0.18 },
  { x: 81, y: 17, r: 0.8, o: 0.24 }, { x: 91, y: 23, r: 0.7, o: 0.22 },
];

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

export default function MainMenu() {
  const navigate = useNavigate();
  const player = usePlayerStore();
  const scene = useSceneStore();
  const { loadItems } = useInventoryStore();
  const { setSlots } = useSaveStore();

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
    });
    loadItems(data.inventory);
    setSlots(loadAllSlots());
    navigate('/game');
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-between relative overflow-hidden select-none"
      style={{ paddingTop: 'clamp(60px, 12vh, 110px)', paddingBottom: 'clamp(40px, 8vh, 70px)' }}>

      {/* ── 星空层 ── */}
      <svg
        className="fixed inset-0 w-full pointer-events-none"
        style={{ height: '55%', zIndex: 0 }}
        viewBox="0 0 100 30"
        preserveAspectRatio="xMidYMid slice"
      >
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.4} fill={`rgba(232,213,163,${s.o})`} />
        ))}
      </svg>

      {/* ── 月亮 ── */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: 'clamp(24px, 6vh, 56px)',
          right: 'clamp(48px, 10vw, 120px)',
          width: 'clamp(48px, 5vw, 72px)',
          height: 'clamp(48px, 5vw, 72px)',
          zIndex: 1,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 35%, rgba(240,222,170,0.90) 0%, rgba(220,190,110,0.55) 38%, rgba(201,168,76,0.12) 65%, transparent 80%)',
          boxShadow: '0 0 32px rgba(201,168,76,0.30), 0 0 70px rgba(201,168,76,0.12), 0 0 130px rgba(201,168,76,0.06)',
        }}
      />
      {/* 月晕 */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: 'clamp(8px, 3.5vh, 36px)',
          right: 'clamp(28px, 8vw, 96px)',
          width: 'clamp(88px, 9vw, 120px)',
          height: 'clamp(88px, 9vw, 120px)',
          zIndex: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)',
        }}
      />

      {/* ── 山水背景 ── */}
      <MountainBackground opacity={1} />

      {/* ── 漂浮粒子 ── */}
      {inkParticles.map((p, i) => (
        <span key={i} className="ink-particle" style={{
          left: p.left, bottom: `${10 + (i % 3) * 8}%`,
          width: p.size, height: p.size * 1.3,
          animationDelay: p.delay, animationDuration: p.duration, opacity: 0,
        }} />
      ))}

      {/* ── 标题区 ── */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* 年代题眉 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 sm:w-16 h-px bg-gold/25" />
          <span className="text-gold/40 text-[10px] sm:text-xs tracking-[0.45em]">大唐开元年间</span>
          <div className="w-10 sm:w-16 h-px bg-gold/25" />
        </div>

        {/* 主标题 */}
        <h1
          className="text-gold tracking-[0.35em] leading-none mb-1"
          style={{
            fontSize: 'clamp(2.8rem, 8vw, 5rem)',
            textShadow: '0 0 60px rgba(201,168,76,0.35), 0 0 20px rgba(201,168,76,0.18)',
          }}
        >
          天机残卷
        </h1>

        {/* 英文副标题 */}
        <p className="text-gold/22 text-[10px] tracking-[0.5em] mt-3 mb-1 uppercase">
          The Scroll of Heaven&apos;s Secret
        </p>

        {/* 分隔装饰 */}
        <div className="flex items-center gap-2 mt-3">
          <div className="w-6 h-px bg-gold/18" />
          <span className="text-gold/22 text-[8px]">✦</span>
          <div className="w-6 h-px bg-gold/18" />
        </div>
      </div>

      {/* ── 菜单区 ── */}
      <div className="relative z-10 flex flex-col items-center gap-3 w-full max-w-[240px] sm:max-w-xs">

        {/* 继续游戏（存档信息） */}
        {hasContinue && autoSave?.data && (
          <button
            onClick={handleContinue}
            className="w-full py-3 border border-gold/50 text-gold tracking-[0.25em] text-sm transition-all duration-200 cursor-pointer hover:bg-gold/5"
            style={{ boxShadow: '0 0 0 rgba(201,168,76,0)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px rgba(201,168,76,0.18)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 rgba(201,168,76,0)'; }}
          >
            继续游戏
            <span className="block text-[10px] text-gold/40 mt-0.5 tracking-widest">
              {autoSave.data.player.name} · {saveSubtitle}
            </span>
          </button>
        )}

        {/* 新游戏 */}
        <button
          onClick={() => navigate('/create')}
          className={`w-full py-3 border tracking-[0.3em] text-sm transition-all duration-200 cursor-pointer ${
            hasContinue
              ? 'border-gold/22 text-ink/50 hover:border-gold/40 hover:text-ink/75'
              : 'border-gold/50 text-gold hover:bg-gold/5'
          }`}
          style={!hasContinue ? { boxShadow: '0 0 0 rgba(201,168,76,0)' } : {}}
          onMouseEnter={(e) => { if (!hasContinue) (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px rgba(201,168,76,0.18)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 rgba(201,168,76,0)'; }}
        >
          新游戏
        </button>

        {/* 次级按钮行 */}
        <div className="flex gap-4 mt-1">
          {hasAnyEnding && (
            <button
              onClick={() => navigate('/endings')}
              className="text-ink/28 hover:text-ink/50 tracking-widest transition-all text-xs cursor-pointer py-1"
            >
              结局图鉴
            </button>
          )}
          <button
            onClick={() => navigate('/credits')}
            className="text-ink/28 hover:text-ink/50 tracking-widest transition-all text-xs cursor-pointer py-1"
          >
            关于
          </button>
        </div>
      </div>

      {/* ── 底部版本文字 ── */}
      <p className="absolute bottom-4 text-ink/12 text-[10px] tracking-[0.4em] z-10">
        三章完结
      </p>
    </div>
  );
}
