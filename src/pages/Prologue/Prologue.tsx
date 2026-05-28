import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PROLOGUE_LINES = [
  '大唐开元二十三年，秋。',
  '长安城，往事客栈。',
  '你本只是路过此地，却在一个普通的夜晚被命运留了下来。',
  '清晨，隔壁房间的商人宋怀义死在了密室之中——',
  '门窗俱锁，无人进出，却留下了一具冰冷的尸体。',
  '驿卒未至，官府难查。',
  '这一天，解开谜题的人，只能是你。',
];

const LINE_DURATION = 2000;

export default function Prologue() {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(0);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (visibleCount < PROLOGUE_LINES.length) {
      const t = setTimeout(() => setVisibleCount((c) => c + 1), visibleCount === 0 ? 300 : LINE_DURATION);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setShowButton(true), 800);
      return () => clearTimeout(t);
    }
  }, [visibleCount]);

  return (
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center p-12">
      <div className="max-w-xl w-full space-y-5">
        {PROLOGUE_LINES.map((line, i) => (
          <p
            key={i}
            className={`leading-loose text-base transition-opacity duration-1000 ${i < visibleCount ? 'opacity-80' : 'opacity-0'}`}
          >
            {line}
          </p>
        ))}

        <div className={`pt-8 text-center transition-opacity duration-700 ${showButton ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => navigate('/game')}
            className={`border border-gold text-gold px-8 py-2 text-sm tracking-widest hover:shadow-[0_0_16px_rgba(201,168,76,0.4)] transition-all ${showButton ? 'cursor-pointer' : 'pointer-events-none'}`}
          >
            踏入江湖
          </button>
        </div>
      </div>
    </div>
  );
}
