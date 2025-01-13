// pages/collections/share/[id].tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getSharedCollection, getAllCollectionLinks } from '@/lib/Collection';
import type { Collection } from '@/types/Collection';
import type { Link } from '@/types/Link';
import { ArrowLeft } from 'lucide-react';

const SharedCollectionPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSharedCollection = async () => {
      if (!id || typeof id !== 'string') return;

      try {
        const collectionData = await getSharedCollection(id);
        setCollection(collectionData);

        const  collectionLinks  = await getAllCollectionLinks(id);
        setLinks(collectionLinks);
      } catch (error) {
        console.error('Error loading shared collection:', error);
        if (error instanceof Error) {
          if (error.message === 'Collection not found') {
            setError('コレクションが見つかりません');
          } else if (error.message === 'This collection is private') {
            setError('このコレクションは非公開です');
          } else {
            setError('コレクションの読み込みに失敗しました');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadSharedCollection();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'エラーが発生しました'}
            </h1>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              トップページへ戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {collection.title}
          </h1>
          <div className="text-sm text-gray-500">
            作成日: {new Date(collection.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* リンク一覧 */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <div
              key={link.docId}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={link.photoUrl || "/api/placeholder/400/300"}
                  alt={link.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-lg mb-2">{link.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{link.address}</p>
                <a
                  href={link.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
                >
                  Google Mapで見る
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SharedCollectionPage;