'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BootController } from '@/lib/boot/BootController';
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
  const [isBootComplete, setIsBootComplete] = useState<boolean>(() => BootController.isComplete());

  const handleBootComplete = useCallback(() => {
    console.log('[AppBootGateway] Boot Sequence Completed -> Mounting React Application Tree');
    setIsBootComplete(true);
  }, []);

  useEffect(() => {
    // If already complete, ensure state is set
    if (BootController.isComplete()) {
      setIsBootComplete(true);
      return;
    }

    // Subscribe to BOOT_COMPLETED event
    const unsubscribe = BootController.onComplete(handleBootComplete);

    // Start BootController
    BootController.start();

    return () => {
      unsubscribe();
    };
  }, [handleBootComplete]);

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

      {isBootComplete && children}
    </>
  );
}

export default AppBootGateway;
