'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { Modal } from '@/components/ui/Modal';
import {
  Inbox,
  Mail,
  User,
  Star,
  Archive,
  Trash2,
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  Send,
  Globe,
  Monitor,
  Clock,
} from 'lucide-react';

export default function AdminContactPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read' | 'starred' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Selected message for details metadata drawer / reply modal
  const [selectedMsg, setSelectedMsg] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Delete Confirmation Modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadMessages = () => {
    fetch('/api/admin/messages')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleToggleStatus = async (id: string, updates: Partial<{ isRead: boolean; isStarred: boolean; isArchived: boolean }>) => {
    try {
      await fetch('/api/admin/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      loadMessages();
      if (selectedMsg && selectedMsg.id === id) {
        setSelectedMsg((prev: any) => ({ ...prev, ...updates }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async () => {
    if (!deleteTargetId) return;
    try {
      await fetch(`/api/admin/messages?id=${deleteTargetId}`, { method: 'DELETE' });
      if (selectedMsg?.id === deleteTargetId) setSelectedMsg(null);
      setDeleteTargetId(null);
      loadMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMsg || !replyText.trim()) return;

    setSendingReply(true);
    try {
      await fetch('/api/admin/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedMsg.id, replyMessage: replyText }),
      });

      // Send mailto shortcut or SMTP trigger
      window.open(
        `mailto:${selectedMsg.email}?subject=Re: ${encodeURIComponent(selectedMsg.subject)}&body=${encodeURIComponent(replyText)}`
      );

      setReplyText('');
      loadMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReply(false);
    }
  };

  // Filter & Pagination Logic
  const filteredMessages = messages.filter((msg) => {
    const matchesTab =
      activeTab === 'all'
        ? !msg.isArchived
        : activeTab === 'unread'
        ? !msg.isRead && !msg.isArchived
        : activeTab === 'read'
        ? msg.isRead && !msg.isArchived
        : activeTab === 'starred'
        ? msg.isStarred && !msg.isArchived
        : msg.isArchived;

    const matchesSearch =
      msg.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage) || 1;
  const paginatedMessages = filteredMessages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8 font-mono text-left max-w-6xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
            <Inbox className="w-6 h-6 text-[var(--accent-color)]" /> System Message Center
          </h1>
          <p className="text-xs text-gray-400">Interactive communications inbox, status tracking, and visitor telemetry.</p>
        </div>
      </div>

      {/* Controls HUD */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-white/10">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {(['all', 'unread', 'read', 'starred', 'archived'] as const).map((tab) => {
            const count = messages.filter((m) =>
              tab === 'all' ? !m.isArchived : tab === 'unread' ? !m.isRead && !m.isArchived : tab === 'read' ? m.isRead && !m.isArchived : tab === 'starred' ? m.isStarred && !m.isArchived : m.isArchived
            ).length;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs rounded-xl uppercase transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-[var(--accent-color)] text-black font-bold'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{tab}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-current">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search inbox..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
          />
        </div>
      </div>

      {/* Main Grid: Inbox List (8 cols) & Message Detail Drawer (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Messages List Column */}
        <div className="lg:col-span-7 space-y-3">
          {paginatedMessages.length > 0 ? (
            paginatedMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  setSelectedMsg(msg);
                  if (!msg.isRead) handleToggleStatus(msg.id, { isRead: true });
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedMsg?.id === msg.id
                    ? 'border-[var(--accent-color)] bg-[var(--bg-glass)]'
                    : !msg.isRead
                    ? 'border-emerald-500/30 bg-black/60 font-bold'
                    : 'border-white/10 bg-black/30 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(msg.id, { isStarred: !msg.isStarred });
                      }}
                      className="text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-4 h-4 ${msg.isStarred ? 'fill-amber-400' : 'text-gray-500'}`} />
                    </button>
                    <h4 className="text-sm text-white font-bold">{msg.name}</h4>
                    <span className="text-[10px] text-gray-400">&lt;{msg.email}&gt;</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{new Date(msg.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="text-xs text-[var(--accent-color)] font-bold mb-1">{msg.subject}</div>
                <p className="text-xs text-gray-400 line-clamp-2">{msg.message}</p>

                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] text-gray-500 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-cyan-400" /> {msg.ipAddress || 'IP logged'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(msg.id, { isArchived: !msg.isArchived });
                      }}
                      className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10"
                      title="Archive Message"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTargetId(msg.id);
                      }}
                      className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-red-500/20"
                      title="Delete Message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <GlassCard variant="default" className="p-8 text-center text-xs text-gray-400">
              No messages found in this view.
            </GlassCard>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-gray-400">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Message Detail & Visitor Telemetry Panel */}
        <div className="lg:col-span-5">
          {selectedMsg ? (
            <GlassCard variant="default" className="space-y-4 sticky top-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-bold text-white text-base">Message Detail</h3>
                <button
                  onClick={() => setSelectedMsg(null)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Close Panel
                </button>
              </div>

              <div>
                <div className="text-xs text-gray-400 font-mono">FROM</div>
                <div className="text-sm font-bold text-white">{selectedMsg.name}</div>
                <div className="text-xs text-[var(--accent-color)]">{selectedMsg.email}</div>
              </div>

              <div>
                <div className="text-xs text-gray-400 font-mono">SUBJECT</div>
                <div className="text-xs font-bold text-white">{selectedMsg.subject}</div>
              </div>

              <div>
                <div className="text-xs text-gray-400 font-mono mb-1">MESSAGE BODY</div>
                <div className="text-xs text-gray-200 bg-black/60 p-3 rounded-xl border border-white/10 leading-relaxed max-h-48 overflow-y-auto">
                  {selectedMsg.message}
                </div>
              </div>

              {/* Visitor Telemetry Drawer */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase">
                  <Info className="w-3.5 h-3.5" /> Visitor Telemetry
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-300 font-mono bg-black/40 p-2.5 rounded-lg border border-white/5">
                  <div>IP: <span className="text-white">{selectedMsg.ipAddress || '127.0.0.1'}</span></div>
                  <div>Submitted: <span className="text-white">{new Date(selectedMsg.createdAt).toLocaleTimeString()}</span></div>
                  <div>Browser: <span className="text-white">{selectedMsg.browser || 'Chrome/Next.js'}</span></div>
                  <div>OS: <span className="text-white">{selectedMsg.os || 'Windows/Linux'}</span></div>
                  <div>Timezone: <span className="text-white">{selectedMsg.timezone || 'UTC+5:30'}</span></div>
                  <div>Device: <span className="text-white">{selectedMsg.device || 'Desktop'}</span></div>
                </div>
              </div>

              {/* Quick Reply Form */}
              <form onSubmit={handleSendReply} className="pt-2 border-t border-white/10 space-y-2">
                <label className="block text-xs font-bold text-gray-300">Quick Reply Shortcut</label>
                <textarea
                  rows={2}
                  placeholder="Type reply message..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)] resize-none"
                />
                <GlowButton type="submit" variant="primary" size="sm" isLoading={sendingReply} className="w-full" leftIcon={<Send className="w-3.5 h-3.5" />}>
                  Dispatch Mailto Reply
                </GlowButton>
              </form>
            </GlassCard>
          ) : (
            <GlassCard variant="default" className="p-8 text-center text-xs text-gray-400">
              Select a message from the inbox to view full message details and visitor telemetry.
            </GlassCard>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={Boolean(deleteTargetId)} onClose={() => setDeleteTargetId(null)} title="Confirm Delete Message">
        <div className="space-y-4 text-xs font-mono">
          <p className="text-gray-300">Are you sure you want to permanently delete this message entry from the database?</p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteTargetId(null)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300"
            >
              Cancel
            </button>
            <GlowButton variant="secondary" onClick={handleDeleteMessage} className="bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500 hover:text-white">
              Delete Permanently
            </GlowButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
