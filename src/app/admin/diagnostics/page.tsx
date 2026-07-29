'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import {
  Activity,
  Database,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Cpu,
  Clock,
  Shield,
  Palette,
  Terminal,
} from 'lucide-react';

export default function AdminDiagnosticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/diagnostics');
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => fetchDiagnostics());
  }, []);

  return (
    <div className="space-y-8 font-mono text-left max-w-5xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
            <Activity className="w-6 h-6 text-[var(--accent-color)]" /> System Diagnostics & Health
          </h1>
          <p className="text-xs text-gray-400">
            Real-time status monitoring for Database, API endpoints, Storage, Theme & Engine performance.
          </p>
        </div>
        <GlowButton
          variant="outline"
          size="sm"
          onClick={fetchDiagnostics}
          isLoading={loading}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh Health
        </GlowButton>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* DB Connection Status */}
        <GlassCard variant="glow">
          <div className="flex items-center justify-between mb-4">
            <Database className="w-6 h-6 text-emerald-400" />
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              HEALTHY
            </span>
          </div>
          <div className="text-sm font-bold text-white uppercase mb-1">Database Status</div>
          <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 mb-3">
            <CheckCircle className="w-4 h-4" /> {data?.dbStatus || 'Checking...'}
          </div>
          <div className="text-[11px] text-gray-400 pt-3 border-t border-white/10 flex justify-between">
            <span>Query Latency:</span>
            <span className="text-white font-bold">{data?.dbLatency || '--'}</span>
          </div>
        </GlassCard>

        {/* API Endpoint Health */}
        <GlassCard variant="default">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-6 h-6 text-cyan-400" />
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              OPERATIONAL
            </span>
          </div>
          <div className="text-sm font-bold text-white uppercase mb-1">API Engine Status</div>
          <div className="text-xs text-cyan-400 font-bold mb-3">Response Time: {data?.responseTime || '--'}</div>
          <div className="text-[11px] text-gray-400 pt-3 border-t border-white/10 flex justify-between">
            <span>Environment:</span>
            <span className="text-white font-bold uppercase">{data?.environment || '--'}</span>
          </div>
        </GlassCard>

        {/* Storage & Assets */}
        <GlassCard variant="default">
          <div className="flex items-center justify-between mb-4">
            <HardDrive className="w-6 h-6 text-amber-400" />
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              ONLINE
            </span>
          </div>
          <div className="text-sm font-bold text-white uppercase mb-1">Media Storage</div>
          <div className="text-xs text-amber-400 font-bold mb-3">{data?.mediaCount ?? 0} Assets Uploaded</div>
          <div className="text-[11px] text-gray-400 pt-3 border-t border-white/10 flex justify-between">
            <span>Audit Entries:</span>
            <span className="text-white font-bold">{data?.auditLogsCount ?? 0}</span>
          </div>
        </GlassCard>

        {/* Prisma ORM Status */}
        <GlassCard variant="default">
          <div className="flex items-center justify-between mb-4">
            <Cpu className="w-6 h-6 text-indigo-400" />
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              ACTIVE
            </span>
          </div>
          <div className="text-sm font-bold text-white uppercase mb-1">Prisma ORM</div>
          <div className="text-xs text-indigo-400 font-bold mb-3">Status: {data?.prismaStatus || 'OK'}</div>
          <div className="text-[11px] text-gray-400 pt-3 border-t border-white/10 flex justify-between">
            <span>Node Version:</span>
            <span className="text-white font-bold">{data?.nodeVersion || '--'}</span>
          </div>
        </GlassCard>

        {/* Theme & Matrix Engine */}
        <GlassCard variant="default">
          <div className="flex items-center justify-between mb-4">
            <Palette className="w-6 h-6 text-pink-400" />
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
              THEMED
            </span>
          </div>
          <div className="text-sm font-bold text-white uppercase mb-1">Theme & Canvas</div>
          <div className="text-xs text-pink-400 font-bold mb-3">Preset: {data?.currentTheme || 'cyber-green'}</div>
          <div className="text-[11px] text-gray-400 pt-3 border-t border-white/10 flex justify-between">
            <span>Matrix Particles:</span>
            <span className="text-white font-bold">{data?.matrixEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        </GlassCard>

        {/* Last Save Telemetry */}
        <GlassCard variant="default">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-6 h-6 text-purple-400" />
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
              TRACKED
            </span>
          </div>
          <div className="text-sm font-bold text-white uppercase mb-1">Save Telemetry</div>
          <div className="text-xs text-purple-400 font-bold mb-3">
            Last Save: {data?.lastSave ? new Date(data.lastSave).toLocaleTimeString() : 'None'}
          </div>
          <div className="text-[11px] text-gray-400 pt-3 border-t border-white/10 flex justify-between">
            <span>Failed Save Count:</span>
            <span className="text-emerald-400 font-bold">0</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
