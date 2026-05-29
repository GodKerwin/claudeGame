import type { GameMap, GameEvent, NPC, Item, Talent, CharacterTemplate, Room } from '../types/game';

import chapter1MapsRaw from './maps/chapter1.json';
import chapter1EventsRaw from './events/chapter1.json';
import chapter1NPCsRaw from './npcs/chapter1.json';
import chapter1ItemsRaw from './items/chapter1.json';
import chapter2MapsRaw from './maps/chapter2.json';
import chapter2EventsRaw from './events/chapter2.json';
import chapter2NPCsRaw from './npcs/chapter2.json';
import chapter2ItemsRaw from './items/chapter2.json';
import talentsRaw from './talents.json';
import templatesRaw from './templates.json';

export const MAPS: GameMap[] = [...chapter1MapsRaw, ...chapter2MapsRaw] as GameMap[];
export const EVENTS: GameEvent[] = [...chapter1EventsRaw, ...chapter2EventsRaw] as GameEvent[];
export const NPCS: NPC[] = [...chapter1NPCsRaw, ...chapter2NPCsRaw] as NPC[];
export const ITEMS: Item[] = [...chapter1ItemsRaw, ...chapter2ItemsRaw] as Item[];
export const TALENTS: Talent[] = talentsRaw as Talent[];
export const TEMPLATES: CharacterTemplate[] = templatesRaw as CharacterTemplate[];

export const ALL_ROOMS: Room[] = MAPS.flatMap((m) => m.rooms);

export const getRoom = (id: string): Room | undefined => ALL_ROOMS.find((r) => r.id === id);
export const getEvent = (id: string): GameEvent | undefined => EVENTS.find((e) => e.id === id);
export const getNPC = (id: string): NPC | undefined => NPCS.find((n) => n.id === id);
export const getItem = (id: string): Item | undefined => ITEMS.find((i) => i.id === id);
export const getTalent = (id: string): Talent | undefined => TALENTS.find((t) => t.id === id);
export const getTemplate = (id: string): CharacterTemplate | undefined => TEMPLATES.find((t) => t.id === id);
