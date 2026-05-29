import type { GameEvent, EventAction, Condition } from '../types/game';
import { evaluate } from './conditionEvaluator';
import type { EvalContext } from './conditionEvaluator';
import { getItem } from '../data/loader';

export interface ActionResult {
  action: EventAction;
  available: boolean;
  completed: boolean;
  hint: string;
}

export function getActionResults(event: GameEvent, ctx: EvalContext): ActionResult[] {
  return event.actions.map((action) => ({
    action,
    available: evaluate(action.requires, ctx),
    completed: isCompleted(action, ctx),
    hint: getMissingConditionLabel(action.requires, ctx),
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
    for (const flag of condition.flags) {
      if (!ctx.flags.includes(flag)) hints.push(`条件未满足`);
    }
  }
  return hints.join('，');
}
