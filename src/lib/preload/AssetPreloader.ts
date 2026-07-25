'use client';

import { ImagePreloader } from './ImagePreloader';
import { preloadFonts } from './FontPreloader';
import { fetchCMSPayload, CMSInitialPayload } from './ThemeLoader';

export interface PreloadProgress {
  percent: number;
  stage: string;
  loadedCount: number;
  totalCount: number;
  cmsPayload?: CMSInitialPayload;
}

class PriorityAssetPreloader {
  private isTier1Complete = false;

  /**
   * Inject high-priority <link rel="preload" as="image"> into document head
   */
  private injectHeadPreload(url: string) {
    if (!url || typeof document === 'undefined') return;
    if (document.querySelector(`link[rel="preload"][href="${url}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    (link as any).fetchPriority = 'high';
    document.head.appendChild(link);
  }

  /**
   * Main Boot Preloading Execution Pipeline
   */
  public async preloadTier1(
    onProgress?: (progress: PreloadProgress) => void
  ): Promise<CMSInitialPayload> {
    if (typeof window === 'undefined') {
      const fallbackPayload = await fetchCMSPayload();
      return fallbackPayload;
    }

    console.log('[Boot Engine] Tier 1 Critical Asset Preloading Started');

    onProgress?.({
      percent: 10,
      stage: 'INITIALIZING_KERNEL_ENVIRONMENT',
      loadedCount: 0,
      totalCount: 2,
    });

    // Step 1: Fetch CMS Profile & Appearance (30%)
    const cmsPayload = await fetchCMSPayload();
    console.log('[Boot Engine] CMS Profile Data & Theme Loaded', cmsPayload);

    onProgress?.({
      percent: 35,
      stage: 'PRELOADING_HERO_AND_ABOUT_MEDIA',
      loadedCount: 0,
      totalCount: 2,
      cmsPayload,
    });

    // Inject Head Preload links for Tier 1 Hero & About artwork
    this.injectHeadPreload(cmsPayload.heroImage);
    this.injectHeadPreload(cmsPayload.profileImage);

    // Step 2: Parallel Preload & Hardware img.decode() for Hero & About (75%)
    let tier1Loaded = 0;
    await Promise.all([
      ImagePreloader.preloadImage(cmsPayload.heroImage, 'high').then(() => {
        tier1Loaded++;
        console.log('[Boot Engine] Hero Workstation Artwork Preloaded & Decoded');
        onProgress?.({
          percent: 55,
          stage: 'DECODING_HERO_MEDIA_BUFFER',
          loadedCount: tier1Loaded,
          totalCount: 2,
          cmsPayload,
        });
      }),
      ImagePreloader.preloadImage(cmsPayload.profileImage, 'high').then(() => {
        tier1Loaded++;
        console.log('[Boot Engine] About Profile Image Preloaded & Decoded');
        onProgress?.({
          percent: 75,
          stage: 'DECODING_ABOUT_MEDIA_BUFFER',
          loadedCount: tier1Loaded,
          totalCount: 2,
          cmsPayload,
        });
      }),
    ]);

    // Step 3: Font Preloading & System Sync (100%)
    await preloadFonts();
    console.log('[Boot Engine] Fonts & CSS Ready');

    this.isTier1Complete = true;

    onProgress?.({
      percent: 100,
      stage: 'TIER1_CRITICAL_ASSETS_READY',
      loadedCount: 2,
      totalCount: 2,
      cmsPayload,
    });

    // Step 4: Dispatch Tier 2 Background Preloading (Non-blocking)
    this.preloadTier2Background(cmsPayload);

    return cmsPayload;
  }

  /**
   * Tier 2 Background Asset Preloading (Projects, Certificates, Timeline, Skills)
   * Runs asynchronously without blocking the UI reveal!
   */
  private async preloadTier2Background(payload: CMSInitialPayload) {
    if (typeof window === 'undefined') return;

    const backgroundUrls = [
      ...payload.projectImages,
      ...payload.certLogos,
      ...payload.timelineIcons,
      ...payload.skillLogos,
    ];

    if (backgroundUrls.length === 0) return;

    console.log(`[Boot Engine] Tier 2 Background Preloading Launched (${backgroundUrls.length} assets)`);

    await Promise.all(
      backgroundUrls.map((url) => ImagePreloader.preloadImage(url, 'auto'))
    );

    console.log('[Boot Engine] Tier 2 Background Asset Preloading Complete');
  }
}

export const AssetPreloader = new PriorityAssetPreloader();
