import { StatBar } from '../ui/StatBar';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { getItem } from '../../data/loader';

export function RightPanel() {
  const player = usePlayerStore();
  const { clues, questLog } = useSceneStore();

  const clueItems = clues.map((id) => getItem(id)).filter(Boolean);

  const questLabels: Record<string, string> = {
    quest_main_murder: '调查客栈命案',
    quest_dafei_gang: '大飞帮隐藏线索',
  };

  return (
    <div className="flex flex-col h-full p-3 gap-4 text-sm overflow-y-auto">
      <div>
        <p className="text-gold/60 text-xs mb-2 tracking-widest">【角色属性】</p>
        <div className="space-y-1.5">
          <StatBar label="strength" value={player.strength} />
          <StatBar label="agility" value={player.agility} />
          <StatBar label="wisdom" value={player.wisdom} />
          <StatBar label="constitution" value={player.constitution} />
        </div>
        {player.talent && (
          <p className="mt-2 text-xs text-gold/50">天赋：<span className="text-gold">{player.talent}</span></p>
        )}
      </div>

      <div>
        <p className="text-gold/60 text-xs mb-2 tracking-widest">【线索记录】</p>
        {clueItems.length === 0 ? (
          <p className="text-ink/30 text-xs">尚无线索</p>
        ) : (
          <ul className="space-y-1">
            {clueItems.map((item) => item && (
              <li key={item.id} className="text-xs text-ink/70 flex items-start gap-1">
                <span className="text-gold/50 mt-0.5">·</span>
                <span>{item.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-gold/60 text-xs mb-2 tracking-widest">【当前任务】</p>
        <ul className="space-y-1">
          {questLog.map((qid) => (
            <li key={qid} className="text-xs text-ink/70 flex items-start gap-1">
              <span className="text-gold/50 mt-0.5">◈</span>
              <span>{questLabels[qid] ?? qid}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
