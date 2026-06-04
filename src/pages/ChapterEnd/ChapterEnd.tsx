import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSceneStore } from '../../store/sceneStore';
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

interface EndingStyle {
  sealChar: string;
  sealColor: string;
  atmosphereColor: string;
  label: string;
}

const ENDING_STYLES: Record<string, EndingStyle> = {
  chapter1_truth_ending:   { sealChar: '明', sealColor: 'rgba(201,168,76,0.88)',  atmosphereColor: 'rgba(201,168,76,0.07)',  label: '真相' },
  chapter1_force_ending:   { sealChar: '武', sealColor: 'rgba(139,26,26,0.88)',   atmosphereColor: 'rgba(139,26,26,0.08)',   label: '以力' },
  chapter1_hermit_ending:  { sealChar: '隐', sealColor: 'rgba(140,130,110,0.75)', atmosphereColor: 'rgba(60,55,45,0.06)',    label: '归隐' },
  chapter2_arrest_ending:  { sealChar: '律', sealColor: 'rgba(201,168,76,0.88)',  atmosphereColor: 'rgba(201,168,76,0.06)',  label: '缉拿' },
  chapter2_release_ending: { sealChar: '散', sealColor: 'rgba(150,140,125,0.75)', atmosphereColor: 'rgba(80,75,65,0.05)',    label: '放行' },
  chapter2_join_ending:    { sealChar: '入', sealColor: 'rgba(58,122,90,0.88)',   atmosphereColor: 'rgba(58,122,90,0.07)',   label: '入局' },
  chapter3_truth_ending:   { sealChar: '公', sealColor: 'rgba(201,168,76,0.90)',  atmosphereColor: 'rgba(201,168,76,0.09)',  label: '公诸' },
  chapter3_standoff_ending:{ sealChar: '峙', sealColor: 'rgba(140,130,110,0.75)', atmosphereColor: 'rgba(60,55,45,0.06)',    label: '对峙' },
  chapter3_join_ending:    { sealChar: '同', sealColor: 'rgba(58,122,90,0.90)',   atmosphereColor: 'rgba(58,122,90,0.08)',   label: '同行' },
};

const CHAPTER_CLOSE_CAPTIONS: Record<string, string> = {
  '1': '——线索已握，长安还在等你。',
  '2': '——黑幕初破，名单仍藏深处。',
  '3': '——真相既出，万事终有归处。',
};

function EndingSeal({ char, color, label, visible }: { char: string; color: string; label: string; visible: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-2 mb-10 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <svg
        width="68"
        height="68"
        viewBox="0 0 68 68"
        className={visible ? 'seal-drop' : ''}
      >
        {/* 外框 */}
        <rect x="3" y="3" width="62" height="62" rx="2"
          fill={color.replace(/[\d.]+\)$/, '0.08)')}
          stroke={color} strokeWidth="1.5" />
        {/* 内框 */}
        <rect x="8" y="8" width="52" height="52" rx="1"
          fill="none" stroke={color} strokeWidth="0.5" opacity="0.45" />
        {/* 篆书字 */}
        <text x="34" y="48" textAnchor="middle"
          fill={color} fontSize="34" fontFamily="serif" fontWeight="bold"
          style={{ letterSpacing: 0 }}>
          {char}
        </text>
      </svg>
      <span style={{ color, fontSize: '11px', letterSpacing: '0.25em', opacity: 0.75 }}>{label}</span>
    </div>
  );
}

