import { useNavigate } from 'react-router-dom';
import { getSeenEndings } from '../../engine/endingRecord';
import { CornerFrame } from '../../components/ui/CornerFrame';
import { MountainBackground } from '../../components/ui/MountainBackground';

interface EndingEntry {
  id: string;
  chapter: 1 | 2 | 3;
  name: string;
  description: string;
}

const ENDINGS: EndingEntry[] = [
  {
    id: 'chapter1_truth_ending',
    chapter: 1,
    name: '真相结局·明察秋毫',
    description: '你以智慧解开了这道局，真相已在掌中。但棋局远未终止。',
  },
  {
    id: 'chapter1_force_ending',
    chapter: 1,
    name: '莽夫结局·以力服众',
    description: '你以力破局，真相却仍藏于刀锋之后。长安城，还有更深的秘密等着你。',
  },
  {
    id: 'chapter1_hermit_ending',
    chapter: 1,
    name: '隐士结局·归隐无踪',
    description: '你选择了另一条路，却发现路的尽头仍是同一扇门。',
  },
  {
    id: 'chapter2_arrest_ending',
    chapter: 2,
    name: '缉拿结局·铁证如山',
    description: '铁证如山，李邈被捕。然而「鸢」这个名字，仍悬而未决。',
  },
  {
    id: 'chapter2_release_ending',
    chapter: 2,
    name: '放行结局·各走一路',
    description: '真相只得一半，而那个知道另一半的人，已经消失在长安的人海里。',
  },
  {
    id: 'chapter2_join_ending',
    chapter: 2,
    name: '入网结局·两面为局',
    description: '你踏入了那张网。是猎人，还是猎物，此刻还说不清。',
  },
  {
    id: 'chapter3_truth_ending',
    chapter: 3,
    name: '公诸结局·天下共知',
    description: '天机创立卷公诸于众，廷尉府的旧案重见天日。名单上的人，终于可以不再躲藏。飞爷被带走了。这张网，由你来收。',
  },
  {
    id: 'chapter3_standoff_ending',
    chapter: 3,
    name: '对峙结局·各执一端',
    description: '飞爷走了，名单还在他手里。你手里，是半段真相。另一半，在某个你看不见的地方等着你。',
  },
  {
    id: 'chapter3_join_ending',
    chapter: 3,
    name: '同行结局·两鸢共局',
    description: '你烧了追查令，他告诉了你名单的下落。两个人，一张网，对抗同一个还没有名字的敌人。这局棋，还没有下完。',
  },
];

const CHAPTER_TITLES: Record<number, string> = {
  1: '第一章·长安往事',
  2: '第二章·东市风云',
  3: '第三章·鸢归何处',
};

export default function EndingGallery() {
  const navigate = useNavigate();
  const seen = new Set(getSeenEndings());
  const unlockedCount = ENDINGS.filter((e) => seen.has(e.id)).length;

  const byChapter = ([1, 2, 3] as const).map((ch) => ({
    chapter: ch,
    title: CHAPTER_TITLES[ch],
    endings: ENDINGS.filter((e) => e.chapter === ch),
  }));

  return (
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center py-12 px-6 relative overflow-hidden">
      <MountainBackground opacity={0.5} />
      <div className="w-full max-w-2xl relative z-10">
        <div className="flex items-baseline justify-between mb-10">
          <CornerFrame size="sm" className="px-4 py-2">
            <h1 className="text-gold text-2xl tracking-[0.2em]">结局图鉴</h1>
          </CornerFrame>
          <span className="text-ink/30 text-sm tracking-widest">
            {unlockedCount} / {ENDINGS.length} 已解锁
          </span>
        </div>

        <div className="space-y-10">
          {byChapter.map(({ chapter, title, endings }) => (
            <div key={chapter}>
              <p className="text-gold/50 text-xs tracking-widest mb-4">{title}</p>
              <div className="space-y-3">
                {endings.map((e) => {
                  const unlocked = seen.has(e.id);
                  return (
                    <div
                      key={e.id}
                      className={`border px-4 py-3 transition-colors ${
                        unlocked
                          ? 'border-gold/40 bg-gold/5'
                          : 'border-ink/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={unlocked ? 'text-gold text-xs' : 'text-ink/20 text-xs'}>
                          {unlocked ? '★' : '☆'}
                        </span>
                        <span className={`text-sm tracking-wide ${unlocked ? 'text-ink/90' : 'text-ink/25'}`}>
                          {e.name}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed pl-4 ${unlocked ? 'text-ink/60' : 'text-ink/20'}`}>
                        {unlocked ? e.description : '尚未解锁'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/')}
            className="border border-gold/30 text-gold/60 px-8 py-2 text-sm tracking-widest hover:border-gold/60 hover:text-gold transition-all cursor-pointer"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
}
