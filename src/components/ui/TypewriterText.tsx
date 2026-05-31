import { useState, useEffect } from 'react';

interface Props {
  text: string;
  className?: string;
  speed?: number;
  onUpdate?: () => void;
}

const BATCH = 2; // 每帧渲染字符数，减少 re-render 次数

export function TypewriterText({ text, className = '', speed = 30, onUpdate }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
  }, [text]);

  useEffect(() => {
    if (count >= text.length) return;
    const t = setTimeout(() => {
      setCount((c) => Math.min(c + BATCH, text.length));
      onUpdate?.();
    }, speed);
    return () => clearTimeout(t);
  }, [count, text.length, speed, onUpdate]);

  return <span className={className}>{text.slice(0, count)}</span>;
}
