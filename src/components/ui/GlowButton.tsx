'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlowButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...motionProps
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm font-medium',
    lg: 'px-7 py-3.5 text-base font-semibold',
  };

  const variantClasses = {
    primary:
      'bg-[var(--accent-color)] text-black font-semibold hover:bg-white shadow-[var(--shadow-accent-glow)] border border-[var(--accent-color)]',
    secondary:
      'bg-[var(--bg-glass)] text-white hover:text-[var(--accent-color)] border border-[var(--border-accent)] hover:border-[var(--accent-color)] backdrop-blur-md',
    outline:
      'bg-transparent text-[var(--accent-color)] border border-[var(--border-accent)] hover:bg-[var(--bg-glass)] hover:border-[var(--accent-color)]',
    danger:
      'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      disabled={disabled || isLoading}
      className={`relative inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...motionProps}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </motion.button>
  );
};
