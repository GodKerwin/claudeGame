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

const LINE_DURATION = 2000;

export default function Prologue() {
  const navigate = useNavigate();
  const template = usePlayerStore((s) => s.template);

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
      const t = setTimeout(() => setVisibleCount((c) => c + 1), visibleCount === 0 ? 300 : LINE_DURATION);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setShowButton(true), 800);
      return () => clearTimeout(t);
    }
  }, [visibleCount, skipped, lines.length]);

  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const handleSkip = () => {
    setSkipped(true);
    setVisibleCount(lines.length);
    setShowButton(true);
  };

  const genericCount = GENERIC_LINES.length;

  return (
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center p-12">
      {showSkip && !showButton && (
        <button
          onClick={handleSkip}
          className="fixed top-4 right-6 text-xs text-ink/20 hover:text-ink/40 cursor-pointer tracking-widest"
        >
          跳过
        </button>
      )}
      <div className="max-w-xl w-full space-y-5">
        {lines.map((line, i) => (
          <p
            key={i}
            className={`leading-loose transition-opacity duration-1000 ${
              i < visibleCount ? 'opacity-80' : 'opacity-0'
            } ${
              i >= genericCount
                ? 'text-gold/70 text-sm border-l border-gold/30 pl-3'
                : 'text-base'
            }`}
          >
            {line}
          </p>
        ))}

        <div className={`pt-8 text-center transition-opacity duration-700 ${showButton ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => navigate('/game')}
            className={`border border-gold text-gold px-8 py-2 text-sm tracking-widest hover:shadow-[0_0_16px_rgba(201,168,76,0.4)] transition-shadow ${showButton ? 'cursor-pointer' : 'pointer-events-none'}`}
          >
            踏入江湖
          </button>
        </div>
      </div>
    </div>
  );
}
