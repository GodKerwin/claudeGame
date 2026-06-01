import { useEffect, useState } from 'react';

interface Props {
  chapter: 1 | 2 | 3;
  onDone: () => void;
}

const CHAPTER_INFO: Record<number, { num: string; title: string; sub: string }> = {
  1: { num: '壹', title: '往事客栈', sub: '一人死于密室，真相藏于每一道门缝之后' },
  2: { num: '贰', title: '东市追查', sub: '浪鹏帮、天机阁、一张牵动长安的隐秘之网' },
  3: { num: '鸢归何处', title: '鸢归何处', sub: '名单、旧主与无法忘却的誓言' },
};

export function ChapterIntro({ chapter, onDone }: Props) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const info = CHAPTER_INFO[chapter];

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 600);
    const t2 = setTimeout(() => setPhase('out'), 2400);
    const t3 = setTimeout(() => onDone(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const baseOpacity = phase === 'out' ? 'opacity-0' : phase === 'hold' ? 'opacity-100' : 'opacity-0';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-paper transition-opacity duration-700 ${baseOpacity}`}
      style={{ pointerEvents: phase === 'out' ? 'none' : 'auto' }}
      onClick={() => { setPhase('out'); setTimeout(onDone, 700); }}
    >
      {/* 水墨晕染背景 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <InkSplash />
      </div>

      <div className={`relative z-10 text-center transition-all duration-700 ${phase === 'in' ? 'translate-y-3 opacity-0' : phase === 'out' ? '-translate-y-3 opacity-0' : 'translate-y-0 opacity-100'}`}>
        {/* 章节小字 */}
        <p className="text-gold/40 text-xs tracking-[0.5em] mb-4">第{info.num}章</p>

        {/* 主标题 */}
        <div className="relative inline-block">
          {/* 左右装饰横线 */}
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-px bg-gold/25" />
            <h1
              className="text-gold/90 tracking-[0.25em]"
              style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', textShadow: '0 0 40px rgba(201,168,76,0.5)' }}
            >
              {chapter === 3 ? info.title : `往事客栈 · 东市追查 · 鸢归何处`.split(' · ')[chapter - 1]}
            </h1>
            <div className="w-12 h-px bg-gold/25" />
          </div>
        </div>

        {/* 章节副标题 */}
        <p className="text-ink/45 text-[13px] tracking-[0.15em] mt-3 max-w-xs mx-auto leading-relaxed">{info.sub}</p>

        {/* 小提示 */}
        <p className="text-ink/18 text-[11px] tracking-widest mt-8">点击跳过</p>
      </div>
    </div>
  );
}

function InkSplash() {
  return (
    <svg
      viewBox="0 0 800 600"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0 }}
    >
      <defs>
        <radialGradient id="ink-center" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(201,168,76,0.07)" />
          <stop offset="60%" stopColor="rgba(201,168,76,0.03)" />
          <stop offset="100%" stopColor="rgba(201,168,76,0)" />
        </radialGradient>
        <radialGradient id="ink-top" cx="30%" cy="20%" r="40%">
          <stop offset="0%" stopColor="rgba(201,168,76,0.05)" />
          <stop offset="100%" stopColor="rgba(201,168,76,0)" />
        </radialGradient>
        <radialGradient id="ink-bot" cx="70%" cy="80%" r="40%">
          <stop offset="0%" stopColor="rgba(201,168,76,0.04)" />
          <stop offset="100%" stopColor="rgba(201,168,76,0)" />
        </radialGradient>
        <style>{`
          @keyframes inkFloat {
            0%, 100% { transform: scale(1) translate(0,0); }
            33% { transform: scale(1.06) translate(4px,-6px); }
            66% { transform: scale(0.97) translate(-3px,5px); }
          }
          .ink-anim { animation: inkFloat 8s ease-in-out infinite; transform-origin: center; }
        `}</style>
      </defs>
      <ellipse className="ink-anim" cx="400" cy="300" rx="380" ry="280" fill="url(#ink-center)" style={{ animationDelay: '0s' }} />
      <ellipse className="ink-anim" cx="240" cy="160" rx="260" ry="200" fill="url(#ink-top)" style={{ animationDelay: '-2.5s' }} />
      <ellipse className="ink-anim" cx="560" cy="440" rx="240" ry="180" fill="url(#ink-bot)" style={{ animationDelay: '-5s' }} />
    </svg>
  );
}
