'use client';

import React from 'react';

interface LoadingSkeletonProps {
  count?: number;
  height?: string;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  count = 3,
  height = 'h-32',
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`w-full ${height} rounded-2xl bg-white/5 border border-white/10 animate-pulse p-6 flex flex-col justify-between`}
        >
          <div className="w-2/3 h-4 bg-white/10 rounded" />
          <div className="w-full h-3 bg-white/10 rounded" />
          <div className="w-1/2 h-3 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
};
