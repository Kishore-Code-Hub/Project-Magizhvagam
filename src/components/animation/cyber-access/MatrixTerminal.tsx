'use client';

import React, { useState, useEffect, useRef } from 'react';

const BOOT_COMMANDS = [
  'Initializing kernel...',
  'Loading system modules...',
  'Mounting virtual filesystem...',
  'Verifying encrypted memory...',
  'Establishing secure tunnel...',
  'Loading neural interface...',
  'Connecting to Matrix node...',
  'Synchronizing runtime...',
  'Authenticating operator...',
  'Injecting cyber modules...',
  'Decrypting secure archives...',
  'Initializing GPU shaders...',
  'Verifying network integrity...',
  'Establishing encrypted session...',
  'Loading AI assistant...',
  'Compiling runtime assets...',
  'Checking memory sectors...',
  'Connecting secure channel...',
  'System integrity verified.',
  'Access level granted.',
];

const MATRIX_DATA_ENTRIES = [
  '0x7FFAE192 [MEM_ALLOC_OK]',
  '110100101011 01101001',
  'A4F1B7C9 :: HASH_VERIFIED',
  '0x00007FFF89A2 SYSCALL_OK',
  '01101001 01101110 01101001',
];

interface MatrixTerminalProps {
  isFrozen?: boolean;
}

export default function MatrixTerminal({ isFrozen = false }: MatrixTerminalProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [currentText, setCurrentText] = useState<string>('');
  const isFrozenRef = useRef<boolean>(isFrozen);

  useEffect(() => {
    isFrozenRef.current = isFrozen;
  }, [isFrozen]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let mounted = true;

    // Create a shuffled copy of the boot commands
    const pool = [...BOOT_COMMANDS];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    let commandIdx = 0;
    let dataCounter = 0;

    const getNextCommand = (): string => {
      dataCounter++;
      // Interleave binary/hex matrix data every 3-4 lines
      if (dataCounter % 3 === 0) {
        const dataItem = MATRIX_DATA_ENTRIES[Math.floor(Math.random() * MATRIX_DATA_ENTRIES.length)];
        return dataItem;
      }
      const cmd = pool[commandIdx % pool.length];
      commandIdx++;
      return cmd;
    };

    let targetText = getNextCommand();
    let charIdx = 0;

    const typeStep = () => {
      if (!mounted) return;

      if (isFrozenRef.current) {
        return;
      }

      if (charIdx < targetText.length) {
        const nextChar = targetText[charIdx];
        charIdx++;
        setCurrentText(targetText.slice(0, charIdx));
        const delay = 18 + Math.floor(Math.random() * 18);
        timeoutId = setTimeout(typeStep, delay);
      } else {
        const completedLine = targetText;
        const pauseDelay = 180 + Math.floor(Math.random() * 150);

        timeoutId = setTimeout(() => {
          if (!mounted || isFrozenRef.current) return;

          setLines((prev) => {
            const next = [...prev, completedLine];
            // Keep rolling history limited to 7 lines (around 6-8 lines)
            return next.length > 7 ? next.slice(next.length - 7) : next;
          });

          targetText = getNextCommand();
          charIdx = 0;
          setCurrentText('');

          timeoutId = setTimeout(typeStep, 60);
        }, pauseDelay);
      }
    };

    typeStep();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      className="absolute top-3 left-3 sm:top-5 sm:left-6 z-50 pointer-events-none font-mono text-[9px] xs:text-[10px] sm:text-xs leading-tight sm:leading-relaxed text-[#00FF66] max-w-[280px] xs:max-w-[340px] sm:max-w-[450px] overflow-hidden select-none"
      style={{
        textShadow: '0 0 5px rgba(0, 255, 102, 0.75), 0 0 10px rgba(0, 255, 102, 0.4)',
      }}
    >
      {lines.map((line, idx) => (
        <div key={idx} className="whitespace-nowrap truncate opacity-85">
          <span className="text-[#00FF66]/60 font-bold mr-1.5">&gt;</span>
          <span>{line}</span>
        </div>
      ))}
      <div className="whitespace-nowrap truncate flex items-center">
        <span className="text-[#00FF66]/60 font-bold mr-1.5">&gt;</span>
        <span>{currentText}</span>
        <span className="inline-block w-1.5 h-3.5 sm:w-2 sm:h-4 bg-[#00FF66] ml-0.5 animate-pulse align-middle" />
      </div>
    </div>
  );
}
