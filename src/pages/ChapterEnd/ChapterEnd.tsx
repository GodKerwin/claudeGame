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

const CHAPTER4_ENDINGS: Record<string, string> = {
  chapter4_expose_ending: '内鬼与幕后者，你一手将他们从阴影里拉出来。二十年的噤声，在这一刻松动了。',
  chapter4_gather_ending: '证据已齐，真相的形状已经清晰。最后那一步，等到所有人都到场的时候，再说。',
  chapter4_shadow_ending: '你把所有的线索压在手里，选择暂时沉默。有时候，等待是一种力量。',
};

const CHAPTER5_ENDINGS: Record<string, string> = {
  chapter5_burn_ending: '火烧尽了，灰烬里没有声音。这个选择，你一个人知道它意味着什么。',
  chapter5_entrust_ending: '真相被托付给了一个你信得过的人。宋怀义的名字，终于从「叛徒」那列消失了。',
  chapter5_reveal_ending: '坊间的流言，比任何一道官文都走得快。真相以碎片的形式，回到了长安城里。',
  chapter5_tianji_ending: '天机再动。这一次，有两个人，一张更完整的名单，以及一件还没做完的事。',
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
  chapter4_expose_ending:  { sealChar: '露', sealColor: 'rgba(201,168,76,0.90)', atmosphereColor: 'rgba(201,168,76,0.09)', label: '揭露' },
  chapter4_gather_ending:  { sealChar: '备', sealColor: 'rgba(140,130,110,0.75)', atmosphereColor: 'rgba(60,55,45,0.06)',   label: '备证' },
  chapter4_shadow_ending:  { sealChar: '伺', sealColor: 'rgba(80,100,130,0.75)', atmosphereColor: 'rgba(50,65,90,0.06)',   label: '静观' },
  chapter5_burn_ending:    { sealChar: '炬', sealColor: 'rgba(139,26,26,0.88)',  atmosphereColor: 'rgba(139,26,26,0.08)',  label: '付炬' },
  chapter5_entrust_ending: { sealChar: '托', sealColor: 'rgba(201,168,76,0.88)', atmosphereColor: 'rgba(201,168,76,0.07)', label: '托付' },
  chapter5_reveal_ending:  { sealChar: '布', sealColor: 'rgba(58,122,90,0.88)',  atmosphereColor: 'rgba(58,122,90,0.07)',  label: '公布' },
  chapter5_tianji_ending:  { sealChar: '启', sealColor: 'rgba(100,160,200,0.90)', atmosphereColor: 'rgba(80,130,170,0.09)', label: '再启' },
};

const CHAPTER_CLOSE_CAPTIONS: Record<string, string> = {
  '1': '——线索已握，长安还在等你。',
  '2': '——黑幕初破，名单仍藏深处。',
  '3': '——真相既出，万事终有归处。',
  '4': '——幕后者已现，最终一役，等你来定。',
  '5': '——万事有始有终，此局，由你落子。',
};

