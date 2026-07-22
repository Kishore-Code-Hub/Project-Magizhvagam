'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { CyberAudio } from '@/lib/CyberAudio';

interface TypewriterProps {
  words?: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseTime?: number;
}

const DEFAULT_WORDS = [
  'KISHORE_NARAYANAN_K',
  'Cybersecurity Enthusiast_',
  'Ethical Hacker_',
  'Software Engineer_',
  'AI Developer_',
];

export default function Typewriter({
  words = DEFAULT_WORDS,
  typingSpeed = 75,
  deletingSpeed = 35,
  pauseTime = 1600,
}: TypewriterProps) {
  const { audioMuted } = useTheme();

  const safeWords =
    Array.isArray(words) && words.filter(Boolean).length > 0
      ? words.filter((w): w is string => typeof w === 'string' && w.trim().length > 0)
      : DEFAULT_WORDS;

  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentWord = safeWords[index % safeWords.length] || DEFAULT_WORDS[0];

  useEffect(() => {
    if (isPaused) {
      const timeout = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseTime);
      return () => clearTimeout(timeout);
    }

    if (isDeleting) {
      if (subIndex === 0) {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % safeWords.length);
        return;
      }
      const timeout = setTimeout(() => {
        setSubIndex((prev) => Math.max(0, prev - 1));
      }, deletingSpeed);
      return () => clearTimeout(timeout);
    } else {
      if (subIndex >= currentWord.length) {
        setIsPaused(true);
        return;
      }
      const timeout = setTimeout(() => {
        setSubIndex((prev) => Math.min(currentWord.length, prev + 1));
        CyberAudio.playKeyClick(audioMuted);
      }, typingSpeed);
      return () => clearTimeout(timeout);
    }
  }, [subIndex, isDeleting, isPaused, index, safeWords, currentWord, typingSpeed, deletingSpeed, pauseTime, audioMuted]);

  const displayedText = (currentWord ?? '').substring(0, subIndex) ?? '';

  return (
    <span className="inline-flex items-center text-accent font-mono font-bold tracking-wider text-xl sm:text-2xl lg:text-3xl">
      <span>&gt; {displayedText}</span>
      <span className="w-[3px] h-7 bg-accent ml-1.5 animate-pulse" />
    </span>
  );
}
