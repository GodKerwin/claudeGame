import type { GameEvent, EventAction, Condition } from '../types/game';
import { evaluate, isActionVisible } from './conditionEvaluator';
import type { EvalContext } from './conditionEvaluator';
import { getItem } from '../data/loader';

export interface ActionResult {
  action: EventAction;
  available: boolean;
  completed: boolean;
  hint: string;
  visible: boolean;
}

export function getActionResults(event: GameEvent, ctx: EvalContext): ActionResult[] {
  return event.actions.map((action) => ({
    action,
    available: evaluate(action.requires, ctx),
    completed: isCompleted(action, ctx),
    hint: getMissingConditionLabel(action.requires, ctx),
    visible: isActionVisible(action.requires, ctx),
  }));
}

function isCompleted(action: EventAction, ctx: EvalContext): boolean {
  if (!action.requires?.flags_absent?.length) return false;
  if (evaluate(action.requires, ctx)) return false;
  const { flags_absent: _fa, ...rest } = action.requires;
  const hasOtherConditions = Object.keys(rest).length > 0;
  return hasOtherConditions ? evaluate(rest as Condition, ctx) : true;
}

export function canExecuteAction(action: EventAction, ctx: EvalContext): boolean {
  return evaluate(action.requires, ctx);
}

const SPECIFIC_FLAG_HINTS: Record<string, string> = {
  cook_talked:             '还未向厨娘问话——她是毒茶的关键目击者',
  drunk_talked:            '还未向醉汉询问——他当夜见过可疑人影',
  ch1_clues_sufficient:    '收集的线索还不充分，仍有关键证物未找到',
  wujue_tianji_revealed:   '无迹和尚尚未开口——需先以证据当面质问他',
  ch2_clues_sufficient:    '收集的线索还不充分，案情尚不全面',
  ch3_clues_sufficient:    '收集的线索还不充分，真相尚未完整呈现',
};

export function getMissingConditionLabel(condition: Condition | null | undefined, ctx: EvalContext): string {
  if (!condition || evaluate(condition, ctx)) return '';
  const hints: string[] = [];
  if (condition.wisdom !== undefined && ctx.player.wisdom < condition.wisdom)
    hints.push(`需要智慧 ≥ ${condition.wisdom}`);
  if (condition.strength !== undefined && ctx.player.strength < condition.strength)
    hints.push(`需要力量 ≥ ${condition.strength}`);
  if (condition.agility !== undefined && ctx.player.agility < condition.agility)
    hints.push(`需要敏捷 ≥ ${condition.agility}`);
  if (condition.constitution !== undefined && ctx.player.constitution < condition.constitution)
    hints.push(`需要根骨 ≥ ${condition.constitution}`);
  if (condition.talent !== undefined && ctx.player.talent !== condition.talent)
    hints.push(`需要天赋「${condition.talent}」`);
  if (condition.has) {
    const missingNames = condition.has
      .filter((itemId) => !ctx.inventory.includes(itemId))
      .map((itemId) => getItem(itemId)?.name ?? itemId);
    if (missingNames.length > 0) hints.push(`缺少：${missingNames.join('、')}`);
  }
  if (condition.flags) {
    const missingFlags = condition.flags.filter((f) => !ctx.flags.includes(f));
    const missingSynths = missingFlags.filter((f) => f.startsWith('synth_'));
    const missingOthers = missingFlags.filter((f) => !f.startsWith('synth_'));
    if (missingSynths.length > 0)
      hints.push(`需先在推理页完成关键推断（还差 ${missingSynths.length} 个）`);
    for (const f of missingOthers) {
      const msg = SPECIFIC_FLAG_HINTS[f];
      if (msg) hints.push(msg);
    }
    const unknownOthers = missingOthers.filter((f) => !SPECIFIC_FLAG_HINTS[f]);
    if (unknownOthers.length > 0) hints.push('条件未满足');
  }
  return hints.join('，');
}
