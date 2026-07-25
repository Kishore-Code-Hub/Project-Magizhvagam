/**
 * Normalizes an uploaded image URL or path.
 * Guarantees that relative upload paths or paths containing '/public/'
 * are cleanly formatted as leading absolute web URLs ("/uploads/category/...").
 */
export function normalizeImageUrl(url?: string | null, defaultCategory: string = 'uploads'): string | null {
  if (!url) return null;
  let trimmed = url.trim();
  if (!trimmed) return null;

  // Strip leading '/public' or 'public' prefix if present
  if (trimmed.startsWith('/public/')) {
    trimmed = trimmed.substring(7); // Converts '/public/uploads/...' -> '/uploads/...'
  } else if (trimmed.startsWith('public/')) {
    trimmed = '/' + trimmed.substring(7); // Converts 'public/uploads/...' -> '/uploads/...'
  }

  // Full absolute URLs (HTTP/HTTPS) or Data URIs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Absolute path already starting with '/'
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // Relative path starting with 'uploads/'
  if (trimmed.startsWith('uploads/')) {
    return '/' + trimmed;
  }

  // Bare filename (e.g. "1785001266060-burp_Suite.png")
  if (/\.(png|jpe?g|webp|svg|gif|jfif)$/i.test(trimmed)) {
    return `/uploads/${defaultCategory}/${trimmed}`;
  }

  return trimmed;
}
