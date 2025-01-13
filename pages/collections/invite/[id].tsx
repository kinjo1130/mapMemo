// pages/collections/invite/[id].tsx
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
          router.replace(`/collections/${id}`);
          return;
        }

        // メンバーとして追加
        await addUserToCollection(id as string, profile.userId, 'viewer');
        router.replace(`/collections/${id}`);
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
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"/>
            </svg>
            LINEでログイン
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default CollectionInvitePage;