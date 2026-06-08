import type { GameMap, GameEvent, NPC, Item, Talent, CharacterTemplate, Room, Synthesis, SuspectProfile, ChapterVerdict } from '../types/game';

import chapter1MapsRaw from './maps/chapter1.json';
import chapter1EventsRaw from './events/chapter1.json';
import chapter1NPCsRaw from './npcs/chapter1.json';
import chapter1ItemsRaw from './items/chapter1.json';
import chapter2MapsRaw from './maps/chapter2.json';
import chapter2EventsRaw from './events/chapter2.json';
import chapter2NPCsRaw from './npcs/chapter2.json';
import chapter2ItemsRaw from './items/chapter2.json';
import chapter3MapsRaw from './maps/chapter3.json';
import chapter3EventsRaw from './events/chapter3.json';
import chapter3NPCsRaw from './npcs/chapter3.json';
import chapter3ItemsRaw from './items/chapter3.json';
import chapter4MapsRaw from './maps/chapter4.json';
import chapter4EventsRaw from './events/chapter4.json';
import chapter4NPCsRaw from './npcs/chapter4.json';
import chapter4ItemsRaw from './items/chapter4.json';
import chapter5MapsRaw from './maps/chapter5.json';
import chapter5EventsRaw from './events/chapter5.json';
import chapter5NPCsRaw from './npcs/chapter5.json';
import chapter5ItemsRaw from './items/chapter5.json';
import talentsRaw from './talents.json';
import templatesRaw from './templates.json';
import chapter1SynthesesRaw from './syntheses/chapter1.json';
import chapter2SynthesesRaw from './syntheses/chapter2.json';
import chapter3SynthesesRaw from './syntheses/chapter3.json';
import chapter4SynthesesRaw from './syntheses/chapter4.json';
import chapter5SynthesesRaw from './syntheses/chapter5.json';
import chapter1ProfilesRaw from './profiles/chapter1.json';
import chapter2ProfilesRaw from './profiles/chapter2.json';
import chapter3ProfilesRaw from './profiles/chapter3.json';
import chapter4ProfilesRaw from './profiles/chapter4.json';
import chapter5ProfilesRaw from './profiles/chapter5.json';
import chapter1VerdictRaw from './verdicts/chapter1.json';
import chapter2VerdictRaw from './verdicts/chapter2.json';
import chapter3VerdictRaw from './verdicts/chapter3.json';
import chapter4VerdictRaw from './verdicts/chapter4.json';
import chapter5VerdictRaw from './verdicts/chapter5.json';

export const MAPS: GameMap[] = [...chapter1MapsRaw, ...chapter2MapsRaw, ...chapter3MapsRaw, ...chapter4MapsRaw, ...chapter5MapsRaw] as GameMap[];
export const EVENTS: GameEvent[] = [...chapter1EventsRaw, ...chapter2EventsRaw, ...chapter3EventsRaw, ...chapter4EventsRaw, ...chapter5EventsRaw] as GameEvent[];
export const NPCS: NPC[] = [...chapter1NPCsRaw, ...chapter2NPCsRaw, ...chapter3NPCsRaw, ...chapter4NPCsRaw, ...chapter5NPCsRaw] as NPC[];
export const ITEMS: Item[] = [...chapter1ItemsRaw, ...chapter2ItemsRaw, ...chapter3ItemsRaw, ...chapter4ItemsRaw, ...chapter5ItemsRaw] as Item[];
export const TALENTS: Talent[] = talentsRaw as Talent[];
export const TEMPLATES: CharacterTemplate[] = templatesRaw as CharacterTemplate[];

export const ALL_ROOMS: Room[] = MAPS.flatMap((m) => m.rooms);

const roomMap = new Map(ALL_ROOMS.map((r) => [r.id, r]));
const eventMap = new Map(EVENTS.map((e) => [e.id, e]));
const npcMap = new Map(NPCS.map((n) => [n.id, n]));
const itemMap = new Map(ITEMS.map((i) => [i.id, i]));
const talentMap = new Map(TALENTS.map((t) => [t.id, t]));
const templateMap = new Map(TEMPLATES.map((t) => [t.id, t]));

export const getRoom = (id: string): Room | undefined => roomMap.get(id);
export const getEvent = (id: string): GameEvent | undefined => eventMap.get(id);
export const getNPC = (id: string): NPC | undefined => npcMap.get(id);
export const getItem = (id: string): Item | undefined => itemMap.get(id);
export const getTalent = (id: string): Talent | undefined => talentMap.get(id);
export const getTemplate = (id: string): CharacterTemplate | undefined => templateMap.get(id);

export const SYNTHESES: Synthesis[] = [
  ...chapter1SynthesesRaw,
  ...chapter2SynthesesRaw,
  ...chapter3SynthesesRaw,
  ...chapter4SynthesesRaw,
  ...chapter5SynthesesRaw,
] as Synthesis[];
export const SUSPECT_PROFILES: SuspectProfile[] = [
  ...chapter1ProfilesRaw,
  ...chapter2ProfilesRaw,
  ...chapter3ProfilesRaw,
  ...chapter4ProfilesRaw,
  ...chapter5ProfilesRaw,
] as SuspectProfile[];

export function getSynthesisResult(itemA: string, itemB: string): Synthesis | undefined {
  return SYNTHESES.find((s) =>
    (s.itemA === itemA && s.itemB === itemB) ||
    (s.itemA === itemB && s.itemB === itemA)
  );
}

export function getProfile(npcId: string): SuspectProfile | undefined {
  return SUSPECT_PROFILES.find((p) => p.npcId === npcId);
}

const VERDICTS: ChapterVerdict[] = [
  chapter1VerdictRaw as ChapterVerdict,
  chapter2VerdictRaw as ChapterVerdict,
  chapter3VerdictRaw as ChapterVerdict,
  chapter4VerdictRaw as ChapterVerdict,
  chapter5VerdictRaw as ChapterVerdict,
];

export function getVerdict(chapterId: 1 | 2 | 3 | 4 | 5): ChapterVerdict | undefined {
  return VERDICTS.find((v) => v.chapterId === chapterId);
}
