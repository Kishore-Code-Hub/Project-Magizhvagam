'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, Key, AlertTriangle, Terminal, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Stage 1: Security Gateway state
  const [gatewayKey, setGatewayKey] = useState('');
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [gatewayError, setGatewayError] = useState('');

  // Stage 2: Real Admin Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const unlocked = sessionStorage.getItem('admin_gateway_unlocked');
      if (unlocked === 'true') {
        setIsUnlocked(true);
      }
    }
    setCheckingSession(false);
  }, []);

  const handleGatewayUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setGatewayLoading(true);
    setGatewayError('');

    try {
      const res = await fetch('/api/admin/gateway/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gatewayKey }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Security key rejected.');
      }

      sessionStorage.setItem('admin_gateway_unlocked', 'true');
      setIsUnlocked(true);
    } catch (err: any) {
      setGatewayError(err.message);
    } finally {
      setGatewayLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#050508] font-mono text-emerald-400 text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 animate-spin text-emerald-400" />
          <span>CHECKING_SECURITY_CLEARANCE...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#040507] circuit-grid relative overflow-hidden select-none font-sans">
      {/* Ambient background security glows */}
      <div className="absolute top-10 left-10 w-[450px] h-[450px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Stage 1: Cyber Security Gateway */}
      {!isUnlocked ? (
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 items-stretch">
          {/* Left Panel: SOC Security Warning Card */}
          <div className="lg:col-span-7 rounded-2xl bg-[#080304]/95 border border-red-500/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)] backdrop-blur-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            {/* Scanline overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: 'linear-gradient(rgba(255, 0, 0, 0) 50%, rgba(0, 0, 0, 0.4) 50%)',
                backgroundSize: '100% 4px',
              }}
            />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between border-b border-red-500/30 pb-3">
                <span className="flex items-center gap-2 text-xs font-mono font-bold text-red-500 uppercase tracking-widest">
                  <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                  <span>CYBER OPS // GATEWAY PROTOCOL</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/80 border border-red-500/40 text-red-400">
                  LEVEL 5 RESTRICTED
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-mono font-black text-red-500 tracking-wide uppercase flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                  <span>ACCESS DETECTED</span>
                </h2>
                <div className="space-y-2 text-xs sm:text-sm text-gray-300 font-mono leading-relaxed bg-black/60 p-4 rounded-xl border border-red-500/20">
                  <p className="text-red-400 font-bold">&gt; Hey, culprit.</p>
                  <p>&gt; I know you're trying to access the administrator control panel.</p>
                  <p>&gt; This system is continuously monitored &amp; logged.</p>
                  <p>&gt; If you are not the authorized owner of this portfolio, you do not have clearance.</p>
                  <p className="text-amber-400 font-semibold">&gt; Turn back now. Unauthorized attempts will be rejected.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-red-500/20 flex items-center justify-between text-[11px] font-mono text-gray-500 relative z-10">
              <span>SECURITY LOG: ACTIVE</span>
              <span>ENCRYPTION: AES-256-GCM</span>
            </div>
          </div>

          {/* Right Panel: Security Access Key Form */}
          <div className="lg:col-span-5 rounded-2xl bg-[#050906]/95 border border-[#00ff66]/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,255,102,0.15)] backdrop-blur-xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,102,0.3)]">
                <Shield className="w-6 h-6 text-emerald-400 animate-pulse" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wide">SECURITY ACCESS KEY</h3>
                <p className="text-xs text-gray-400 font-sans mt-0.5">Enter key to unmask admin authentication gateway</p>
              </div>

              {gatewayError && (
                <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{gatewayError}</span>
                </div>
              )}

              <form onSubmit={handleGatewayUnlock} className="space-y-4 pt-2 font-mono">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                    SECURITY ACCESS KEY
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••••••"
                      value={gatewayKey}
                      onChange={(e) => setGatewayKey(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/80 border border-emerald-500/40 text-emerald-300 placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={gatewayLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-black font-extrabold text-xs tracking-widest uppercase shadow-[0_0_25px_rgba(0,255,102,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {gatewayLoading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>VERIFY SECURITY KEY</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="text-[10px] text-gray-500 font-mono text-center pt-2 border-t border-emerald-500/20">
              STAGE 1 GATEWAY // ADMIN AUTHENTICATION
            </div>
          </div>
        </div>
      ) : (
        /* Stage 2: Real Admin Login Form */
        <div className="glass-panel max-w-md w-full p-8 border-emerald-500/40 shadow-[0_0_60px_rgba(0,255,102,0.2)] relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(0,255,102,0.3)]">
              <Lock className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight font-mono uppercase">ADMINISTRATOR LOGIN</h1>
            <p className="text-xs text-emerald-400 font-mono">Stage 1 Verified // Authenticated System Control Panel</p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 font-mono">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>ADMIN EMAIL</span>
              </label>
              <input
                type="email"
                required
                placeholder="Enter the Admin Mail id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 glass-input text-sm font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                <span>SECRET PASSWORD</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 glass-input text-sm font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-extrabold text-xs tracking-widest uppercase shadow-[0_0_30px_rgba(0,255,102,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loginLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>AUTHENTICATE &amp; ENTER DASHBOARD</span>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
