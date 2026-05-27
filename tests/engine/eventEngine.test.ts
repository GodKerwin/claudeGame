import { describe, it, expect } from 'vitest';
import { getActionResults, canExecuteAction, getMissingConditionLabel } from '../../src/engine/eventEngine';
import type { GameEvent } from '../../src/types/game';
import type { EvalContext } from '../../src/engine/conditionEvaluator';

const baseCtx: EvalContext = {
  player: { name: '测', template: 't', strength: 6, agility: 6, wisdom: 6, constitution: 6, talent: '' },
  inventory: [],
  flags: [],
};

const testEvent: GameEvent = {
  id: 'test_event',
  title: '测试',
  description: '测试事件',
  actions: [
    { id: 'easy_action', label: '普通操作', requires: null, result: '成功了。' },
    { id: 'wisdom_action', label: '智慧操作', requires: { wisdom: 8 }, result: '推演成功。' },
    { id: 'flag_action', label: '旗帜操作', requires: { flags: ['innkeeper_met'] }, result: '通关了。' },
  ],
};

describe('getActionResults', () => {
  it('marks available actions correctly', () => {
    const results = getActionResults(testEvent, baseCtx);
    expect(results[0].available).toBe(true);
    expect(results[1].available).toBe(false);
    expect(results[2].available).toBe(false);
  });

  it('marks wisdom action available when stat met', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, wisdom: 8 } };
    const results = getActionResults(testEvent, ctx);
    expect(results[1].available).toBe(true);
  });

  it('returns hint for unavailable action', () => {
    const results = getActionResults(testEvent, baseCtx);
    expect(results[1].hint).toContain('智慧');
    expect(results[1].hint).toContain('8');
  });

  it('returns empty hint for available action', () => {
    const results = getActionResults(testEvent, baseCtx);
    expect(results[0].hint).toBe('');
  });
});

describe('canExecuteAction', () => {
  it('returns true when action has no requires', () => {
    expect(canExecuteAction(testEvent.actions[0], baseCtx)).toBe(true);
  });

  it('returns false when action requires stat not met', () => {
    expect(canExecuteAction(testEvent.actions[1], baseCtx)).toBe(false);
  });
});

describe('getMissingConditionLabel', () => {
  it('returns hint for unmet wisdom requirement', () => {
    const label = getMissingConditionLabel({ wisdom: 8 }, baseCtx);
    expect(label).toContain('智慧');
    expect(label).toContain('8');
  });

  it('returns empty string for met condition', () => {
    const ctx = { ...baseCtx, player: { ...baseCtx.player, wisdom: 9 } };
    expect(getMissingConditionLabel({ wisdom: 8 }, ctx)).toBe('');
  });

  it('returns empty string for null condition', () => {
    expect(getMissingConditionLabel(null, baseCtx)).toBe('');
  });
});
