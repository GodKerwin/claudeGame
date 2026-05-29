export interface HintContext {
  flags: string[];
  items: string[];
  chapter: 1 | 2 | 3;
  strength: number;
  agility: number;
  wisdom: number;
}

interface HintRule {
  when: (ctx: HintContext) => boolean;
  hint: string;
}

const has = (ctx: HintContext, flag: string) => ctx.flags.includes(flag);
const hasItem = (ctx: HintContext, item: string) => ctx.items.includes(item);

const CHAPTER1_RULES: HintRule[] = [
  {
    when: (ctx) =>
      has(ctx, 'kite_identity_clue') &&
      has(ctx, 'cloth_fiber_found') &&
      has(ctx, 'tianji_records_found'),
    hint: '三条关键证据已齐备。前往废弃宅院，准备揭开真相。',
  },
  {
    when: (ctx) =>
      has(ctx, 'cloth_fiber_found') &&
      has(ctx, 'kite_identity_clue') &&
      !has(ctx, 'tianji_records_found'),
    hint: '物证和身份线索已有，还缺天机阁的档案记录。前往城郊废弃宅院搜寻。',
  },
  {
    when: (ctx) =>
      has(ctx, 'cloth_fiber_found') &&
      !has(ctx, 'kite_identity_clue'),
    hint: '布料纤维已找到。与飞爷深谈，追问「鸢」的身份，这条线索他最清楚。',
  },
  {
    when: (ctx) =>
      has(ctx, 'body_examined') &&
      !has(ctx, 'cloth_fiber_found'),
    hint: '尸体检查过了，但死者手中或许还藏着东西。再仔细检查一遍手部。',
  },
  {
    when: (ctx) =>
      has(ctx, 'white_stranger_trust') &&
      has(ctx, 'learned_wuhen_bu'),
    hint: '白衣人已传授你独门身法。真相未必要揭露，有时沉默才是最好的选择。',
  },
  {
    when: (ctx) =>
      has(ctx, 'white_stranger_trust') &&
      !has(ctx, 'learned_wuhen_bu'),
    hint: '白衣人已信任你。继续与他交谈，争取让他传授独门身法。',
  },
  {
    when: (ctx) =>
      has(ctx, 'tianji_records_found') &&
      !has(ctx, 'kite_identity_clue') &&
      !has(ctx, 'cloth_fiber_found'),
    hint: '天机阁档案已在手。还需要两条线索：物证（尸体）和鸢的身份（飞爷）。',
  },
  {
    when: (ctx) => !has(ctx, 'innkeeper_met'),
    hint: '先与客栈掌柜李福交谈，他最先发现尸体，了解案发经过。',
  },
  {
    when: (ctx) => has(ctx, 'innkeeper_met') && !has(ctx, 'body_examined'),
    hint: '前往二楼命案房间，检查宋怀义的遗体和现场。',
  },
  {
    when: () => true,
    hint: '从往事客栈的案发房间入手，与掌柜和目击者交谈，追查鸢的线索。',
  },
];

const CHAPTER2_RULES: HintRule[] = [
  {
    when: (ctx) =>
      hasItem(ctx, 'poison_residue_sample') &&
      hasItem(ctx, 'monk_identity_scroll') &&
      hasItem(ctx, 'langpeng_dispatch_order'),
    hint: '三件铁证俱在。前往东市与李邈对质，可以将他绳之以法。',
  },
  {
    when: (ctx) =>
      hasItem(ctx, 'poison_residue_sample') &&
      hasItem(ctx, 'monk_identity_scroll') &&
      !hasItem(ctx, 'langpeng_dispatch_order'),
    hint: '还缺浪鹏帮的调令文书。继续追查浪鹏帮在东市的据点。',
  },
  {
    when: (ctx) =>
      has(ctx, 'tianji_recruit_offered') &&
      ctx.agility >= 8 &&
      !has(ctx, 'langpeng_trail'),
    hint: '天机阁向你发出招募，而你的身手已足够。这条路通向意想不到的结局。',
  },
  {
    when: (ctx) => has(ctx, 'langpeng_trail') && !has(ctx, 'langpeng_dispatch_order'),
    hint: '浪鹏帮的踪迹已掌握。若想在茶馆与李邈谈判，须先取得调令文书——那是让他坐下来开口的筹码。',
  },
  {
    when: (ctx) =>
      has(ctx, 'gang_culture_known') &&
      !has(ctx, 'hideout_entered'),
    hint: '你对江湖规矩了如指掌。平康坊据点藏着浪鹏帮的秘密，你的帮派见识或许能派上用场。',
  },
  {
    when: (ctx) => !has(ctx, 'langpeng_discovered'),
    hint: '在东市深处探查，寻找浪鹏帮与此案的关联。大堂公告板和醉汉可能知道更多。',
  },
  {
    when: () => true,
    hint: '在东市四处搜查，从受害者身份和幕后推手两条线同步推进。',
  },
];

