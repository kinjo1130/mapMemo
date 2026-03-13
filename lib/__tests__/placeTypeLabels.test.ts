import { describe, it, expect } from 'vitest';
import { generateTagsFromTypes } from '../placeTypeLabels';

describe('generateTagsFromTypes', () => {
  it('レストランのtypesを日本語タグに変換する', () => {
    const types = ['restaurant', 'food', 'point_of_interest', 'establishment'];
    const tags = generateTagsFromTypes(types);
    expect(tags).toEqual(['レストラン', '飲食']);
  });

  it('カフェのtypesを日本語タグに変換する', () => {
    const types = ['cafe', 'food', 'point_of_interest', 'establishment'];
    const tags = generateTagsFromTypes(types);
    expect(tags).toEqual(['カフェ', '飲食']);
  });

  it('観光スポットのtypesを変換する', () => {
    const types = ['tourist_attraction', 'point_of_interest', 'establishment'];
    const tags = generateTagsFromTypes(types);
    expect(tags).toEqual(['観光スポット']);
  });

  it('汎用タイプ（point_of_interest, establishment）は除外する', () => {
    const types = ['point_of_interest', 'establishment'];
    const tags = generateTagsFromTypes(types);
    expect(tags).toEqual([]);
  });

  it('公園+観光スポットの複合', () => {
    const types = ['park', 'tourist_attraction', 'point_of_interest', 'establishment'];
    const tags = generateTagsFromTypes(types);
    expect(tags).toEqual(['公園', '観光スポット']);
  });

  it('同じ日本語ラベルに変換されるtypeは重複しない', () => {
    const types = ['grocery_or_supermarket', 'supermarket', 'food', 'establishment'];
    const tags = generateTagsFromTypes(types);
    expect(tags).toEqual(['スーパー', '飲食']);
  });

  it('マッピングにないtypeは無視する', () => {
    const types = ['unknown_type', 'restaurant'];
    const tags = generateTagsFromTypes(types);
    expect(tags).toEqual(['レストラン']);
  });

  it('空配列の場合は空配列を返す', () => {
    expect(generateTagsFromTypes([])).toEqual([]);
  });

  it('交通系のtypesを変換する', () => {
    const types = ['train_station', 'transit_station', 'point_of_interest', 'establishment'];
    const tags = generateTagsFromTypes(types);
    expect(tags).toEqual(['駅', '交通機関']);
  });

  it('宿泊施設のtypesを変換する', () => {
    const types = ['lodging', 'point_of_interest', 'establishment'];
    const tags = generateTagsFromTypes(types);
    expect(tags).toEqual(['宿泊施設']);
  });
});
