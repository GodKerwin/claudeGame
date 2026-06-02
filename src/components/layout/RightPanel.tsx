import { useState, useEffect, useRef } from 'react';
import { StatBar } from '../ui/StatBar';
import { Tooltip } from '../ui/Tooltip';
import { DiamondDivider } from '../ui/DiamondDivider';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { getItem, TALENTS, getTemplate, getSynthesisResult, SUSPECT_PROFILES, SYNTHESES } from '../../data/loader';

const STAT_DESCRIPTIONS: Record<string, string> = {
  strength: '力量\n筋骨强健，以力破局。破门、格斗、强行撬锁等动作皆仰仗于此。',
  agility: '敏捷\n身法飘逸，如燕轻盈。潜行、翻越、追踪踪迹等动作皆仰仗于此。',
  wisdom: '智慧\n心思缜密，料事如神。推理、识破暗语、解读线索等动作皆仰仗于此。',
  constitution: '根骨\n体魄坚韧，百折不挠。耐毒、抗压、长途奔袭等动作皆仰仗于此。',
};

const QUEST_HINTS: Record<string, { name: string; hint: string }> = {
  quest_main_murder: {
    name: '调查客栈命案',
    hint: '案发房间与大堂皆有蹊跷可查，\n掌柜李福藏着些话，不妨多问几句。\n线索足够时，可前往城郊废弃宅院。',
  },
  quest_dafei_gang: {
    name: '大飞帮隐藏线索',
    hint: '大堂公告板上的告示不只是告示，\n与醉酒客人攀谈，或许有意外收获。\n深夜的客栈，比白日更藏得住秘密。',
  },
  quest_li_mao_case: {
    name: '追查李邈',
    hint: '东市各处藏有关键证据，\n毒物、身份证明、调令文书缺一不可。\n三件在手，方可面对李邈。',
  },
  quest_find_kite: {
    name: '追寻「鸢」的身份',
    hint: '大雁塔的无名碑藏有天机阁的秘密，\n飞爷故居的画像壁或许有意外发现。\n无迹和尚知道最后的真相。',
  },
};

const QUEST_ENDINGS: Record<string, string[]> = {
  quest_main_murder:  ['chapter1_truth_ending', 'chapter1_force_ending', 'chapter1_hermit_ending'],
  quest_dafei_gang:   ['chapter2_started', 'chapter1_hermit_ending'],
  quest_li_mao_case:  ['chapter2_arrest_ending', 'chapter2_release_ending', 'chapter2_join_ending'],
  quest_find_kite:    ['chapter3_truth_ending', 'chapter3_standoff_ending', 'chapter3_join_ending'],
};

