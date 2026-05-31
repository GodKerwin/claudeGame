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
