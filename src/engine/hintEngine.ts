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
      ctx.talent === '望闻断骨' &&
      has(ctx, 'innkeeper_met') &&
      !has(ctx, 'medical_exam_done'),
    hint: '你是医者。前往命案房间，使用「以医者之眼检查」一次性得出死因、毒物和时间——比其他人快得多。',
  },
  {
    when: (ctx) =>
      ctx.talent === '三教九流' &&
      !has(ctx, 'langpeng_discovered'),
    hint: '大堂的醉汉和后巷老乞丐认识你这种人——他们会主动告诉你昨夜发生了什么，不需要你追问。',
  },
  {
    when: (ctx) =>
      has(ctx, 'white_stranger_trust') &&
      !has(ctx, 'learned_wuhen_bu'),
    hint: '白衣人已信任你。继续与他交谈，争取让他传授独门身法——这将开启另一条出路。',
  },
  {
    when: (ctx) =>
      has(ctx, 'learned_wuhen_bu') &&
      !has(ctx, 'innkeeper_trusted'),
    hint: '习得无痕步之后，白衣人指引你去废弃宅院。但宅院还未开放——需先回到客栈大堂，查验尸体后再与掌柜深谈，取得他的信任，才能进入地窖搜寻关键证物。',
  },
  {
    when: (ctx) =>
      has(ctx, 'learned_wuhen_bu') &&
      has(ctx, 'innkeeper_trusted') &&
      !has(ctx, 'cellar_fragment_obtained'),
    hint: '习得无痕步，掌柜已信任你。现在前往地窖（从大堂可到），进入深处打开密室——里面藏着能打开废弃宅院大门的关键碎片。',
  },
  {
    when: (ctx) =>
      has(ctx, 'learned_wuhen_bu') &&
      has(ctx, 'cellar_fragment_obtained') &&
      !has(ctx, 'clue_blood_letter_found'),
    hint: '地窖碎片已得，还差血书令牌——在二楼二〇三号命案房间仔细翻查宋怀义的枕头下方。',
  },
  {
    when: (ctx) =>
      has(ctx, 'learned_wuhen_bu') &&
      has(ctx, 'cellar_fragment_obtained') &&
      has(ctx, 'clue_blood_letter_found') &&
      !has(ctx, 'clue_arsenic_found'),
    hint: '还差砒霜证物。前往后厨（从大堂可到），检查灶台旁倒扣的药罐。',
  },
  {
    when: (ctx) =>
      has(ctx, 'learned_wuhen_bu') &&
      has(ctx, 'cellar_fragment_obtained') &&
      has(ctx, 'clue_blood_letter_found') &&
      has(ctx, 'clue_arsenic_found'),
    hint: '三件证物已齐。前往城郊废弃宅院（从大堂外「城郊树林」方向可到），在正堂找到「无痕步」的出路。',
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
    when: (ctx) =>
      has(ctx, 'beggar_first_talked') &&
      !has(ctx, 'langpeng_discovered') &&
      !hasItem(ctx, 'tavern_wine'),
    hint: '后巷老乞丐说口渴了。回客栈大堂向掌柜李福要一碗酒，再带去给他，他自然会把知道的事全告诉你。',
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
      ctx.talent === '望闻断骨' &&
      hasItem(ctx, 'poison_residue_sample') &&
      !hasItem(ctx, 'monk_identity_scroll'),
    hint: '毒物样本已有。前往慈恩寺偏院的僧房，无迹和尚腕骨有旧伤——你可以主动开口提出为他看诊，以医者之诚换取他的信任，他会亲手交出那份证据。',
  },
  {
    when: (ctx) =>
      ctx.talent !== '望闻断骨' &&
      hasItem(ctx, 'poison_residue_sample') &&
      !hasItem(ctx, 'monk_identity_scroll'),
    hint: '毒物样本已有。找到无迹和尚，他的身份文书是证明李邈参与其中的关键。',
  },
  {
    when: (ctx) =>
      ctx.talent === '望闻断骨' &&
      has(ctx, 'langpeng_trail') &&
      hasItem(ctx, 'langpeng_dispatch_order') &&
      !hasItem(ctx, 'monk_identity_scroll'),
    hint: '调令文书已在手，若觉得三件证据难以凑齐，可直接前往茶馆——「放走」李邈也是一种结束，你手中的证据已足以逼他承认。',
  },
  {
    when: (ctx) =>
      ctx.talent === '官威' &&
      has(ctx, 'langpeng_discovered'),
    hint: '你可以凭官牒直接传唤浪鹏帮成员。前往东市官署，申请公函——这是最直接的路。',
  },
  {
    when: (ctx) =>
      ctx.talent === '耳报神' &&
      !has(ctx, 'langpeng_discovered'),
    hint: '你走南闯北，消息比别人快。东市的摊贩和回春堂的和尚都听说过你，去找他们——不用套话，他们会主动说。',
  },
  {
    when: (ctx) =>
      ctx.talent === '望闻断骨' &&
      !has(ctx, 'wujue_treated'),
    hint: '回春堂的无迹和尚右手有旧伤。你可以为他施治——医者仁心换来的，往往是最诚实的话。',
  },
  {
    when: (ctx) =>
      ctx.talent === '三教九流' &&
      has(ctx, 'langpeng_discovered') &&
      !hasItem(ctx, 'langpeng_dispatch_order'),
    hint: '浪鹏帮据点里的探子认出你了。你也可以走黑市渠道——平康坊深处，有人专门倒卖这种情报。',
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
      has(ctx, 'chapter3_started') &&
      !has(ctx, 'tianji_mission_started') &&
      !has(ctx, 'stele_seen'),
    hint: '第三章伊始，两处可入手：天机安宅（接任务令，了解目标）和大雁塔下（无名碑藏有线索）。两处均可作为起点。',
  },
  {
    when: (ctx) =>
      has(ctx, 'tianji_mission_started') &&
      !has(ctx, 'fei_ye_identity_confirmed') &&
      !has(ctx, 'stele_decoded'),
    hint: '任务令已接，目标是「旧主」。大雁塔下的无名碑是线索起点——碑文藏有天机阁创立者的信息。',
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
      ctx.talent === '耳报神' &&
      !has(ctx, 'tianji_trust_gained'),
    hint: '天机阁有个旧规矩：说书人进门多三成信任。直接报你的身份——联络人会让你进去的。',
  },
  {
    when: (ctx) =>
      ctx.talent === '三教九流' &&
      !has(ctx, 'tianji_trust_gained'),
    hint: '天机安宅的联络人听说过你传递那件物件的旧事。直接说你认识那个飞贼——他会明白的。',
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
