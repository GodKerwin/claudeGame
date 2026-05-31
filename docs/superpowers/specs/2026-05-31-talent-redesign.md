# 三职业天赋重设计文档

**日期：** 2026-05-31
**范围：** 说书人、游方医、飞贼三个职业天赋的名称、描述与游戏机制全面重设计

---

## 背景与问题

原三个天赋（三寸不烂之舌、毒经百草、夜行百盗）均采用「降低某属性门槛+2」的设计模式，与捕快（官威）和道士（望气观相）相比缺乏独特性：
- 效果同质——都是数值加成
- 与角色身份脱节——说书人的核心优势不是「会说话所以智慧+2」
- 游玩中感受不到差异——不会带来不同的探索路径

---

## 新天赋设计

### 说书人：「耳报神」

**天赋ID：** `耳报神`

**描述：** 走南闯北，消息比人快半步，各地都有说过书的老相识。

**效果说明：** 进入有人的场所自动获得一条「流言」；茶馆、大堂等社交场合，特定NPC见到说书人会主动开口，无需铺垫直接透露信息。

**设计轴：时间差**——别人要追问三步才知道的事，说书人进门就已经听说了。

**机制实现（condition.talent: "耳报神"）：**
- `npc_innkeeper_li_fu` 增加专属对话：认出说书人，主动透露"前几日有人问过宋怀义的住处"
- `npc_drunk_zhang_san` 增加专属对话：认出说书人是江湖中人，主动说出见过蓝衫人的细节
- `npc_old_beggar`（后巷）增加专属对话：乞丐认出是说书人，分享关于那晚后巷异动的情报
- 第二章 `npc_wujue` 增加专属对话：和尚曾听说书人讲过天机阁旧事，多说一层
- 第三章 `npc_tianji_contact` 增加专属对话：联络人听过说书人的名号，信任更易建立

**删除：** conditionEvaluator 中「wisdom门槛-2」的数值加成。

---

### 游方医：「望闻断骨」

**天赋ID：** `望闻断骨`

**描述：** 行医多年，以医者之眼察伤观死——见血知死时，闻气识毒性。

**效果说明：** 检查尸体或伤者时自动解锁医学专属行动，可直接得出其他职业需要拼凑多件物证才能推断的结论；遇到受伤或生病的NPC可主动施救，解锁「医患信任」专属对话。

**设计轴：视角差**——同一具尸体，医者看出的信息比常人多得多。

**机制实现（condition.talent: "望闻断骨"）：**
- `evt_body_examine` 增加专属行动「以医者之眼检查」：一次行动同时得出死亡时间、毒物类别、入针位置三条结论，相当于其他职业的三步合一
- `npc_cook_wang`（厨娘）增加专属对话：她受到惊吓、手在颤抖，游方医可为她把脉安抚，换取她主动说出厨房里看到的事
- 第二章 `npc_wujue` 增加专属对话：和尚右手有旧伤，游方医可为其诊治，换取他多说一层内情
- 第三章 `npc_wujue` 增加专属对话：和尚病重，游方医施救后他道出最后一段证词

**删除：** conditionEvaluator 中「constitution门槛-2」的数值加成；原「毒烟免疫穿行」的事件条件改为不依赖天赋（改为纯constitution门槛或删除该限制）。

---

### 飞贼：「三教九流」

**天赋ID：** `三教九流`

**描述：** 混迹于江湖底层多年，乞丐认得、帮派摸得、黑市进得——认识所有不该认识的人。

**效果说明：** 底层NPC（乞丐、帮派外围、黑市商人）见到飞贼会主动搭话，提供正经人问不出的内幕；可通过黑市渠道获取无法从正规途径得到的线索物品。

**设计轴：渠道差**——信息来源和其他职业完全不同，走的是地下网络而非正规询问。

**机制实现（condition.talent: "三教九流"）：**
- `npc_old_beggar`（后巷）增加专属对话：认出飞贼是同道中人，说出雇主的一条线索（独家情报，其他职业无法从此处得到）
- `npc_drunk_zhang_san` 增加专属对话：其实是个江湖混混，见到飞贼摘下伪装，提供关于蓝衫人的去向
- 第二章 `npc_langpeng_scout` 增加专属对话：帮派探子认出飞贼，愿意以情报换情报
- 第二章新增事件 `evt_ch2_blackmarket_intel`（东市据点房间）：飞贼可通过黑市渠道购买关于李邈的内幕文件
- 第三章 `npc_tianji_contact` 增加专属对话：联络人知道飞贼曾帮天机阁传递过物件，有旧交情

**删除：** conditionEvaluator 中「agility门槛-2」的数值加成。

---

## 受影响文件清单

| 文件 | 操作 |
|------|------|
| `src/data/talents.json` | 替换3个天赋条目（ID、名称、描述、效果文本） |
| `src/data/templates.json` | 更新shuoshuren/youfangyi/feizei的talent字段 |
| `src/engine/conditionEvaluator.ts` | 删除3个旧才能的stat加成逻辑，talent字段引用自动通过`condition.talent`处理 |
| `src/engine/hintEngine.ts` | 将旧天赋ID替换为新ID，更新对应的提示文字 |
| `src/data/npcs/chapter1.json` | 为npc_innkeeper_li_fu、npc_drunk_zhang_san、npc_cook_wang、npc_old_beggar增加专属对话 |
| `src/data/npcs/chapter2.json` | 为npc_wujue、npc_langpeng_scout增加专属对话 |
| `src/data/npcs/chapter3.json` | 为npc_wujue、npc_tianji_contact增加专属对话 |
| `src/data/events/chapter1.json` | evt_body_examine增加望闻断骨专属行动；修改毒烟穿行事件条件 |
| `src/data/events/chapter2.json` | 增加evt_ch2_blackmarket_intel事件 |
| `tests/engine/conditionEvaluator.test.ts` | 更新测试：验证旧加成消失，新天赋名通过talent字段正常工作 |

---

## 不在范围内

- 捕快（官威）和道士（望气观相）不变
- 不新增引擎级功能（无「进入房间自动执行」机制）
- 不修改属性成长系统（incrementStat逻辑不变）
