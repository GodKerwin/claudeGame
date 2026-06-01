import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameLayout } from '../../components/layout/GameLayout';
import { LeftPanel } from '../../components/layout/LeftPanel';
import { CenterPanel } from '../../components/layout/CenterPanel';
import { RightPanel } from '../../components/layout/RightPanel';
import { SaveLoadModal } from '../../components/save/SaveLoadModal';
import { SettingsModal } from '../../components/settings/SettingsModal';
import { ChapterIntro } from '../../components/ui/ChapterIntro';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useSettings } from '../../hooks/useSettings';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { getRoom, getEvent, getNPC } from '../../data/loader';
import { getActionResults } from '../../engine/eventEngine';
import { getAvailableDialogues } from '../../engine/storyEngine';
import { evaluate } from '../../engine/conditionEvaluator';
import { getHint } from '../../engine/hintEngine';
import type { EvalContext } from '../../engine/conditionEvaluator';
import type { DialogueChoice } from '../../types/game';

type ModalType = 'save' | 'load' | 'settings' | null;

type Grants = {
  flags?: string[];
  clues?: string[];
  items?: string[];
  remove_items?: string[];
  quests?: string[];
  strength?: number | null;
  agility?: number | null;
  wisdom?: number | null;
  constitution?: number | null;
};

type StatKey = 'strength' | 'agility' | 'wisdom' | 'constitution';
interface SceneOps { addFlag: (f: string) => void; addClue: (c: string) => void; addQuest: (q: string) => void; }
interface PlayerOps { incrementStat: (stat: StatKey, val: number) => void; }

