import { StatBar } from '../ui/StatBar';
import { Tooltip } from '../ui/Tooltip';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { getItem, TALENTS, getTemplate } from '../../data/loader';

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

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="w-1 h-1 rounded-full bg-gold/35 shrink-0" />
      <span className="text-gold/40 text-[10px] tracking-[0.25em]">{label}</span>
      <div className="flex-1 h-px bg-gold/10" />
    </div>
  );
}

export function RightPanel() {
  const player = usePlayerStore();
  const { clues, questLog } = useSceneStore();

  const clueItems = clues.map((id) => getItem(id)).filter(Boolean);
  const talentInfo = TALENTS.find((t) => t.id === player.talent);
  const baseTemplate = getTemplate(player.template);

  return (
    <div className="flex flex-col h-full p-3 gap-5 text-sm overflow-y-auto scrollbar-thin">
      {/* 身家底细 */}
      <div>
        <SectionHeader label="身家底细" />
        <div className="space-y-2">
          {(['strength', 'agility', 'wisdom', 'constitution'] as const).map((stat) => {
            const base = baseTemplate?.stats[stat] ?? player[stat];
            const delta = player[stat] - base;
            return (
              <Tooltip key={stat} content={STAT_DESCRIPTIONS[stat]} position="left">
                <div className="cursor-help w-full flex items-center gap-1">
                  <div className="flex-1">
                    <StatBar label={stat} value={player[stat]} />
                  </div>
                  {delta > 0 && (
                    <span className="text-[10px] text-gold/50 shrink-0 ml-0.5">+{delta}</span>
                  )}
                </div>
              </Tooltip>
            );
          })}
        </div>
        {player.talent && talentInfo && (
          <Tooltip content={`${talentInfo.name}\n${talentInfo.description}\n${talentInfo.effect}`} position="left">
            <div className="mt-2.5 flex items-center gap-1.5 cursor-help border border-gold/12 px-2 py-1.5 bg-gold/3">
              <span className="text-gold/35 text-[10px]">天赋</span>
              <div className="w-px h-3 bg-gold/20 shrink-0" />
              <span className="text-gold/75 text-xs">{player.talent}</span>
              <span className="text-ink/20 text-[9px] ml-auto">?</span>
            </div>
          </Tooltip>
        )}
      </div>

      {/* 线索存档 */}
      <div>
        <SectionHeader label="线索存档" />
        {clueItems.length === 0 ? (
          <p className="text-ink/20 text-xs pl-3 italic">线索尚无，慢慢查来</p>
        ) : (
          <ul className="space-y-1">
            {clueItems.map((item) => item && (
              <Tooltip key={item.id} content={item.description} position="left">
                <li className="text-xs text-ink/60 flex items-start gap-1.5 cursor-help px-1 py-0.5 hover:text-ink/80 transition-colors group">
                  <span className="text-gold/35 mt-0.5 shrink-0 group-hover:text-gold/55 transition-colors">◈</span>
                  <span>{item.name}</span>
                </li>
              </Tooltip>
            ))}
          </ul>
        )}
      </div>

      {/* 未竟之事 */}
      {questLog.length > 0 && (
        <div>
          <SectionHeader label="未竟之事" />
          <ul className="space-y-3">
            {questLog.map((qid) => {
              const q = QUEST_HINTS[qid];
              return (
                <li key={qid} className="text-xs">
                  <div className="flex items-start gap-1.5 mb-1">
                    <span className="text-gold/40 mt-0.5 shrink-0 text-[10px]">▸</span>
                    <span className="text-ink/65">{q?.name ?? qid}</span>
                  </div>
                  {q?.hint && (
                    <p className="text-ink/28 leading-relaxed pl-3.5 text-[11px] whitespace-pre-line">{q.hint}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
