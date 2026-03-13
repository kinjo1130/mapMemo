/** Google Maps Place Types → 日本語ラベルのマッピング */
const PLACE_TYPE_LABELS: Record<string, string> = {
  // 飲食
  restaurant: 'レストラン',
  cafe: 'カフェ',
  bar: 'バー',
  bakery: 'パン屋',
  meal_delivery: 'デリバリー',
  meal_takeaway: 'テイクアウト',
  food: '飲食',
  // 買い物
  shopping_mall: 'ショッピングモール',
  clothing_store: '衣料品店',
  convenience_store: 'コンビニ',
  department_store: 'デパート',
  drugstore: 'ドラッグストア',
  electronics_store: '家電量販店',
  furniture_store: '家具店',
  grocery_or_supermarket: 'スーパー',
  supermarket: 'スーパー',
  home_goods_store: '雑貨店',
  jewelry_store: 'ジュエリーショップ',
  book_store: '書店',
  pet_store: 'ペットショップ',
  shoe_store: '靴屋',
  store: 'ショップ',
  // 観光・レジャー
  tourist_attraction: '観光スポット',
  amusement_park: '遊園地',
  aquarium: '水族館',
  art_gallery: 'ギャラリー',
  museum: '美術館・博物館',
  zoo: '動物園',
  stadium: 'スタジアム',
  bowling_alley: 'ボウリング場',
  movie_theater: '映画館',
  night_club: 'ナイトクラブ',
  casino: 'カジノ',
  campground: 'キャンプ場',
  // 自然・公園
  park: '公園',
  natural_feature: '自然スポット',
  // 宿泊
  lodging: '宿泊施設',
  // 交通
  airport: '空港',
  bus_station: 'バス停',
  train_station: '駅',
  subway_station: '地下鉄駅',
  transit_station: '交通機関',
  taxi_stand: 'タクシー乗り場',
  parking: '駐車場',
  gas_station: 'ガソリンスタンド',
  // 健康・美容
  beauty_salon: '美容院',
  hair_care: 'ヘアサロン',
  spa: 'スパ',
  gym: 'ジム',
  hospital: '病院',
  dentist: '歯医者',
  doctor: '医院',
  pharmacy: '薬局',
  veterinary_care: '動物病院',
  // 教育
  school: '学校',
  university: '大学',
  library: '図書館',
  // サービス
  bank: '銀行',
  atm: 'ATM',
  post_office: '郵便局',
  laundry: 'コインランドリー',
  car_wash: '洗車',
  car_repair: '自動車修理',
  // 宗教
  church: '教会',
  hindu_temple: 'ヒンドゥー寺院',
  mosque: 'モスク',
  synagogue: 'シナゴーグ',
  // 汎用（これらは除外）
  // point_of_interest, establishment, premise, etc.
};

// 汎用すぎてタグにしても意味がない types
const EXCLUDED_TYPES = new Set([
  'point_of_interest',
  'establishment',
  'premise',
  'subpremise',
  'political',
  'locality',
  'sublocality',
  'neighborhood',
  'route',
  'street_address',
  'geocode',
  'place_of_worship',
]);

/**
 * Google Maps Place Types を日本語タグに変換する。
 * 汎用的すぎるタイプは除外し、マッピングがあるもののみ返す。
 */
export function generateTagsFromTypes(types: string[]): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();

  for (const type of types) {
    if (EXCLUDED_TYPES.has(type)) continue;
    const label = PLACE_TYPE_LABELS[type];
    if (label && !seen.has(label)) {
      seen.add(label);
      tags.push(label);
    }
  }

  return tags;
}
