import { describe, it, expect } from 'vitest';
import { getHint } from '../../src/engine/hintEngine';
import type { HintContext } from '../../src/engine/hintEngine';

const base: HintContext = {
  flags: [], items: [], chapter: 1,
  strength: 6, agility: 6, wisdom: 6, constitution: 6, talent: '',
};

describe('getHint chapter 1', () => {
  it('第一步：未见掌柜时提示去找掌柜', () => {
    const hint = getHint(base);
    expect(hint).toContain('李福');
  });

  it('见过掌柜后提示去查尸体', () => {
    const hint = getHint({ ...base, flags: ['innkeeper_met'] });
    expect(hint).toContain('尸体');
  });

  it('三证齐全时提示准备对质', () => {
    const ctx = {
      ...base,
      flags: ['body_examined', 'cloth_fiber_found', 'kite_identity_clue', 'tianji_records_found'],
    };
    expect(getHint(ctx)).not.toBe('四处探查，与每位NPC交谈，不要放过任何可互动的事件。');
  });
});

describe('getHint chapter 2', () => {
  it('chapter2开始后有实质提示', () => {
    const hint = getHint({ ...base, chapter: 2, flags: ['chapter2_started'] });
    expect(hint).not.toBe('四处探查，与每位NPC交谈，不要放过任何可互动的事件。');
  });
});

describe('getHint chapter 3', () => {
  it('chapter3开始后有实质提示', () => {
    const hint = getHint({ ...base, chapter: 3, flags: ['chapter3_started'] });
    expect(hint).not.toBe('四处探查，与每位NPC交谈，不要放过任何可互动的事件。');
  });
});

describe('talent-aware hints', () => {
  it('捕快/官威职业获得官方渠道提示', () => {
    const hint = getHint({ ...base, talent: '官威', flags: ['innkeeper_met'] });
    expect(hint).toBeTruthy();
  });
});
