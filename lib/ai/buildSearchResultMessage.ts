import { Message } from '@line/bot-sdk';
import { Link } from '@/types/Link';

function buildBubble(link: Link) {
  const contents: any[] = [];

  // Hero: 画像
  const hero = link.photoUrl
    ? {
        type: 'image',
        url: link.photoUrl,
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
      }
    : undefined;

  // Body
  const bodyContents: any[] = [
    {
      type: 'text',
      text: link.name || '名称不明',
      weight: 'bold',
      size: 'md',
      wrap: true,
      maxLines: 2,
    },
  ];

  // 住所
  if (link.address) {
    bodyContents.push({
      type: 'text',
      text: link.address,
      size: 'xs',
      color: '#999999',
      wrap: true,
      maxLines: 2,
      margin: 'sm',
    });
  }

  // 評価
  if (link.rating) {
    bodyContents.push({
      type: 'box',
      layout: 'baseline',
      margin: 'sm',
      contents: [
        {
          type: 'text',
          text: '★',
          size: 'sm',
          color: '#FFD700',
          flex: 0,
        },
        {
          type: 'text',
          text: `${link.rating}${link.userRatingsTotal ? ` (${link.userRatingsTotal})` : ''}`,
          size: 'sm',
          color: '#666666',
          flex: 0,
          margin: 'sm',
        },
      ],
    });
  }

  // タグ（最大3つ）
  const displayTags = (link.tags || []).slice(0, 3);
  if (displayTags.length > 0) {
    bodyContents.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'md',
      spacing: 'sm',
      contents: displayTags.map((tag) => ({
        type: 'text',
        text: `#${tag}`,
        size: 'xxs',
        color: '#1DB446',
        flex: 0,
      })),
    });
  }

  // Footer
  const mapUrl = link.googleMapsUrl || link.link;
  const footer = {
    type: 'box',
    layout: 'vertical',
    spacing: 'sm',
    contents: [
      {
        type: 'button',
        style: 'primary',
        height: 'sm',
        action: {
          type: 'uri',
          label: '開く',
          uri: mapUrl,
        },
        color: '#1DB446',
      },
    ],
    flex: 0,
  };

  const bubble: any = {
    type: 'bubble',
    size: 'micro',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: bodyContents,
      spacing: 'sm',
      paddingAll: '13px',
    },
    footer,
  };

  if (hero) {
    bubble.hero = hero;
  }

  return bubble;
}

export function buildSearchResultMessage(
  links: Link[],
  searchQuery: string
): Message {
  if (links.length === 0) {
    return {
      type: 'flex',
      altText: `「${searchQuery}」の検索結果`,
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'MapMemo',
              weight: 'bold',
              size: 'xl',
              color: '#1DB446',
            },
            {
              type: 'text',
              text: `「${searchQuery}」に一致する場所が見つかりませんでした。`,
              wrap: true,
              size: 'sm',
              color: '#666666',
              margin: 'lg',
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              action: {
                type: 'uri',
                label: '保存した地点一覧を見る',
                uri: 'https://liff.line.me/2005710452-e6m8Ao66',
              },
              color: '#1DB446',
            },
          ],
          flex: 0,
        },
      },
    } as Message;
  }

  const LIFF_URL = 'https://liff.line.me/2005710452-e6m8Ao66';

  if (links.length >= 5) {
    const bubbles = links.slice(0, 4).map(buildBubble);
    const remainingCount = links.length - 4;

    const seeMoreBubble = {
      type: 'bubble',
      size: 'micro',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🔍',
            size: 'xxl',
            align: 'center',
          },
          {
            type: 'text',
            text: `他にも ${remainingCount}件 の結果があります`,
            wrap: true,
            size: 'sm',
            align: 'center',
            margin: 'lg',
            color: '#666666',
          },
        ],
        justifyContent: 'center',
        paddingAll: '13px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: {
              type: 'uri',
              label: 'すべての結果を見る',
              uri: `${LIFF_URL}?search=${encodeURIComponent(searchQuery)}`,
            },
            color: '#1DB446',
          },
        ],
        flex: 0,
      },
    };

    bubbles.push(seeMoreBubble);

    return {
      type: 'flex',
      altText: `「${searchQuery}」の検索結果: ${links.length}件`,
      contents: {
        type: 'carousel',
        contents: bubbles,
      },
    } as Message;
  }

  const bubbles = links.map(buildBubble);

  return {
    type: 'flex',
    altText: `「${searchQuery}」の検索結果: ${links.length}件`,
    contents: {
      type: 'carousel',
      contents: bubbles,
    },
  } as Message;
}