function applyGrants(
  grants: Grants | undefined,
  scene: SceneOps,
  addItem: (id: string) => void,
  removeItem: (id: string) => void,
  player: PlayerOps,
) {
  if (!grants) return;
  grants.flags?.forEach((f) => scene.addFlag(f));
  grants.clues?.forEach((c) => scene.addClue(c));
  grants.items?.forEach((i) => addItem(i));
  grants.remove_items?.forEach((i) => removeItem(i));
  grants.quests?.forEach((q) => scene.addQuest(q));
  if (grants.strength != null) player.incrementStat('strength', grants.strength);
  if (grants.agility != null) player.incrementStat('agility', grants.agility);
  if (grants.wisdom != null) player.incrementStat('wisdom', grants.wisdom);
  if (grants.constitution != null) player.incrementStat('constitution', grants.constitution);
}

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
  const [chapterIntroShown, setChapterIntroShown] = useState<number>(() =>
    parseInt(sessionStorage.getItem('tianji-intro-shown') ?? '1', 10)
  );
  const processingRef = useRef(false);
  const prevRoomRef = useRef<string | null>(null);

  useAutoSave();
  useSettings();


  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modal === null) setModal('settings');
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modal]);

  // 重访触发：换房间时检查新线索激活的旧地点提示
  useEffect(() => {
    const roomId = scene.currentRoomId;
    const isRoomChange = prevRoomRef.current !== null && prevRoomRef.current !== roomId;
    prevRoomRef.current = roomId;
    if (!isRoomChange) return;

    const currentRoom = getRoom(roomId);
    if (!currentRoom?.revisitEvents) return;
    for (const rev of currentRoom.revisitEvents) {
      if (evaluate(rev.requires, ctx)) {
        scene.addStoryText(rev.text);
        rev.grants?.flags?.forEach((f) => scene.addFlag(f));
      }
    }
  }, [scene.currentRoomId, ctx]); // eslint-disable-line

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

  const chapter = useMemo<1 | 2 | 3>(() =>
    scene.flags.includes('chapter3_started') ? 3
    : scene.flags.includes('chapter2_started') ? 2
    : 1,
  [scene.flags]);

  const showChapterIntro = chapter > chapterIntroShown;

  const handleIntroComplete = useCallback(() => {
    const next = chapter as number;
    sessionStorage.setItem('tianji-intro-shown', String(next));
    setChapterIntroShown(next);
  }, [chapter]);

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

    const result: Array<{ id: string; label: string; available: boolean; completed: boolean; hint: string; group?: 'npc' | 'event' | 'choice'; eventId?: string; eventTitle?: string; entityName?: string }> = [];

    for (const interactableId of room.interactables) {
      if (interactableId.startsWith('evt_')) {
        const event = getEvent(interactableId);
        if (!event) continue;
        // 执行事件级前置条件（未满足则整个事件不显示）
        if (event.requires && !evaluate(event.requires, ctx)) continue;
        const results = getActionResults(event, ctx);
        for (const r of results) {
          // flag 锁定且未完成的 action 完全隐藏；已完成的透传以显示「已探查」
          if (!r.visible && !r.completed) continue;
          result.push({
            id: `${interactableId}:${r.action.id}`,
            label: r.action.label,
            available: r.available,
            completed: r.completed,
            hint: r.hint,
            group: 'event' as const,
            eventId: interactableId,
            eventTitle: event.title,
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
            label: nextUnseen ? `与${npc.name}交谈` : `与${npc.name}交谈（已对话）`,
            available: true,
            completed: !nextUnseen && dialogues.length > 0,
            hint: '',
            group: 'npc' as const,
            entityName: npc.name,
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
      if (choice.hint) scene.addStoryText(choice.hint);
      applyGrants(choice.grants, scene, addItem, removeItem, player);
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
      if (action.hint) scene.addStoryText(action.hint);
      applyGrants(action.grants, scene, addItem, removeItem, player);
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
      applyGrants(d.grants, scene, addItem, removeItem, player);
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
      <GameLayout
        left={<LeftPanel onNavigate={handleNavigate} />}
        center={
          <CenterPanel
            roomName={room.name}
            roomId={room.id}
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
        right={<RightPanel onSettings={() => setModal('settings')} />}
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

      {showChapterIntro && (
        <ChapterIntro chapter={chapter} onDone={handleIntroComplete} />
      )}

      {showFirstRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-serif"
          style={{ background: 'rgba(10,6,2,0.75)', backdropFilter: 'blur(2px)' }}>
          <div
            className="relative max-w-xs w-full mx-6 px-8 py-7 text-ink"
            style={{
              background: 'linear-gradient(135deg, rgba(26,18,8,0.97) 0%, rgba(22,15,6,0.97) 100%)',
              border: '1px solid rgba(201,168,76,0.25)',
              boxShadow: '0 0 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(201,168,76,0.08)',
            }}
          >
            {/* 角落装饰 */}
            {[['top-2 left-2','border-t border-l'],['top-2 right-2','border-t border-r'],['bottom-2 left-2','border-b border-l'],['bottom-2 right-2','border-b border-r']].map(([pos, cls]) => (
              <div key={pos} className={`absolute ${pos} w-3 h-3 border-gold/30 ${cls}`} />
            ))}

            <div className="text-center mb-5">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="flex-1 h-px bg-gold/20" />
                <span className="text-gold/40 text-[10px] tracking-[0.4em]">入局须知</span>
                <div className="flex-1 h-px bg-gold/20" />
              </div>
              <h2 className="text-gold/90 text-base tracking-[0.3em]">天机残卷</h2>
            </div>

            <div className="space-y-3 mb-6">
              {[
                ['左侧', '可前往的地点，点击即可移动'],
                ['中央', '「人物」区对话 NPC，「探索」区调查场景'],
                ['右侧', '身家 · 物品 · 脉络，三标签切换'],
                ['提示', '卡关时点击行动区右上角「提示」按钮'],
              ].map(([label, desc]) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="text-gold/50 text-[11px] tracking-widest shrink-0 w-6 text-right mt-0.5">{label}</span>
                  <div className="w-px self-stretch bg-gold/15 shrink-0" />
                  <span className="text-ink/55 text-xs leading-relaxed">{desc}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  localStorage.setItem('tianji-firstrun-seen', '1');
                  setShowFirstRun(false);
                }}
                className="btn-jianghu border border-gold/35 text-gold/70 hover:border-gold hover:text-gold px-10 py-2 text-sm tracking-[0.3em] transition-all cursor-pointer"
              >
                踏入江湖
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
