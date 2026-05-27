export interface PlayerStats {
  name: string;
  template: string;
  strength: number;
  agility: number;
  wisdom: number;
  constitution: number;
  talent: string;
}

export interface Condition {
  strength?: number;
  agility?: number;
  wisdom?: number;
  constitution?: number;
  talent?: string;
  has?: string[];
  flags?: string[];
  flags_absent?: string[];
}

export interface ActionGrant {
  flags?: string[];
  clues?: string[];
  items?: string[];
  remove_items?: string[];
  quests?: string[];
}

export interface EventAction {
  id: string;
  label: string;
  requires: Condition | null;
  result: string;
  grants?: ActionGrant;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  requires?: Condition;
  actions: EventAction[];
}

export interface DialogueChoice {
  id: string;
  label: string;
  condition?: Condition;
  response: string;
  grants?: ActionGrant;
}

export interface DialogueLine {
  id: string;
  condition?: Condition;
  text: string;
  grants?: ActionGrant;
  hidden?: boolean;
  choices?: DialogueChoice[];
}

export interface NPC {
  id: string;
  name: string;
  description: string;
  dialogues: DialogueLine[];
}

export interface Room {
  id: string;
  name: string;
  description: string;
  interactables: string[];
  exits: string[];
  requires?: Condition | null;
}

export interface GameMap {
  id: string;
  name: string;
  rooms: Room[];
}

export interface Item {
  id: string;
  name: string;
  description: string;
  isClue: boolean;
}

export interface Talent {
  id: string;
  name: string;
  description: string;
}

export interface CharacterTemplate {
  id: string;
  name: string;
  description: string;
  flavor: string;
  stats: {
    strength: number;
    agility: number;
    wisdom: number;
    constitution: number;
  };
  talent: string;
}

export interface SaveData {
  player: PlayerStats;
  currentRoomId: string;
  inventory: string[];
  clues: string[];
  flags: string[];
  questLog: string[];
  storyText: string[];
}

export interface SaveSlot {
  id: number;
  type: 'manual' | 'auto';
  timestamp: number;
  label: string;
  data: SaveData | null;
}
