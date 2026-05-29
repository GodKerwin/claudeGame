import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from '../../src/store/playerStore';

beforeEach(() => {
  usePlayerStore.getState().reset();
  usePlayerStore.getState().setPlayer({
    name: '测试者', template: 'bukai',
    strength: 8, agility: 5, wisdom: 7, constitution: 4,
    talent: '官威',
  });
});

describe('incrementStat', () => {
  it('增加属性值', () => {
    usePlayerStore.getState().incrementStat('wisdom', 1);
    expect(usePlayerStore.getState().wisdom).toBe(8);
  });

  it('不超过12的上限', () => {
    usePlayerStore.getState().setPlayer({
      name: 'x', template: 'x',
      strength: 12, agility: 12, wisdom: 12, constitution: 12, talent: '',
    });
    usePlayerStore.getState().incrementStat('strength', 1);
    expect(usePlayerStore.getState().strength).toBe(12);
  });

  it('增量为0时不变', () => {
    usePlayerStore.getState().incrementStat('agility', 0);
    expect(usePlayerStore.getState().agility).toBe(5);
  });
});
