// Design System Tokens & Constants for Awwwards-Quality Cyber Portfolio V2.0

export const DESIGN_SYSTEM = {
  typography: {
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    families: {
      sans: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
      mono: 'var(--font-mono, monospace)',
    },
  },
  colors: {
    presets: {
      'cyber-green': {
        name: 'Cyber Matrix Green',
        primary: '#00ff66',
        secondary: '#00cc52',
        accentGlow: 'rgba(0, 255, 102, 0.35)',
        bgMain: '#050505',
        bgCard: 'rgba(10, 14, 11, 0.92)',
        bgGlass: 'rgba(0, 255, 102, 0.035)',
        border: 'rgba(0, 255, 102, 0.28)',
      },
      'neon-cyan': {
        name: 'Neon Cyan Overdrive',
        primary: '#00f0ff',
        secondary: '#00b8cc',
        accentGlow: 'rgba(0, 240, 255, 0.35)',
        bgMain: '#03080d',
        bgCard: 'rgba(7, 16, 26, 0.92)',
        bgGlass: 'rgba(0, 240, 255, 0.035)',
        border: 'rgba(0, 240, 255, 0.28)',
      },
      'matrix-amber': {
        name: 'Amber Terminal',
        primary: '#ffb000',
        secondary: '#d99400',
        accentGlow: 'rgba(255, 176, 0, 0.35)',
        bgMain: '#080500',
        bgCard: 'rgba(20, 14, 2, 0.92)',
        bgGlass: 'rgba(255, 176, 0, 0.035)',
        border: 'rgba(255, 176, 0, 0.28)',
      },
      'dark-minimal': {
        name: 'Monochrome Obsidian',
        primary: '#ffffff',
        secondary: '#a1a1aa',
        accentGlow: 'rgba(255, 255, 255, 0.2)',
        bgMain: '#09090b',
        bgCard: 'rgba(18, 18, 20, 0.92)',
        bgGlass: 'rgba(255, 255, 255, 0.03)',
        border: 'rgba(255, 255, 255, 0.15)',
      },
    },
  },
  categories: {
    skills: [
      'Languages',
      'Frameworks',
      'Databases',
      'Cloud & DevOps',
      'Cybersecurity',
      'AI / ML',
      'Tools',
      'Soft Skills',
    ],
    projects: [
      'All Projects',
      'Web Engineering',
      'Cybersecurity',
      'AI / ML',
      'Cloud Architecture',
    ],
    timeline: [
      'Education',
      'Experience',
      'Internships',
      'Projects',
      'Competitions',
      'Research',
      'Hackathons',
      'Certifications',
      'Milestones',
    ],
  },
} as const;

export type ThemePreset = keyof typeof DESIGN_SYSTEM.colors.presets;
