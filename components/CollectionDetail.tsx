import React, { useState, useEffect, useCallback } from 'react';
import { getAllCollectionLinks } from '@/lib/Collection';
import type {  Link } from '@/types/Link';
import type {Collection} from '@/types/Collection';
import { ArrowLeft, Share2, Settings, Users, Map, Calendar } from 'lucide-react';
import LinkList from './LinkList';
import TripPlanner from './TripPlanner';
import { db } from '@/lib/init/firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import ShareButton from './ShareSettings';
import ShareSettings from './ShareSettings';
import InviteModal from './InviteModal';

interface CollectionDetailProps {
  collection: Collection;
  onBack: () => void;
}

export const CollectionDetail: React.FC<CollectionDetailProps> = ({ collection, onBack }) => {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'links' | 'trip'>('links');

  useEffect(() => {
    loadCollectionLinks();
  }, [collection.collectionId]);

  const loadCollectionLinks = async () => {
    try {
      const collectionLinks = await getAllCollectionLinks(collection.collectionId);
      setLinks(collectionLinks);
    } catch (error) {
      console.error('Failed to load collection links:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "Links", id));
      setLinks((prevLinks) => prevLinks.filter((link) => link.docId !== id));
    } catch (error) {
      console.error("Error deleting link:", error);
      throw error;
    }
  }, []);
  const handleCollectionUpdate = async () => {
    // コレクション情報を再取得する必要がある場合はここで実行
    await loadCollectionLinks();
  };

  return (
    <div>
      {/* ヘッダー */}
      <div className="bg-white shadow rounded-lg mb-4 p-4">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            戻る
          </button>
          <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            {/* 招待ボタンを追加 */}
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="text-gray-600 hover:text-blue-600"
              title="メンバーを招待"
            >
              <Users className="w-5 h-5" />
            </button>
            <ShareSettings collection={collection} onUpdate={handleCollectionUpdate} />
          </div>
           
          </div>
        </div>
        <h2 className="text-2xl font-bold">{collection.title}</h2>
        {/* {collection.description && (
          <p className="text-gray-600 mt-2">{collection.description}</p>
        )} */}
      </div>

      {/* タブ切り替え */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'links'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('links')}
        >
          <div className="flex items-center">
            <Map className="w-4 h-4 mr-2" />
            ピン一覧
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'trip'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('trip')}
        >
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            旅行プランナー
          </div>
        </button>
      </div>

      {/* コンテンツ表示 */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : activeTab === 'links' ? (
        <LinkList
          links={links}
          onDelete={handleDelete}
          // onLoadMore={handleLoadMore}
          // hasMore={hasMore}
          isLoading={loading}
          userId={collection.uid}
        />
      ) : (
        <TripPlanner
          collection={collection}
          links={links}
          onUpdateLinks={loadCollectionLinks}
        />
      )}

      {/* 招待モーダルを追加 */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        collection={collection}
        onUpdate={handleCollectionUpdate}
      />
    </div>
  );
};

export default CollectionDetail;
