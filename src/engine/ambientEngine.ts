import type { Room } from '../types/game';
import type { EvalContext } from './conditionEvaluator';
import { evaluate } from './conditionEvaluator';

export function getAmbientText(room: Room, ctx: EvalContext): string {
  if (room.ambientByFlag) {
    for (const entry of room.ambientByFlag) {
      if (evaluate(entry.requires, ctx)) return entry.text;
    }
  }
  if (room.ambientByTime) {
    const t = room.ambientByTime[ctx.timeOfDay];
    if (t) return t;
  }
  return room.description;
}