export default function ChapterEnd() {
  const navigate = useNavigate();
  const scene = useSceneStore();
  const { clues, visitedRooms, foundSynthesisIds } = useSceneStore();
  const [visibleCount, setVisibleCount] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const [sealVisible, setSealVisible] = useState(false);

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

  const ch3TruthEcho =
    endingFlag === 'chapter3_truth_ending' && scene.flags.includes('chapter1_truth_ending')
      ? '从那家客栈的走廊开始，你就没有回过头。'
      : null;

  const endingStyle = endingFlag ? ENDING_STYLES[endingFlag] : null;

  const chapterTitle = isChapter3 ? '第三章·完' : isChapter2 ? '第二章·完' : '第一章·完';

  const clueItems = clues
    .map((id) => getItem(id))
    .filter((item): item is NonNullable<typeof item> => item !== undefined && item !== null);

  const lines = useMemo(
    () =>
      [
        chapterTitle,
        endingText,
        ...(ch3TruthEcho ? [ch3TruthEcho] : []),
        ...(clueItems.length > 0 ? ['【你所掌握的线索】'] : []),
        ...clueItems.map((item) => `· ${item.name}`),
      ].filter(Boolean),
    [chapterTitle, endingText, ch3TruthEcho, clueItems]
  );

  useEffect(() => {
    if (endingFlag) addSeenEnding(endingFlag);
  }, [endingFlag]);

  // 印章先出现，然后文字开始逐行显现
  useEffect(() => {
    const t0 = setTimeout(() => setSealVisible(true), 200);
    const t1 = setTimeout(() => {
      if (visibleCount < lines.length) {
        setVisibleCount(1);
      }
    }, 900);
    return () => { clearTimeout(t0); clearTimeout(t1); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (visibleCount === 0) return;
    if (visibleCount < lines.length) {
      const t = setTimeout(() => setVisibleCount((c) => c + 1), 1100);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShowButton(true), 400);
    return () => clearTimeout(t);
  }, [visibleCount, lines.length]);

  const handleSkip = useCallback(() => {
    setSealVisible(true);
    setVisibleCount(lines.length);
    setShowButton(true);
  }, [lines.length]);

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

      {/* 跳过按钮 */}
      {!showButton && (
        <button
          onClick={handleSkip}
          className="fixed top-6 right-8 z-20 text-ink/30 hover:text-ink/65 text-[11px] tracking-[0.25em] cursor-pointer transition-colors"
        >
          跳过 ›
        </button>
      )}

      {/* 结局氛围色调叠层 */}
      {endingStyle && (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1500"
          style={{
            opacity: sealVisible ? 1 : 0,
            background: `radial-gradient(ellipse 70% 80% at 50% 35%, ${endingStyle.atmosphereColor} 0%, transparent 70%)`,
          }}
        />
      )}

      <div className="max-w-md w-full relative z-10">
        {/* 印章 */}
        {endingStyle && (
          <div className="flex justify-center">
            <EndingSeal
              char={endingStyle.sealChar}
              color={endingStyle.sealColor}
              label={endingStyle.label}
              visible={sealVisible}
            />
          </div>
        )}

        <div className="space-y-8">
          {lines.map((line, i) => {
            const isTitle = i === 0;
            const isClueHeader = line === '【你所掌握的线索】';
            const isEcho = line === ch3TruthEcho;
            const isClueItem = line.startsWith('· ');

            const content = (
              <p
                key={i}
                className={`leading-[2] transition-all duration-1000 ${
                  i < visibleCount ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                } ${
                  isTitle
                    ? 'text-gold/90 text-xl tracking-[0.3em] text-center'
                    : isEcho
                    ? 'text-gold/45 text-[12px] tracking-[0.15em] italic text-center'
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

        {/* 此行收获 */}
        <div className="mt-8 mb-4 flex justify-center gap-8">
          {[
            { label: '线索收集', value: clues.length },
            { label: '推理洞察', value: foundSynthesisIds.length },
            { label: '走访之处', value: visitedRooms.length },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-gold/75 text-xl tracking-wide font-serif">{value}</span>
              <span className="text-ink/30 text-[10px] tracking-[0.2em]">{label}</span>
            </div>
          ))}
        </div>

        <div
          className={`mt-16 text-center transition-all duration-700 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-8 h-px bg-gold/20" />
            <div className="w-[5px] h-[5px] bg-gold/30" style={{ transform: 'rotate(45deg)' }} />
            <div className="w-8 h-px bg-gold/20" />
          </div>
          {(() => {
            const chNum = isChapter3 ? '3' : isChapter2 ? '2' : '1';
            const caption = CHAPTER_CLOSE_CAPTIONS[chNum];
            return caption ? (
              <p className="text-ink/22 text-[11px] tracking-[0.2em] italic mb-3 text-center">{caption}</p>
            ) : null;
          })()}
          {!isChapter3 && (
            <p className="text-ink/18 text-[10px] tracking-[0.15em] mb-4 text-center">建议在继续前保存游戏</p>
          )}
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
