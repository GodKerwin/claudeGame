# 天机残卷 开发交接文档

> **给另一台电脑的 Claude Code：** 直接从 Task 5 继续实现，不要重新规划。

## 当前进度

| Task | 状态 | 说明 |
|------|------|------|
| Task 1：修复"?"字符显示 | ✅ DONE | `RightPanel.tsx:93` 已加 `font-sans min-w-[1em]` |
| Task 2：NPC跨章节对话锁定 | ✅ DONE | `saveEngine.ts` 迁移函数 + `Game.tsx` 章节前缀键 |
| Task 3：ActionGrant属性成长 | ✅ DONE | `game.ts` 扩展 + `playerStore.ts` `incrementStat` + `Game.tsx` 3处grant处理 |
| Task 4：移动端底部标签栏 | ✅ DONE | `GameLayout.tsx` 重写，md断点切换，ARIA无障碍 |
| **Task 5：全新职业与天赋** | **⏳ 待实现** | 见下方详细说明 |
| Task 6：更新旧天赋引用 | ⏳ 待实现 | |
| Task 7：简化角色创建页面 | ⏳ 待实现 | |
| Task 8：添加属性成长事件 | ⏳ 待实现 | |
| Task 9：重写提示系统 | ⏳ 待实现 | |
| Task 10：RightPanel成长Delta | ⏳ 待实现 | |
| Task 11：全量测试验证 | ⏳ 待实现 | |

**最后提交SHA:** `a1c55ec`  
**完整实现计划:** `docs/superpowers/plans/2026-05-29-game-improvements.md`

---

## Task 5：全新职业与天赋数据（下一步）

### 需要修改的文件
- `src/data/templates.json` — 完整替换为5个新职业
- `src/data/talents.json` — 完整替换为5个新天赋
- `src/engine/conditionEvaluator.ts` — 更新天赋加成逻辑
- `tests/engine/conditionEvaluator.test.ts` — 替换旧天赋测试

### 5个新职业（替换 templates.json）

```json
[
  {
    "id": "bukai",
    "name": "捕快",
    "description": "奉旨缉拿的官差，以权破局，公正严明。",
    "flavor": "「天子脚下，法度森严，犯我大唐者，虽远必诛。」",
    "stats": { "strength": 8, "agility": 5, "wisdom": 7, "constitution": 4 },
    "talent": "官威"
  },
  {
    "id": "daoshi",
    "name": "道士",
    "description": "玄门行者，以观破局，洞察天机。",
    "flavor": "「道可道，非常道。名可名，非常名。」",
    "stats": { "strength": 3, "agility": 5, "wisdom": 9, "constitution": 7 },
    "talent": "望气观相"
  },
  {
    "id": "shuoshuren",
    "name": "说书人",
    "description": "走江湖的艺人，以言破局，消息灵通。",
    "flavor": "「一张嘴，走遍天下路；三寸舌，抵得千军万马。」",
    "stats": { "strength": 3, "agility": 7, "wisdom": 8, "constitution": 4 },
    "talent": "三寸不烂之舌"
  },
  {
    "id": "youfangyi",
    "name": "游方医",
    "description": "走方郎中，以医破局，悬壶济世。",
    "flavor": "「救人一命，胜造七级浮屠。」",
    "stats": { "strength": 4, "agility": 5, "wisdom": 6, "constitution": 9 },
    "talent": "毒经百草"
  },
  {
    "id": "feizei",
    "name": "飞贼",
    "description": "夜行的江湖客，以快破局，飞檐走壁。",
    "flavor": "「最好的证据，是别人不知道你已经拿走了。」",
    "stats": { "strength": 7, "agility": 10, "wisdom": 4, "constitution": 4 },
    "talent": "夜行百盗"
  }
]
```

### 5个新天赋（替换 talents.json）

