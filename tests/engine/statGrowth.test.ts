import { describe, it, expect } from 'vitest';
import { evaluate } from '../../src/engine/conditionEvaluator';
import type { EvalContext } from '../../src/engine/conditionEvaluator';

describe('stat growth gates', () => {
  const baseCtx = (wisdom: number): EvalContext => ({
    player: { name: '', template: '', strength: 6, agility: 6, wisdom, constitution: 6, talent: '' },
    inventory: [],
    flags: [],
  });

  it('wisdom >= 7 gate passes when wisdom is 7', () => {
    expect(evaluate({ wisdom: 7 }, baseCtx(7))).toBe(true);
  });

  it('wisdom >= 7 gate fails when wisdom is 6', () => {
    expect(evaluate({ wisdom: 7 }, baseCtx(6))).toBe(false);
  });

  it('wisdom >= 8 gate passes when wisdom is 8', () => {
    expect(evaluate({ wisdom: 8 }, baseCtx(8))).toBe(true);
  });

  it('wisdom >= 8 gate fails when wisdom is 7', () => {
    expect(evaluate({ wisdom: 8 }, baseCtx(7))).toBe(false);
  });
});
