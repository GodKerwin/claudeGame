import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Props {
  text: string;
  className?: string;
  speed?: number;
}

export function TypewriterText({ text, className = '', speed = 0.03 }: Props) {
  const chars = useMemo(() => text.split(''), [text]);

  return (
    <span className={className}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * speed, duration: 0 }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}
