import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameLayout } from '../../components/layout/GameLayout';
import { LeftPanel } from '../../components/layout/LeftPanel';
import { CenterPanel } from '../../components/layout/CenterPanel';
import { RightPanel } from '../../components/layout/RightPanel';
import { SaveLoadModal } from '../../components/save/SaveLoadModal';
import { SettingsModal } from '../../components/settings/SettingsModal';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useSettings } from '../../hooks/useSettings';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { getRoom, getEvent, getNPC } from '../../data/loader';
import { getActionResults } from '../../engine/eventEngine';
import { getAvailableDialogues } from '../../engine/storyEngine';
import { evaluate } from '../../engine/conditionEvaluator';
import type { EvalContext } from '../../engine/conditionEvaluator';
import type { DialogueChoice } from '../../types/game';

type ModalType = 'save' | 'load' | 'settings' | null;

interface PendingChoices {
  npcId: string;
  npcName: string;
  choices: DialogueChoice[];
}

const CHAPTER1_ENDINGS = ['chapter1_truth_ending', 'chapter1_force_ending', 'chapter1_hermit_ending'];
const CHAPTER2_ENDINGS = ['chapter2_arrest_ending', 'chapter2_release_ending', 'chapter2_join_ending'];

export default function Game() {
  const navigate = useNavigate();
  const player = usePlayerStore();
  const scene = useSceneStore();
  const { items, addItem, removeItem } = useInventoryStore();
  const [modal, setModal] = useState<ModalType>(null);
  const [pendingChoices, setPendingChoices] = useState<PendingChoices | null>(null);
  const processingRef = useRef(false);

  useAutoSave();
  useSettings();

  useEffect(() => {
    const inChapter2 = scene.flags.includes('chapter2_started');
    const endings = inChapter2 ? CHAPTER2_ENDINGS : CHAPTER1_ENDINGS;
    if (endings.some((f) => scene.flags.includes(f))) {
      navigate('/chapter-end');
    }
  }, [scene.flags, navigate]);

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
    // 有待选对话时，只显示选项按钮
    if (pendingChoices) {
      return pendingChoices.choices.map((c) => ({
        id: `choice:${c.id}`,
        label: `「${c.label}」`,
        available: true,
        completed: false,
        hint: '',
      }));
    }

    const actions: Array<{ id: string; label: string; available: boolean; completed: boolean; hint: string }> = [];

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
            completed: r.completed,
            hint: r.hint,
          });
        }
      } else if (interactableId.startsWith('npc_')) {
        const npc = getNPC(interactableId);
        if (!npc) continue;
        const dialogues = getAvailableDialogues(npc, ctx);
        if (dialogues.length > 0) {
          const dialogueKey = `${interactableId}:${dialogues[0].id}`;
          const seen = scene.seenDialogues.includes(dialogueKey);
          actions.push({
            id: `${interactableId}:talk`,
            label: seen ? `与${npc.name}交谈（已对话）` : `与${npc.name}交谈`,
            available: true,
            completed: false,
            hint: '',
          });
        }
      }
    }
    return actions;
  };

  const handleAction = (actionId: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setTimeout(() => { processingRef.current = false; }, 300);

    // 处理对话选项
    if (actionId.startsWith('choice:')) {
      if (!pendingChoices) return;
      const choiceId = actionId.slice('choice:'.length);
      const choice = pendingChoices.choices.find((c) => c.id === choiceId);
      if (!choice) return;
      scene.addStoryText(`【${pendingChoices.npcName}】${choice.response}`);
      if (choice.grants) {
        choice.grants.flags?.forEach((f) => scene.addFlag(f));
        choice.grants.clues?.forEach((c) => scene.addClue(c));
        choice.grants.items?.forEach((i) => addItem(i));
        choice.grants.remove_items?.forEach((i) => removeItem(i));
        choice.grants.quests?.forEach((q) => scene.addQuest(q));
      }
      setPendingChoices(null);
      return;
    }

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
      scene.markDialogueSeen(`${entityId}:${d.id}`);
      if (d.grants) {
        d.grants.flags?.forEach((f) => scene.addFlag(f));
        d.grants.clues?.forEach((c) => scene.addClue(c));
        d.grants.items?.forEach((i) => addItem(i));
        d.grants.quests?.forEach((q) => scene.addQuest(q));
      }
      // 处理分支选项
      if (d.choices && d.choices.length > 0) {
        const availableChoices = d.choices.filter(
          (c) => !c.condition || evaluate(c.condition, ctx)
        );
        if (availableChoices.length > 0) {
          setPendingChoices({ npcId: entityId, npcName: npc.name, choices: availableChoices });
        }
      }
    }
  };

  const handleNavigate = (roomId: string) => {
    setPendingChoices(null);
    scene.setRoom(roomId);
  };

  const actions = buildActions();

  return (
    <>
      <button
        onClick={() => setModal('settings')}
        className="fixed top-2 right-4 z-20 text-base text-gold/20 hover:text-gold/60 px-2 py-1 cursor-pointer"
        title="设置"
      >
        ⚙
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
            pendingChoices={!!pendingChoices}
          />
        }
        right={<RightPanel />}
      />

      {modal === 'settings' && (
        <SettingsModal
          onClose={() => setModal(null)}
          onSave={() => setModal('save')}
          onLoad={() => setModal('load')}
        />
      )}
      {(modal === 'save' || modal === 'load') && (
        <SaveLoadModal mode={modal} onClose={() => setModal(null)} />
      )}
    </>
  );
}