const TIMELINE_FLAGS: Array<{ flag: string; text: string }> = [
  { flag: 'innkeeper_met',           text: '从掌柜李福处得知案发经过' },
  { flag: 'body_examined',           text: '检查宋怀义遗体，死因存疑' },
  { flag: 'medical_exam_done',       text: '医者断定：毒与缢，两手并施' },
  { flag: 'cloth_fiber_found',       text: '现场发现异色布料，凶手留痕' },
  { flag: 'langpeng_discovered',     text: '确认浪鹏帮当夜现身案发地' },
  { flag: 'kite_identity_clue',      text: '「鸢」字印记指向隐秘组织' },
  { flag: 'tianji_records_found',    text: '天机阁旧档重见天日' },
  { flag: 'dafei_contact_made',      text: '与大飞帮建立初步联系' },
  { flag: 'white_stranger_trust',    text: '白衣人身份未明，却予以信任' },
  { flag: 'learned_wuhen_bu',        text: '习得《无痕步》，另辟蹊径' },
  { flag: 'gang_culture_known',      text: '掌握帮派暗语，可与黑市周旋' },
  { flag: 'langpeng_trail',               text: '追踪浪鹏帮至东市据点' },
  { flag: 'wujue_met',                    text: '初见无迹和尚，他似乎知道更多' },
  { flag: 'wujue_treated',               text: '无迹和尚吐露旧伤来历' },
  { flag: 'poison_source_known',          text: '毒物溯源：砒霜配曼陀罗，非市售成药' },
  { flag: 'hideout_trust_gained',         text: '以暗语取得据点成员信任' },
  { flag: 'li_mao_exposed',              text: '李邈身份揭穿，幕后黑手现形' },
  { flag: 'chapter2_join_ending',         text: '选择卧底，潜入浪鹏帮内部' },
  { flag: 'chapter3_started',             text: '天机来令：追查旧主与失踪名单' },
  { flag: 'tianji_contact_met',           text: '初见天机安宅联络人' },
  { flag: 'stele_decoded',               text: '大雁塔碑文破译，创始者浮现' },
  { flag: 'orders_writing_read',          text: '任务令笔迹藏「鸢」字暗记' },
  { flag: 'wujue_tianji_revealed',        text: '无迹和尚承认昔日天机阁风字组身份' },
  { flag: 'fei_ye_tianji_origin_known',   text: '天机阁创立初心：护名单上之人' },
  { flag: 'tianji_trust_gained',          text: '取得天机安宅联络人认可' },
  { flag: 'feiyes_manor_searched',        text: '飞爷旧居画像壁揭开真相' },
  { flag: 'manor_injury_read',            text: '旧居伤痕印证：此处住过飞爷' },
  { flag: 'stele_contacted',              text: '江湖人脉证实：碑后密卷尚在' },
  { flag: 'fei_ye_sighted',              text: '塔下脚印犹新，飞爷近在长安城中' },
  { flag: 'fei_ye_identity_confirmed',    text: '飞爷真实身份已确认' },
  { flag: 'wujue_guilt_revealed',         text: '无迹和尚首次开口，愧疚二十年' },
  { flag: 'wujue_spoke_once',            text: '和尚道出名单埋藏之处' },
  { flag: 'negotiation_opened',           text: '以茶楼令牌开启谈判空间' },
  { flag: 'deeper_threat_revealed',       text: '大飞情报揭露更深层威胁' },
  { flag: 'chapter3_truth_ending',        text: '铁证俱全，真相公之于众' },
  { flag: 'chapter3_standoff_ending',     text: '曲江亭对峙，各守半段真相' },
  { flag: 'chapter3_join_ending',         text: '任务令付之一炬，同守天机名单' },
];

function TalentSeal({ name }: { name: string }) {
  const chars = name.split('');
  const isLong = chars.length > 2;
  const size = isLong ? 36 : 28;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'inline-block', flexShrink: 0 }}>
      <rect x="1.5" y="1.5" width={size - 3} height={size - 3} rx="1"
        fill="rgba(139,26,26,0.08)" stroke="rgba(139,26,26,0.55)" strokeWidth="1" />
      {chars.length <= 2 ? (
        chars.map((c, i) => (
          <text key={i} x={size / 2} y={chars.length === 1 ? size / 2 + 5 : (i === 0 ? 14 : 26)}
            textAnchor="middle" fill="rgba(139,26,26,0.85)"
            fontSize={chars.length === 1 ? 16 : 12} fontFamily="serif" fontWeight="bold">
            {c}
          </text>
        ))
      ) : (
        <>
          <text x={size / 2} y={13} textAnchor="middle" fill="rgba(139,26,26,0.85)" fontSize={9} fontFamily="serif" fontWeight="bold">{chars[0]}{chars[1]}</text>
          <text x={size / 2} y={24} textAnchor="middle" fill="rgba(139,26,26,0.85)" fontSize={9} fontFamily="serif" fontWeight="bold">{chars[2]}{chars[3] ?? ''}</text>
        </>
      )}
    </svg>
  );
}

type Tab = 'stats' | 'items' | 'deduce' | 'lore';

const TAB_LABELS: Record<Tab, string> = { stats: '人物', items: '物品', deduce: '推理', lore: '脉络' };

interface RightPanelProps {
  onSettings?: () => void;
}