const CASE_SUMMARIES: Record<string, Array<{ label: string; content: string }>> = {
  chapter1_truth_ending: [
    { label: '凶手', content: '浪鹏帮刺客（女性，体态轻盈），由李邈雇佣、天机内鬼配合' },
    { label: '手法', content: '预制砒霜毒茶致昏，密道入室，绳索勒毙，翻窗出逃' },
    { label: '动机', content: '截获宋怀义所携天机名单，阻止情报传递' },
    { label: '幕后', content: '李邈（廷尉府附庸）操控浪鹏帮，名单背后牵涉廷尉府旧案' },
  ],
  chapter2_arrest_ending: [
    { label: '主谋', content: '李邈，廷尉府参军，以浪鹏帮为执行工具' },
    { label: '关联', content: '无迹和尚（韩朔）提供毒剂配方，被动卷入，以出家二十年偿还' },
    { label: '目的', content: '夺取天机名单，掌控情报网络，为上游势力服务' },
    { label: '上游', content: '廷尉府某一层级——李邈不过是中间人，真正的主使尚在更深处' },
  ],
  chapter3_truth_ending: [
    { label: '飞爷', content: '天机阁创立者，代号「鸢」，隐身大飞帮主二十年' },
    { label: '名单', content: '记录37名被庇护者——天机阁保护的是「不该死之人」，非情报买卖' },
    { label: '威胁', content: '廷尉府某层级官员主导，系统追杀名单成员，与二十年前旧案一脉相承' },
    { label: '结局', content: '飞爷被带走，名单由你接管。廷尉府旧案重启，真相公诸于众' },
  ],
  chapter4_expose_ending: [
    { label: '内鬼', content: '天机联络人（化名「谢文」）——薛崇礼安插的棋子，在归鸟问津据点销毁档案、暴露节点，并在宋怀义即将开口时自行决定灭口' },
    { label: '幕后', content: '薛崇礼——前廷尉令，二十年前以北境秘密往来换取政治保护，天机阁掌握其罪证后进行反向绑架' },
    { label: '吹哨', content: '宋怀义发现名单被篡改，独自来长安欲告知飞爷，却因内鬼存在而无法走内部渠道，最终被灭口' },
    { label: '便条', content: '宋怀义临终便条断于「谢」字，李福的临终话也指向同一个「谢」字——两条后路，殊途同归' },
  ],
  chapter5_tianji_ending: [
    { label: '真相', content: '名单=飞爷的庇护承诺；宋怀义=吹哨人；内鬼=天机联络人；幕后=薛崇礼' },
    { label: '选择', content: '以修复后的名单为基础，与飞爷一同重建天机阁，继续保护那些走投无路的人' },
    { label: '证据', content: '薛崇礼的把柄被保存，作为将来的后手——不是要用它，而是不让它消失' },
    { label: '尾声', content: '往事客栈收到一封无名信：「天机再动。」李福把信叠好，放进了贴身的内袋里' },
  ],
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

  const isChapter5 = scene.flags.includes('chapter5_started');
  const isChapter4 = scene.flags.includes('chapter4_started');
  const isChapter3 = scene.flags.includes('chapter3_started');
  const isChapter2 = scene.flags.includes('chapter2_started');

  const endingFlag = isChapter5
    ? Object.keys(CHAPTER5_ENDINGS).find((f) => scene.flags.includes(f))
    : isChapter4
    ? Object.keys(CHAPTER4_ENDINGS).find((f) => scene.flags.includes(f))
    : isChapter3
    ? Object.keys(CHAPTER3_ENDINGS).find((f) => scene.flags.includes(f))
    : isChapter2
    ? Object.keys(CHAPTER2_ENDINGS).find((f) => scene.flags.includes(f))
    : Object.keys(CHAPTER1_ENDINGS).find((f) => scene.flags.includes(f));

  const endingText = endingFlag
    ? isChapter5
      ? CHAPTER5_ENDINGS[endingFlag]
      : isChapter4
      ? CHAPTER4_ENDINGS[endingFlag]
      : isChapter3
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

  const chapterTitle = isChapter5 ? '第五章·完' : isChapter4 ? '第四章·完' : isChapter3 ? '第三章·完' : isChapter2 ? '第二章·完' : '第一章·完';

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
    if (isChapter5) {
      navigate('/');
    } else if (isChapter4) {
      scene.addFlag('chapter5_started');
      scene.setRoom('wangshi_secret_room');
      navigate('/game');
    } else if (isChapter3) {
      scene.addFlag('chapter4_started');
      scene.setRoom('guinian_teahouse');
      navigate('/game');
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

  const handleRetry = () => {
    const chNum = isChapter5 ? '5' : isChapter4 ? '4' : isChapter3 ? '3' : isChapter2 ? '2' : '1';
    sessionStorage.setItem('tianji-chapter-select', chNum);
    navigate('/create');
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

        {/* ── 案情还原 ── */}
        {endingFlag && CASE_SUMMARIES[endingFlag] && (
          <div className="mt-8 mb-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gold/15" />
              <span className="text-gold/40 text-[10px] tracking-[0.45em]">案情还原</span>
              <div className="flex-1 h-px bg-gold/15" />
            </div>
            <div className="space-y-2.5">
              {CASE_SUMMARIES[endingFlag].map(({ label, content }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="text-gold/50 text-[10px] tracking-widest shrink-0 w-7 text-right mt-0.5 font-serif">
                    {label}
                  </span>
                  <div className="w-px self-stretch bg-gold/15 shrink-0" />
                  <span className="text-ink/45 text-[11px] leading-relaxed flex-1">
                    {content}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className={`mt-16 text-center transition-all duration-700 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-8 h-px bg-gold/20" />
            <div className="w-[5px] h-[5px] bg-gold/30" style={{ transform: 'rotate(45deg)' }} />
            <div className="w-8 h-px bg-gold/20" />
          </div>
          {(() => {
            const chNum = isChapter5 ? '5' : isChapter4 ? '4' : isChapter3 ? '3' : isChapter2 ? '2' : '1';
            const caption = CHAPTER_CLOSE_CAPTIONS[chNum];
            return caption ? (
              <p className="text-ink/22 text-[11px] tracking-[0.2em] italic mb-3 text-center">{caption}</p>
            ) : null;
          })()}
          {!isChapter5 && (
            <p className="text-ink/18 text-[10px] tracking-[0.15em] mb-4 text-center">建议在继续前保存游戏</p>
          )}
          <button
            onClick={handleContinue}
            className="btn-jianghu border border-gold/40 text-gold/75 px-12 py-2.5 text-sm tracking-[0.3em] hover:border-gold hover:text-gold transition-all cursor-pointer"
          >
            {isChapter5 ? '回到主菜单' : '前往下一章'}
          </button>
          <button
            onClick={handleRetry}
            className="mt-3 block w-full text-ink/28 hover:text-ink/55 text-[11px] tracking-[0.25em] transition-colors cursor-pointer"
          >
            再试本章
          </button>
        </div>
      </div>
    </div>
  );
}
