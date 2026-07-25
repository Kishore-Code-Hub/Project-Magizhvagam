'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Shield, ShieldAlert, Key, Lock, UserCheck } from 'lucide-react';

export default function AdminSecurityPage() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/admin/security')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="space-y-8 font-mono text-left max-w-5xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
            <Shield className="w-6 h-6 text-[var(--accent-color)]" /> Security & Audit Trail Control
          </h1>
          <p className="text-xs text-gray-400">Inspect system audit logs, active JWT sessions, and security posture.</p>
        </div>
      </div>

      <GlassCard variant="glow">
        <h4 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-400" /> Active Authenticated Sessions
        </h4>
        <div className="space-y-2">
          {data?.activeSessions?.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10 text-xs">
              <div>
                <span className="font-bold text-white">{s.user?.name}</span> ({s.user?.email})
                <div className="text-[10px] text-gray-400">Expires: {new Date(s.expiresAt).toLocaleString()}</div>
              </div>
              <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Active Session
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard variant="default">
        <h4 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" /> System Audit Logs
        </h4>
        <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
          {data?.auditLogs?.map((log: any) => (
            <div key={log.id} className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-[var(--accent-color)]">{log.action}</span>
                <span className="text-gray-400 ml-2">by {log.actor}</span>
                {log.details && <p className="text-[10px] text-gray-500 truncate max-w-md">{log.details}</p>}
              </div>
              <span className="text-[10px] text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
