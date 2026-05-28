import { StatBar } from '../ui/StatBar';
import { Tooltip } from '../ui/Tooltip';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { getItem, TALENTS } from '../../data/loader';

const STAT_DESCRIPTIONS: Record<string, string> = {
  strength: '力量\n影响体力检定、破门、格斗等动作',
  agility: '敏捷\n影响潜行、翻越、追踪等动作',
  wisdom: '智慧\n影响推理、识别暗语、解读线索等动作',
  constitution: '根骨\n影响耐毒、抗压、长途行进等动作',
};

const QUEST_HINTS: Record<string, { name: string; hint: string }> = {
  quest_main_murder: {
    name: '调查客栈命案',
    hint: '尝试检查二〇二号房与大堂，\n与掌柜李福交谈可能获得更多线索。\n收集足够的证据后前往废弃宅院。',
  },
  quest_dafei_gang: {
    name: '大飞帮隐藏线索',
    hint: '注意大堂的公告板，\n某些告示可能暗藏玄机。\n试着与饮酒的客人搭话。',
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
        <p className="text-gold/60 text-xs mb-2 tracking-widest">【角色属性】</p>
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
          <Tooltip content={`${talentInfo.description}\n\n${talentInfo.effect}`} position="left">
            <p className="mt-2 text-xs text-gold/50 cursor-help">
              天赋：<span className="text-gold">{player.talent}</span>
              <span className="text-ink/30 ml-1">(?)</span>
            </p>
          </Tooltip>
        )}
      </div>

      <div>
        <p className="text-gold/60 text-xs mb-2 tracking-widest">【线索记录】</p>
        {clueItems.length === 0 ? (
          <p className="text-ink/30 text-xs">尚无线索</p>
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
        <p className="text-gold/60 text-xs mb-2 tracking-widest">【当前任务】</p>
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
                      <span className="text-ink/30 hover:text-gold/50 cursor-help ml-1">?</span>
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
