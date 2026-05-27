import type { NPC, DialogueLine } from '../types/game';
import { evaluate } from './conditionEvaluator';
import type { EvalContext } from './conditionEvaluator';

export function getAvailableDialogues(npc: NPC, ctx: EvalContext): DialogueLine[] {
  return npc.dialogues.filter((d) => evaluate(d.condition, ctx));
}

export function getFirstDialogue(npc: NPC, ctx: EvalContext): DialogueLine | undefined {
  return getAvailableDialogues(npc, ctx)[0];
}
