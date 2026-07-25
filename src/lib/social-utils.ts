export interface SocialsConfig {
  github: string;
  linkedin: string;
  leetcode: string;
  email: string;
  tryhackme?: string;
  hackthebox?: string;
}

export const DEFAULT_SOCIALS: SocialsConfig = {
  github: 'https://github.com',
  linkedin: 'https://linkedin.com',
  leetcode: 'https://leetcode.com',
  email: 'mailto:kishorenarayanankarthikeyan@gmail.com',
  tryhackme: 'https://tryhackme.com',
  hackthebox: 'https://hackthebox.com',
};

/**
 * Robustly parses and normalizes socials data from database or props.
 * Always returns non-empty URLs for github, linkedin, and leetcode.
 */
export function getSocials(rawSocials?: any): SocialsConfig {
  if (!rawSocials) return { ...DEFAULT_SOCIALS };

  let parsed = rawSocials;

  // If rawSocials is a string, parse JSON (handle double-stringified JSON)
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = {};
    }
  }
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = {};
    }
  }

  const github = typeof parsed?.github === 'string' && parsed.github.trim() ? parsed.github.trim() : DEFAULT_SOCIALS.github;
  const linkedin = typeof parsed?.linkedin === 'string' && parsed.linkedin.trim() ? parsed.linkedin.trim() : DEFAULT_SOCIALS.linkedin;
  const leetcode = typeof parsed?.leetcode === 'string' && parsed.leetcode.trim() ? parsed.leetcode.trim() : DEFAULT_SOCIALS.leetcode;
  const email = typeof parsed?.email === 'string' && parsed.email.trim() ? parsed.email.trim() : DEFAULT_SOCIALS.email;

  return {
    ...DEFAULT_SOCIALS,
    ...parsed,
    github,
    linkedin,
    leetcode,
    email,
  };
}
