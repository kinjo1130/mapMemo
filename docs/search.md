# 検索アーキテクチャ

## 概要

検索ロジックは `lib/search/` に集約されている。Web UIとAI検索（LINE Bot）の両方がこの共通モジュールを利用する。

## モジュール構成

```
lib/search/
├── filterLinks.ts   # 検索関数の実装
└── index.ts         # re-export
```

### 関数一覧

| 関数 | 用途 | 利用箇所 |
|------|------|----------|
| `parseSearchTerms` | 検索文字列をキーワード配列に分割 | 内部利用 |
| `matchesTerm` | 単一キーワードとLinkの各フィールドを照合 | 内部利用 |
| `filterByKeywords` | AND検索でリンクを絞り込む | Web UI (`useSearch`) |
| `scoreByKeywords` | OR検索 + スコアリングでリンクを評価 | AI検索 (`lib/ai/tools.ts`) |
| `filterByDateRange` | 日付範囲で絞り込む | Web UI (`useSearch`) |
| `sortLinks` | 保存順 or 名前順でソート | Web UI (`useSearch`) |

## 検索対象フィールド

`matchesTerm` が照合するLinkのフィールド:

- `name` — 場所名
- `address` — 住所
- `groupName` — LINEグループ名
- `displayName` — 保存したユーザー名
- `categories` — Google Maps カテゴリ（配列）
- `tags` — ユーザー付与タグ（配列）

すべて部分一致・大文字小文字区別なし。

## Web UI検索 vs AI検索

検索には意図的に異なる戦略を採用している。

### Web UI検索（`filterByKeywords`）

- **AND検索**: すべてのキーワードにマッチするリンクのみを返す
- 理由: ユーザーが明示的にキーワードを入力しており、絞り込みの意図が明確
- 利用フロー: `useSearch` → `filterByKeywords` → `filterByDateRange` → `sortLinks`

### AI検索（`scoreByKeywords`）

- **OR検索 + スコアリング**: 1つでもキーワードにマッチすればヒット、マッチ数/総キーワード数でスコアを算出
- 理由: AIが自然言語を複数キーワードに分解するため、部分マッチでも関連結果を返したい
- 利用フロー: `lib/ai/tools.ts` の `searchByKeyword` ツール → `scoreByKeywords` → スコア降順ソート → 上位20件

```
スコア = マッチしたキーワード数 / 総キーワード数
例: keywords=["渋谷", "カフェ"] で name="渋谷カフェ" → score=1.0
    keywords=["渋谷", "カフェ"] で name="新宿カフェ" → score=0.5
```

## キーワード分割ルール

`parseSearchTerms` の仕様:

- 半角スペース・全角スペース（`\u3000`）の両方で分割
- 連続スペースは1つとして扱う
- 空文字列やスペースのみの入力は空配列を返す
- すべて小文字に正規化

## 日付フィルタの仕様

- `timestamp` は Firestore `Timestamp` 型。`toDate()` でJS Dateに変換して比較
- 開始日は `00:00:00`、終了日は `23:59:59.999` に正規化して日単位で比較
- 開始日のみ・終了日のみの指定も可能
- `timestamp` が存在しないリンクはフィルタ対象外（除外される）

## テスト

```bash
pnpm test
```

関連テストファイル:

| ファイル | 内容 |
|----------|------|
| `lib/__tests__/search.test.ts` | `parseSearchTerms`, `matchesTerm`, `filterByDateRange`, `sortLinks` |
| `lib/__tests__/searchFilter.test.ts` | `filterByKeywords`（カテゴリ・タグ・複合検索・互換性） |
| `lib/__tests__/mentionSearch.test.ts` | `scoreByKeywords`（スコアリング・ソート） |

## 検索ロジックを変更する際の注意

- `matchesTerm` を変更すると Web UI検索・AI検索の両方に影響する
- 新しい検索対象フィールドを追加する場合は `matchesTerm` に追加し、対応するテストも追加する
- Web UIとAI検索の戦略（AND vs OR）は意図的な設計判断であり、統一しないこと
