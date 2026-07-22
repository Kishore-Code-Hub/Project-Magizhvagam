export interface ProfileData {
  id: string;
  name: string;
  headline: string;
  taglines: string[];
  bio: string;
  resumeUrl: string;
  image?: string;
  socials: {
    github?: string;
    linkedin?: string;
    email?: string;
    twitter?: string;
  };
  stats: {
    yearsLearning: string;
    projects: string;
    certifications: string;
    curiosity: string;
  };
}

export interface ProjectData {
  id: string;
  title: string;
  description: string;
  longDescription?: string | null;
  image: string;
  tags: string[];
  githubUrl?: string | null;
  liveUrl?: string | null;
  featured: boolean;
  order: number;
  published: boolean;
  createdAt?: string;
}

export interface SkillData {
  id: string;
  name: string;
  category: 'Languages' | 'Security Tools' | 'Infra/DevOps' | 'AI/ML' | string;
  icon: string;
  level?: string;
  order: number;
}

export interface CertificationData {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialUrl?: string | null;
  logoUrl?: string | null;
  order: number;
}

export interface TimelineData {
  id: string;
  year: string;
  title: string;
  subtitle?: string | null;
  description: string;
  category: 'Education' | 'Project' | 'Milestone' | 'Security' | string;
  order: number;
}

export interface MessageData {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  ipAddress?: string | null;
  isRead: boolean;
  repliedAt?: string | null;
  replyMessage?: string | null;
  createdAt: string;
}
