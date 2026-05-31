export interface HintContext {
  flags: string[];
  items: string[];
  chapter: 1 | 2 | 3;
  strength: number;
  agility: number;
  wisdom: number;
  constitution: number;
  talent: string;
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
    hint: '三条关键证据已齐备。前往城郊废弃宅院，揭开「鸢」的真面目。',
  },
  {
    when: (ctx) =>
      has(ctx, 'body_examined') &&
      has(ctx, 'kite_identity_clue') &&
      !has(ctx, 'tianji_records_found'),
    hint: '已有物证和身份线索。前往城郊废弃宅院（从客栈大堂可前往），搜寻天机阁的档案记录。',
  },
  {
    when: (ctx) =>
      has(ctx, 'body_examined') &&
      has(ctx, 'cloth_fiber_found') &&
      !has(ctx, 'kite_identity_clue'),
    hint: '布料纤维已找到。找到飞爷，与他深谈，追问「鸢」的身份——他知道内情。',
  },
  {
    when: (ctx) =>
      has(ctx, 'body_examined') &&
      !has(ctx, 'cloth_fiber_found') &&
      !has(ctx, 'kite_identity_clue'),
    hint: '尸体已检查。再仔细检查死者的手部，可能还有遗漏的物证。同时找飞爷了解案情背景。',
  },
  {
    when: (ctx) =>
      ctx.talent === '官威' &&
      has(ctx, 'innkeeper_met') &&
      !has(ctx, 'body_examined'),
    hint: '你持有官牒，可直接要求掌柜带路进入命案房间，无需额外周旋。',
  },
  {
    when: (ctx) =>
      ctx.talent === '望气观相' &&
      has(ctx, 'innkeeper_met') &&
      !has(ctx, 'body_examined'),
    hint: '以道法观气，命案房间必有残留的阴煞之气。前往二楼，你的感知会引导你找到关键之处。',
  },
  {
    when: (ctx) =>
      ctx.talent === '毒经百草' &&
      has(ctx, 'body_examined'),
    hint: '你的医术告诉你，死者身上的症状不像外伤所致。寻找毒物相关线索，从案发房间的角落入手。',
  },
  {
    when: (ctx) =>
      ctx.talent === '夜行百盗' &&
      !has(ctx, 'secret_room_opened'),
    hint: '你注意到客栈有些门上了锁，但锁对你来说不过是摆设。夜间行事，客栈二楼有可疑之处。',
  },
  {
    when: (ctx) =>
      has(ctx, 'white_stranger_trust') &&
      !has(ctx, 'learned_wuhen_bu'),
    hint: '白衣人已信任你。继续与他交谈，争取让他传授独门身法——这将开启另一条出路。',
  },
  {
    when: (ctx) =>
      ctx.wisdom >= 7 &&
      has(ctx, 'innkeeper_met') &&
      !has(ctx, 'body_examined'),
    hint: '你的智慧告诉你，掌柜的描述有些地方对不上。前往二楼命案房间，亲眼核实。',
  },
  {
    when: (ctx) => !has(ctx, 'innkeeper_met'),
    hint: '先与客栈掌柜李福交谈（他在大堂）。他第一个发现尸体，是了解案发经过的最佳入口。',
  },
  {
    when: (ctx) => has(ctx, 'innkeeper_met') && !has(ctx, 'body_examined'),
    hint: '前往二楼命案房间（从大堂可以前往），检查宋怀义的尸体和现场痕迹。',
  },
  {
    when: () => true,
    hint: '从客栈大堂的掌柜入手，了解案发经过，再去二楼检查命案现场。',
  },
];

