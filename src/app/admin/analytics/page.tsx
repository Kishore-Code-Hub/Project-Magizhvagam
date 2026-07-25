'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { BarChart3, Eye, MousePointerClick, Download, MessageSquare } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="space-y-8 font-mono text-left max-w-5xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[var(--accent-color)]" /> Analytics & Visitor Telemetry
          </h1>
          <p className="text-xs text-gray-400">Privacy-focused metrics for views, downloads, project interactions, and messages.</p>
        </div>
      </div>

      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard variant="glow">
            <div className="text-xs text-gray-400 font-bold mb-1">TOTAL VIEWS</div>
            <div className="text-3xl font-extrabold text-[var(--accent-color)]">{data.summary.totalViews}</div>
          </GlassCard>

          <GlassCard variant="glow">
            <div className="text-xs text-gray-400 font-bold mb-1">PROJECT INTERACTION</div>
            <div className="text-3xl font-extrabold text-cyan-400">{data.summary.projectClicks}</div>
          </GlassCard>

          <GlassCard variant="glow">
            <div className="text-xs text-gray-400 font-bold mb-1">RESUME DOWNLOADS</div>
            <div className="text-3xl font-extrabold text-amber-400">{data.summary.resumeDownloads}</div>
          </GlassCard>

          <GlassCard variant="glow">
            <div className="text-xs text-gray-400 font-bold mb-1">MESSAGES LOGGED</div>
            <div className="text-3xl font-extrabold text-emerald-400">{data.summary.messagesCount}</div>
          </GlassCard>
        </div>
      )}

      <GlassCard variant="default">
        <h4 className="text-sm font-bold text-white uppercase mb-4">Recent Event Logs</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
          {data?.logs?.map((log: any) => (
            <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-color)]" />
                <span className="font-bold text-white">{log.eventType}</span>
                <span className="text-gray-400">{log.path || '/'}</span>
              </div>
              <span className="text-[10px] text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