const CHAPTER3_RULES: HintRule[] = [
  {
    when: (ctx) =>
      hasItem(ctx, 'teahouse_token') &&
      !has(ctx, 'fei_ye_identity_confirmed'),
    hint: '皇城茶馆的入场牌或许不只是纪念品。与飞爷正面交锋时，它可能打开意想不到的局面。',
  },
  {
    when: (ctx) =>
      hasItem(ctx, 'tianji_founding_scroll') &&
      has(ctx, 'deeper_threat_revealed') &&
      has(ctx, 'fei_ye_identity_confirmed'),
    hint: '证据与真相俱全。前往曲江亭，公开一切的时刻到了。',
  },
  {
    when: (ctx) =>
      has(ctx, 'chapter2_join_ending') &&
      has(ctx, 'tianji_trust_gained') &&
      has(ctx, 'fei_ye_identity_confirmed'),
    hint: '你已赢得信任，也确认了飞爷的身份。前往曲江亭，做出你的选择。',
  },
  {
    when: (ctx) => has(ctx, 'fei_ye_identity_confirmed'),
    hint: '飞爷的身份已确认。前往曲江亭，他在那里等你。',
  },
  {
    when: (ctx) =>
      has(ctx, 'feiyes_manor_searched') &&
      !has(ctx, 'fei_ye_identity_confirmed'),
    hint: '旧居已搜查完毕。与无迹和尚再次交谈，他掌握着最后的证词。',
  },
  {
    when: (ctx) =>
      has(ctx, 'chapter2_join_ending') &&
      !has(ctx, 'tianji_trust_gained'),
    hint: '在天机安宅展示你对阁内的了解，赢得联络人的信任。',
  },
  {
    when: (ctx) =>
      !has(ctx, 'chapter2_join_ending') &&
      !has(ctx, 'tianji_network_seen') &&
      !has(ctx, 'fei_ye_identity_confirmed'),
    hint: '天机安宅向所有追查真相的人敞开大门。前往那里，或许能找到飞爷身份的关键线索。',
  },
  {
    when: (ctx) =>
      (hasItem(ctx, 'tianji_founding_scroll') || has(ctx, 'stele_decoded')) &&
      !has(ctx, 'feiyes_manor_searched'),
    hint: '天机阁的线索已有。前往飞爷故居，查看画像壁，确认他的真实身份。',
  },
  {
    when: (ctx) => !has(ctx, 'stele_decoded') && !hasItem(ctx, 'tianji_founding_scroll'),
    hint: '从大雁塔下的无名碑入手，上面藏着天机阁创始者的信息。',
  },
  {
    when: () => true,
    hint: '追查「鸢」的真实身份：调查无名碑，搜寻飞爷故居，与无迹和尚交谈。',
  },
];

export function getHint(ctx: HintContext): string {
  const rules =
    ctx.chapter === 3
      ? CHAPTER3_RULES
      : ctx.chapter === 2
      ? CHAPTER2_RULES
      : CHAPTER1_RULES;

  for (const rule of rules) {
    if (rule.when(ctx)) return rule.hint;
  }
  return '四处探查，不要放过任何可互动的对象和NPC。';
}
