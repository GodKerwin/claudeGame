import type { Room } from '../types/game';
import { evaluate } from './conditionEvaluator';
import type { EvalContext } from './conditionEvaluator';

export function getAvailableExits(room: Room, ctx: EvalContext, allRooms: Room[]): Room[] {
  return room.exits
    .map((id) => allRooms.find((r) => r.id === id))
    .filter((r): r is Room => r !== undefined && evaluate(r.requires, ctx));
}

export function getRoomInteractables(room: Room): string[] {
  return room.interactables;
}
