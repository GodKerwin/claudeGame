import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { useSaveStore } from '../../store/saveStore';
import { loadFromSlot, loadAllSlots } from '../../engine/saveEngine';

export default function MainMenu() {
  const navigate = useNavigate();
  const player = usePlayerStore();
  const scene = useSceneStore();
  const { loadItems } = useInventoryStore();
  const { setSlots } = useSaveStore();

  const slots = loadAllSlots();
  const autoSave = slots.find((s) => s.id === 0);
  const hasContinue = !!autoSave?.data;

  const handleContinue = () => {
    const data = loadFromSlot(0);
    if (!data) return;
    player.setPlayer(data.player);
    scene.loadState({
      currentRoomId: data.currentRoomId,
      flags: data.flags,
      clues: data.clues,
      questLog: data.questLog,
      storyText: data.storyText,
    });
    loadItems(data.inventory);
    setSlots(loadAllSlots());
    navigate('/game');
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center">
      <div className="text-center space-y-2 mb-16">
        <h1 className="text-gold text-5xl tracking-[0.3em]">天机残卷</h1>
        <p className="text-ink/30 text-sm tracking-widest">第一章·长安往事</p>
      </div>

      <div className="flex flex-col gap-4 w-64">
        <button
          onClick={() => navigate('/create')}
          className="py-3 border border-gold/40 text-ink hover:border-gold hover:text-gold tracking-widest transition-all cursor-pointer"
        >
          新游戏
        </button>

        {hasContinue && autoSave?.data && (
          <button
            onClick={handleContinue}
            className="py-3 border border-gold/20 text-ink/60 hover:border-gold/40 hover:text-ink/80 tracking-widest transition-all text-sm cursor-pointer"
          >
            继续游戏
            <span className="block text-xs text-ink/30 mt-0.5">
              {autoSave.data.player.name} · {new Date(autoSave.timestamp).toLocaleDateString('zh-CN')}
            </span>
          </button>
        )}
      </div>

      <p className="absolute bottom-6 text-ink/15 text-xs tracking-widest">
        天机残卷 · Chapter I · MVP
      </p>
    </div>
  );
}
