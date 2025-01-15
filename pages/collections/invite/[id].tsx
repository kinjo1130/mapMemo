import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useProfile } from '@/hooks/useProfile';
import { useLiff } from '@/hooks/useLiff';
import { addUserToCollection, getCollectionById } from '@/lib/Collection';

const CollectionInvitePage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { profile, loading: profileLoading } = useProfile();
  const { login, isAuthenticated } = useLiff();
  const [collection, setCollection] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // コレクション情報の取得
  useEffect(() => {
    const fetchCollection = async () => {
      if (!id || typeof id !== 'string') return;
      
      try {
        const collectionData = await getCollectionById(id);
        if (!collectionData) {
          setError('コレクションが見つかりません');
          return;
        }
        setCollection(collectionData);
      } catch (error) {
        setError('コレクションの読み込みに失敗しました');
      }
    };

    fetchCollection();
  }, [id]);

  // 認証済みの場合の処理
  useEffect(() => {
    const handleAuthenticated = async () => {
      if (!profile || !collection || !id) return;

      try {
        // すでにメンバーかチェック
        if (collection.users?.some((user: any) => user.uid === profile.userId)) {
          // コレクション詳細画面に遷移
          router.replace({
            pathname: '/home',
            query: {
              tab: 'collections',
              collectionId: id
            }
          });
          return;
        }

        // メンバーとして追加
        await addUserToCollection(id as string, profile.userId, 'viewer');
        
        // コレクション詳細画面に遷移
        router.replace({
          pathname: '/home',
          query: {
            tab: 'collections',
            collectionId: id
          }
        });
      } catch (error) {
        setError('コレクションへの参加に失敗しました');
      }
    };

    if (isAuthenticated && profile) {
      handleAuthenticated();
    }
  }, [isAuthenticated, profile, collection, id]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center max-w-md">
          <h1 className="text-xl font-bold text-gray-900 mb-4">{error}</h1>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  if (profileLoading || !collection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 未認証の場合は招待画面を表示
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">
            コレクションに参加
          </h1>
          <div className="text-center mb-8">
            <p className="text-gray-600 mb-2">
              「{collection.title}」に招待されています
            </p>
            <p className="text-sm text-gray-500">
              参加するにはLINEでログインしてください
            </p>
          </div>
          <button
            onClick={() => login()}
            className="w-full bg-[#00B900] text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 hover:bg-[#009C00] transition-colors"
          >
            LINEでログイン
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default CollectionInvitePage;