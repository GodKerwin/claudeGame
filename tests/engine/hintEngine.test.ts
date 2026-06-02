import { describe, it, expect } from 'vitest';
import { getHint } from '../../src/engine/hintEngine';
import type { HintContext } from '../../src/engine/hintEngine';

const base = (overrides: Partial<HintContext> = {}): HintContext => ({
  flags: [],
  items: [],
  chapter: 1,
  strength: 5,
  agility: 5,
  wisdom: 5,
  constitution: 5,
  talent: 'none',
  ...overrides,
});

describe('hintEngine – Chapter 1', () => {
  it('returns final confrontation hint when all 3 items present', () => {
    const hint = getHint(base({
      flags: ['clue_blood_letter_found', 'clue_arsenic_found', 'cellar_fragment_obtained'],
    }));
    expect(hint).toContain('废弃宅院');
  });

  it('returns cellar hint when innkeeper trusted but fragment missing', () => {
    const hint = getHint(base({
      flags: ['innkeeper_trusted'],
    }));
    expect(hint).toContain('地窖');
  });

  it('returns wuhen step hint when learned_wuhen_bu and innkeeper_trusted and fragment missing', () => {
    const hint = getHint(base({
      flags: ['learned_wuhen_bu', 'innkeeper_trusted'],
    }));
    expect(hint).toContain('无痕步');
    expect(hint).toContain('地窖');
  });

  it('returns a non-empty string when no flags set', () => {
    const hint = getHint(base());
    expect(typeof hint).toBe('string');
    expect(hint.length).toBeGreaterThan(0);
  });
});

describe('hintEngine – Chapter 2', () => {
  it('returns confrontation hint when all 3 ch2 items present', () => {
    const hint = getHint(base({
      chapter: 2,
      flags: ['chapter2_started'],
      items: ['poison_residue_sample', 'monk_identity_scroll', 'langpeng_dispatch_order'],
    }));
    expect(hint).toContain('茶馆');
  });

  it('returns dispatch-order hint when 2 items but missing langpeng_dispatch_order', () => {
    const hint = getHint(base({
      chapter: 2,
      flags: ['chapter2_started'],
      items: ['poison_residue_sample', 'monk_identity_scroll'],
    }));
    expect(hint).toContain('调令文书');
  });

  it('returns talent-specific monk healing hint for 望闻断骨 with poison sample', () => {
    const hint = getHint(base({
      chapter: 2,
      flags: ['chapter2_started'],
      items: ['poison_residue_sample'],
      talent: '望闻断骨',
    }));
    expect(hint).toContain('为他看诊');
  });

  it('returns fallback hint when no chapter 2 progress', () => {
    const hint = getHint(base({
      chapter: 2,
      flags: ['chapter2_started'],
    }));
    expect(typeof hint).toBe('string');
    expect(hint.length).toBeGreaterThan(0);
  });
});

describe('hintEngine – Chapter 3', () => {
  it('returns final confrontation hint when scroll and identity confirmed', () => {
    const hint = getHint(base({
      chapter: 3,
      flags: ['chapter3_started', 'fei_ye_identity_confirmed'],
      items: ['tianji_founding_scroll'],
    }));
    expect(hint).toContain('曲江亭');
  });

  it('returns starting hint at chapter 3 start with no progress', () => {
    const hint = getHint(base({
      chapter: 3,
      flags: ['chapter3_started'],
    }));
    expect(hint).toContain('大雁塔');
  });

  it('returns stele hint when mission started but stele not decoded', () => {
    const hint = getHint(base({
      chapter: 3,
      flags: ['chapter3_started', 'tianji_mission_started'],
    }));
    expect(hint).toContain('碑文');
  });

  it('returns wujue testimony hint when manor searched but identity not confirmed', () => {
    const hint = getHint(base({
      chapter: 3,
      flags: ['chapter3_started', 'tianji_mission_started', 'stele_decoded', 'feiyes_manor_searched'],
    }));
    expect(hint).toContain('无迹');
  });
});
