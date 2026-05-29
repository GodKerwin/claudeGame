const KEY = 'tianji-endings';

export function getSeenEndings(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function addSeenEnding(flag: string): void {
  const seen = getSeenEndings();
  if (!seen.includes(flag)) {
    localStorage.setItem(KEY, JSON.stringify([...seen, flag]));
  }
}
