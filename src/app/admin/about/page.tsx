'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { FileUploader } from '@/components/ui/FileUploader';
import {
  User,
  Save,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  GraduationCap,
  Sparkles,
  Activity,
  Layers,
  ShieldCheck,
  Cpu,
  Globe,
  Code2,
  Terminal,
  Rocket,
  Award,
  Flame,
  CheckSquare,
  Square,
  Compass,
} from 'lucide-react';

interface AboutModules {
  showEducation: boolean;
  showFocus: boolean;
  showRoadmap: boolean;
  showSpecializations: boolean;
  showStats: boolean;
}

interface AcademicDegree {
  degree: string;
  college: string;
  year: string;
  status: string;
}

interface RoadmapItem {
  year: string;
  title: string;
  description: string;
  iconName: string;
  colorToken: string;
}

interface StatCardItem {
  id: string;
  value: string;
  label: string;
  colorToken: string;
  iconName: string;
}

interface SpecializationCardItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  colorToken: string;
}

const AVAILABLE_ICONS = [
  'GraduationCap',
  'Code2',
  'Cpu',
  'ShieldCheck',
  'Globe',
  'Compass',
  'Terminal',
  'Rocket',
  'Award',
  'Flame',
  'Sparkles',
];

const COLOR_TOKENS = [
  { label: 'Emerald Green', value: 'emerald', hex: '#00ff66' },
  { label: 'Neon Cyan', value: 'cyan', hex: '#00f0ff' },
  { label: 'Matrix Amber', value: 'amber', hex: '#ffb700' },
  { label: 'Deep Purple', value: 'purple', hex: '#a855f7' },
  { label: 'Cyber Rose', value: 'rose', hex: '#ff0055' },
];

function safeJsonParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  }
  return val as T;
}

