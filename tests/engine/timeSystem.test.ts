import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneStore } from '../../src/store/sceneStore';

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
