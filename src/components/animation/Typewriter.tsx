'use client';

import React, { useState, useEffect } from 'react';

interface TypewriterProps {
  words?: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseTime?: number;
}

const DEFAULT_WORDS = [
  'Kishore',
  'Cybersecurity Enthusiast',
  'AI Developer',
  'Full Stack Developer',
  'Software Engineer',
];

export default function Typewriter({
  words = DEFAULT_WORDS,
  typingSpeed = 85,
  deletingSpeed = 40,
  pauseTime = 1800,
}: TypewriterProps) {
  const safeWords =
    Array.isArray(words) && words.filter(Boolean).length > 0
      ? words.filter((w): w is string => typeof w === 'string' && w.trim().length > 0)
      : DEFAULT_WORDS;

  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const currentWord = safeWords[index % safeWords.length] || DEFAULT_WORDS[0];

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

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
      }, typingSpeed);
      return () => clearTimeout(timeout);
    }
  }, [subIndex, isDeleting, isPaused, index, safeWords, currentWord, typingSpeed, deletingSpeed, pauseTime, reducedMotion]);

  if (reducedMotion) {
    return (
      <span className="text-gradient-purple font-semibold tracking-wide">
        {currentWord}
      </span>
    );
  }

  const displayedText = (currentWord ?? '').substring(0, subIndex) ?? '';

  return (
    <span className="inline-flex items-center text-gradient-purple font-semibold tracking-wide">
      <span>{displayedText}</span>
      <span className="w-[3px] h-7 bg-purple-400 ml-1 animate-pulse" />
    </span>
  );
}