const CHAPTER2_RULES: HintRule[] = [
  {
    when: (ctx) =>
      hasItem(ctx, 'poison_residue_sample') &&
      hasItem(ctx, 'monk_identity_scroll') &&
      hasItem(ctx, 'langpeng_dispatch_order'),
    hint: '三件铁证俱在。前往东市茶馆，与李邈正面对质，将其绳之以法。',
  },
  {
    when: (ctx) =>
      hasItem(ctx, 'poison_residue_sample') &&
      hasItem(ctx, 'monk_identity_scroll') &&
      !hasItem(ctx, 'langpeng_dispatch_order'),
    hint: '还缺浪鹏帮调令文书。前往东市深处的浪鹏帮据点（平康坊方向），搜寻文书。',
  },
  {
    when: (ctx) =>
      hasItem(ctx, 'poison_residue_sample') &&
      !hasItem(ctx, 'monk_identity_scroll'),
    hint: '毒物样本已有。找到无迹和尚，他的身份文书是证明李邈参与其中的关键。',
  },
  {
    when: (ctx) =>
      ctx.talent === '官威' &&
      has(ctx, 'langpeng_discovered'),
    hint: '你可以凭官牒直接传唤浪鹏帮成员。前往东市官署，申请公函——这是最直接的路。',
  },
  {
    when: (ctx) =>
      ctx.talent === '三寸不烂之舌' &&
      !has(ctx, 'langpeng_discovered'),
    hint: '你在茶馆与说书摊混迹多年，消息灵通。找几个东市的老摊贩闲聊，浪鹏帮的风声自然会来。',
  },
  {
    when: (ctx) =>
      ctx.talent === '毒经百草' &&
      !hasItem(ctx, 'poison_residue_sample'),
    hint: '你闻到了空气中若有若无的气味——那是某种特殊植物提炼的毒素。追着这气味走，能找到毒物来源。',
  },
  {
    when: (ctx) =>
      ctx.talent === '夜行百盗' &&
      has(ctx, 'langpeng_discovered') &&
      !hasItem(ctx, 'langpeng_dispatch_order'),
    hint: '浪鹏帮的据点你已摸清。夜间潜入，文书就在帮主的内室，锁对你而言不是问题。',
  },
  {
    when: (ctx) => has(ctx, 'langpeng_trail') && !hasItem(ctx, 'langpeng_dispatch_order'),
    hint: '已掌握浪鹏帮踪迹。前往平康坊据点，调令文书是让李邈开口的筹码。',
  },
  {
    when: (ctx) => !has(ctx, 'langpeng_discovered'),
    hint: '在东市探查浪鹏帮踪迹。公告板上有线索，东市深处的醉汉也可能知道内情。',
  },
  {
    when: () => true,
    hint: '东市之事分两条线：查毒物来源（无迹和尚），查幕后主使（浪鹏帮→李邈）。两线汇合才能结案。',
  },
];

const CHAPTER3_RULES: HintRule[] = [
  {
    when: (ctx) =>
      hasItem(ctx, 'tianji_founding_scroll') &&
      has(ctx, 'fei_ye_identity_confirmed'),
    hint: '证据与真相俱全。前往曲江亭，飞爷在那里等你——做出你的最终选择。',
  },
  {
    when: (ctx) =>
      has(ctx, 'fei_ye_identity_confirmed') &&
      !hasItem(ctx, 'tianji_founding_scroll'),
    hint: '飞爷身份已确认，但还缺天机阁创始档案作为铁证。大雁塔下的无名碑藏有线索。',
  },
  {
    when: (ctx) =>
      ctx.talent === '官威' &&
      has(ctx, 'fei_ye_identity_confirmed'),
    hint: '你有官牒。飞爷的身份一经坐实，可直接持令拘捕——前往曲江亭执行。',
  },
  {
    when: (ctx) =>
      ctx.talent === '望气观相' &&
      !has(ctx, 'fei_ye_identity_confirmed'),
    hint: '飞爷旧居的画像壁藏有气息——你走进那间屋子就会感知到。前往飞爷故居。',
  },
  {
    when: (ctx) =>
      ctx.talent === '三寸不烂之舌' &&
      !has(ctx, 'tianji_trust_gained'),
    hint: '天机安宅的联络人是个谨慎的人。讲一个关于「鸢」的故事给他听——人都爱听故事。',
  },
  {
    when: (ctx) =>
      ctx.talent === '夜行百盗' &&
      !has(ctx, 'feiyes_manor_searched'),
    hint: '飞爷故居戒备森严，但屋顶对你来说就是平地。夜里翻进去，画像壁就在正厅。',
  },
  {
    when: (ctx) =>
      has(ctx, 'feiyes_manor_searched') &&
      !has(ctx, 'fei_ye_identity_confirmed'),
    hint: '旧居已搜查完毕。与无迹和尚再次交谈，他掌握最后的证词，是最终拼图。',
  },
  {
    when: (ctx) =>
      has(ctx, 'chapter2_join_ending') &&
      !has(ctx, 'tianji_trust_gained'),
    hint: '你曾加入天机阁。前往天机安宅，向联络人展示你对阁内事务的了解，重获信任。',
  },
  {
    when: (ctx) => !has(ctx, 'stele_decoded') && !hasItem(ctx, 'tianji_founding_scroll'),
    hint: '从大雁塔下的无名碑入手（从曲江池可前往），碑文藏着天机阁创始者的信息。',
  },
  {
    when: (ctx) =>
      (has(ctx, 'stele_decoded') || hasItem(ctx, 'tianji_founding_scroll')) &&
      !has(ctx, 'feiyes_manor_searched'),
    hint: '线索指向一个人。前往城西飞爷旧居，画像壁上藏着你需要的最后一块拼图。',
  },
  {
    when: () => true,
    hint: '追查「鸢」身份：大雁塔无名碑→飞爷旧居画像壁→无迹和尚证词→曲江亭终局。',
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
  return '四处探查，与每位NPC交谈，不要放过任何可互动的事件。';
}
