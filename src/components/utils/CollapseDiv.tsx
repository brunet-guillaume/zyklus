import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface FadeInProps {
  visible: boolean;
  children: ReactNode;
  initial?: boolean;
  className?: string;
}

export default function CollapseDiv({
  visible,
  children,
  initial = true,
  className = '',
}: FadeInProps) {
  return (
    <motion.div
      initial={initial ? 'on' : 'off'}
      variants={{
        on: {
          pointerEvents: 'auto',
          height: 'auto',
          transitionEnd: { overflow: 'visible' },
        },
        off: {
          pointerEvents: 'none',
          height: 0,
          overflow: 'hidden',
        },
      }}
      animate={visible ? 'on' : 'off'}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}
