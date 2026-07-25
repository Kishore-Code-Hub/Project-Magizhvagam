'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Shield, ShieldAlert, Key, Lock, UserCheck } from 'lucide-react';

export default function AdminSecurityPage() {
  const [data, setData] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    fetch('/api/admin/security')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error(err));
  }, []);

  const categories = ['ALL', 'ADMIN_ACTIONS', 'FAILED_LOGINS', 'MATRIX_EDITS', 'MEDIA_UPLOADS'];

  const filteredLogs = data?.auditLogs?.filter((log: any) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'ADMIN_ACTIONS') return log.action?.includes('UPDATE') || log.action?.includes('CREATE');
    if (selectedCategory === 'FAILED_LOGINS') return log.action?.includes('LOGIN_FAILED') || log.action?.includes('AUTH_ERROR');
    if (selectedCategory === 'MATRIX_EDITS') return log.action?.includes('MATRIX') || log.action?.includes('APPEARANCE');
    if (selectedCategory === 'MEDIA_UPLOADS') return log.action?.includes('UPLOAD') || log.action?.includes('MEDIA');
    return true;
  });

  const handleTerminateSession = async (sessionId?: string) => {
    try {
      const url = sessionId ? `/api/admin/security?sessionId=${sessionId}` : '/api/admin/security?all=true';
      await fetch(url, { method: 'DELETE' });
      // reload
      const res = await fetch('/api/admin/security');
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error(err);
    }
  };

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
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-white uppercase flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" /> Active Authenticated Sessions
          </h4>
          {data?.activeSessions?.length > 0 && (
            <button
              onClick={() => handleTerminateSession()}
              className="px-3 py-1 text-[10px] rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
            >
              Terminate All Sessions
            </button>
          )}
        </div>

        <div className="space-y-2">
          {data?.activeSessions?.length > 0 ? (
            data.activeSessions.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{s.user?.name || 'Admin User'}</span>
                    <span className="text-gray-400">({s.user?.email || 'admin@soundkish.dev'})</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 flex flex-wrap items-center gap-3">
                    <span>Started: {new Date(s.createdAt).toLocaleString()}</span>
                    <span>Expires: {new Date(s.expiresAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    Active Session
                  </span>
                  <button
                    onClick={() => handleTerminateSession(s.id)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all cursor-pointer"
                    title="Terminate Session"
                  >
                    <Key className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-gray-500">No active authenticated sessions.</div>
          )}
        </div>
      </GlassCard>

      <GlassCard variant="default">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h4 className="text-sm font-bold text-white uppercase flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" /> System Audit Logs
          </h4>

          {/* Audit Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[var(--accent-color)] text-black font-bold border-[var(--accent-color)]'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
          {filteredLogs?.length > 0 ? (
            filteredLogs.map((log: any) => (
              <div key={log.id} className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-[var(--accent-color)]">{log.action}</span>
                  <span className="text-gray-400 ml-2">by {log.actor}</span>
                  {log.details && <p className="text-[10px] text-gray-500 truncate max-w-md">{log.details}</p>}
                </div>
                <span className="text-[10px] text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-gray-500">No matching audit logs found for this filter.</div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
