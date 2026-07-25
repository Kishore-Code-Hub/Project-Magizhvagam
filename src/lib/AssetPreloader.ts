'use client';

export interface PreloadProgress {
  percent: number;
  stage: string;
  loadedCount: number;
  totalCount: number;
}

class AssetPreloaderEngine {
  private cache: Set<string> = new Set();

  /**
   * Preload a single image URL into browser cache & decode into memory buffer
   */
  public async preloadImage(url: string): Promise<void> {
    if (!url || typeof window === 'undefined' || this.cache.has(url)) {
      return;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.loading = 'eager';
      (img as any).fetchPriority = 'high';
      img.decoding = 'async';

      img.onload = () => {
        this.cache.add(url);
        if ('decode' in img) {
          img
            .decode()
            .then(() => resolve())
            .catch(() => resolve());
        } else {
          resolve();
        }
      };

      img.onerror = () => {
        // Resolve on error to prevent blocking execution
        resolve();
      };

      img.src = url;
    });
  }

  /**
   * Inject high priority <link rel="preload" as="image"> tag into document.head
   */
  public injectHeadPreload(url: string): void {
    if (!url || typeof document === 'undefined') return;
    const existing = document.querySelector(`link[rel="preload"][href="${url}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    (link as any).fetchPriority = 'high';
    document.head.appendChild(link);
  }

  /**
   * Main Boot Preloading pipeline
   */
  public async preloadAll(
    onProgress?: (progress: PreloadProgress) => void
  ): Promise<void> {
    if (typeof window === 'undefined') return;

    onProgress?.({
      percent: 5,
      stage: 'INITIALIZING_SYSTEM_KERNEL',
      loadedCount: 0,
      totalCount: 1,
    });

    const urlsToPreload: Set<string> = new Set(['/hero-hacker.png']);

    try {
      // Step 1: Fetch Profile & Appearance Settings (15%)
      onProgress?.({
        percent: 15,
        stage: 'FETCHING_CMS_PROFILE_DATA',
        loadedCount: 0,
        totalCount: 1,
      });

      const profileRes = await fetch('/api/admin/profile').catch(() => null);
      if (profileRes && profileRes.ok) {
        const profileData = await profileRes.json().catch(() => null);
        if (profileData) {
          let statsObj: any = {};
          try {
            statsObj = typeof profileData.stats === 'string' ? JSON.parse(profileData.stats) : profileData.stats || {};
          } catch {}

          if (statsObj.heroImage) urlsToPreload.add(statsObj.heroImage);
          if (statsObj.profileImage) urlsToPreload.add(statsObj.profileImage);
        }
      }

      // Step 2: Fetch Projects, Certificates, Timeline, Skills (35%)
      onProgress?.({
        percent: 35,
        stage: 'COLLECTING_SECTION_MEDIA_ASSETS',
        loadedCount: 0,
        totalCount: urlsToPreload.size,
      });

      const [projectsRes, certsRes, timelineRes, skillsRes] = await Promise.all([
        fetch('/api/admin/projects').catch(() => null),
        fetch('/api/admin/certificates').catch(() => null),
        fetch('/api/admin/timeline').catch(() => null),
        fetch('/api/admin/skills').catch(() => null),
      ]);

      if (projectsRes?.ok) {
        const projects = await projectsRes.json().catch(() => []);
        if (Array.isArray(projects)) {
          projects.slice(0, 6).forEach((p: any) => {
            if (p.image) urlsToPreload.add(p.image);
          });
        }
      }

      if (certsRes?.ok) {
        const certs = await certsRes.json().catch(() => []);
        if (Array.isArray(certs)) {
          certs.slice(0, 6).forEach((c: any) => {
            if (c.organizationLogo) urlsToPreload.add(c.organizationLogo);
          });
        }
      }

      if (timelineRes?.ok) {
        const timeline = await timelineRes.json().catch(() => []);
        if (Array.isArray(timeline)) {
          timeline.slice(0, 6).forEach((t: any) => {
            if (t.iconUrl) urlsToPreload.add(t.iconUrl);
          });
        }
      }

      if (skillsRes?.ok) {
        const skills = await skillsRes.json().catch(() => []);
        if (Array.isArray(skills)) {
          skills.slice(0, 10).forEach((s: any) => {
            if (s.officialLogo) urlsToPreload.add(s.officialLogo);
          });
        }
      }

      // Step 3: Inject Head Preload Links & Preload Images in Parallel (50% -> 90%)
      const urlArray = Array.from(urlsToPreload);
      urlArray.forEach((url) => this.injectHeadPreload(url));

      let loadedCount = 0;
      const totalCount = urlArray.length;

      onProgress?.({
        percent: 50,
        stage: 'PRELOADING_HERO_AND_ABOUT_MEDIA',
        loadedCount: 0,
        totalCount,
      });

      await Promise.all(
        urlArray.map(async (url) => {
          await this.preloadImage(url);
          loadedCount++;
          const percent = Math.min(90, 50 + Math.round((loadedCount / totalCount) * 40));
          onProgress?.({
            percent,
            stage: 'DECODING_MEDIA_MEMORY_BUFFERS',
            loadedCount,
            totalCount,
          });
        })
      );

      // Step 4: Font Preloading & Final Hardware Sync (90% -> 100%)
      onProgress?.({
        percent: 92,
        stage: 'SYNCHRONIZING_SYSTEM_FONTS',
        loadedCount,
        totalCount,
      });

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready.catch(() => null);
      }

      onProgress?.({
        percent: 100,
        stage: 'SYSTEM_READY_FOR_DISPATCH',
        loadedCount,
        totalCount,
      });
    } catch (err) {
      console.warn('[AssetPreloader] Warning during preload:', err);
      onProgress?.({
        percent: 100,
        stage: 'SYSTEM_READY_FOR_DISPATCH',
        loadedCount: urlsToPreload.size,
        totalCount: urlsToPreload.size,
      });
    }
  }
}

export const AssetPreloader = new AssetPreloaderEngine();
