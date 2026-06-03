import { useState, useEffect } from 'react';

const STORAGE_KEY = 'tianji_font_size';
const DEFAULT_SIZE = 16;
const MIN_SIZE = 12;
const MAX_SIZE = 22;

function applyFontSize(size: number) {
  document.documentElement.style.fontSize = `${size}px`;
  // zoom scales all px-based values uniformly (rem already scaled via root font-size)
  (document.body.style as Record<string, string>).zoom = String(size / 16);
}

export function useSettings() {
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_SIZE;
  });

  useEffect(() => {
    applyFontSize(fontSize);
    localStorage.setItem(STORAGE_KEY, String(fontSize));
  }, [fontSize]);

  const increaseFontSize = () => setFontSize((s) => Math.min(s + 1, MAX_SIZE));
  const decreaseFontSize = () => setFontSize((s) => Math.max(s - 1, MIN_SIZE));
  const resetFontSize = () => setFontSize(DEFAULT_SIZE);

  return { fontSize, increaseFontSize, decreaseFontSize, resetFontSize, MIN_SIZE, MAX_SIZE };
}
