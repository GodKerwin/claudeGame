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
import { getRoom, getEvent, getNPC, getItem, TALENTS } from '../../data/loader';
import { getActionResults } from '../../engine/eventEngine';
import { getAvailableDialogues } from '../../engine/storyEngine';
import { evaluate } from '../../engine/conditionEvaluator';
import { getHint } from '../../engine/hintEngine';
import { audioEngine } from '../../engine/audioEngine';
import type { EvalContext } from '../../engine/conditionEvaluator';
import type { ActionGrant, DialogueChoice } from '../../types/game';

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

const QUEST_NOTIFICATION: Record<string, string> = {
  quest_main_murder: '调查客栈命案',
  quest_dafei_gang:  '大飞帮隐藏线索',
  quest_li_mao_case: '追查李邈',
  quest_find_kite:   '追寻「鸢」的身份',
};

interface SceneOps { addFlag: (f: string) => void; addClue: (c: string) => void; addQuest: (q: string) => void; addStoryText: (text: string) => void; questLog: string[]; }
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
  grants.quests?.forEach((q) => {
    if (!scene.questLog.includes(q)) {
      const name = QUEST_NOTIFICATION[q] ?? q;
      scene.addStoryText(`（新任务已开启：【${name}】）`);
      audioEngine.playSFX('discover');
    }
    scene.addQuest(q);
  });
  if (grants.strength != null) player.incrementStat('strength', grants.strength);
  if (grants.agility != null) player.incrementStat('agility', grants.agility);
  if (grants.wisdom != null) player.incrementStat('wisdom', grants.wisdom);
  if (grants.constitution != null) player.incrementStat('constitution', grants.constitution);
  if (grants.storyText) scene.addStoryText(grants.storyText);
}

interface PendingChoices {
  npcId: string;
  npcName: string;
  choices: DialogueChoice[];
}

interface PendingInterrogation {
  npcId: string;
  npcName: string;
  dialogueId: string;
  prompt: string;
  accepts: string[];
  successResponse: string;
  failResponse: string;
  grants?: ActionGrant;
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
  const [pendingInterrogation, setPendingInterrogation] = useState<PendingInterrogation | null>(null);
  const [endingPending, setEndingPending] = useState(false);
  const processingRef = useRef(false);
  const prevRoomRef = useRef<string | null>(null);
  const shownTalentViewsRef = useRef<Set<string>>(new Set());

