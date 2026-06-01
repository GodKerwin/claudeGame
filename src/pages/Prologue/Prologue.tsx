import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../store/playerStore';
import { getTemplate } from '../../data/loader';

const GENERIC_LINES = [
  '大唐开元二十三年，秋。',
  '长安城，往事客栈。',
  '你不过是一个过路人，却在某个寻常的夜晚，被命运钉在了这里。',
  '翌日清晨，邻室商人宋怀义死于密室之中——',
  '门扃窗闭，无迹可循，却留下一具冰凉的尸首，和满地未解的疑云。',
];

const LINE_DURATION = 2200;

export default function Prologue() {
  const navigate = useNavigate();
  const template = usePlayerStore((s) => s.template);
  const playerName = usePlayerStore((s) => s.name);

  const lines = useMemo(() => {
    const tpl = getTemplate(template);
    const extra = tpl?.prologueLines ?? [];
    return [...GENERIC_LINES, ...extra];
  }, [template]);

  const [visibleCount, setVisibleCount] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    if (skipped) {
      setVisibleCount(lines.length);
      setShowButton(true);
      return;
    }
    if (visibleCount < lines.length) {
      const t = setTimeout(() => setVisibleCount((c) => c + 1), visibleCount === 0 ? 400 : LINE_DURATION);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setShowButton(true), 1000);
      return () => clearTimeout(t);
    }
  }, [visibleCount, skipped, lines.length]);

  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const handleSkip = () => {
    setSkipped(true);
    setVisibleCount(lines.length);
    setShowButton(true);
  };

  const genericCount = GENERIC_LINES.length;

  return (
    <div
      className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center px-8 py-16 relative"
      onClick={!showButton ? handleSkip : undefined}
      style={{ cursor: !showButton ? 'pointer' : 'default' }}
    >
      {/* 背景：中央暗晕增加纵深感 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 50% 60% at 50% 50%, rgba(0,0,0,0.35) 0%, transparent 70%),
            radial-gradient(ellipse 70% 50% at 50% 50%, rgba(201,168,76,0.04) 0%, transparent 100%)
          `,
        }}
      />

      {/* 跳过提示 */}
      {showSkip && !showButton && (
        <button
          onClick={(e) => { e.stopPropagation(); handleSkip(); }}
          className="fixed top-5 right-6 text-[11px] text-ink/20 hover:text-ink/40 cursor-pointer tracking-[0.3em] transition-colors"
        >
          跳过
        </button>
      )}

      {/* 顶部装饰线 */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-px h-16 transition-opacity duration-1000"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(201,168,76,0.25))', opacity: visibleCount > 0 ? 1 : 0 }}
      />

      <div className="max-w-md w-full relative z-10 flex gap-6">
        {/* 左侧竖向装饰 */}
        <div
          className="shrink-0 flex flex-col items-center gap-1 transition-opacity duration-1000"
          style={{ opacity: visibleCount > 1 ? 1 : 0 }}
          aria-hidden
        >
          <div className="w-px flex-1 bg-gold/10" />
          <span
            className="text-gold/12 text-[9px] select-none"
            style={{ writingMode: 'vertical-rl', letterSpacing: '0.15em' }}
          >
            大唐开元
          </span>
          <div className="w-px flex-1 bg-gold/10" />
        </div>

        {/* 正文 */}
        <div className="flex-1">
          {playerName && visibleCount > 0 && (
            <p
              className="text-gold/25 text-[10px] tracking-[0.4em] text-center mb-8 transition-opacity duration-1000"
              style={{ opacity: visibleCount > 0 ? 1 : 0 }}
            >
              {playerName} 的故事
            </p>
          )}

          <div className="space-y-6">
            {lines.map((line, i) => (
              <p
                key={i}
                className={`leading-[2] transition-all duration-1000 ${
                  i < visibleCount ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                } ${
                  i >= genericCount
                    ? 'text-gold/65 text-sm border-l border-gold/25 pl-4 ml-2'
                    : i === 0 || i === 1
                    ? 'text-gold/50 text-sm tracking-widest text-center'
                    : 'text-ink/80 text-[15px]'
                }`}
                style={{ transitionDelay: `${i < visibleCount ? 0 : 100}ms` }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* 进入按钮 */}
          <div
            className={`mt-16 text-center transition-all duration-700 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-12 h-px bg-gold/25" />
              <span className="text-gold/30 text-[10px] tracking-widest">一切已定</span>
              <div className="w-12 h-px bg-gold/25" />
            </div>
            <button
              onClick={() => navigate('/game')}
              className={`btn-jianghu border border-gold/50 text-gold/80 px-12 py-2.5 text-sm tracking-[0.3em] transition-all duration-300 hover:border-gold hover:text-gold ${showButton ? 'cursor-pointer' : 'pointer-events-none'}`}
              style={{ boxShadow: '0 0 0 rgba(201,168,76,0)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px rgba(201,168,76,0.2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 rgba(201,168,76,0)'; }}
            >
              踏入江湖
            </button>
            <p className="mt-3 text-ink/15 text-[10px] tracking-widest">点击任意处可跳过</p>
          </div>
        </div>
      </div>

      {/* 底部装饰线 */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-px h-16 transition-opacity duration-1000"
        style={{ background: 'linear-gradient(to top, transparent, rgba(201,168,76,0.15))', opacity: visibleCount > 0 ? 1 : 0 }}
      />
    </div>
  );
}
