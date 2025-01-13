import React, { useState, useEffect } from 'react';
import { createCollection, getCollections } from '@/lib/Collection';
import type { Collection } from '@/types/Collection';
import { Plus, Share2, Globe, Lock } from 'lucide-react';
import { formatDate } from '@/utils/date';

interface CollectionListProps {
  userId: string;
  onCollectionSelect: (collection: Collection) => void;
}

export const CollectionList: React.FC<CollectionListProps> = ({ userId, onCollectionSelect }) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    loadCollections();
  }, [userId]);

  const loadCollections = async () => {
    try {
      const userCollections = await getCollections(userId);
      setCollections(userCollections);
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const collectionId = await createCollection(userId, newTitle, true);
      await loadCollections();
      setNewTitle('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 新規作成フォーム */}
      <div className="bg-white rounded-lg shadow mb-4 p-4">
        {isCreating ? (
          <form onSubmit={handleCreateCollection} className="space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="コレクション名を入力"
              className="w-full p-2 border rounded text-base"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                作成
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            新しいコレクションを作成
          </button>
        )}
      </div>

      {/* コレクション一覧 */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <div
            key={collection.collectionId}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onCollectionSelect(collection)}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-lg">{collection.title}</h3>
                {/* {collection.isPublic ? (
                  <Globe className="w-4 h-4 text-gray-500" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-500" />
                )} */}
              </div>
              {/* {collection.description && (
                <p className="text-gray-600 text-sm mb-4">{collection.description}</p>
              )} */}
              <div className="flex items-center justify-between text-sm text-gray-500">
              <span>作成日: {formatDate(collection.createdAt)}</span>
                {/* {collection.isPublic && (
                  <Share2 className="w-4 h-4 hover:text-blue-600" />
                )} */}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};