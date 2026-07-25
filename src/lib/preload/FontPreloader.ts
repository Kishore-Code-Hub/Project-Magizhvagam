'use client';

export async function preloadFonts(): Promise<boolean> {
  if (typeof document === 'undefined' || !document.fonts) {
    return true;
  }

  try {
    await document.fonts.ready;
    return true;
  } catch {
    return true;
  }
}
