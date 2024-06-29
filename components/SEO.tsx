import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
}

const SEO: React.FC<SEOProps> = ({
  title = 'LINEで簡単に地図を保存・管理',
  description = 'Map MemoはLINEボットを通じてGoogle Mapsの場所を簡単に保存・管理できるアプリです。旅行計画や思い出の場所の記録に最適。',
  canonical = 'https://www.mapmemo.com',
  ogImage = 'https://www.mapmemo.com/default-og-image.jpg',
  ogType = 'website',
}) => {
  const siteTitle = 'Map Memo';
  const fullTitle = `${title} | ${siteTitle}`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteTitle} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@mapmemo" />
      <meta name="twitter:creator" content="@mapmemo" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
};

export default SEO;