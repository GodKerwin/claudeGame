import { StatBar } from '../ui/StatBar';
import { Tooltip } from '../ui/Tooltip';
import { DiamondDivider } from '../ui/DiamondDivider';
import { usePlayerStore } from '../../store/playerStore';
import { useSceneStore } from '../../store/sceneStore';
import { useInventoryStore } from '../../store/inventoryStore';
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

// 按触发顺序排列——只显示已触发的条目
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
  { flag: 'langpeng_trail',          text: '追踪浪鹏帮至东市据点' },
  { flag: 'wujue_treated',           text: '无迹和尚吐露旧伤来历' },
  { flag: 'hideout_trust_gained',    text: '以暗语取得据点成员信任' },
  { flag: 'chapter2_join_ending',    text: '选择卧底，潜入浪鹏帮内部' },
  { flag: 'stele_decoded',           text: '大雁塔碑文破译，创始者浮现' },
  { flag: 'tianji_trust_gained',     text: '取得天机安宅联络人认可' },
  { flag: 'feiyes_manor_searched',   text: '飞爷旧居画像壁藏有秘密' },
  { flag: 'fei_ye_identity_confirmed', text: '飞爷真实身份已确认' },
  { flag: 'negotiation_opened',      text: '以茶楼令牌开启谈判空间' },
  { flag: 'deeper_threat_revealed',  text: '大飞情报揭露更深层威胁' },
  { flag: 'wujue_spoke_once',        text: '无迹和尚首次开口，愧疚二十年' },
];

function SectionHeader({ label }: { label: string }) {
  return <DiamondDivider label={label} />;
}

export function RightPanel() {
  const player = usePlayerStore();
  const { clues, questLog, flags } = useSceneStore();
  const { items } = useInventoryStore();

  const clueItems = clues.map((id) => getItem(id)).filter(Boolean);
  const carriedItems = items.map((id) => getItem(id)).filter((item) => item && !item.isClue);
  const talentInfo = TALENTS.find((t) => t.id === player.talent);
  const baseTemplate = getTemplate(player.template);
  const timelineEntries = TIMELINE_FLAGS.filter((e) => flags.includes(e.flag));

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
            <div className="mt-2.5 flex items-center gap-1.5 cursor-help px-1 py-1">
              <span className="text-gold/35 text-[10px]">天赋</span>
              <div className="w-px h-3 bg-gold/20 shrink-0" />
              <span className="text-gold/75 text-xs">{player.talent}</span>
              <span className="text-ink/20 text-[9px] ml-auto">?</span>
            </div>
          </Tooltip>
        )}
      </div>

      {/* 随身之物 */}
      {carriedItems.length > 0 && (
        <div>
          <SectionHeader label="随身之物" />
          <ul className="space-y-1">
            {carriedItems.map((item) => item && (
              <Tooltip key={item.id} content={item.description} position="left">
                <li className="text-xs text-ink/60 flex items-start gap-1.5 cursor-help px-1 py-0.5 hover:text-ink/80 transition-colors group">
                  <span className="text-gold/30 mt-0.5 shrink-0 group-hover:text-gold/50 transition-colors">◇</span>
                  <span>{item.name}</span>
                </li>
              </Tooltip>
            ))}
          </ul>
        </div>
      )}

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

      {/* 案件时间线 */}
      {timelineEntries.length > 0 && (
        <div>
          <SectionHeader label="已知脉络" />
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
