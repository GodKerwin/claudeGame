import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneStore } from '../../src/store/sceneStore';

describe('sceneStore – foundSynthesisIds', () => {
  beforeEach(() => {
    useSceneStore.getState().reset();
  });

  it('starts empty', () => {
    expect(useSceneStore.getState().foundSynthesisIds).toEqual([]);
  });

  it('adds an id', () => {
    useSceneStore.getState().addFoundSynthesisId('synth_double_kill');
    expect(useSceneStore.getState().foundSynthesisIds).toContain('synth_double_kill');
  });

  it('does not add duplicates', () => {
    useSceneStore.getState().addFoundSynthesisId('synth_double_kill');
    useSceneStore.getState().addFoundSynthesisId('synth_double_kill');
    expect(useSceneStore.getState().foundSynthesisIds.length).toBe(1);
  });

  it('loadState restores foundSynthesisIds', () => {
    useSceneStore.getState().loadState({ foundSynthesisIds: ['synth_innkeeper_role'] });
    expect(useSceneStore.getState().foundSynthesisIds).toEqual(['synth_innkeeper_role']);
  });
});
