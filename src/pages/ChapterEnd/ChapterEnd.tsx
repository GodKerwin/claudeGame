import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { getItem } from '../../data/loader';
import { addSeenEnding } from '../../engine/endingRecord';
import { CornerFrame } from '../../components/ui/CornerFrame';
import { MountainBackground } from '../../components/ui/MountainBackground';

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

const CHAPTER3_ENDINGS: Record<string, string> = {
  chapter3_truth_ending: '天机创立卷公诸于众，廷尉府的旧案重见天日。名单上的人，终于可以不再躲藏。飞爷被带走了。这张网，由你来收。',
  chapter3_standoff_ending: '飞爷走了，名单还在他手里。你手里，是半段真相。另一半，在某个你看不见的地方等着你。',
  chapter3_join_ending: '你烧了追查令，他告诉了你名单的下落。两个人，一张网，对抗同一个还没有名字的敌人。这局棋，还没有下完。',
};

export default function ChapterEnd() {
  const navigate = useNavigate();
  const scene = useSceneStore();
  const { items } = useInventoryStore();
  const [visibleCount, setVisibleCount] = useState(0);
  const [showButton, setShowButton] = useState(false);

  const isChapter3 = scene.flags.includes('chapter3_started');
  const isChapter2 = scene.flags.includes('chapter2_started');

  const endingFlag = isChapter3
    ? Object.keys(CHAPTER3_ENDINGS).find((f) => scene.flags.includes(f))
    : isChapter2
    ? Object.keys(CHAPTER2_ENDINGS).find((f) => scene.flags.includes(f))
    : Object.keys(CHAPTER1_ENDINGS).find((f) => scene.flags.includes(f));

  const endingText = endingFlag
    ? isChapter3
      ? CHAPTER3_ENDINGS[endingFlag]
      : isChapter2
      ? CHAPTER2_ENDINGS[endingFlag]
      : CHAPTER1_ENDINGS[endingFlag]
    : '';

  const chapterTitle = isChapter3 ? '第三章·完' : isChapter2 ? '第二章·完' : '第一章·完';

  const clueItems = isChapter3 || isChapter2
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
    if (endingFlag) addSeenEnding(endingFlag);
  }, [endingFlag]);

  useEffect(() => {
    if (visibleCount < lines.length) {
      const t = setTimeout(() => setVisibleCount((c) => c + 1), visibleCount === 0 ? 300 : 1800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShowButton(true), 600);
    return () => clearTimeout(t);
  }, [visibleCount, lines.length]);

  const handleContinue = () => {
    if (isChapter3) {
      navigate('/');
    } else if (isChapter2) {
      scene.addFlag('chapter3_started');
      const startRoom = scene.flags.includes('chapter2_join_ending')
        ? 'tianji_safehouse'
        : 'dayan_pagoda';
      scene.setRoom(startRoom);
      navigate('/game');
    } else {
      scene.addFlag('chapter2_started');
      scene.setRoom('east_market_entrance');
      navigate('/game');
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center px-8 py-16 relative overflow-hidden">
      <MountainBackground opacity={0.7} />

      <div className="max-w-md w-full relative z-10">
        <div className="space-y-8">
          {lines.map((line, i) => {
            const isTitle = i === 0;
            const isClueHeader = line === '【你所掌握的线索】';
            const isClueItem = line.startsWith('· ');

            const content = (
              <p
                key={i}
                className={`leading-[2] transition-all duration-1000 ${
                  i < visibleCount ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                } ${
                  isTitle
                    ? 'text-gold/90 text-xl tracking-[0.3em] text-center'
                    : isClueHeader
                    ? 'text-gold/50 text-xs tracking-widest text-center'
                    : isClueItem
                    ? 'text-ink/60 text-sm pl-4 border-l border-gold/20'
                    : 'text-ink/80 text-[15px] border-l-2 border-gold/20 pl-4'
                }`}
                style={{
                  transitionDelay: `${i < visibleCount ? 0 : 100}ms`,
                  textShadow: isTitle ? '0 0 30px rgba(201,168,76,0.4)' : undefined,
                }}
              >
                {line}
              </p>
            );

            return isTitle ? (
              <CornerFrame key={i} size="sm" className="inline-block w-full text-center py-3 px-8">
                {content}
              </CornerFrame>
            ) : content;
          })}
        </div>

        <div
          className={`mt-16 text-center transition-all duration-700 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-px bg-gold/20" />
            <div className="w-[5px] h-[5px] bg-gold/30" style={{ transform: 'rotate(45deg)' }} />
            <div className="w-8 h-px bg-gold/20" />
          </div>
          <button
            onClick={handleContinue}
            className="btn-jianghu border border-gold/40 text-gold/75 px-12 py-2.5 text-sm tracking-[0.3em] hover:border-gold hover:text-gold transition-all cursor-pointer"
          >
            {isChapter3 ? '回到主菜单' : '前往下一章'}
          </button>
        </div>
      </div>
    </div>
  );
}
