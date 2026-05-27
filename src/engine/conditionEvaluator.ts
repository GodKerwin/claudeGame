import type { Condition, PlayerStats } from '../types/game';

export interface EvalContext {
  player: PlayerStats;
  inventory: string[];
  flags: string[];
}

export function evaluate(condition: Condition | null | undefined, ctx: EvalContext): boolean {
  if (!condition) return true;
  const { player, inventory, flags } = ctx;

  if (condition.wisdom !== undefined) {
    const bonus = player.talent === '机关奇才' ? 2 : 0;
    if (player.wisdom + bonus < condition.wisdom) return false;
  }
  if (condition.strength !== undefined) {
    const bonus = player.talent === '天生神力' ? 2 : 0;
    if (player.strength + bonus < condition.strength) return false;
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
  return true;
}
