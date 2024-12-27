import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MapMemo | LINEで簡単に地図を保存・管理',
  description: 'MapMemoはLINEボットを通じてGoogle Mapsの場所を簡単に保存・管理できるアプリです。旅行計画や思い出の場所の記録に最適。',
  openGraph: {
    title: 'MapMemo | LINEで簡単に地図を保存・管理',
    description: 'MapMemoはLINEボットを通じてGoogle Mapsの場所を簡単に保存・管理できるアプリです。',
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  );
}