'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

export type RevealVariant = 'fade-up' | 'fade-left' | 'fade-right' | 'scale' | 'blur';

interface RevealWrapperProps {
  children: React.ReactNode;
  variant?: RevealVariant;
  duration?: number;
  delay?: number;
  className?: string;
  once?: boolean;
  amount?: number;
}

const variantsMap: Record<RevealVariant, Variants> = {
  'fade-up': {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  'fade-left': {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  'fade-right': {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1.0 },
  },
  blur: {
    hidden: { opacity: 0, filter: 'blur(10px)', y: 20 },
    visible: { opacity: 1, filter: 'blur(0px)', y: 0 },
  },
};

export const RevealWrapper: React.FC<RevealWrapperProps> = ({
  children,
  variant = 'fade-up',
  duration = 0.6,
  delay = 0.08,
  className = '',
  once = true,
  amount = 0.15,
}) => {
  const [shouldReduceMotion, setShouldReduceMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setShouldReduceMotion(prefersReduced);
    }
  }, []);

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const activeVariant = variantsMap[variant] || variantsMap['fade-up'];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      transition={{
        duration,
        delay,
        ease: [0.215, 0.61, 0.355, 1], // easeOutCubic
      }}
      variants={activeVariant}
      className={className}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
};
