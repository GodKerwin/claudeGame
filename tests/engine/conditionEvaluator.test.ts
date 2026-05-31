import { describe, it, expect } from 'vitest';
import { evaluate } from '../../src/engine/conditionEvaluator';
import type { EvalContext } from '../../src/engine/conditionEvaluator';

const baseCtx: EvalContext = {
  player: { name: '测试者', template: 'test', strength: 6, agility: 6, wisdom: 6, constitution: 6, talent: '' },
  inventory: [],
  flags: [],
};

describe('evaluate', () => {
  it('returns true for null condition', () => {
    expect(evaluate(null, baseCtx)).toBe(true);
  });

  it('returns true for undefined condition', () => {
    expect(evaluate(undefined, baseCtx)).toBe(true);
  });

  it('passes stat threshold when exactly met', () => {
    expect(evaluate({ wisdom: 6 }, baseCtx)).toBe(true);
  });

  it('fails stat threshold when not met', () => {
    expect(evaluate({ wisdom: 7 }, baseCtx)).toBe(false);
  });

  it('talent 三寸不烂之舌 reduces wisdom requirement by 2', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '三寸不烂之舌' } };
    expect(evaluate({ wisdom: 8 }, ctx)).toBe(true); // wisdom 6+2=8, passes
  });

  it('talent 夜行百盗 reduces agility requirement by 2', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '夜行百盗' } };
    expect(evaluate({ agility: 8 }, ctx)).toBe(true); // agility 6+2=8, passes
  });

  it('talent 毒经百草 reduces constitution requirement by 2', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '毒经百草' } };
    expect(evaluate({ constitution: 8 }, ctx)).toBe(true); // constitution 6+2=8, passes
  });

  it('other talents do not get wisdom bonus', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '官威' } };
    expect(evaluate({ wisdom: 8 }, ctx)).toBe(false);
  });

  it('talent check passes when talent matches', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '毒体' } };
    expect(evaluate({ talent: '毒体' }, ctx)).toBe(true);
  });

  it('talent check fails when talent does not match', () => {
    expect(evaluate({ talent: '毒体' }, baseCtx)).toBe(false);
  });

  it('passes item check when item in inventory', () => {
    const ctx = { ...baseCtx, inventory: ['broken_copper_badge'] };
    expect(evaluate({ has: ['broken_copper_badge'] }, ctx)).toBe(true);
  });

  it('fails item check when item missing', () => {
    expect(evaluate({ has: ['broken_copper_badge'] }, baseCtx)).toBe(false);
  });

  it('passes flags check when all flags present', () => {
    const ctx = { ...baseCtx, flags: ['innkeeper_met', 'body_examined'] };
    expect(evaluate({ flags: ['innkeeper_met'] }, ctx)).toBe(true);
  });

  it('fails flags check when flag missing', () => {
    expect(evaluate({ flags: ['innkeeper_met'] }, baseCtx)).toBe(false);
  });

  it('passes flags_absent when flag is not set', () => {
    expect(evaluate({ flags_absent: ['already_done'] }, baseCtx)).toBe(true);
  });

  it('fails flags_absent when flag is set', () => {
    const ctx = { ...baseCtx, flags: ['already_done'] };
    expect(evaluate({ flags_absent: ['already_done'] }, ctx)).toBe(false);
  });

  it('evaluates combined conditions — all must pass', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, wisdom: 8 }, flags: ['innkeeper_met'] };
    expect(evaluate({ wisdom: 8, flags: ['innkeeper_met'] }, ctx)).toBe(true);
    expect(evaluate({ wisdom: 8, flags: ['innkeeper_trusted'] }, ctx)).toBe(false);
  });

  it('constitution check: 官威 talent has no bonus', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, constitution: 7, talent: '官威' } };
    expect(evaluate({ constitution: 8 }, ctx)).toBe(false);
  });

  it('毒经百草 talent requires both constitution AND talent', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, constitution: 8, talent: '毒经百草' } };
    expect(evaluate({ constitution: 8, talent: '毒经百草' }, ctx)).toBe(true);
  });
});
