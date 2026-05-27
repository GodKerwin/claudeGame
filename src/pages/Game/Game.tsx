import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameLayout } from '../../components/layout/GameLayout';
import { LeftPanel } from '../../components/layout/LeftPanel';
import { CenterPanel } from '../../components/layout/CenterPanel';
import { RightPanel } from '../../components/layout/RightPanel';
import { SaveLoadModal } from '../../components/save/SaveLoadModal';
import { useAutoSave } from '../../hooks/useAutoSave';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { getRoom, getEvent, getNPC } from '../../data/loader';
import { getActionResults } from '../../engine/eventEngine';
import { getAvailableDialogues } from '../../engine/storyEngine';
import type { EvalContext } from '../../engine/conditionEvaluator';

type ModalType = 'save' | 'load' | null;

export default function Game() {
  const navigate = useNavigate();
  const player = usePlayerStore();
  const scene = useSceneStore();
  const { items, addItem, removeItem } = useInventoryStore();
  const [modal, setModal] = useState<ModalType>(null);

  useAutoSave();

  if (!player.name) {
    navigate('/');
    return null;
  }

  const room = getRoom(scene.currentRoomId);
  if (!room) {
    return (
      <div className="text-blood p-8 font-serif bg-paper min-h-screen">
        错误：找不到当前房间 {scene.currentRoomId}
      </div>
    );
  }

  const ctx: EvalContext = {
    player: {
      name: player.name,
      template: player.template,
      strength: player.strength,
      agility: player.agility,
      wisdom: player.wisdom,
      constitution: player.constitution,
      talent: player.talent,
    },
    inventory: items,
    flags: scene.flags,
  };

  const buildActions = () => {
    const actions: Array<{ id: string; label: string; available: boolean; hint: string }> = [];

    for (const interactableId of room.interactables) {
      if (interactableId.startsWith('evt_')) {
        const event = getEvent(interactableId);
        if (!event) continue;
        const results = getActionResults(event, ctx);
        for (const r of results) {
          actions.push({
            id: `${interactableId}:${r.action.id}`,
            label: r.action.label,
            available: r.available,
            hint: r.hint,
          });
        }
      } else if (interactableId.startsWith('npc_')) {
        const npc = getNPC(interactableId);
        if (!npc) continue;
        const dialogues = getAvailableDialogues(npc, ctx);
        if (dialogues.length > 0) {
          actions.push({
            id: `${interactableId}:talk`,
            label: `与${npc.name}交谈`,
            available: true,
            hint: '',
          });
        }
      }
    }
    return actions;
  };

  const handleAction = (actionId: string) => {
    const colonIdx = actionId.indexOf(':');
    const entityId = actionId.slice(0, colonIdx);
    const subId = actionId.slice(colonIdx + 1);

    if (entityId.startsWith('evt_')) {
      const event = getEvent(entityId);
      if (!event) return;
      const action = event.actions.find((a) => a.id === subId);
      if (!action) return;
      scene.addStoryText(action.result);
      if (action.grants) {
        action.grants.flags?.forEach((f) => scene.addFlag(f));
        action.grants.clues?.forEach((c) => scene.addClue(c));
        action.grants.items?.forEach((i) => addItem(i));
        action.grants.remove_items?.forEach((i) => removeItem(i));
        action.grants.quests?.forEach((q) => scene.addQuest(q));
      }
    } else if (entityId.startsWith('npc_')) {
      const npc = getNPC(entityId);
      if (!npc) return;
      const dialogues = getAvailableDialogues(npc, ctx);
      if (dialogues.length === 0) return;
      const d = dialogues[0];
      scene.addStoryText(`【${npc.name}】${d.text}`);
      if (d.grants) {
        d.grants.flags?.forEach((f) => scene.addFlag(f));
        d.grants.clues?.forEach((c) => scene.addClue(c));
        d.grants.items?.forEach((i) => addItem(i));
        d.grants.quests?.forEach((q) => scene.addQuest(q));
      }
    }
  };

  const handleNavigate = (roomId: string) => {
    scene.setRoom(roomId);
  };

  const actions = buildActions();

  return (
    <>
      <button
        onClick={() => setModal('save')}
        className="fixed top-2 right-52 z-20 text-xs text-gold/20 hover:text-gold/60 px-2 py-1 cursor-pointer"
        title="存档（✦）"
      >
        ✦
      </button>

      <GameLayout
        left={<LeftPanel onNavigate={handleNavigate} />}
        center={
          <CenterPanel
            roomName={room.name}
            roomDescription={room.description}
            storyTexts={scene.storyText}
            actions={actions}
            onAction={handleAction}
          />
        }
        right={<RightPanel />}
      />

      {modal && (
        <SaveLoadModal mode={modal} onClose={() => setModal(null)} />
      )}
    </>
  );
}
