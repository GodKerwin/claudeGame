export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';

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
  timeOfDay?: TimeOfDay[];
}

export interface ActionGrant {
  flags?: string[];
  clues?: string[];
  items?: string[];
  remove_items?: string[];
  quests?: string[];
  strength?: number;
  agility?: number;
  wisdom?: number;
  constitution?: number;
  storyText?: string;
}

export interface EvidenceGate {
  prompt: string;
  accepts: string[];
  failText: string;
}

export interface VerdictOption {
  id: string;
  text: string;
}

export interface VerdictQuestion {
  id: string;
  text: string;
  options: VerdictOption[];
  correctId: string;
}

export interface ChapterVerdict {
  chapterId: 1 | 2 | 3;
  eventId: string;
  grantFlag: string;
  failText: string;
  questions: VerdictQuestion[];
}

export interface EventAction {
  id: string;
  label: string;
  requires: Condition | null;
  result: string;
  hint?: string;
  grants?: ActionGrant;
  evidenceGate?: EvidenceGate;
  timeCost?: 1 | 2;
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
  hint?: string;
  grants?: ActionGrant;
}

export interface DialogueLine {
  id: string;
  condition?: Condition;
  text: string;
  grants?: ActionGrant;
  hidden?: boolean;
  choices?: DialogueChoice[];
  interrogation?: {
    prompt: string;
    accepts: string[];
    successResponse: string;
    failResponse: string;
  };
}

export interface InterrogationLevelData {
  level: 0 | 1 | 2;
  moodHint: string;
  text: string;
  indirectText?: string;
  pushEvidence?: string[];
  grants?: ActionGrant;
}

export interface NPCInterrogation {
  enabled: boolean;
  triggerFlag?: string;
  levels: InterrogationLevelData[];
}

export interface NPC {
  id: string;
  name: string;
  description: string;
  dialogues: DialogueLine[];
  interrogation?: NPCInterrogation;
}

export interface RoomRevisitEvent {
  id: string;
  requires: Condition;
  text: string;
  grants?: ActionGrant;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  interactables: string[];
  exits: string[];
  requires?: Condition | null;
  revisitEvents?: RoomRevisitEvent[];
  talentViews?: { talent: string; text: string }[];
}

export interface Synthesis {
  id: string;
  itemA: string;
  itemB: string;
  result: string;
  hint: string;
  grants?: ActionGrant;
  pivotal?: boolean;
  chapter?: 1 | 2 | 3;
}

export interface SuspectFact {
  flag: string;
  text: string;
  type: 'known' | 'contradiction';
}

export interface SuspectProfile {
  npcId: string;
  name: string;
  role: string;
  suspicion: string;
  facts: SuspectFact[];
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
  effect: string;
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
  prologueLines?: string[];
}

export interface SaveData {
  player: PlayerStats;
  currentRoomId: string;
  inventory: string[];
  clues: string[];
  flags: string[];
  questLog: string[];
  storyText: string[];
  seenDialogues: string[];
  visitedRooms: string[];
  foundSynthesisIds?: string[];
  timeOfDay?: TimeOfDay;
}

export interface SaveSlot {
  id: number;
  type: 'manual' | 'auto';
  timestamp: number;
  label: string;
  data: SaveData | null;
}
