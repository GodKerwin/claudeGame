import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneStore } from '../../src/store/sceneStore';
import { evaluate, isActionVisible } from '../../src/engine/conditionEvaluator';
import type { EvalContext } from '../../src/engine/conditionEvaluator';

describe('timeSystem', () => {
  beforeEach(() => {
    useSceneStore.getState().reset();
  });

  it('默认时段为 morning', () => {
    expect(useSceneStore.getState().timeOfDay).toBe('morning');
  });

  it('advanceTime(1) 从 morning 推进到 noon', () => {
    useSceneStore.getState().advanceTime(1);
    expect(useSceneStore.getState().timeOfDay).toBe('noon');
  });

  it('advanceTime(2) 从 morning 推进到 afternoon', () => {
    useSceneStore.getState().advanceTime(2);
    expect(useSceneStore.getState().timeOfDay).toBe('afternoon');
  });

  it('night 推进 1 步循环回 dawn', () => {
    const store = useSceneStore.getState();
    store.advanceTime(4);
    expect(useSceneStore.getState().timeOfDay).toBe('night');
    useSceneStore.getState().advanceTime(1);
    expect(useSceneStore.getState().timeOfDay).toBe('dawn');
  });

  it('chapter2_started flag 重置 timeOfDay 为 morning', () => {
    const store = useSceneStore.getState();
    store.advanceTime(3);
    store.addFlag('chapter2_started');
    expect(useSceneStore.getState().timeOfDay).toBe('morning');
  });

  it('chapter3_started flag 重置 timeOfDay 为 morning', () => {
    const store = useSceneStore.getState();
    store.advanceTime(3);
    store.addFlag('chapter3_started');
    expect(useSceneStore.getState().timeOfDay).toBe('morning');
  });
});

describe('conditionEvaluator timeOfDay', () => {
  const baseCtx: EvalContext = {
    player: { name: '', template: '', strength: 6, agility: 6, wisdom: 6, constitution: 6, talent: '' },
    inventory: [],
    flags: [],
    timeOfDay: 'night',
  };

  it('timeOfDay 匹配时条件通过', () => {
    expect(evaluate({ timeOfDay: ['night', 'dawn'] }, baseCtx)).toBe(true);
  });

  it('timeOfDay 不匹配时条件失败', () => {
    expect(evaluate({ timeOfDay: ['morning', 'noon'] }, baseCtx)).toBe(false);
  });

  it('timeOfDay 不匹配时 isActionVisible 返回 false（隐藏，非置灰）', () => {
    expect(isActionVisible({ timeOfDay: ['morning'] }, baseCtx)).toBe(false);
  });

  it('无 timeOfDay 条件时正常通过', () => {
    expect(evaluate({}, baseCtx)).toBe(true);
  });
});
