import { useEffect, useState } from 'react';
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

const CORNERS = [
  'top-2 left-2 border-t border-l',
  'top-2 right-2 border-t border-r',
  'bottom-2 left-2 border-b border-l',
  'bottom-2 right-2 border-b border-r',
];

export function SaveLoadModal({ mode, onClose }: Props) {
  const { slots, setSlots, updateSlot } = useSaveStore();
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [confirmOverwrite, setConfirmOverwrite] = useState<number | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const player = usePlayerStore();
  const scene = useSceneStore();
  const { items, loadItems } = useInventoryStore();

  const handleSave = (slotId: number) => {
    if (slotId === 0) return;
    const slot = slots.find((s) => s.id === slotId);
    if (slot?.data && confirmOverwrite !== slotId) {
      setConfirmOverwrite(slotId);
      return;
    }
    setConfirmOverwrite(null);
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
      foundSynthesisIds: scene.foundSynthesisIds,
    };
    const saved = saveToSlot(slotId, data);
    updateSlot(saved);
    setStatusMsg('已保存');
    setTimeout(() => { setStatusMsg(''); onClose(); }, 1200);
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
      storyText: (data.storyText ?? []).slice(-20),
      seenDialogues: data.seenDialogues ?? [],
      visitedRooms: data.visitedRooms ?? [data.currentRoomId],
      foundSynthesisIds: data.foundSynthesisIds ?? [],
    });
    loadItems(data.inventory);
    setSlots(loadAllSlots());
    setStatusMsg('已读取');
    setTimeout(() => { setStatusMsg(''); onClose(); }, 1200);
  };

  const manualSlots = slots.filter((s) => s.type === 'manual');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center font-serif px-4"
      style={{ background: 'rgba(8,5,2,0.78)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xs"
        style={{
          background: 'linear-gradient(135deg, rgba(26,18,8,0.98) 0%, rgba(20,14,5,0.98) 100%)',
          border: '1px solid rgba(201,168,76,0.22)',
          boxShadow: '0 0 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(201,168,76,0.07)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {CORNERS.map((cls) => (
          <div key={cls} className={`absolute ${cls} w-3 h-3 border-gold/28`} />
        ))}

        <div className="px-6 py-5">
          {/* 标题 */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gold/15" />
            <span className="text-gold/80 text-sm tracking-[0.3em]">{mode === 'save' ? '存档' : '读档'}</span>
            <div className="flex-1 h-px bg-gold/15" />
          </div>

          {/* 存档槽 */}
          <div className="space-y-2 mb-5">
            {manualSlots.map((slot) => {
              const empty = !slot.data;
              const disabled = mode === 'load' && empty;
              return (
                <button
                  key={slot.id}
                  onClick={() => !disabled && (mode === 'save' ? handleSave(slot.id) : handleLoad(slot.id))}
                  disabled={disabled}
                  className={`w-full text-left px-3 py-2.5 border transition-all duration-150 ${
                    disabled
                      ? 'border-gold/8 cursor-not-allowed'
                      : 'border-gold/18 hover:border-gold/50 hover:bg-gold/4 cursor-pointer'
                  }`}
                >
                  <div className="flex items-baseline gap-2">
                    <span className={`text-[11px] tracking-widest shrink-0 ${disabled ? 'text-ink/20' : 'text-gold/55'}`}>
                      {slot.label}
                    </span>
                    {slot.data ? (
                      <span className={`text-[11px] flex-1 min-w-0 truncate ${disabled ? 'text-ink/20' : 'text-ink/50'}`}>
                        {slot.data.player.name}
                        <span className={`ml-1.5 text-[10px] ${disabled ? 'text-ink/15' : 'text-ink/30'}`}>
                          {new Date(slot.timestamp).toLocaleDateString('zh-CN', { year: '2-digit', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-ink/20 flex-1">空槽</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 覆盖确认 */}
          {mode === 'save' && confirmOverwrite !== null && (
            <div className="mb-4 px-1 py-2 border border-blood/30 bg-blood/5">
              <p className="text-[11px] text-ink/60 text-center mb-2 leading-snug">
                此槽已有存档，确认覆盖？
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSave(confirmOverwrite)}
                  className="flex-1 py-1.5 text-xs text-blood/70 border border-blood/25 hover:border-blood/55 hover:bg-blood/8 transition-colors cursor-pointer"
                >
                  覆盖
                </button>
                <button
                  onClick={() => setConfirmOverwrite(null)}
                  className="flex-1 py-1.5 text-xs text-ink/40 border border-gold/15 hover:border-gold/35 transition-colors cursor-pointer"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 状态消息 */}
          {statusMsg && (
            <p className="text-center text-gold/80 text-sm tracking-widest mb-4">{statusMsg}</p>
          )}

          {/* 取消 */}
          <button
            onClick={onClose}
            className="w-full py-2 text-ink/30 hover:text-ink/55 text-xs tracking-widest transition-colors cursor-pointer border border-gold/10 hover:border-gold/25"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
