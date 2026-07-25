export interface ProfileData {
  id: string;
  name: string;
  headline: string;
  taglines: string[];
  bio: string;
  resumeUrl: string;
  image?: string;
  profileImage?: string;
  professionalIdentity?: string;
  personalBio?: string;
  education?: string[];
  currentFocus?: string;
  values?: string[];
  availability?: string;
  languages?: string[];
  socials: {
    github?: string;
    linkedin?: string;
    email?: string;
    twitter?: string;
    leetcode?: string;
    tryhackme?: string;
    hackthebox?: string;
  };
  stats: {
    yearsLearning: string;
    projects: string;
    certifications: string;
    curiosity: string;
    heroImage?: string;
    greeting?: string;
  };
  aboutModules?: {
    showEducation?: boolean;
    showFocus?: boolean;
    showRoadmap?: boolean;
    showSpecializations?: boolean;
    showStats?: boolean;
  };
  academicDegree?: {
    degree: string;
    college: string;
    year: string;
    status: string;
  };
  focusChips?: string[];
  careerRoadmap?: {
    year: string;
    title: string;
    description: string;
    iconName?: string;
    colorToken?: string;
  }[];
  statsCards?: {
    id: string;
    value: string;
    label: string;
    colorToken?: string;
    iconName: string;
  }[];
  specializationCards?: {
    id: string;
    title: string;
    description: string;
    iconName: string;
    colorToken?: string;
  }[];
}

export interface ProjectData {
  id: string;
  title: string;
  description: string;
  longDescription?: string | null;
  image: string;
  gallery?: string;
  videoUrl?: string | null;
  githubUrl?: string | null;
  liveUrl?: string | null;
  documentationUrl?: string | null;
  architectureDiagram?: string | null;
  features?: string;
  challenges?: string | null;
  solutions?: string | null;
  tags: string | string[];
  category?: string;
  status?: string;
  metrics?: string;
  featured: boolean;
  order: number;
  published: boolean;
  createdAt?: string;
}

export interface SkillData {
  id: string;
  name: string;
  category: string;
  icon?: string;
  officialLogo?: string | null;
  shortDesc?: string | null;
  yearsExperience?: number;
  proficiency?: number;
  level?: string;
  featured?: boolean;
  order: number;
}

export interface CertificationData {
  id: string;
  title: string;
  issuer: string;
  logoUrl?: string | null;
  organizationLogo?: string | null;
  issueDate: string;
  expiryDate?: string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  pdfUrl?: string | null;
  skillsCovered?: string;
  description?: string | null;
  featured?: boolean;
  order: number;
}

export interface TimelineData {
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
  isCurrent?: boolean;
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