export default function AdminAboutPage() {
  const [formData, setFormData] = useState({
    name: '',
    headline: '',
    professionalIdentity: '',
    personalBio: '',
    currentFocus: '',
    availability: '',
    education: 'B.E. Computer Science & Engineering',
    profileImage: '',
  });

  const [aboutModules, setAboutModules] = useState<AboutModules>({
    showEducation: true,
    showFocus: true,
    showRoadmap: true,
    showSpecializations: true,
    showStats: true,
  });

  const [academicDegree, setAcademicDegree] = useState<AcademicDegree>({
    degree: 'B.E. Computer Science & Engineering',
    college: 'SRM Valliammai Engineering College',
    year: '2024 – 2028',
    status: 'Active',
  });

  const [focusChips, setFocusChips] = useState<string[]>([
    '✓ Cybersecurity',
    '✓ AI & Neural Nets',
    '✓ Backend Systems',
    '✓ Cloud Infrastructure',
    '✓ DevOps & Containers',
    '✓ Network Security',
  ]);

  const [careerRoadmap, setCareerRoadmap] = useState<RoadmapItem[]>([
    { year: '2024', title: 'Started CSE Engineering', description: 'Foundation in computer science & security principles', iconName: 'GraduationCap', colorToken: 'emerald' },
    { year: '2025', title: 'Full Stack & Security Projects', description: 'Building web systems and pentesting labs', iconName: 'Code2', colorToken: 'cyan' },
    { year: '2026', title: 'AI + Cyber Threat Detection', description: 'Advanced machine learning for network intrusion', iconName: 'Cpu', colorToken: 'amber' },
    { year: 'Goal', title: 'Security Software Engineer', description: 'Production engineering and defense-in-depth', iconName: 'ShieldCheck', colorToken: 'rose' },
  ]);

  const [statsCards, setStatsCards] = useState<StatCardItem[]>([
    { id: '1', value: '15+', label: 'Projects Built', colorToken: 'emerald', iconName: 'Rocket' },
    { id: '2', value: '10+', label: 'Certifications', colorToken: 'cyan', iconName: 'Award' },
    { id: '3', value: '2+', label: 'Years Learning', colorToken: 'emerald', iconName: 'Flame' },
    { id: '4', value: '∞', label: 'Curiosity', colorToken: 'amber', iconName: 'Sparkles' },
  ]);

  const [specializationCards, setSpecializationCards] = useState<SpecializationCardItem[]>([
    { id: '1', title: 'Cybersecurity', description: 'Application Security, Threat Detection & Vulnerability Analysis', iconName: 'ShieldCheck', colorToken: 'emerald' },
    { id: '2', title: 'AI Systems', description: 'Neural Networks, Computer Vision & Constraint Algorithms', iconName: 'Cpu', colorToken: 'cyan' },
    { id: '3', title: 'Cloud Infra', description: 'Scalable Microservices, Docker Containers & CI/CD Pipelines', iconName: 'Globe', colorToken: 'amber' },
    { id: '4', title: 'Networking', description: 'TCP/IP Architecture, Packet Analysis & Firewall Systems', iconName: 'Compass', colorToken: 'rose' },
    { id: '5', title: 'Backend Systems', description: 'FastAPI, Node.js, High-Throughput REST APIs & JWT Security', iconName: 'Code2', colorToken: 'purple' },
    { id: '6', title: 'Linux Kernel', description: 'Bash Scripting, System Administration & Access Controls', iconName: 'Terminal', colorToken: 'emerald' },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const statsObj = safeJsonParse<Record<string, any>>(data.stats, {});
          let eduVal = 'B.E. Computer Science & Engineering';
          try {
            const parsedEdu = safeJsonParse(data.education, []);
            if (Array.isArray(parsedEdu) && parsedEdu.length > 0) eduVal = parsedEdu[0];
          } catch {}

          setFormData({
            name: data.name || 'Soundkish',
            headline: data.headline || 'Securing Systems. Building Trust.',
            professionalIdentity: data.professionalIdentity || '',
            personalBio: data.personalBio || data.bio || '',
            currentFocus: data.currentFocus || '',
            availability: data.availability || '',
            education: eduVal,
            profileImage: data.profileImage || statsObj.profileImage || '/hero-hacker.png',
          });

          if (data.aboutModules) {
            setAboutModules(safeJsonParse(data.aboutModules, aboutModules));
          }
          if (data.academicDegree) {
            setAcademicDegree(safeJsonParse(data.academicDegree, academicDegree));
          }
          if (data.focusChips) {
            setFocusChips(safeJsonParse(data.focusChips, focusChips));
          }
          if (data.careerRoadmap) {
            setCareerRoadmap(safeJsonParse(data.careerRoadmap, careerRoadmap));
          }
          if (data.statsCards) {
            setStatsCards(safeJsonParse(data.statsCards, statsCards));
          }
          if (data.specializationCards) {
            setSpecializationCards(safeJsonParse(data.specializationCards, specializationCards));
          }
        }
      })
      .catch((err) => console.error('Error fetching profile data:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const toggleModule = (key: keyof AboutModules) => {
    setAboutModules((prev) => ({ ...prev, [key]: !prev[key] }));
    setIsDirty(true);
  };

  const handleDegreeChange = (field: keyof AcademicDegree, value: string) => {
    setAcademicDegree((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setSaving(true);
      setMessage(null);

      try {
        const payload = {
          ...formData,
          aboutModules: JSON.stringify(aboutModules),
          academicDegree: JSON.stringify(academicDegree),
          focusChips: JSON.stringify(focusChips),
          careerRoadmap: JSON.stringify(careerRoadmap),
          statsCards: JSON.stringify(statsCards),
          specializationCards: JSON.stringify(specializationCards),
          stats: JSON.stringify({ profileImage: formData.profileImage }),
        };

        const res = await fetch('/api/admin/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to save about configuration');
        }

        setIsDirty(false);
        setLastSaved(new Date().toLocaleTimeString());
        setMessage({ type: 'success', text: 'About CMS settings updated successfully!' });
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Error saving data' });
      } finally {
        setSaving(false);
      }
    },
    [formData, aboutModules, academicDegree, focusChips, careerRoadmap, statsCards, specializationCards]
  );

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Focus Chips Handlers
  const addFocusChip = () => {
    setFocusChips((prev) => [...prev, '✓ New Focus Area']);
    setIsDirty(true);
  };
  const updateFocusChip = (index: number, val: string) => {
    setFocusChips((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
    setIsDirty(true);
  };
  const removeFocusChip = (index: number) => {
    setFocusChips((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  // Career Roadmap Handlers
  const addRoadmapItem = () => {
    setCareerRoadmap((prev) => [
      ...prev,
      { year: '2027', title: 'New Milestone', description: 'Milestone description', iconName: 'Rocket', colorToken: 'cyan' },
    ]);
    setIsDirty(true);
  };
  const updateRoadmapItem = (index: number, field: keyof RoadmapItem, val: string) => {
    setCareerRoadmap((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
    setIsDirty(true);
  };
  const moveRoadmapItem = (index: number, dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= careerRoadmap.length) return;
    setCareerRoadmap((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
    setIsDirty(true);
  };
  const removeRoadmapItem = (index: number) => {
    setCareerRoadmap((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  // Stats Cards Handlers
  const addStatCard = () => {
    setStatsCards((prev) => [
      ...prev,
      { id: Date.now().toString(), value: '100%', label: 'Metric Label', colorToken: 'emerald', iconName: 'Sparkles' },
    ]);
    setIsDirty(true);
  };
  const updateStatCard = (index: number, field: keyof StatCardItem, val: string) => {
    setStatsCards((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
    setIsDirty(true);
  };
  const removeStatCard = (index: number) => {
    setStatsCards((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  // Specialization Cards Handlers
  const addSpecializationCard = () => {
    setSpecializationCards((prev) => [
      ...prev,
      { id: Date.now().toString(), title: 'New Domain', description: 'Description of expertise', iconName: 'ShieldCheck', colorToken: 'emerald' },
    ]);
    setIsDirty(true);
  };
  const updateSpecializationCard = (index: number, field: keyof SpecializationCardItem, val: string) => {
    setSpecializationCards((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
    setIsDirty(true);
  };
  const removeSpecializationCard = (index: number) => {
    setSpecializationCards((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 font-sans text-gray-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="w-6 h-6 text-emerald-400" /> About CMS Manager
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Configure dynamic modules, bio content, career roadmap timeline, and specializations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastSaved && <span className="text-xs text-gray-400 font-mono">Saved at {lastSaved}</span>}
          <GlowButton onClick={handleSave} disabled={saving} variant={isDirty ? 'primary' : 'secondary'}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : isDirty ? 'Save Changes' : 'Saved'}
          </GlowButton>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* SECTION 1: ABOUT MODULES VISIBILITY MANAGER */}
      <GlassCard variant="glow" className="p-6 rounded-2xl border-emerald-500/30">
        <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" /> Modular About Section Controls
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Toggle modules ON or OFF. Disabled modules collapse cleanly without leaving whitespace. Stored data is preserved in the database.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { key: 'showEducation', label: 'Academic Degree' },
            { key: 'showSpecializations', label: 'Specialization Cards' },
            { key: 'showStats', label: 'Statistics Cards' },
          ].map(({ key, label }) => {
            const active = (aboutModules as any)[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleModule(key as keyof AboutModules)}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  active
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                    : 'bg-black/40 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <span className="text-xs font-semibold">{label}</span>
                {active ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-gray-500" />}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* SECTION 2: CORE BIO & PROFILE */}
      <GlassCard variant="default" className="p-6 rounded-2xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-400" /> Profile & Identity
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-black/50 border border-gray-800 rounded-lg text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Professional Identity</label>
              <input
                type="text"
                name="professionalIdentity"
                value={formData.professionalIdentity}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-black/50 border border-gray-800 rounded-lg text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Personal Bio</label>
            <textarea
              name="personalBio"
              rows={3}
              value={formData.personalBio}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-black/50 border border-gray-800 rounded-lg text-white text-sm focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Current Focus Description</label>
            <textarea
              name="currentFocus"
              rows={2}
              value={formData.currentFocus}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-black/50 border border-gray-800 rounded-lg text-white text-sm focus:border-emerald-500 outline-none"
            />
          </div>

          <FileUploader
            label="Profile Picture URL"
            value={formData.profileImage}
            onUploadComplete={(url) => {
              setFormData((prev) => ({ ...prev, profileImage: url }));
              setIsDirty(true);
            }}
            category="about"
          />
        </div>
      </GlassCard>

      {/* SECTION 3: ACADEMIC DEGREE CARD */}
      {aboutModules.showEducation && (
        <GlassCard variant="default" className="p-6 rounded-2xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-400" /> Academic Degree Card
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Degree Title</label>
              <input
                type="text"
                value={academicDegree.degree}
                onChange={(e) => handleDegreeChange('degree', e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-gray-800 rounded-lg text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">College / Institution</label>
              <input
                type="text"
                value={academicDegree.college}
                onChange={(e) => handleDegreeChange('college', e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-gray-800 rounded-lg text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Year Span</label>
              <input
                type="text"
                value={academicDegree.year}
                onChange={(e) => handleDegreeChange('year', e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-gray-800 rounded-lg text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Status Badge</label>
              <input
                type="text"
                value={academicDegree.status}
                onChange={(e) => handleDegreeChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-gray-800 rounded-lg text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
        </GlassCard>
      )}

      {/* SECTION 4: CAREER ROADMAP */}
      {aboutModules.showRoadmap ? (
        <GlassCard variant="default" className="p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" /> Career Roadmap Timeline
            </h2>
            <GlowButton type="button" onClick={addRoadmapItem} variant="secondary" className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Milestone
            </GlowButton>
          </div>

          <div className="space-y-4">
            {careerRoadmap.map((item, idx) => (
              <div key={idx} className="p-4 bg-black/40 border border-gray-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-gray-800 pb-2">
                  <span className="text-xs font-bold text-emerald-400 font-mono">Milestone #{idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveRoadmapItem(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRoadmapItem(idx, 'down')}
                      disabled={idx === careerRoadmap.length - 1}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRoadmapItem(idx)}
                      className="p-1 text-rose-400 hover:text-rose-300 ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Year / Label</label>
                    <input
                      type="text"
                      value={item.year}
                      onChange={(e) => updateRoadmapItem(idx, 'year', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-black/60 border border-gray-800 rounded text-xs text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] text-gray-400 mb-1">Milestone Title</label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateRoadmapItem(idx, 'title', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-black/60 border border-gray-800 rounded text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Description</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateRoadmapItem(idx, 'description', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-black/60 border border-gray-800 rounded text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Semantic Icon</label>
                    <select
                      value={item.iconName || 'Rocket'}
                      onChange={(e) => updateRoadmapItem(idx, 'iconName', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-black/60 border border-gray-800 rounded text-xs text-white outline-none focus:border-emerald-500"
                    >
                      {AVAILABLE_ICONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Color Theme Token</label>
                    <select
                      value={item.colorToken || 'emerald'}
                      onChange={(e) => updateRoadmapItem(idx, 'colorToken', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-black/60 border border-gray-800 rounded text-xs text-white outline-none focus:border-emerald-500"
                    >
                      {COLOR_TOKENS.map((ct) => (
                        <option key={ct.value} value={ct.value}>
                          {ct.label} ({ct.hex})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : (
        <div className="p-4 rounded-xl border border-gray-800 bg-black/30 text-xs text-gray-400">
          Career Roadmap Timeline module is currently disabled. Data is preserved in the database.
        </div>
      )}

      {/* SECTION 5: SPECIALIZATIONS GRID */}
      {aboutModules.showSpecializations && (
        <GlassCard variant="default" className="p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Specialization Highlight Cards
            </h2>
            <GlowButton type="button" onClick={addSpecializationCard} variant="secondary" className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Specialization
            </GlowButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specializationCards.map((card, idx) => (
              <div key={card.id || idx} className="p-4 bg-black/40 border border-gray-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <span className="text-xs font-bold text-cyan-400">Specialization #{idx + 1}</span>
                  <button type="button" onClick={() => removeSpecializationCard(idx)} className="text-rose-400 hover:text-rose-300">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={card.title}
                    onChange={(e) => updateSpecializationCard(idx, 'title', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-black/60 border border-gray-800 rounded text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Description</label>
                  <input
                    type="text"
                    value={card.description}
                    onChange={(e) => updateSpecializationCard(idx, 'description', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-black/60 border border-gray-800 rounded text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Icon</label>
                    <select
                      value={card.iconName || 'ShieldCheck'}
                      onChange={(e) => updateSpecializationCard(idx, 'iconName', e.target.value)}
                      className="w-full px-2 py-1.5 bg-black/60 border border-gray-800 rounded text-xs text-white outline-none"
                    >
                      {AVAILABLE_ICONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Color Token</label>
                    <select
                      value={card.colorToken || 'emerald'}
                      onChange={(e) => updateSpecializationCard(idx, 'colorToken', e.target.value)}
                      className="w-full px-2 py-1.5 bg-black/60 border border-gray-800 rounded text-xs text-white outline-none"
                    >
                      {COLOR_TOKENS.map((ct) => (
                        <option key={ct.value} value={ct.value}>
                          {ct.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* SECTION 6: STATS COUNTERS GRID */}
      {aboutModules.showStats && (
        <GlassCard variant="default" className="p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" /> Statistics Counter Cards
            </h2>
            <GlowButton type="button" onClick={addStatCard} variant="secondary" className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Counter
            </GlowButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {statsCards.map((card, idx) => (
              <div key={card.id || idx} className="p-3 bg-black/40 border border-gray-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">Card #{idx + 1}</span>
                  <button type="button" onClick={() => removeStatCard(idx)} className="text-rose-400 hover:text-rose-300">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Value (e.g. 15+)"
                  value={card.value}
                  onChange={(e) => updateStatCard(idx, 'value', e.target.value)}
                  className="w-full px-2 py-1 bg-black/60 border border-gray-800 rounded text-xs text-white outline-none font-mono"
                />
                <input
                  type="text"
                  placeholder="Label"
                  value={card.label}
                  onChange={(e) => updateStatCard(idx, 'label', e.target.value)}
                  className="w-full px-2 py-1 bg-black/60 border border-gray-800 rounded text-xs text-white outline-none"
                />
                <select
                  value={card.iconName || 'Rocket'}
                  onChange={(e) => updateStatCard(idx, 'iconName', e.target.value)}
                  className="w-full px-2 py-1 bg-black/60 border border-gray-800 rounded text-[10px] text-white outline-none"
                >
                  {AVAILABLE_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
                <select
                  value={card.colorToken || 'emerald'}
                  onChange={(e) => updateStatCard(idx, 'colorToken', e.target.value)}
                  className="w-full px-2 py-1 bg-black/60 border border-gray-800 rounded text-[10px] text-white outline-none"
                >
                  {COLOR_TOKENS.map((ct) => (
                    <option key={ct.value} value={ct.value}>
                      {ct.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
