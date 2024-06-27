# 🗺️ Map Memo

## 📌 概要

Map Memoは、LINEボットを通じてGoogle Mapsのリンクを簡単に保存・管理できるアプリケーションです。お気に入りの場所や訪れたい場所を効率的に記録し、整理するのに最適なツールです。

## ✨ 特徴

- 📍 Google MapsのURLを送信するだけで場所を保存
- 🔍 保存した場所の詳細情報（名前、住所、評価など）を自動取得
- 🗓️ 保存期間の設定が可能
- 🇯🇵 日本語対応（場所の詳細情報も日本語で取得）

## 🛠️ 技術スタック

- Next.js
- TypeScript
- Firebase (Firestore)
- LINE Messaging API
- Google Maps Platform APIs

## 🚀 セットアップ

1. リポジトリをクローン:
   ```
   git clone https://github.com/kinjo1130/useMap.git
   cd map-memo
   ```

2. 依存関係をインストール:
   ```
   npm install
   ```

3. 環境変数を設定:
   `.env.local` ファイルを作成し、以下の変数を設定:
   ```
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
   LINE_CHANNEL_SECRET=your_line_channel_secret
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   FIREBASE_PRIVATE_KEY=your_firebase_private_key
   ```

4. アプリケーションを起動:
   ```
   npm run dev
   ```

## 📖 使用方法

1. LINEで友達追加: [QRコードまたはLINE ID]
2. Google MapsのURLをボットに送信
3. ボットが場所の詳細を取得し、保存します
4. 「保存期間変更」と送信することで、保存期間を設定できます

## 🚧 今後の展開

- 👥 グループでの場所の共有機能
- 🔎 保存した場所の検索機能
- 📊 保存した場所の統計情報表示

## 🤝 貢献

貢献は大歓迎です！バグ報告、機能リクエスト、プルリクエストなど、どんな形でも構いません。

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

## 📞 お問い合わせ

質問や提案がある場合は、[Issues](https://github.com/kinjo1130/useMap/issues) でお問い合わせください。

---

🌟 Map Memoで、あなたの大切な場所を簡単に記録しましょう！