  useAutoSave();
  useSettings();


  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (endingPending) { navigate('/chapter-end'); return; }
      if (e.key === 'Escape' && modal === null) setModal('settings');
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modal, endingPending, navigate]);

  useEffect(() => {
    const inChapter3 = scene.flags.includes('chapter3_started');
    const inChapter2 = scene.flags.includes('chapter2_started');
    const endings = inChapter3 ? CHAPTER3_ENDINGS : inChapter2 ? CHAPTER2_ENDINGS : CHAPTER1_ENDINGS;
    if (endings.some((f) => scene.flags.includes(f))) {
      audioEngine.playSFX('chapter');
      setEndingPending(true);
    }
  }, [scene.flags]);

  // 线索数量门槛：达到后自动打 flag，供结局 requires 检查
  useEffect(() => {
    const count = scene.clues.length;
    const inCh3 = scene.flags.includes('chapter3_started');
    const inCh2 = scene.flags.includes('chapter2_started');
    const ch = inCh3 ? 3 : inCh2 ? 2 : 1;
    if (ch === 1 && count >= 9 && !scene.flags.includes('ch1_clues_sufficient'))
      scene.addFlag('ch1_clues_sufficient');
    else if (ch === 2 && count >= 6 && !scene.flags.includes('ch2_clues_sufficient'))
      scene.addFlag('ch2_clues_sufficient');
    else if (ch === 3 && count >= 5 && !scene.flags.includes('ch3_clues_sufficient'))
      scene.addFlag('ch3_clues_sufficient');
  }, [scene.clues.length, scene.flags]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // 重访触发：必须放在 ctx 声明之后，避免 TDZ
  useEffect(() => {
    const roomId = scene.currentRoomId;
    const isRoomChange = prevRoomRef.current !== null && prevRoomRef.current !== roomId;
    prevRoomRef.current = roomId;
    if (!isRoomChange) return;

    const currentRoom = getRoom(roomId);
    if (!currentRoom?.revisitEvents) return;
    let firstRevisit = true;
    for (const rev of currentRoom.revisitEvents) {
      if (evaluate(rev.requires, ctx)) {
        if (firstRevisit && scene.storyText.length > 0) {
          scene.addStoryText('---SEPARATOR---');
          firstRevisit = false;
        }
        scene.addStoryText(rev.text);
        audioEngine.playSFX('hint');
        applyGrants(rev.grants, scene, addItem, removeItem, player);
      }
    }
  }, [scene.currentRoomId, ctx]); // eslint-disable-line

  // 天赋专属调查视角
  useEffect(() => {
    if (!room?.talentViews || !player.talent) return;
    const key = `${room.id}:${player.talent}`;
    if (shownTalentViewsRef.current.has(key)) return;
    const view = room.talentViews.find((v) => v.talent === player.talent);
    if (view) {
      shownTalentViewsRef.current.add(key);
      scene.addStoryText(view.text);
    }
  }, [scene.currentRoomId]); // eslint-disable-line

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
    if (scene.storyText.length > 0) {
      scene.addStoryText('---SEPARATOR---');
    }
    setTimeout(() => { processingRef.current = false; }, 300);

    // 处理对话选项
    if (actionId.startsWith('choice:')) {
      if (!pendingChoices) return;
      const choiceId = actionId.slice('choice:'.length);
      const choice = pendingChoices.choices.find((c) => c.id === choiceId);
      if (!choice) return;
      audioEngine.playSFX('click');
      scene.addStoryText(`【${pendingChoices.npcName}】${choice.response}`);
      if (choice.hint) { scene.addStoryText(choice.hint); audioEngine.playSFX('hint'); }
      if (choice.grants?.clues?.length || choice.grants?.items?.length) audioEngine.playSFX('discover');
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
      // 根据收益选择音效
      const g = action.grants;
      if (g?.clues?.length)        audioEngine.playSFX('discover');
      else if (g?.items?.length)   audioEngine.playSFX('pickup');
      else                         audioEngine.playSFX('click');
      const talentPrefix = action.requires?.talent && action.requires.talent === player.talent
        ? `【天赋·${TALENTS.find((t) => t.id === player.talent)?.name ?? player.talent}】`
        : '';
      scene.addStoryText(talentPrefix ? `${talentPrefix}\n${action.result}` : action.result);
      if (action.hint) { scene.addStoryText(action.hint); audioEngine.playSFX('hint'); }
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
      // 审讯博弈：若该对话有 interrogation，先暂停并请玩家出示证据
      if (nextUnseen.interrogation) {
        setPendingInterrogation({
          npcId: entityId,
          npcName: npc.name,
          dialogueId: nextUnseen.id,
          prompt: nextUnseen.interrogation.prompt,
          accepts: nextUnseen.interrogation.accepts,
          successResponse: nextUnseen.interrogation.successResponse,
          failResponse: nextUnseen.interrogation.failResponse,
          grants: nextUnseen.grants,
        });
        return;
      }
      audioEngine.playSFX('dialogue');
      const d = nextUnseen;
      scene.addStoryText(`【${npc.name}】${d.text}`);
      scene.markDialogueSeen(`ch${chapter}:${entityId}:${d.id}`);
      if (d.grants?.clues?.length || d.grants?.items?.length) audioEngine.playSFX('discover');
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
    setPendingInterrogation(null);
    audioEngine.playSFX('room_change');
    scene.setRoom(roomId);
  }, [scene]);

  const handlePresentEvidence = useCallback((itemId: string) => {
    if (!pendingInterrogation) return;
    const { npcId, npcName, dialogueId, accepts, successResponse, failResponse, grants } = pendingInterrogation;
    const itemName = getItem(itemId)?.name ?? '此物';
    const isCorrect = accepts.includes(itemId);

    scene.addStoryText(`你出示了【${itemName}】。`);
    if (isCorrect) {
      audioEngine.playSFX('discover');
      scene.addStoryText(`【${npcName}】${successResponse}`);
      scene.markDialogueSeen(`ch${chapter}:${npcId}:${dialogueId}`);
      if (grants?.clues?.length || grants?.items?.length) audioEngine.playSFX('pickup');
      applyGrants(grants, scene, addItem, removeItem, player);
    } else {
      audioEngine.playSFX('click');
      scene.addStoryText(`【${npcName}】${failResponse}`);
    }
    setPendingInterrogation(null);
  }, [pendingInterrogation, chapter, scene, addItem, removeItem, player]);

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

  const interrogationAllItems = pendingInterrogation
    ? [
        ...scene.clues.map((id) => {
          const it = getItem(id);
          return it ? { id: it.id, name: it.name, isClue: true } : null;
        }).filter(Boolean) as { id: string; name: string; isClue: boolean }[],
        ...items.map((id) => {
          const it = getItem(id);
          return it && !it.isClue ? { id: it.id, name: it.name, isClue: false } : null;
        }).filter(Boolean) as { id: string; name: string; isClue: boolean }[],
      ]
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
            pendingInterrogation={pendingInterrogation ? {
              npcName: pendingInterrogation.npcName,
              prompt: pendingInterrogation.prompt,
              allItems: interrogationAllItems ?? [],
              onPresent: handlePresentEvidence,
              onCancel: () => setPendingInterrogation(null),
            } : null}
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

      {endingPending && (
        <div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center cursor-pointer select-none panel-fade-in"
          style={{ background: 'rgba(10,6,2,0.92)', backdropFilter: 'blur(4px)' }}
          onClick={() => navigate('/chapter-end')}
        >
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.45))' }} />
              <span className="text-gold/38 text-[9px] tracking-[0.55em]">章节终结</span>
              <div className="w-14 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.45))' }} />
            </div>
            <p className="text-gold/90 text-[26px] tracking-[0.45em]">
              {chapter === 3 ? '第三章·完' : chapter === 2 ? '第二章·完' : '第一章·完'}
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-px bg-gold/25" />
              <div className="w-[5px] h-[5px] bg-gold/35" style={{ transform: 'rotate(45deg)' }} />
              <div className="w-8 h-px bg-gold/25" />
            </div>
            <p className="text-ink/32 text-[11px] tracking-[0.3em] mt-3">点击任意处继续</p>
          </div>
        </div>
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
                ['右侧', '人物 · 物品 · 推理 · 脉络，四标签切换'],
                ['推理', '在推理标签中选择两件线索，可推断它们的关联'],
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
