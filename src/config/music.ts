import { MUSIC_PATH } from '@/lib/audio/constants';

export { MUSIC_PATH };

export interface MusicConfig {
  defaultTrackTitle: string;
  defaultTrackUrl: string;
  defaultVolume: number;
  defaultMute: boolean;
  defaultAutoplay: boolean;
  defaultLoop: boolean;
  supportedFormats: string[];
}

export const DEFAULT_MUSIC_CONFIG: MusicConfig = {
  defaultTrackTitle: 'Cyber Ambient Operations',
  defaultTrackUrl: MUSIC_PATH,
  defaultVolume: 25,
  defaultMute: false,
  defaultAutoplay: true,
  defaultLoop: true,
  supportedFormats: ['.mp3'],
};

export function getCacheBustUrl(url: string, version?: string | number): string {
  if (!url) return MUSIC_PATH;
  try {
    if (!version) return url;
    const delimiter = url.includes('?') ? '&' : '?';
    return `${url}${delimiter}v=${version}`;
  } catch {
    return url;
  }
}
