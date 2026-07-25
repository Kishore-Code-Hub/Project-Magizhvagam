'use client';

class ImagePreloaderEngine {
  private loadedUrls: Set<string> = new Set();
  private failedUrls: Set<string> = new Set();

  /**
   * Preload and hardware-decode a single image URL into memory buffer.
   * Never throws or blocks execution on failure.
   */
  public async preloadImage(url: string, priority: 'high' | 'auto' = 'high'): Promise<boolean> {
    if (!url || typeof window === 'undefined') return true;
    if (this.loadedUrls.has(url)) return true;
    if (this.failedUrls.has(url)) return false;

    return new Promise((resolve) => {
      const img = new Image();
      img.loading = 'eager';
      (img as any).fetchPriority = priority;
      img.decoding = 'async';

      img.onload = async () => {
        this.loadedUrls.add(url);
        if ('decode' in img) {
          try {
            await img.decode();
          } catch {
            // Ignore decode warning
          }
        }
        resolve(true);
      };

      img.onerror = () => {
        console.warn(`[ImagePreloader] Asset fallback applied for: ${url}`);
        this.failedUrls.add(url);
        resolve(false);
      };

      img.src = url;
    });
  }

  public isLoaded(url: string): boolean {
    return this.loadedUrls.has(url);
  }
}

export const ImagePreloader = new ImagePreloaderEngine();