export function RightPanel({ onSettings }: RightPanelProps) {
  const [tab, setTab] = useState<Tab>('stats');
  useEffect(() => {
    const tabKeys: Record<string, Tab> = { '1': 'stats', '2': 'items', '3': 'deduce', '4': 'lore' };
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
      const t = tabKeys[e.key];
      if (t) setTab(t);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const [selectedA, setSelectedA] = useState<string | null>(null);

  const [selectedB, setSelectedB] = useState<string | null>(null);
  const [synthResult, setSynthResult] = useState<{ text: string; isNew: boolean } | null>(null);
  const [expandedNpc, setExpandedNpc] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isNewSynth, setIsNewSynth] = useState(false);
  const synthTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const player = usePlayerStore();
  const { clues, questLog, flags, addFlag, foundSynthesisIds, addFoundSynthesisId } = useSceneStore();
  const { items, addItem } = useInventoryStore();

  const lastSeenItemCountRef = useRef(items.length);
  const lastSeenClueCountRef = useRef(clues.length);
  const itemsBadge = items.length > lastSeenItemCountRef.current || clues.length > lastSeenClueCountRef.current;

  useEffect(() => {
    if (tab === 'items') {
      lastSeenItemCountRef.current = items.length;
      lastSeenClueCountRef.current = clues.length;
    }
  }, [tab, items.length, clues.length]);

  const clueItems = clues.map((id) => getItem(id)).filter(Boolean);
  const carriedItems = items.map((id) => getItem(id)).filter((item) => item && !item.isClue);
  const talentInfo = TALENTS.find((t) => t.id === player.talent);
  const baseTemplate = getTemplate(player.template);
  const timelineEntries = TIMELINE_FLAGS.filter((e) => flags.includes(e.flag));

  // Derive synthesis display objects from persisted IDs
  const foundSyntheses = foundSynthesisIds
    .map((id) => SYNTHESES.find((s) => s.id === id))
    .filter(Boolean) as import('../../types/game').Synthesis[];

  // All selectable items for synthesis board
  const allSelectableItems = [
    ...clues.map((id) => getItem(id)).filter(Boolean).map((it) => ({ ...it!, isClue: true })),
    ...items.map((id) => getItem(id)).filter((it) => it && !it.isClue).map((it) => ({ ...it!, isClue: false })),
  ];

  // When selectedA is set, pre-compute which items have a synthesis recipe with it
  const compatibleWithA = selectedA
    ? new Set(
        SYNTHESES
          .filter((s) => s.itemA === selectedA || s.itemB === selectedA)
          .map((s) => (s.itemA === selectedA ? s.itemB : s.itemA))
      )
    : new Set<string>();

  const handleSelectItem = (itemId: string) => {
    if (selectedA === itemId) {
      setSelectedA(null);
      setSynthResult(null);
      return;
    }
    if (selectedB === itemId) {
      setSelectedB(null);
      setSynthResult(null);
      return;
    }
    if (!selectedA) {
      setSelectedA(itemId);
      return;
    }
    if (!selectedB) {
      const newB = itemId;
      setSelectedB(newB);
      // Run synthesis immediately
      const synth = getSynthesisResult(selectedA, newB);
      if (!synth) {
        setSynthResult({ text: '这两件物证之间，暂无关联。', isNew: false });
      } else {
        const alreadyFound = foundSynthesisIds.includes(synth.id);
        if (!alreadyFound) {
          addFoundSynthesisId(synth.id);
          // Apply grants
          synth.grants?.flags?.forEach((f) => addFlag(f));
          synth.grants?.items?.forEach((i) => addItem(i));
          setSynthResult({ text: synth.result, isNew: true });
          setIsNewSynth(true);
          if (synthTimerRef.current) clearTimeout(synthTimerRef.current);
          synthTimerRef.current = setTimeout(() => setIsNewSynth(false), 3000);
        } else {
          setSynthResult({ text: synth.result, isNew: false });
        }
      }
    } else {
      // Reset and start fresh with this item as A
      setSelectedA(itemId);
      setSelectedB(null);
      setSynthResult(null);
    }
  };

  const resetSynthesis = () => {
    setSelectedA(null);
    setSelectedB(null);
    setSynthResult(null);
    if (synthTimerRef.current) clearTimeout(synthTimerRef.current);
    setIsNewSynth(false);
  };

  // Suspect profiles: only show NPCs where at least one fact's flag is in current flags
  const visibleProfiles = SUSPECT_PROFILES.filter((profile) =>
    profile.facts.some((fact) => flags.includes(fact.flag))
  );

  return (
    <div className="flex flex-col h-full text-sm">
      {/* 标签栏 */}
      <div className="flex border-b border-gold/15 shrink-0 items-stretch">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            title={`${TAB_LABELS[t]} (${i + 1})`}
            className={`flex-1 py-2 text-[11px] tracking-widest transition-colors cursor-pointer relative ${
              tab === t
                ? 'text-gold/80 border-b border-gold/55 -mb-px bg-gold/5'
                : 'text-ink/30 hover:text-ink/55'
            }`}
          >
            {TAB_LABELS[t]}
            {t === 'items' && itemsBadge && tab !== 'items' && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blood/70 rounded-full" />
            )}
          </button>
        ))}
        {onSettings && (
          <button
            onClick={onSettings}
            title="设置"
            className="px-2.5 text-ink/25 hover:text-gold/60 transition-colors cursor-pointer border-l border-gold/10 text-[11px] tracking-widest shrink-0"
          >
            ⚙
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        {/* ── 身家 ── */}
        {tab === 'stats' && (
          <div className="space-y-5">
            <div>
              <DiamondDivider label="资质" />
              <div className="space-y-2">
                {(['strength', 'agility', 'wisdom', 'constitution'] as const).map((stat) => {
                  const base = baseTemplate?.stats[stat] ?? player[stat];
                  const delta = player[stat] - base;
                  return (
                    <Tooltip key={stat} content={STAT_DESCRIPTIONS[stat]} position="left">
                      <div className="cursor-help w-full flex items-center gap-1">
                        <div className="flex-1 min-w-0">
                          <StatBar label={stat} value={player[stat]} />
                        </div>
                        {/* 始终占位，避免进度条宽度不一致 */}
                        <span className="w-5 text-right text-[10px] text-gold/50 shrink-0">
                          {delta > 0 ? `+${delta}` : ''}
                        </span>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
            {player.talent && talentInfo && (
              <div>
                <DiamondDivider label="天赋" />
                <Tooltip content={`${talentInfo.name}\n${talentInfo.description}\n${talentInfo.effect}`} position="left">
                  <div className="flex items-center gap-2.5 cursor-help px-1 py-0.5">
                    <TalentSeal name={player.talent} />
                    <div>
                      <p className="text-gold/75 text-xs tracking-wide">{talentInfo.name}</p>
                      <p className="text-ink/35 text-[10px] leading-snug mt-0.5">{talentInfo.description}</p>
                    </div>
                  </div>
                </Tooltip>
              </div>
            )}
            {questLog.length > 0 && (
              <div>
                <DiamondDivider label="未竟之事" />
                <ul className="space-y-3">
                  {questLog.map((qid) => {
                    const q = QUEST_HINTS[qid];
                    const isDone = QUEST_ENDINGS[qid]?.some((f) => flags.includes(f)) ?? false;
                    return (
                      <li key={qid} className="text-xs">
                        <div className="flex items-start gap-1.5 mb-1">
                          <span className={`mt-0.5 shrink-0 text-[10px] ${isDone ? 'text-ink/20' : 'text-gold/40'}`}>
                            {isDone ? '✓' : '▸'}
                          </span>
                          <span className={isDone ? 'text-ink/25 line-through' : 'text-ink/65'}>
                            {q?.name ?? qid}
                          </span>
                          {isDone && (
                            <span className="text-[9px] text-ink/20 ml-1 shrink-0">·已结案</span>
                          )}
                        </div>
                        {q?.hint && !isDone && (
                          <p className="text-ink/28 leading-relaxed pl-3.5 text-[11px] whitespace-pre-line">{q.hint}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── 物品 ── */}
        {tab === 'items' && (
          <div className="space-y-5">
            <div>
              <DiamondDivider label="随身之物" />
              {carriedItems.length === 0 ? (
                <p className="text-ink/20 text-xs pl-3 italic">囊中空空</p>
              ) : (
                <ul className="space-y-1">
                  {carriedItems.map((item) => item && (
                    <li key={item.id} className="text-xs">
                      <button
                        onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                        className="w-full flex items-start gap-1.5 px-1 py-0.5 text-ink/60 hover:text-ink/80 transition-colors group cursor-pointer text-left"
                      >
                        <span className="text-gold/30 mt-0.5 shrink-0 group-hover:text-gold/50 transition-colors">◇</span>
                        <span className="flex-1">{item.name}</span>
                        <span className="text-[9px] text-ink/18 shrink-0 mt-0.5">{expandedItemId === item.id ? '▴' : '▾'}</span>
                      </button>
                      {expandedItemId === item.id && (
                        <p className="text-[11px] text-ink/38 leading-relaxed pl-4 pr-1 pb-1 border-l border-gold/12 ml-1.5">{item.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <DiamondDivider label="线索存档" />
              {clueItems.length === 0 ? (
                <p className="text-ink/20 text-xs pl-3 italic">线索尚无，慢慢查来</p>
              ) : (
                <ul className="space-y-1">
                  {clueItems.map((item) => item && (
                    <li key={item.id} className="text-xs">
                      <button
                        onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                        className="w-full flex items-start gap-1.5 px-1 py-0.5 text-ink/60 hover:text-ink/80 transition-colors group cursor-pointer text-left"
                      >
                        <span className="text-gold/35 mt-0.5 shrink-0 group-hover:text-gold/55 transition-colors">◈</span>
                        <span className="flex-1">{item.name}</span>
                        <span className="text-[9px] text-ink/18 shrink-0 mt-0.5">{expandedItemId === item.id ? '▴' : '▾'}</span>
                      </button>
                      {expandedItemId === item.id && (
                        <p className="text-[11px] text-ink/38 leading-relaxed pl-4 pr-1 pb-1 border-l border-gold/12 ml-1.5">{item.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ── 推理 ── */}
        {tab === 'deduce' && (
          <div className="space-y-5">
            {/* 证据推断 */}
            <div>
              <DiamondDivider label="证据推断" />
              <p className="text-ink/25 text-[10px] pl-1 mb-2 leading-snug">
                {!selectedA
                  ? '选择第一件物证（甲）开始推理'
                  : !selectedB
                    ? `已选甲：${allSelectableItems.find((i) => i.id === selectedA)?.name ?? selectedA}，再选一件物证（乙）`
                    : '推理完成，可重置后继续'}
              </p>
              {allSelectableItems.length === 0 ? (
                <p className="text-ink/20 text-xs pl-3 italic">尚无可用物证</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {allSelectableItems.map((item) => {
                      const isA = selectedA === item.id;
                      const isB = selectedB === item.id;
                      const isSelected = isA || isB;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectItem(item.id)}
                          className={`text-[11px] px-2 py-0.5 border transition-colors cursor-pointer tracking-wide ${
                            isSelected
                              ? 'border-gold/60 text-gold/85 bg-gold/8'
                              : compatibleWithA.has(item.id)
                                ? 'border-gold/35 text-ink/60 hover:border-gold/55 hover:text-ink/80'
                                : 'border-ink/12 text-ink/45 hover:border-gold/30 hover:text-ink/65'
                          }`}
                        >
                          {isA && <span className="text-gold/50 mr-0.5 text-[9px]">甲</span>}
                          {isB && <span className="text-gold/50 mr-0.5 text-[9px]">乙</span>}
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                  {(selectedA || selectedB) && (
                    <button
                      onClick={resetSynthesis}
                      className="text-[10px] text-ink/20 hover:text-ink/40 tracking-widest mb-2 cursor-pointer transition-colors"
                    >
                      重置选择
                    </button>
                  )}
                  {synthResult && (
                    <div className={`border-l-2 pl-3 mb-2 transition-colors duration-700 ${
                      isNewSynth ? 'border-gold/60 bg-gold/6' : synthResult.isNew ? 'border-gold/55' : 'border-ink/15'
                    }`}>
                      {isNewSynth && (
                        <span className="text-[9px] text-gold/65 tracking-[0.2em] mb-1 block">✦ 新推论</span>
                      )}
                      {!isNewSynth && synthResult.isNew && (
                        <span className="text-[9px] text-gold/45 tracking-widest mb-1 block">新发现</span>
                      )}
                      <p className="text-xs leading-relaxed text-ink/70">{synthResult.text}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 已推断记录 */}
            {foundSyntheses.length > 0 && (
              <div>
                <DiamondDivider label="推断记录" />
                <ul className="space-y-2">
                  {foundSyntheses.map((s) => (
                    <li key={s.id} className="border-l border-gold/15 pl-2">
                      <p className="text-[10px] text-gold/40 tracking-wide mb-0.5">{s.hint}</p>
                      <p className="text-[11px] text-ink/45 leading-snug">{s.result}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 人物档案 */}
            {visibleProfiles.length > 0 && (
              <div>
                <DiamondDivider label="人物档案" />
                <div className="space-y-1">
                  {visibleProfiles.map((profile) => {
                    const visibleFacts = profile.facts.filter((f) => flags.includes(f.flag));
                    const isExpanded = expandedNpc === profile.npcId;
                    return (
                      <div key={profile.npcId} className="border-b border-gold/8 last:border-0">
                        <button
                          onClick={() => setExpandedNpc(isExpanded ? null : profile.npcId)}
                          className={`w-full flex items-center gap-2 px-1 py-2 text-left transition-colors cursor-pointer ${
                            isExpanded ? 'text-gold/75' : 'text-ink/55 hover:text-ink/75'
                          }`}
                        >
                          <span className={`text-[9px] shrink-0 ${isExpanded ? 'text-gold/45' : 'text-ink/20'}`}>
                            {isExpanded ? '▾' : '▸'}
                          </span>
                          <span className="text-[13px] flex-1 tracking-wide">{profile.name}</span>
                          <span className="text-[9px] text-ink/20 shrink-0 tabular-nums">
                            {visibleFacts.length}/{profile.facts.length}
                          </span>
                        </button>
                        {isExpanded && (
                          <div className="ml-3 pl-3 border-l border-gold/12 pb-2 space-y-1.5">
                            <p className={`text-[10px] tracking-wide mb-1 ${
                              profile.suspicion.startsWith('可疑') ? 'text-blood/65' : 'text-gold/50'
                            }`}>
                              {profile.suspicion}
                            </p>
                            {visibleFacts.map((fact) => (
                              <div
                                key={fact.flag}
                                className={`text-[11px] leading-snug border-l-2 pl-2 ${
                                  fact.type === 'contradiction'
                                    ? 'border-blood/45 text-blood/60'
                                    : 'border-gold/15 text-ink/55'
                                }`}
                              >
                                {fact.text}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {visibleProfiles.length === 0 && foundSyntheses.length === 0 && (
              <p className="text-ink/20 text-xs pl-3 italic">尚未对任何人物形成印象</p>
            )}
          </div>
        )}

        {/* ── 脉络 ── */}
        {tab === 'lore' && (
          <div className="space-y-5">
            {timelineEntries.length > 0 && (
              <div>
                <DiamondDivider label="已知脉络" />
                <ol className="space-y-1.5 relative pl-3">
                  <div className="absolute left-[5px] top-1 bottom-1 w-px bg-gold/10" />
                  {timelineEntries.map((entry, i) => (
                    <li key={entry.flag} className="flex items-start gap-2">
                      <span
                        className={`shrink-0 mt-[3px] w-[6px] h-[6px] border transition-colors ${
                          i === timelineEntries.length - 1
                            ? 'border-gold/55 bg-gold/25'
                            : 'border-gold/20 bg-transparent'
                        }`}
                        style={{ transform: 'rotate(45deg)' }}
                      />
                      <span className={`text-[11px] leading-snug ${
                        i === timelineEntries.length - 1 ? 'text-ink/60' : 'text-ink/30'
                      }`}>
                        {entry.text}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {timelineEntries.length === 0 && (
              <p className="text-ink/20 text-xs pl-3 italic">案情尚无头绪</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
