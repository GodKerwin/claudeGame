import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
import { getRoom, getEvent, getNPC, getTemplate } from '../../data/loader';
import { getActionResults } from '../../engine/eventEngine';
import { getAvailableDialogues } from '../../engine/storyEngine';
import { evaluate } from '../../engine/conditionEvaluator';
import { getHint } from '../../engine/hintEngine';
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
const CHAPTER3_ENDINGS = ['chapter3_truth_ending', 'chapter3_standoff_ending', 'chapter3_join_ending'];

export default function Game() {
  const navigate = useNavigate();
  const player = usePlayerStore();
  const scene = useSceneStore();
  const { items, addItem, removeItem } = useInventoryStore();
  const [modal, setModal] = useState<ModalType>(null);
  const [pendingChoices, setPendingChoices] = useState<PendingChoices | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showFirstRun, setShowFirstRun] = useState<boolean>(
    !localStorage.getItem('tianji-firstrun-seen')
  );
  const processingRef = useRef(false);

  useAutoSave();
  useSettings();


  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modal === null) setModal('settings');
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modal]);

  useEffect(() => {
    const inChapter3 = scene.flags.includes('chapter3_started');
    const inChapter2 = scene.flags.includes('chapter2_started');
    const endings = inChapter3 ? CHAPTER3_ENDINGS : inChapter2 ? CHAPTER2_ENDINGS : CHAPTER1_ENDINGS;
    if (endings.some((f) => scene.flags.includes(f))) {
      navigate('/chapter-end');
    }
  }, [scene.flags, navigate]);

  useEffect(() => {
    if (!player.name) {
      navigate('/');
    }
  }, [player.name, navigate]);

  const room = getRoom(scene.currentRoomId);

  const chapter: 1 | 2 | 3 = scene.flags.includes('chapter3_started')
    ? 3
    : scene.flags.includes('chapter2_started')
    ? 2
    : 1;

  const ctx = useMemo<EvalContext>(() => ({
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
  }), [player, items, scene.flags]);

  const actions = useMemo(() => {
    if (!room) return [];

    // 有待选对话时，只显示选项按钮
    if (pendingChoices) {
      return pendingChoices.choices.map((c) => ({
        id: `choice:${c.id}`,
        label: `「${c.label}」`,
        available: true,
        completed: false,
        hint: '',
        group: 'choice' as const,
      }));
    }

    const result: Array<{ id: string; label: string; available: boolean; completed: boolean; hint: string; group?: 'npc' | 'event' | 'choice' }> = [];

    for (const interactableId of room.interactables) {
      if (interactableId.startsWith('evt_')) {
        const event = getEvent(interactableId);
        if (!event) continue;
        const results = getActionResults(event, ctx);
        for (const r of results) {
          result.push({
            id: `${interactableId}:${r.action.id}`,
            label: r.action.label,
            available: r.available,
            completed: r.completed,
            hint: r.hint,
            group: 'event' as const,
          });
        }
      } else if (interactableId.startsWith('npc_')) {
        const npc = getNPC(interactableId);
        if (!npc) continue;
        const dialogues = getAvailableDialogues(npc, ctx);
        if (dialogues.length > 0) {
          const nextUnseen = dialogues.find(
            (d) => !scene.seenDialogues.includes(`ch${chapter}:${interactableId}:${d.id}`)
          );
          result.push({
            id: `${interactableId}:talk`,
            label: nextUnseen
              ? `与${npc.name}交谈`
              : `与${npc.name}交谈（已对话）`,
            available: true,
            completed: !nextUnseen && dialogues.length > 0,
            hint: '',
            group: 'npc' as const,
          });
        }
      }
    }
    return result;
  }, [scene.currentRoomId, scene.flags, scene.clues, scene.seenDialogues, pendingChoices, ctx, room, chapter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = useCallback((actionId: string) => {
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
        if (choice.grants.strength != null) player.incrementStat('strength', choice.grants.strength);
        if (choice.grants.agility != null) player.incrementStat('agility', choice.grants.agility);
        if (choice.grants.wisdom != null) player.incrementStat('wisdom', choice.grants.wisdom);
        if (choice.grants.constitution != null) player.incrementStat('constitution', choice.grants.constitution);
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
        if (action.grants.strength != null) player.incrementStat('strength', action.grants.strength);
        if (action.grants.agility != null) player.incrementStat('agility', action.grants.agility);
        if (action.grants.wisdom != null) player.incrementStat('wisdom', action.grants.wisdom);
        if (action.grants.constitution != null) player.incrementStat('constitution', action.grants.constitution);
      }
    } else if (entityId.startsWith('npc_')) {
      const npc = getNPC(entityId);
      if (!npc) return;
      const dialogues = getAvailableDialogues(npc, ctx);
      if (dialogues.length === 0) return;
      const nextUnseen = dialogues.find((d) => !scene.seenDialogues.includes(`ch${chapter}:${entityId}:${d.id}`));
      if (!nextUnseen) {
        scene.addStoryText(`（${npc.name}似乎已无更多可说的了。）`);
        return;
      }
      const d = nextUnseen;
      scene.addStoryText(`【${npc.name}】${d.text}`);
      scene.markDialogueSeen(`ch${chapter}:${entityId}:${d.id}`);
      if (d.grants) {
        d.grants.flags?.forEach((f) => scene.addFlag(f));
        d.grants.clues?.forEach((c) => scene.addClue(c));
        d.grants.items?.forEach((i) => addItem(i));
        d.grants.quests?.forEach((q) => scene.addQuest(q));
        if (d.grants.strength != null) player.incrementStat('strength', d.grants.strength);
        if (d.grants.agility != null) player.incrementStat('agility', d.grants.agility);
        if (d.grants.wisdom != null) player.incrementStat('wisdom', d.grants.wisdom);
        if (d.grants.constitution != null) player.incrementStat('constitution', d.grants.constitution);
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
  }, [pendingChoices, ctx, scene, addItem, removeItem]);

  const handleNavigate = useCallback((roomId: string) => {
    setPendingChoices(null);
    scene.setRoom(roomId);
  }, [scene]);

  if (!player.name) {
    return null;
  }

  if (!room) {
    return (
      <div className="text-blood p-8 font-serif bg-paper min-h-screen">
        错误：找不到当前房间 {scene.currentRoomId}
      </div>
    );
  }

  const currentHint = showHint
    ? getHint({ flags: scene.flags, items, chapter, strength: player.strength, agility: player.agility, wisdom: player.wisdom, constitution: player.constitution, talent: player.talent })
    : null;

  return (
    <>
      <button
        onClick={() => setModal('settings')}
        className="fixed top-2 right-3 z-20 text-sm text-gold/50 hover:text-gold border border-gold/20 hover:border-gold/50 px-2.5 py-1 tracking-widest transition-colors cursor-pointer"
        title="设置"
      >
        设置
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
            hint={currentHint}
            onToggleHint={() => setShowHint((v) => !v)}
            showHint={showHint}
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

      {showFirstRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper/80 backdrop-blur-sm">
          <div className="font-serif bg-paper/90 border border-gold/30 max-w-sm w-full mx-4 p-8 space-y-4 text-ink">
            <h2 className="text-gold text-lg tracking-widest text-center">初次踏入江湖</h2>
            <div className="border-t border-gold/20" />
            <ul className="space-y-2 text-sm tracking-wide text-ink/70">
              <li>· 左侧面板：可前往的地点</li>
              <li>· 中央区域：当前场景，点击下方选项推进</li>
              <li>· 右侧面板：人物信息与任务线索</li>
              <li>· 「提示」按钮：遇到困难时点击获得指引</li>
            </ul>
            <div className="border-t border-gold/20" />
            <div className="flex justify-center">
              <button
                onClick={() => {
                  localStorage.setItem('tianji-firstrun-seen', '1');
                  setShowFirstRun(false);
                }}
                className="py-2 px-8 border border-gold/40 text-ink hover:border-gold hover:text-gold tracking-widest transition-all cursor-pointer text-sm"
              >
                明白了
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
