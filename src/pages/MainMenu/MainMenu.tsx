import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { useSaveStore } from '../../store/saveStore';
import { loadFromSlot, loadAllSlots } from '../../engine/saveEngine';
import { getSeenEndings } from '../../engine/endingRecord';
import { MountainBackground } from '../../components/ui/MountainBackground';

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

/** 远景楼阁剪影 + 飞檐 SVG */
function PavilionSilhouette() {
  return (
    <svg
      viewBox="0 0 320 200"
      className="fixed pointer-events-none"
      style={{ bottom: '28%', left: '3%', width: 'clamp(140px, 20vw, 260px)', opacity: 0.18, zIndex: 1 }}
      fill="rgba(201,168,76,0.6)"
    >
      {/* 塔身三层 */}
      <rect x="120" y="140" width="80" height="55" />
      <rect x="108" y="100" width="104" height="48" />
      <rect x="96"  y="62"  width="128" height="46" />
      {/* 飞檐 */}
      <polygon points="86,100  160,82  234,100  244,106  234,104  160,86  86,104" />
      <polygon points="98,140  160,122  222,140  230,145  222,143  160,126  98,143" />
      <polygon points="76,62   160,40   244,62   256,68   244,66   160,44   76,66" />
      {/* 屋顶尖 */}
      <polygon points="160,22 148,64 172,64" />
      {/* 窗格 */}
      <rect x="148" y="108" width="24" height="28" opacity="0.4" />
      <rect x="148" y="148" width="24" height="40" opacity="0.35" />
    </svg>
  );
}

/** 左侧松枝剪影 */
function PineBranches() {
  return (
    <svg
      viewBox="0 0 120 280"
      className="fixed pointer-events-none"
      style={{ bottom: '20%', left: 0, width: 'clamp(60px, 8vw, 110px)', opacity: 0.20, zIndex: 2 }}
      fill="rgba(201,168,76,0.5)"
    >
      <path d="M20,280 L30,180 C35,140 15,110 10,80 C20,90 40,95 50,82 C42,100 30,120 38,145 C48,120 65,108 72,90 C62,112 55,135 62,155 C70,135 85,118 90,100 C78,128 72,152 78,175 L60,280 Z" />
      {/* 松针团 */}
      <ellipse cx="12" cy="75" rx="22" ry="12" transform="rotate(-30 12 75)" />
      <ellipse cx="52" cy="80" rx="26" ry="11" transform="rotate(15 52 80)" />
      <ellipse cx="74" cy="88" rx="20" ry="10" transform="rotate(25 74 88)" />
    </svg>
  );
}

