'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface MatrixCenterLoaderProps {
  onAuthorize: () => void;
  isAuthorizing: boolean;
}

const TITLE_TEXT = 'WELCOME TO THE MATRIX';

const LINES = [
  'Initializing system kernel...',
  'Verifying secure connection...',
  'Loading essential modules...',
  'Establishing encrypted channel...',
  'System ready.',
];

export default function MatrixCenterLoader({ onAuthorize, isAuthorizing }: MatrixCenterLoaderProps) {
  const [typedTitle, setTypedTitle] = useState<string>('');
  const [isTitleFinished, setIsTitleFinished] = useState<boolean>(false);
  const [completedLines, setCompletedLines] = useState<string[]>([]);
  const [currentLineText, setCurrentLineText] = useState<string>('');
  const [activeLineIdx, setActiveLineIdx] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const hasTriggeredRef = useRef<boolean>(false);

  const handleAdvance = useCallback(() => {
    if (hasTriggeredRef.current || isAuthorizing) return;
    hasTriggeredRef.current = true;
    onAuthorize();
  }, [onAuthorize, isAuthorizing]);

  // Press any key or click anywhere to advance immediately
  useEffect(() => {
    const handleUserInteraction = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('button')) return;
      handleAdvance();
    };

    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);

    return () => {
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [handleAdvance]);

  // Step 1: Type out "WELCOME TO THE MATRIX" title first
  useEffect(() => {
    let charIdx = 0;
    let timeoutId: NodeJS.Timeout | null = null;

    const typeTitle = () => {
      if (charIdx < TITLE_TEXT.length) {
        charIdx++;
        setTypedTitle(TITLE_TEXT.slice(0, charIdx));
        // Fast, realistic title typing (20ms per char)
        timeoutId = setTimeout(typeTitle, 20);
      } else {
        timeoutId = setTimeout(() => {
          setIsTitleFinished(true);
        }, 100);
      }
    };

    typeTitle();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Step 2: Once title is typed, type out command lines sequentially
  useEffect(() => {
    if (!isTitleFinished) return;

    let timeoutId: NodeJS.Timeout | null = null;

    if (activeLineIdx >= LINES.length) {
      setIsFinished(true);
      // Auto-advance quickly after finishing
      timeoutId = setTimeout(() => {
        handleAdvance();
      }, 350);
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    }

    const targetText = LINES[activeLineIdx];
    let charIdx = 0;

    const typeChar = () => {
      if (charIdx < targetText.length) {
        charIdx++;
        setCurrentLineText(targetText.slice(0, charIdx));
        timeoutId = setTimeout(typeChar, 12);
      } else {
        timeoutId = setTimeout(() => {
          setCompletedLines((prev) => [...prev, targetText]);
          setCurrentLineText('');
          setActiveLineIdx((prev) => prev + 1);
        }, 80);
      }
    };

    typeChar();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isTitleFinished, activeLineIdx, handleAdvance]);

  return (
    <div className="relative z-30 flex flex-col items-center justify-center font-mono select-none px-4 w-full max-w-2xl text-left">
      {/* Title with typing effect */}
      <div
        className="text-xl sm:text-3xl font-extrabold tracking-widest text-[#00FF66] mb-8 sm:mb-10 uppercase flex items-center justify-center sm:justify-start gap-1.5 self-center sm:self-start min-h-[40px]"
        style={{
          textShadow: '0 0 10px rgba(0, 255, 102, 0.8), 0 0 20px rgba(0, 255, 102, 0.4)',
        }}
      >
        <span>{typedTitle}</span>
        <span className="w-3 h-6 sm:w-4 sm:h-7 bg-[#00FF66] animate-pulse inline-block align-middle" />
      </div>

      {/* Typed Commands */}
      <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-lg text-[#00FF66] font-semibold tracking-wide w-full min-h-[220px]">
        {completedLines.map((line, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 sm:gap-3"
            style={{
              textShadow: '0 0 8px rgba(0, 255, 102, 0.75)',
            }}
          >
            <span className="text-[#00FF66] font-bold">&gt;</span>
            <span>{line}</span>
            <span className="w-2.5 h-5 sm:w-3 sm:h-6 bg-[#00FF66] inline-block opacity-90" />
          </div>
        ))}

        {isTitleFinished && !isFinished && activeLineIdx < LINES.length && (
          <div
            className="flex items-center gap-2 sm:gap-3"
            style={{
              textShadow: '0 0 8px rgba(0, 255, 102, 0.75)',
            }}
          >
            <span className="text-[#00FF66] font-bold">&gt;</span>
            <span>{currentLineText}</span>
            <span className="w-2.5 h-5 sm:w-3 sm:h-6 bg-[#00FF66] animate-pulse inline-block" />
          </div>
        )}
      </div>

      {/* Subtext Prompt */}
      <div className="mt-10 sm:mt-12 text-xs sm:text-sm tracking-[0.3em] text-gray-400 font-bold uppercase animate-pulse text-center w-full self-center">
        PRESS ANY KEY TO CONTINUE
      </div>
    </div>
  );
}
