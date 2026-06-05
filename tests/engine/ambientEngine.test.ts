import { describe, it, expect } from 'vitest';
import { getAmbientText } from '../../src/engine/ambientEngine';
import type { Room } from '../../src/types/game';
import type { EvalContext } from '../../src/engine/conditionEvaluator';

const baseCtx: EvalContext = {
  player: { name: 'test', template: 'scholar', strength: 5, agility: 5, wisdom: 5, constitution: 5, talent: '' },
  inventory: [],
  flags: [],
  timeOfDay: 'morning',
};

const baseRoom: Room = {
  id: 'test_room',
  name: '测试房间',
  description: '这是默认描述。',
  interactables: [],
  exits: [],
};

describe('getAmbientText', () => {
  it('returns description when no ambient fields', () => {
    expect(getAmbientText(baseRoom, baseCtx)).toBe('这是默认描述。');
  });

  it('returns timeOfDay variant when ambientByTime matches', () => {
    const room: Room = { ...baseRoom, ambientByTime: { morning: '晨光文字' } };
    expect(getAmbientText(room, baseCtx)).toBe('晨光文字');
  });

  it('falls back to description when timeOfDay not in ambientByTime', () => {
    const room: Room = { ...baseRoom, ambientByTime: { night: '夜晚文字' } };
    expect(getAmbientText(room, baseCtx)).toBe('这是默认描述。');
  });

  it('flag variant takes priority over timeOfDay variant', () => {
    const room: Room = {
      ...baseRoom,
      ambientByTime: { morning: '晨光文字' },
      ambientByFlag: [{ requires: { flags: ['trusted'] }, text: 'flag文字' }],
    };
    const ctx = { ...baseCtx, flags: ['trusted'] };
    expect(getAmbientText(room, ctx)).toBe('flag文字');
  });

  it('skips flag entry when condition not met, falls through to timeOfDay', () => {
    const room: Room = {
      ...baseRoom,
      ambientByTime: { morning: '晨光文字' },
      ambientByFlag: [{ requires: { flags: ['missing_flag'] }, text: 'flag文字' }],
    };
    expect(getAmbientText(room, baseCtx)).toBe('晨光文字');
  });

  it('returns first matching flag entry when multiple entries', () => {
    const room: Room = {
      ...baseRoom,
      ambientByFlag: [
        { requires: { flags: ['flag_a'] }, text: '文字A' },
        { requires: { flags: ['flag_b'] }, text: '文字B' },
      ],
    };
    const ctx = { ...baseCtx, flags: ['flag_a', 'flag_b'] };
    expect(getAmbientText(room, ctx)).toBe('文字A');
  });

  it('handles empty ambientByFlag array without error', () => {
    const room: Room = { ...baseRoom, ambientByFlag: [] };
    expect(getAmbientText(room, baseCtx)).toBe('这是默认描述。');
  });
});
