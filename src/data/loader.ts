import type { GameMap, GameEvent, NPC, Item, Talent, CharacterTemplate, Room } from '../types/game';

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
import talentsRaw from './talents.json';
import templatesRaw from './templates.json';

export const MAPS: GameMap[] = [...chapter1MapsRaw, ...chapter2MapsRaw, ...chapter3MapsRaw] as GameMap[];
export const EVENTS: GameEvent[] = [...chapter1EventsRaw, ...chapter2EventsRaw, ...chapter3EventsRaw] as GameEvent[];
export const NPCS: NPC[] = [...chapter1NPCsRaw, ...chapter2NPCsRaw, ...chapter3NPCsRaw] as NPC[];
export const ITEMS: Item[] = [...chapter1ItemsRaw, ...chapter2ItemsRaw, ...chapter3ItemsRaw] as Item[];
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
