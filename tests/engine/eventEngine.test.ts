import { describe, it, expect } from 'vitest';
import { getActionResults, canExecuteAction, getMissingConditionLabel } from '../../src/engine/eventEngine';
import type { GameEvent, TimeOfDay } from '../../src/types/game';
import type { EvalContext } from '../../src/engine/conditionEvaluator';

const baseCtx: EvalContext = {
  player: { name: '测', template: 't', strength: 6, agility: 6, wisdom: 6, constitution: 6, talent: '' },
  inventory: [],
  flags: [],
  timeOfDay: 'morning' as TimeOfDay,
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

  it('returns false when action requires flag not present', () => {
    expect(canExecuteAction(testEvent.actions[2], baseCtx)).toBe(false);
  });

  it('returns true when flag condition is met', () => {
    const ctx = { ...baseCtx, flags: ['innkeeper_met'] };
    expect(canExecuteAction(testEvent.actions[2], ctx)).toBe(true);
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

  it('returns hint for unmet strength requirement', () => {
    const label = getMissingConditionLabel({ strength: 8 }, baseCtx);
    expect(label).toContain('力量');
    expect(label).toContain('8');
  });

  it('returns hint for unmet agility requirement', () => {
    const label = getMissingConditionLabel({ agility: 8 }, baseCtx);
    expect(label).toContain('敏捷');
    expect(label).toContain('8');
  });

  it('returns hint for unmet constitution requirement', () => {
    const label = getMissingConditionLabel({ constitution: 8 }, baseCtx);
    expect(label).toContain('根骨');
    expect(label).toContain('8');
  });

  it('returns hint for unmet talent requirement', () => {
    const label = getMissingConditionLabel({ talent: '官威' }, baseCtx);
    expect(label).toContain('官威');
  });

  it('returns synth hint for missing synth_ flags', () => {
    const label = getMissingConditionLabel({ flags: ['synth_double_kill', 'synth_poison_path'] }, baseCtx);
    expect(label).toContain('推理页');
    expect(label).toContain('2');
  });

  it('returns specific hint for known flag', () => {
    const label = getMissingConditionLabel({ flags: ['cook_talked'] }, baseCtx);
    expect(label).toContain('厨娘');
  });

  it('returns 条件未满足 for unknown flag', () => {
    const label = getMissingConditionLabel({ flags: ['some_unknown_flag_xyz'] }, baseCtx);
    expect(label).toContain('条件未满足');
  });

  it('combines multiple hints with ，separator', () => {
    const label = getMissingConditionLabel({ wisdom: 8, strength: 8 }, baseCtx);
    expect(label).toContain('，');
    expect(label).toContain('智慧');
    expect(label).toContain('力量');
  });
});

describe('getActionResults — visible and completed fields', () => {
  const eventWithFlagAction: GameEvent = {
    id: 'test_visibility',
    title: '可见性测试',
    description: '...',
    actions: [
      { id: 'stat_gated', label: '属性门控', requires: { wisdom: 9 }, result: '' },
      { id: 'flag_gated', label: '旗帜门控', requires: { flags: ['some_flag'] }, result: '' },
      { id: 'no_gate', label: '无门控', requires: null, result: '' },
    ],
  };

  it('visible=true for stat-gated action (grayed)', () => {
    const results = getActionResults(eventWithFlagAction, baseCtx);
    expect(results[0].visible).toBe(true);
  });

  it('visible=false for flag-gated action (hidden)', () => {
    const results = getActionResults(eventWithFlagAction, baseCtx);
    expect(results[1].visible).toBe(false);
  });

  it('visible=true for ungated action', () => {
    const results = getActionResults(eventWithFlagAction, baseCtx);
    expect(results[2].visible).toBe(true);
  });

  it('completed=false for action without flags_absent', () => {
    const results = getActionResults(eventWithFlagAction, baseCtx);
    expect(results[0].completed).toBe(false);
    expect(results[2].completed).toBe(false);
  });

  it('completed=true when flags_absent condition is triggered', () => {
    const completableEvent: GameEvent = {
      id: 'completable',
      title: '',
      description: '',
      actions: [{
        id: 'one_time_action',
        label: '一次性操作',
        requires: { flags_absent: ['done_flag'] },
        result: '',
      }],
    };
    const ctxWithFlag = { ...baseCtx, flags: ['done_flag'] };
    const results = getActionResults(completableEvent, ctxWithFlag);
    expect(results[0].completed).toBe(true);
  });

  it('completed=false when action is still available (flags_absent not triggered)', () => {
    const completableEvent: GameEvent = {
      id: 'completable2',
      title: '',
      description: '',
      actions: [{
        id: 'still_available',
        label: '仍可用',
        requires: { flags_absent: ['done_flag'] },
        result: '',
      }],
    };
    const results = getActionResults(completableEvent, baseCtx);
    expect(results[0].completed).toBe(false);
  });
});
