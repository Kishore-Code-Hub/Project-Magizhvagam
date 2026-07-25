'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Inbox, Mail, Calendar, User, CheckCircle2 } from 'lucide-react';

export default function AdminContactPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/messages')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 font-mono text-left max-w-5xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
            <Inbox className="w-6 h-6 text-[var(--accent-color)]" /> System Inbox & Dispatches
          </h1>
          <p className="text-xs text-gray-400">Review contact form submissions logged into the database.</p>
        </div>
      </div>

      <div className="space-y-4">
        {messages.map((msg) => (
          <GlassCard key={msg.id} variant="default">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[var(--accent-color)]" />
                <h4 className="font-bold text-white text-base">{msg.name}</h4>
                <span className="text-xs text-gray-400">&lt;{msg.email}&gt;</span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">
                {new Date(msg.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="text-xs font-mono text-[var(--accent-color)] font-bold mb-2">
              Subject: {msg.subject}
            </div>

            <p className="text-xs text-gray-300 font-sans leading-relaxed bg-black/40 p-3 rounded-lg border border-white/5">
              {msg.message}
            </p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
