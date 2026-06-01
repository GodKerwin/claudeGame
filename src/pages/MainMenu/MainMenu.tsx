import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { useSaveStore } from '../../store/saveStore';
import { loadFromSlot, loadAllSlots } from '../../engine/saveEngine';
import { getSeenEndings } from '../../engine/endingRecord';
import { CornerFrame } from '../../components/ui/CornerFrame';
import { MountainBackground } from '../../components/ui/MountainBackground';

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

  const saveFlags: string[] = autoSave?.data?.flags ?? [];
  const saveSubtitle = saveFlags.includes('chapter3_started')
    ? '第三章·鸢归何处'
    : saveFlags.includes('chapter2_started')
    ? '第二章·东市风云'
    : '第一章·长安往事';

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
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center relative overflow-hidden">
      {/* 山水背景 */}
      <MountainBackground opacity={0.9} />

      {/* 内容层 */}
      <div className="relative z-10 flex flex-col items-center">
        {/* 印章装饰（极淡背景） */}
        <div
          className="absolute -top-8 -right-10 text-gold/8 text-5xl font-serif select-none pointer-events-none"
          style={{ transform: 'rotate(8deg)', letterSpacing: '0.05em' }}
          aria-hidden
        >
          天機
        </div>

        {/* 标题区（角花框） */}
        <CornerFrame size="lg" className="text-center px-10 py-6 mb-14">
          {/* 框内顶部细线 */}
          <div className="w-full h-px bg-gold/15 mb-4" />
          <h1 className="text-gold text-5xl tracking-[0.3em]" style={{ textShadow: '0 0 40px rgba(201,168,76,0.25)' }}>
            天机残卷
          </h1>
          <p className="text-ink/30 text-sm tracking-widest mt-2">
            {hasContinue ? saveSubtitle : '第一章·长安往事'}
          </p>
          {/* 框内底部细线 */}
          <div className="w-full h-px bg-gold/15 mt-4" />
        </CornerFrame>

        {/* 菜单按钮 */}
        <div className="flex flex-col gap-4 w-64">
          <button
            onClick={() => navigate('/create')}
            className="btn-jianghu py-3 border border-gold/40 text-ink hover:border-gold hover:text-gold tracking-widest transition-all cursor-pointer"
          >
            新游戏
          </button>

          {hasContinue && autoSave?.data && (
            <button
              onClick={handleContinue}
              className="btn-jianghu py-3 border border-gold/20 text-ink/60 hover:border-gold/40 hover:text-ink/80 tracking-widest transition-all text-sm cursor-pointer"
            >
              继续游戏
              <span className="block text-xs text-ink/30 mt-0.5">
                {autoSave.data.player.name} · {new Date(autoSave.timestamp).toLocaleDateString('zh-CN')}
              </span>
            </button>
          )}

          {hasAnyEnding && (
            <button
              onClick={() => navigate('/endings')}
              className="btn-jianghu py-2 text-ink/30 hover:text-ink/50 tracking-widest transition-all text-xs cursor-pointer"
            >
              结局图鉴
            </button>
          )}

          <button
            onClick={() => navigate('/credits')}
            className="btn-jianghu py-2 text-ink/30 hover:text-ink/50 tracking-widest transition-all text-xs cursor-pointer"
          >
            关于
          </button>
        </div>
      </div>

      <p className="absolute bottom-6 text-ink/15 text-xs tracking-widest z-10">
        天机残卷 · 三章完结
      </p>
    </div>
  );
}
