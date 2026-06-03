import { useState, useEffect } from 'react';

const STORAGE_KEY = 'tianji_font_size';

export const FONT_PRESETS = [
  { label: '小', size: 13 },
  { label: '标准', size: 16 },
  { label: '大', size: 19 },
  { label: '特大', size: 22 },
] as const;

export const DEFAULT_SIZE = 16;

function applyFontSize(size: number) {
  document.documentElement.style.fontSize = `${size}px`;
  (document.body.style as unknown as Record<string, string>).zoom = String(size / 16);
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

  const increaseFontSize = () => {
    setFontSize((s) => {
      const next = FONT_PRESETS.find((p) => p.size > s);
      return next ? next.size : s;
    });
  };

  const decreaseFontSize = () => {
    setFontSize((s) => {
      const prev = [...FONT_PRESETS].reverse().find((p) => p.size < s);
      return prev ? prev.size : s;
    });
  };

  const setFontSizePreset = (size: number) => setFontSize(size);

  return { fontSize, increaseFontSize, decreaseFontSize, setFontSizePreset };
}