/** 右侧悬挂红灯笼 */
function Lanterns() {
  return (
    <svg
      viewBox="0 0 80 180"
      className="fixed pointer-events-none"
      style={{ top: '8%', right: 'clamp(20px, 4vw, 60px)', width: 'clamp(36px, 4vw, 60px)', zIndex: 2 }}
    >
      <defs>
        <radialGradient id="lg1" cx="50%" cy="45%">
          <stop offset="0%"  stopColor="rgba(180,40,20,0.75)" />
          <stop offset="70%" stopColor="rgba(120,20,10,0.55)" />
          <stop offset="100%" stopColor="rgba(60,10,5,0)" />
        </radialGradient>
        <radialGradient id="lg2" cx="50%" cy="45%">
          <stop offset="0%"  stopColor="rgba(180,40,20,0.60)" />
          <stop offset="100%" stopColor="rgba(60,10,5,0)" />
        </radialGradient>
      </defs>
      {/* 绳 */}
      <line x1="40" y1="0" x2="40" y2="16" stroke="rgba(201,168,76,0.30)" strokeWidth="1" />
      {/* 灯笼一 */}
      <ellipse cx="40" cy="42" rx="16" ry="22" fill="url(#lg1)" />
      <rect x="37" y="16" width="6" height="6" rx="1" fill="rgba(180,40,20,0.50)" />
      <rect x="37" y="62" width="6" height="5" rx="1" fill="rgba(180,40,20,0.45)" />
      <line x1="40" y1="67" x2="40" y2="76" stroke="rgba(201,168,76,0.25)" strokeWidth="1" />
      {/* 穗 */}
      {[36,38,40,42,44].map((x, i) => (
        <line key={i} x1={x} y1="76" x2={x - 1 + i * 0.5} y2="92" stroke="rgba(180,40,20,0.35)" strokeWidth="0.8" />
      ))}
      {/* 绳 */}
      <line x1="40" y1="95" x2="40" y2="108" stroke="rgba(201,168,76,0.22)" strokeWidth="1" />
      {/* 灯笼二（稍小） */}
      <ellipse cx="40" cy="128" rx="13" ry="18" fill="url(#lg2)" />
      <rect x="37.5" y="108" width="5" height="5" rx="1" fill="rgba(180,40,20,0.40)" />
      <rect x="37.5" y="146" width="5" height="4" rx="1" fill="rgba(180,40,20,0.35)" />
      {/* 穗 */}
      {[37,39,41,43].map((x, i) => (
        <line key={i} x1={x} y1="150" x2={x - 0.5 + i * 0.4} y2="162" stroke="rgba(180,40,20,0.28)" strokeWidth="0.7" />
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
      style={{ paddingTop: 'clamp(56px, 11vh, 100px)', paddingBottom: 'clamp(36px, 7vh, 64px)' }}>

      {/* 山水 */}
      <MountainBackground opacity={1} />

      {/* 楼阁 · 松枝 · 灯笼 */}
      <PavilionSilhouette />
      <PineBranches />
      <Lanterns />

      {/* 漂浮墨粒 */}
      {inkParticles.map((p, i) => (
        <span key={i} className="ink-particle" style={{
          left: p.left, bottom: `${10 + (i % 3) * 8}%`,
          width: p.size, height: p.size * 1.3,
          animationDelay: p.delay, animationDuration: p.duration, opacity: 0,
        }} />
      ))}

      {/* ── 标题区 ── */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* 题眉 */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 sm:w-14 h-px bg-gold/28" />
          <span className="text-gold/45 text-[10px] tracking-[0.45em]">大唐开元年间</span>
          <div className="w-8 sm:w-14 h-px bg-gold/28" />
        </div>

        {/* 主标题 */}
        <h1
          className="text-gold leading-none tracking-[0.35em]"
          style={{
            fontSize: 'clamp(2.8rem, 8vw, 5rem)',
            textShadow: '0 0 50px rgba(201,168,76,0.30), 0 0 15px rgba(201,168,76,0.15)',
          }}
        >
          天机残卷
        </h1>

        {/* 对联式副题 */}
        <p className="text-ink/30 text-xs tracking-[0.3em] mt-3">往事客栈·一夜风雨·三章奇局</p>

        {/* 下横线 */}
        <div className="flex items-center gap-2 mt-4">
          <div className="w-12 h-px bg-gold/18" />
          <span className="text-gold/20 text-[8px] tracking-[0.3em]">推理文字游戏</span>
          <div className="w-12 h-px bg-gold/18" />
        </div>
      </div>

      {/* ── 菜单区 ── */}
      <div className="relative z-10 flex flex-col items-center gap-3 w-full max-w-[240px] sm:max-w-[280px]">

        {hasContinue && autoSave?.data && (
          <button
            onClick={handleContinue}
            className="w-full py-3 border border-gold/50 text-gold text-sm tracking-[0.25em] transition-all duration-200 cursor-pointer hover:bg-gold/5"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px rgba(201,168,76,0.18)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
          >
            继续游戏
            <span className="block text-[10px] text-gold/40 mt-0.5 tracking-widest">
              {autoSave.data.player.name} · {saveSubtitle}
            </span>
          </button>
        )}

        <button
          onClick={() => navigate('/create')}
          className={`w-full py-3 border text-sm tracking-[0.3em] transition-all duration-200 cursor-pointer ${
            hasContinue
              ? 'border-gold/22 text-ink/50 hover:border-gold/40 hover:text-ink/75'
              : 'border-gold/50 text-gold hover:bg-gold/5'
          }`}
          onMouseEnter={(e) => { if (!hasContinue) (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px rgba(201,168,76,0.18)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
        >
          新游戏
        </button>

        <div className="flex gap-5 mt-1">
          {hasAnyEnding && (
            <button onClick={() => navigate('/endings')}
              className="text-ink/28 hover:text-ink/52 tracking-widest transition-all text-xs cursor-pointer py-1">
              结局图鉴
            </button>
          )}
          <button onClick={() => navigate('/credits')}
            className="text-ink/28 hover:text-ink/52 tracking-widest transition-all text-xs cursor-pointer py-1">
            关于
          </button>
        </div>
      </div>

      <p className="absolute bottom-4 text-ink/12 text-[10px] tracking-[0.4em] z-10">三章完结</p>
    </div>
  );
}