```json
[
  {
    "id": "官威",
    "name": "官威",
    "description": "持有官牒，名正言顺，可强令盘问任何人。",
    "effect": "可对NPC发动「审讯」专属选项；可开启官方档案及官员通道"
  },
  {
    "id": "望气观相",
    "name": "望气观相",
    "description": "以道法观天地气数，见微知著，洞悉人心。",
    "effect": "进入场景自动触发隐藏环境线索；与NPC交谈时显示对方情绪提示"
  },
  {
    "id": "三寸不烂之舌",
    "name": "三寸不烂之舌",
    "description": "走南闯北，一张嘴能说天下，人脉广布各行各业。",
    "effect": "解锁「说书劝说」NPC专属对话；智慧类社交事件门槛降低2点"
  },
  {
    "id": "毒经百草",
    "name": "毒经百草",
    "description": "通晓百草药理，百毒不侵，以毒攻毒，以药救人。",
    "effect": "免疫毒素区域；根骨门槛降低2点（毒物相关事件）；可为NPC疗伤换取信任"
  },
  {
    "id": "夜行百盗",
    "name": "夜行百盗",
    "description": "夜行江湖多年，身手矫健，无门不入。",
    "effect": "可进入「禁止进入」区域；敏捷门槛降低2点（潜行追踪事件）"
  }
]
```

### conditionEvaluator.ts 天赋加成逻辑

将现有的 wisdom/strength/agility/constitution 判断块替换为：

```typescript
if (condition.wisdom !== undefined) {
  const bonus = player.talent === '三寸不烂之舌' ? 2 : 0;
  if (player.wisdom + bonus < condition.wisdom) return false;
}
if (condition.strength !== undefined) {
  if (player.strength < condition.strength) return false;
}
if (condition.agility !== undefined) {
  const bonus = player.talent === '夜行百盗' ? 2 : 0;
  if (player.agility + bonus < condition.agility) return false;
}
if (condition.constitution !== undefined) {
  const bonus = player.talent === '毒经百草' ? 2 : 0;
  if (player.constitution + bonus < condition.constitution) return false;
}
```

### conditionEvaluator.test.ts 新测试（替换旧天赋测试）

找到并替换测试文件中涉及 `机关奇才` 和 `天生神力` 的旧测试，改为：

```typescript
it('talent 三寸不烂之舌 reduces wisdom requirement by 2', () => {
  const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '三寸不烂之舌' } };
  expect(evaluate({ wisdom: 8 }, ctx)).toBe(true);
});

it('talent 夜行百盗 reduces agility requirement by 2', () => {
  const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '夜行百盗' } };
  expect(evaluate({ agility: 8 }, ctx)).toBe(true);
});

it('talent 毒经百草 reduces constitution requirement by 2', () => {
  const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '毒经百草' } };
  expect(evaluate({ constitution: 8 }, ctx)).toBe(true);
});

it('other talents do not get wisdom bonus', () => {
  const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '官威' } };
  expect(evaluate({ wisdom: 8 }, ctx)).toBe(false);
});
```

### Task 5 执行顺序

1. 替换 `tests/engine/conditionEvaluator.test.ts` 中的旧天赋测试（先写失败测试）
2. 运行 `npm test -- tests/engine/conditionEvaluator.test.ts` 确认新测试失败
3. 替换 `src/data/templates.json`
4. 替换 `src/data/talents.json`
5. 更新 `src/engine/conditionEvaluator.ts` 中的属性加成逻辑
6. 运行 `npm test -- tests/engine/conditionEvaluator.test.ts` 确认通过
7. 运行 `npm test` 确认全量通过
8. 提交：`git commit -m "feat: 全新五大职业设计，重写天赋系统与条件评估逻辑"`

---

## 关键架构说明

- **seenDialogues 格式**: `ch{n}:npcId:dialogueId`（已迁移，旧数据自动加 `ch1:` 前缀）
- **chapter 常量位置**: `Game.tsx` 约75行（`const room = ...` 之后）
- **`!= null` 守卫**: stat grants 用 `!= null`，不用 `if (x)` 避免0值被忽略
- **playerStore.incrementStat**: 上限12，`Math.min(12, s[stat] + amount)`
- **移动端断点**: Tailwind `md:` = 768px，手机端显示底部标签栏

## 旧天赋 → 新天赋 映射（Task 6用）

| 旧ID | 新ID |
|------|------|
| `过目不忘` | `望气观相` |
| `江湖老千` | `三寸不烂之舌` |
| `毒体` | `毒经百草` |
| `察言观色` | `三寸不烂之舌` |
| `机关奇才` | `三寸不烂之舌` |
| `天生神力` | （移除，无对应） |

## 测试情况

- 当前通过测试：111条
- 测试框架：Vitest
- 运行命令：`npm test`
- 类型检查：`npx tsc --noEmit`
