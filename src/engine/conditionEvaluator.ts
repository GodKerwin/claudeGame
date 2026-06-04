import type { Condition, PlayerStats, TimeOfDay } from '../types/game';

export interface EvalContext {
  player: PlayerStats;
  inventory: string[];
  flags: string[];
  timeOfDay: TimeOfDay;
}

/**
 * 判断一个 action 是否应当在 UI 中显示（即使不可用）。
 * - 仅被属性/天赋锁定 → 显示为置灰（玩家知道该路径存在）
 * - 被 flag/物品锁定 → 完全隐藏（随剧情自然解锁，循序渐进）
 */
export function isActionVisible(condition: Condition | null | undefined, ctx: EvalContext): boolean {
  if (!condition) return true;
  if (evaluate(condition, ctx)) return true;
  // 若有任意 flag/flags_absent/has 条件未满足，则隐藏
  if (condition.flags?.some((f) => !ctx.flags.includes(f))) return false;
  if (condition.flags_absent?.some((f) => ctx.flags.includes(f))) return false;
  if (condition.has?.some((i) => !ctx.inventory.includes(i))) return false;
  if (condition.timeOfDay && !condition.timeOfDay.includes(ctx.timeOfDay)) return false;
  // 只剩属性/天赋未满足 → 置灰显示
  return true;
}

export function evaluate(condition: Condition | null | undefined, ctx: EvalContext): boolean {
  if (!condition) return true;
  const { player, inventory, flags } = ctx;

  if (condition.wisdom !== undefined) {
    if (player.wisdom < condition.wisdom) return false;
  }
  if (condition.strength !== undefined) {
    if (player.strength < condition.strength) return false;
  }
  if (condition.agility !== undefined) {
    if (player.agility < condition.agility) return false;
  }
  if (condition.constitution !== undefined) {
    if (player.constitution < condition.constitution) return false;
  }
  if (condition.talent !== undefined) {
    if (player.talent !== condition.talent) return false;
  }
  if (condition.has) {
    for (const itemId of condition.has) {
      if (!inventory.includes(itemId)) return false;
    }
  }
  if (condition.flags) {
    for (const flag of condition.flags) {
      if (!flags.includes(flag)) return false;
    }
  }
  if (condition.flags_absent) {
    for (const flag of condition.flags_absent) {
      if (flags.includes(flag)) return false;
    }
  }
  if (condition.timeOfDay && !condition.timeOfDay.includes(ctx.timeOfDay)) return false;
  return true;
}
