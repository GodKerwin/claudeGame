import { StatBar } from '../ui/StatBar';
import { Tooltip } from '../ui/Tooltip';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { getItem, TALENTS } from '../../data/loader';

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

export function RightPanel() {
  const player = usePlayerStore();
  const { clues, questLog } = useSceneStore();

  const clueItems = clues.map((id) => getItem(id)).filter(Boolean);
  const talentInfo = TALENTS.find((t) => t.id === player.talent);

  return (
    <div className="flex flex-col h-full p-3 gap-4 text-sm overflow-y-auto">
      <div>
        <p className="text-gold/60 text-xs mb-2 tracking-widest">【身家底细】</p>
        <div className="space-y-1.5">
          {(['strength', 'agility', 'wisdom', 'constitution'] as const).map((stat) => (
            <Tooltip key={stat} content={STAT_DESCRIPTIONS[stat]} position="left">
              <div className="cursor-help w-full">
                <StatBar label={stat} value={player[stat]} />
              </div>
            </Tooltip>
          ))}
        </div>
        {player.talent && talentInfo && (
          <Tooltip content={`${talentInfo.name}\n${talentInfo.description}\n${talentInfo.effect}`} position="left">
            <p className="mt-2 text-xs text-gold/50 cursor-help">
              天赋：<span className="text-gold">{player.talent}</span>
              <span className="text-ink/30 ml-1">(?)</span>
            </p>
          </Tooltip>
        )}
      </div>

      <div>
        <p className="text-gold/60 text-xs mb-2 tracking-widest">【线索存档】</p>
        {clueItems.length === 0 ? (
          <p className="text-ink/30 text-xs">线索尚无，慢慢查来</p>
        ) : (
          <ul className="space-y-1">
            {clueItems.map((item) => item && (
              <Tooltip key={item.id} content={item.description} position="left">
                <li className="text-xs text-ink/70 flex items-start gap-1 cursor-help">
                  <span className="text-gold/50 mt-0.5">·</span>
                  <span>{item.name}</span>
                </li>
              </Tooltip>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-gold/60 text-xs mb-2 tracking-widest">【未竟之事】</p>
        <ul className="space-y-2">
          {questLog.map((qid) => {
            const q = QUEST_HINTS[qid];
            return (
              <li key={qid} className="text-xs text-ink/70">
                <div className="flex items-start gap-1">
                  <span className="text-gold/50 mt-0.5">◈</span>
                  <span className="flex-1">{q?.name ?? qid}</span>
                  {q?.hint && (
                    <Tooltip content={q.hint} position="left">
                      <span className="font-sans inline-block min-w-[1em] text-center text-ink/30 hover:text-gold/50 cursor-help ml-1">?</span>
                    </Tooltip>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
