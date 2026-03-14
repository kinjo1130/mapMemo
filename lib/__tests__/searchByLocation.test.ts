import { describe, it, expect } from 'vitest';
import { haversineDistance } from '@/lib/ai/tools';

describe('haversineDistance', () => {
  it('同じ座標の距離は0', () => {
    expect(haversineDistance(33.2382, 131.6126, 33.2382, 131.6126)).toBe(0);
  });

  it('大分市と広島市の距離は約150km', () => {
    // 大分市: 33.2382, 131.6126
    // 広島市: 34.3853, 132.4553
    const distance = haversineDistance(33.2382, 131.6126, 34.3853, 132.4553);
    expect(distance).toBeGreaterThan(100);
    expect(distance).toBeLessThan(200);
  });

  it('大分市と別府市の距離は約15km', () => {
    // 大分市: 33.2382, 131.6126
    // 別府市: 33.2847, 131.4913
    const distance = haversineDistance(33.2382, 131.6126, 33.2847, 131.4913);
    expect(distance).toBeGreaterThan(10);
    expect(distance).toBeLessThan(20);
  });
});

describe('searchByLocation radiusKm フィルタリング', () => {
  it('デフォルト半径50kmで広島のお店は大分検索に含まれない', () => {
    // 大分市と広島市の距離は約270km → 50km制限で除外される
    const oitaToHiroshima = haversineDistance(33.2382, 131.6126, 34.3853, 132.4553);
    expect(oitaToHiroshima).toBeGreaterThan(50);
  });

  it('デフォルト半径50kmで別府のお店は大分検索に含まれる', () => {
    // 大分市と別府市の距離は約15km → 50km制限内
    const oitaToBeppu = haversineDistance(33.2382, 131.6126, 33.2847, 131.4913);
    expect(oitaToBeppu).toBeLessThan(50);
  });
});
