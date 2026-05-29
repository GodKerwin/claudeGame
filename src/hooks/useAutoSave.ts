import { useEffect } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { useSceneStore } from '../store/sceneStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useSaveStore } from '../store/saveStore';
import { saveToSlot, loadAllSlots } from '../engine/saveEngine';
import type { SaveData } from '../types/game';

export function useAutoSave() {
  const player = usePlayerStore();
  const scene = useSceneStore();
  const { items } = useInventoryStore();
  const { setSlots, updateSlot } = useSaveStore();

  useEffect(() => {
    setSlots(loadAllSlots());
  }, [setSlots]);

  useEffect(() => {
    if (!player.name) return;
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
    const saved = saveToSlot(0, data, '自动存档');
    updateSlot(saved);
  }, [scene.currentRoomId, scene.flags, scene.clues, scene.questLog]);
}
