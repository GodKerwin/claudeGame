import { useSaveStore } from '../../store/saveStore';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { saveToSlot, loadFromSlot, loadAllSlots } from '../../engine/saveEngine';
import type { SaveData } from '../../types/game';

interface Props {
  mode: 'save' | 'load';
  onClose: () => void;
}

export function SaveLoadModal({ mode, onClose }: Props) {
  const { slots, setSlots, updateSlot } = useSaveStore();
  const player = usePlayerStore();
  const scene = useSceneStore();
  const { items, loadItems } = useInventoryStore();

  const handleSave = (slotId: number) => {
    if (slotId === 0) return;
    const data: SaveData = {
      player: {
        name: player.name,
        template: player.template,
        strength: player.strength,
        agility: player.agility,
        wisdom: player.wisdom,
        constitution: player.constitution,
        talent: player.talent,
      },
      currentRoomId: scene.currentRoomId,
      inventory: items,
      clues: scene.clues,
      flags: scene.flags,
      questLog: scene.questLog,
      storyText: scene.storyText,
      seenDialogues: scene.seenDialogues,
      visitedRooms: scene.visitedRooms,
    };
    const saved = saveToSlot(slotId, data);
    updateSlot(saved);
    onClose();
  };

  const handleLoad = (slotId: number) => {
    const data = loadFromSlot(slotId);
    if (!data) return;
    player.setPlayer(data.player);
    scene.loadState({
      currentRoomId: data.currentRoomId,
      flags: data.flags ?? [],
      clues: data.clues ?? [],
      questLog: data.questLog ?? [],
      storyText: [],
      seenDialogues: data.seenDialogues ?? [],
      visitedRooms: data.visitedRooms ?? [data.currentRoomId],
    });
    loadItems(data.inventory);
    setSlots(loadAllSlots());
    onClose();
  };

  const manualSlots = slots.filter((s) => s.type === 'manual');

  return (
    <div className="fixed inset-0 bg-paper/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-80 border border-gold/30 bg-paper panel p-6 space-y-4">
        <h3 className="text-gold text-center tracking-widest">{mode === 'save' ? '存档' : '读档'}</h3>
        <div className="space-y-2">
          {manualSlots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => mode === 'save' ? handleSave(slot.id) : handleLoad(slot.id)}
              disabled={mode === 'load' && !slot.data}
              className={`w-full text-left px-3 py-2 text-sm border transition-all ${
                mode === 'load' && !slot.data
                  ? 'border-ink/10 text-ink/20 cursor-not-allowed'
                  : 'border-gold/20 text-ink/70 hover:border-gold hover:text-ink cursor-pointer'
              }`}
            >
              <span className="text-gold/60 mr-2">{slot.label}</span>
              {slot.data ? (
                <span className="text-xs text-ink/40">
                  {new Date(slot.timestamp).toLocaleString('zh-CN')} — {slot.data.player.name}
                </span>
              ) : (
                <span className="text-xs text-ink/20">（空槽）</span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full py-2 border border-ink/20 text-ink/40 hover:text-ink text-sm cursor-pointer"
        >
          取消
        </button>
      </div>
    </div>
  );
}
