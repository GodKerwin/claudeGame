import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { getItem } from '../../data/loader';

const CHAPTER1_ENDINGS: Record<string, string> = {
  chapter1_truth_ending: '你以智慧解开了这道局，真相已在掌中。但棋局远未终止。',
  chapter1_force_ending: '你以力破局，真相却仍藏于刀锋之后。长安城，还有更深的秘密等着你。',
  chapter1_hermit_ending: '你选择了另一条路，却发现路的尽头仍是同一扇门。',
};

const CHAPTER2_ENDINGS: Record<string, string> = {
  chapter2_arrest_ending: '铁证如山，李邈被捕。然而「鸢」这个名字，仍悬而未决。',
  chapter2_release_ending: '真相只得一半，而那个知道另一半的人，已经消失在长安的人海里。',
  chapter2_join_ending: '你踏入了那张网。是猎人，还是猎物，此刻还说不清。',
};

export default function ChapterEnd() {
  const navigate = useNavigate();
  const scene = useSceneStore();
  const { items } = useInventoryStore();
  const [visibleCount, setVisibleCount] = useState(0);
  const [showButton, setShowButton] = useState(false);

  const isChapter2 = scene.flags.includes('chapter2_started');
  const endingFlag = isChapter2
    ? Object.keys(CHAPTER2_ENDINGS).find((f) => scene.flags.includes(f))
    : Object.keys(CHAPTER1_ENDINGS).find((f) => scene.flags.includes(f));

  const endingText = endingFlag
    ? (isChapter2 ? CHAPTER2_ENDINGS[endingFlag] : CHAPTER1_ENDINGS[endingFlag])
    : '';

  const chapterTitle = isChapter2 ? '第二章·完' : '第一章·完';

  const clueItems = isChapter2
    ? []
    : items.flatMap((id) => { const item = getItem(id); return item?.isClue ? [item] : []; });

  const lines = useMemo(
    () =>
      [
        chapterTitle,
        endingText,
        ...(clueItems.length > 0 ? ['【你所掌握的线索】'] : []),
        ...clueItems.map((item) => `· ${item.name}`),
      ].filter(Boolean),
    [chapterTitle, endingText, clueItems]
  );

  useEffect(() => {
    if (visibleCount < lines.length) {
      const t = setTimeout(() => setVisibleCount((c) => c + 1), visibleCount === 0 ? 300 : 1800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShowButton(true), 600);
    return () => clearTimeout(t);
  }, [visibleCount, lines.length]);

  const handleContinue = () => {
    if (isChapter2) {
      navigate('/');
    } else {
      scene.addFlag('chapter2_started');
      scene.setRoom('east_market_entrance');
      navigate('/game');
    }
  };

  const buttonLabel = isChapter2 ? '回到主菜单' : '踏入第二章';

  return (
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center p-12">
      <div className="max-w-xl w-full space-y-5">
        {lines.map((line, i) => (
          <p
            key={i}
            className={`leading-loose transition-opacity duration-1000 ${
              i === 0
                ? 'text-gold text-2xl tracking-widest text-center'
                : line.startsWith('【')
                ? 'text-gold/60 text-xs tracking-widest mt-6'
                : line.startsWith('·')
                ? 'text-ink/60 text-sm pl-2'
                : 'text-base text-ink/80'
            } ${i < visibleCount ? 'opacity-100' : 'opacity-0'}`}
          >
            {line}
          </p>
        ))}
        <div
          className={`pt-8 text-center transition-opacity duration-700 ${
            showButton ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={handleContinue}
            className={`border border-gold text-gold px-8 py-2 text-sm tracking-widest hover:shadow-[0_0_16px_rgba(201,168,76,0.4)] transition-all ${
              showButton ? 'cursor-pointer' : 'pointer-events-none'
            }`}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
