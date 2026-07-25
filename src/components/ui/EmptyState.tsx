'use client';

import React from 'react';
import { Database, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Telemetry Available',
  description = 'No content items match your current filter or database query.',
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[var(--bg-glass)] border border-[var(--border-accent)]">
      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[var(--accent-color)] mb-4">
        <Database className="w-6 h-6" />
      </div>
      <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
      <p className="text-sm font-mono text-gray-400 max-w-md mb-6 leading-relaxed">{description}</p>
      {action}
    </div>
  );
};
