// services/lineLocationService.ts
import { saveGoogleMapsLink as saveMapsLink } from '@/lib/saveGoogleMapsLink';

interface GoogleMapsLinkData {
  mapUrl: string;
  userId: string;
  groupId: string;
}

interface SaveResult {
  success?: boolean;
  error?: string;
}

class LineLocationService {
  /**
   * Google MapsのURLかどうかを判定する
   */
  isGoogleMapsUrl(url: string): boolean {
    return url.startsWith('https://maps.google.com/') ||
      url.startsWith('https://www.google.com/maps') ||
      url.startsWith('https://maps.app.goo.gl/') ||
      url.startsWith('https://goo.gl/maps');
  }
  
  /**
   * Google Mapsのリンクを保存する
   */
  async saveGoogleMapsLink(data: GoogleMapsLinkData): Promise<SaveResult> {
    try {
      return await saveMapsLink(data);
    } catch (error) {
      console.error('Error saving Google Maps link:', error);
      return { error: 'Internal server error' };
    }
  }
}

export const lineLocationService = new LineLocationService();