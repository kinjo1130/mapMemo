# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MapMemo - LINE Botと連携した地図ブックマークアプリ。Google Mapsリンクを保存・管理し、Mapboxで可視化する。

## Commands

```bash
pnpm dev          # 開発サーバー起動
pnpm build        # プロダクションビルド
pnpm lint         # ESLint実行
```

パッケージマネージャーは **pnpm**（v8.15.3）、Node.js v20.11.0。

## Architecture

### Tech Stack
- **Next.js 14** (Pages Router) + React 18 + TypeScript
- **Firebase**: Firestore（DB）、Storage（画像）、Admin SDK（サーバーサイド）
- **LINE**: LIFF SDK（認証）、Bot SDK（Webhook）、Messaging API
- **Maps**: Mapbox GL（地図表示）、Google Maps API（場所検索・詳細取得）
- **Styling**: TailwindCSS（カスタムカラー: primary=#2D7B51, secondary=#DC2626）

### Key Directories
- `pages/` — Pages Router。`home.tsx`がメインのアプリ画面、`api/webhook.ts`がLINE Bot Webhook
- `components/` — UIコンポーネント。`Map.tsx`がMapbox統合、`LinkList.tsx`が一覧表示
- `hooks/` — カスタムフック。`useLiff.ts`(認証), `useLinks.ts`(データ取得), `useSearch.ts`(検索・フィルタ)
- `lib/` — ビジネスロジック。`init/`にSDK初期化、`Collection/`, `User/`, `Group/`, `Links/`にCRUD操作
- `types/` — TypeScript型定義（Collection, Link, Group）
- `features/` — フィーチャーベースモジュール（移行中）

### Data Flow
```
useLiff(認証) → useProfile(ユーザー) → useLinks(Firestore) → useSearch(フィルタ/ソート) → UI
```

### Authentication
LINE LIFF認証。`useLiff()`フックで管理。ユーザープロフィールはFirestoreに保存。

### Firestore Collections
- `/users/{userId}` — ユーザープロフィール
- `/Links` — 保存された場所（グローバル）
- `/collections/{collectionId}` — コレクション、サブコレクション`/links/{linkId}`
- `/groups/{groupId}` — LINEグループ

### LINE Bot Webhook (`/api/webhook`)
- `follow`: ユーザー登録
- `message`: Google Maps URL検出→場所保存、"保存期間変更"コマンド
- `postback`: 期間設定UIアクション
- `memberJoined`: グループメンバー追加

### Path Alias
`@/*` → プロジェクトルート（tsconfig.json）

## CI/CD

- コードを変更してコミット・プッシュした際は、CIワークフローが完了するまで監視し、結果を報告すること。
