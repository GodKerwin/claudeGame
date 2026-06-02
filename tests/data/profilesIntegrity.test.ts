import { describe, it, expect } from 'vitest';
import { SUSPECT_PROFILES, NPCS } from '../../src/data/loader';

describe('SuspectProfile data integrity', () => {
  it('all profiles have valid npcId that exists in NPCS', () => {
    const npcIds = new Set(NPCS.map((n) => n.id));
    for (const p of SUSPECT_PROFILES) {
      expect(npcIds.has(p.npcId), `Profile npcId "${p.npcId}" not found in NPCS`).toBe(true);
    }
  });

  it('each profile has at least one fact', () => {
    for (const p of SUSPECT_PROFILES) {
      expect(p.facts.length, `Profile "${p.npcId}" has no facts`).toBeGreaterThan(0);
    }
  });

  it('covers all three chapters', () => {
    const ids = SUSPECT_PROFILES.map((p) => p.npcId);
    expect(ids).toContain('npc_innkeeper_li_fu');   // ch1
    expect(ids).toContain('npc_wujue');             // ch2/3
    expect(ids).toContain('npc_li_mao');            // ch2
    expect(ids).toContain('npc_tianji_contact');    // ch3
  });
});
