import { describe, it, expect } from 'vitest';
import { evaluate, isActionVisible } from '../../src/engine/conditionEvaluator';
import type { EvalContext } from '../../src/engine/conditionEvaluator';
import type { TimeOfDay } from '../../src/types/game';

const baseCtx: EvalContext = {
  player: { name: '测试者', template: 'test', strength: 6, agility: 6, wisdom: 6, constitution: 6, talent: '' },
  inventory: [],
  flags: [],
  timeOfDay: 'morning' as TimeOfDay,
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

  it('耳报神 does not reduce wisdom threshold', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '耳报神' } };
    expect(evaluate({ wisdom: 7 }, ctx)).toBe(false); // 6 < 7, no bonus
  });

  it('望闻断骨 does not reduce constitution threshold', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '望闻断骨' } };
    expect(evaluate({ constitution: 7 }, ctx)).toBe(false); // 6 < 7, no bonus
  });

  it('三教九流 does not reduce agility threshold', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '三教九流' } };
    expect(evaluate({ agility: 7 }, ctx)).toBe(false); // 6 < 7, no bonus
  });

  it('talent check passes when talent matches', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '望闻断骨' } };
    expect(evaluate({ talent: '望闻断骨' }, ctx)).toBe(true);
  });

  it('talent check fails when talent does not match', () => {
    expect(evaluate({ talent: '望闻断骨' }, baseCtx)).toBe(false);
  });

  it('耳报神 talent check works via condition.talent', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '耳报神' } };
    expect(evaluate({ talent: '耳报神' }, ctx)).toBe(true);
  });

  it('三教九流 talent check works via condition.talent', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, talent: '三教九流' } };
    expect(evaluate({ talent: '三教九流' }, ctx)).toBe(true);
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

  it('constitution check: no talent gives bonus', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, constitution: 7, talent: '官威' } };
    expect(evaluate({ constitution: 8 }, ctx)).toBe(false);
  });

  it('望闻断骨 talent gating works via condition.talent', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, constitution: 8, talent: '望闻断骨' } };
    expect(evaluate({ constitution: 8, talent: '望闻断骨' }, ctx)).toBe(true);
  });

  it('passes multiple flags check when all present', () => {
    const ctx = { ...baseCtx, flags: ['flag_a', 'flag_b', 'flag_c'] };
    expect(evaluate({ flags: ['flag_a', 'flag_b'] }, ctx)).toBe(true);
  });

  it('fails multiple flags check when one missing', () => {
    const ctx = { ...baseCtx, flags: ['flag_a'] };
    expect(evaluate({ flags: ['flag_a', 'flag_b'] }, ctx)).toBe(false);
  });

  it('passes multiple items check when all present', () => {
    const ctx = { ...baseCtx, inventory: ['item_a', 'item_b'] };
    expect(evaluate({ has: ['item_a', 'item_b'] }, ctx)).toBe(true);
  });

  it('fails multiple items check when one missing', () => {
    const ctx = { ...baseCtx, inventory: ['item_a'] };
    expect(evaluate({ has: ['item_a', 'item_b'] }, ctx)).toBe(false);
  });

  it('passes condition with only flags_absent', () => {
    expect(evaluate({ flags_absent: ['not_set'] }, baseCtx)).toBe(true);
  });

  it('passes strength check when exactly met', () => {
    expect(evaluate({ strength: 6 }, baseCtx)).toBe(true);
  });

  it('fails strength check when not met', () => {
    expect(evaluate({ strength: 7 }, baseCtx)).toBe(false);
  });

  it('passes agility check when exactly met', () => {
    expect(evaluate({ agility: 6 }, baseCtx)).toBe(true);
  });

  it('fails agility check when not met', () => {
    expect(evaluate({ agility: 7 }, baseCtx)).toBe(false);
  });

  it('passes constitution check when exactly met', () => {
    expect(evaluate({ constitution: 6 }, baseCtx)).toBe(true);
  });

  it('fails constitution check when not met', () => {
    expect(evaluate({ constitution: 7 }, baseCtx)).toBe(false);
  });
});

describe('isActionVisible', () => {
  it('returns true for null condition', () => {
    expect(isActionVisible(null, baseCtx)).toBe(true);
  });

  it('returns true when condition is met', () => {
    const ctx = { ...baseCtx, flags: ['innkeeper_met'] };
    expect(isActionVisible({ flags: ['innkeeper_met'] }, ctx)).toBe(true);
  });

  it('returns false when flag condition not met (hidden)', () => {
    expect(isActionVisible({ flags: ['innkeeper_met'] }, baseCtx)).toBe(false);
  });

  it('returns false when flags_absent condition not met (hidden)', () => {
    const ctx = { ...baseCtx, flags: ['already_done'] };
    expect(isActionVisible({ flags_absent: ['already_done'] }, ctx)).toBe(false);
  });

  it('returns false when inventory condition not met (hidden)', () => {
    expect(isActionVisible({ has: ['blood_letter'] }, baseCtx)).toBe(false);
  });

  it('returns true (grayed) when only stat condition not met', () => {
    expect(isActionVisible({ wisdom: 9 }, baseCtx)).toBe(true);
  });

  it('returns true (grayed) when only talent condition not met', () => {
    expect(isActionVisible({ talent: '官威' }, baseCtx)).toBe(true);
  });

  it('returns false when timeOfDay condition not met (hidden)', () => {
    expect(isActionVisible({ timeOfDay: ['night', 'dawn'] }, baseCtx)).toBe(false);
  });

  it('returns false when flag+stat combined, flag fails (hidden takes priority)', () => {
    expect(isActionVisible({ flags: ['missing_flag'], wisdom: 9 }, baseCtx)).toBe(false);
  });
});
