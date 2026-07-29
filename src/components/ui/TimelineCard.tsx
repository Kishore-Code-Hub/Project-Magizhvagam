'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { CyberBadge } from './CyberBadge';
import { ChevronDown, ExternalLink } from 'lucide-react';

export interface TimelineItem {
  id: string;
  year: string;
  title: string;
  subtitle?: string | null;
  description: string;
  category: string;
  expandedContent?: string | null;
  gallery?: string;
  iconKey?: string | null;
  links?: string;
  isCurrent: boolean;
}

interface TimelineCardProps {
  item: TimelineItem;
}

export const TimelineCard: React.FC<TimelineCardProps> = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const parsedLinks = React.useMemo(() => {
    try {
      return JSON.parse(item.links || '[]');
    } catch {
      return [];
    }
  }, [item.links]);

  return (
    <GlassCard variant={item.isCurrent ? 'glow' : 'interactive'} className="relative">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-[var(--bg-glass)] text-[var(--accent-color)] border border-[var(--border-accent)]">
            {item.year}
          </span>
          <CyberBadge variant="green" size="sm">
            {item.category}
          </CyberBadge>
        </div>
        {item.isCurrent && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Active Role
          </span>
        )}
      </div>

      <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
      {item.subtitle && <p className="text-sm font-mono text-[var(--accent-color)] mb-3">{item.subtitle}</p>}

      <p className="text-sm text-gray-300 leading-relaxed mb-4">{item.description}</p>

      {item.expandedContent && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 text-xs font-mono text-[var(--accent-color)] hover:underline cursor-pointer mb-3"
        >
          <span>{isExpanded ? 'Collapse Blueprint' : 'Expand Deep Dive'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      )}

      <AnimatePresence>
        {isExpanded && item.expandedContent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-gray-300 space-y-2 mb-4"
          >
            <div className="text-[var(--accent-color)] font-bold uppercase tracking-wider mb-1">Architectural Insights</div>
            <p className="leading-relaxed whitespace-pre-line">{item.expandedContent}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {parsedLinks.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
          {parsedLinks.map((link: { label: string; url: string }, i: number) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[var(--accent-color)] border border-white/10 transition-colors"
            >
              <span>{link.label}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      )}
    </GlassCard>
  );
};
