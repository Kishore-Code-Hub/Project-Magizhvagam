'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BootController, BootState } from '@/lib/boot/BootController';
import CyberAccessSequence from '@/components/animation/cyber-access/CyberAccessSequence';

export interface VisitorTelemetry {
  ip?: string;
  userAgent?: string;
  host?: string;
}

export function AppBootGateway({
  children,
  initialTelemetry,
}: {
  children: React.ReactNode;
  initialTelemetry?: VisitorTelemetry;
}) {
  const [bootState, setBootState] = useState<BootState>(() => BootController.getState());
  const [isBootComplete, setIsBootComplete] = useState<boolean>(() => BootController.isComplete());

  const handleBootComplete = useCallback(() => {
    console.log('[AppBootGateway] Boot Complete -> Finalizing Application Gate');
    setIsBootComplete(true);
  }, []);

  useEffect(() => {
    if (BootController.isComplete()) {
      setIsBootComplete(true);
      return;
    }

    const unsubState = BootController.subscribe((newState) => {
      setBootState(newState);
      if (newState === 'COMPLETE') {
        setIsBootComplete(true);
      }
    });

    const unsubComplete = BootController.onComplete(handleBootComplete);

    BootController.start();

    return () => {
      unsubState();
      unsubComplete();
    };
  }, [handleBootComplete]);

  // Mount application tree right as shutter sequence starts (SHUTTER / REVEAL / COMPLETE)
  const shouldMountApp =
    isBootComplete ||
    bootState === 'SHUTTER' ||
    bootState === 'REVEAL' ||
    bootState === 'COMPLETE';

  return (
    <>
      {!isBootComplete && (
        <div className="fixed inset-0 bg-[#030303] z-[99999] overflow-hidden select-none">
          <CyberAccessSequence
            onComplete={handleBootComplete}
            telemetry={initialTelemetry}
          />
        </div>
      )}

      {shouldMountApp && (
        <div className={`w-full min-h-screen ${!isBootComplete ? 'relative z-0' : ''}`}>
          {children}
        </div>
      )}
    </>
  );
}

export default AppBootGateway;
