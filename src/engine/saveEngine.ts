import type { SaveSlot, SaveData } from '../types/game';

const STORAGE_KEY = 'tianji_saves';

export function initDefaultSlots(): SaveSlot[] {
  return [
    { id: 0, type: 'auto', timestamp: 0, label: '自动存档', data: null },
    { id: 1, type: 'manual', timestamp: 0, label: '存档槽一', data: null },
    { id: 2, type: 'manual', timestamp: 0, label: '存档槽二', data: null },
    { id: 3, type: 'manual', timestamp: 0, label: '存档槽三', data: null },
  ];
}

export function loadAllSlots(): SaveSlot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initDefaultSlots();
    const parsed = JSON.parse(raw) as SaveSlot[];
    if (!Array.isArray(parsed) || parsed.length !== 4) return initDefaultSlots();
    return parsed;
  } catch {
    return initDefaultSlots();
  }
}

export function saveToSlot(slotId: number, data: SaveData, label?: string): SaveSlot {
  const slots = loadAllSlots();
  const idx = slots.findIndex((s) => s.id === slotId);
  if (idx === -1) throw new Error(`Save slot ${slotId} not found`);
  const updated: SaveSlot = {
    ...slots[idx],
    timestamp: Date.now(),
    data,
    label: label ?? slots[idx].label,
  };
  slots[idx] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  return updated;
}

export function loadFromSlot(slotId: number): SaveData | null {
  const slots = loadAllSlots();
  const slot = slots.find((s) => s.id === slotId);
  if (!slot?.data) return null;
  return {
    ...slot.data,
    seenDialogues: migrateSeenDialogues(slot.data.seenDialogues ?? []),
    foundSynthesisIds: slot.data.foundSynthesisIds ?? [],
  };
}

export function migrateSeenDialogues(keys: string[]): string[] {
  return keys.map((key) => (/^ch\d:/.test(key) ? key : `ch1:${key}`));
}

export function deleteSlot(slotId: number): void {
  const slots = loadAllSlots();
  const idx = slots.findIndex((s) => s.id === slotId);
  if (idx !== -1) {
    slots[idx] = { ...slots[idx], data: null, timestamp: 0 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  }
}
