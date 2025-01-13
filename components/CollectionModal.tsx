import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { getCollections, addLinkToCollection, removeLinkFromCollection, isLinkInCollection, createCollection } from '@/lib/Collection';
import type { Link } from '@/types/Link';
import type { Collection } from '@/types/Collection';
import { Plus } from 'lucide-react';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: Link;
  userId: string;
}

const CollectionModal: React.FC<CollectionModalProps> = ({
  isOpen,
  onClose,
  link,
  userId,
}) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionTitle, setNewCollectionTitle] = useState('');

  useEffect(() => {
    const loadCollections = async () => {
      if (isOpen) {
        setLoading(true);
        try {
          const userCollections = await getCollections(userId);
          setCollections(userCollections);
          
          // 既に追加済みのコレクションを確認
          const selectedIds = new Set<string>();
          await Promise.all(
            userCollections.map(async (collection: Collection) => {
              const isIncluded = await isLinkInCollection(collection.collectionId, link.docId);
              if (isIncluded) {
                selectedIds.add(collection.collectionId);
              }
            })
          );
          setSelectedCollections(selectedIds);
        } catch (error) {
          console.error('Failed to load collections:', error);
        }
        setLoading(false);
      }
    };

    loadCollections();
  }, [isOpen, userId, link.docId]);

  const handleToggleCollection = async (collectionId: string) => {
    try {
      if (selectedCollections.has(collectionId)) {
        // コレクションから削除
        await removeLinkFromCollection(collectionId, link.docId);
        setSelectedCollections(prev => {
          const updated = new Set(prev);
          updated.delete(collectionId);
          return updated;
        });
      } else {
        // コレクションに追加
        await addLinkToCollection(collectionId, link);
        setSelectedCollections(prev => {
          const updated = new Set(prev);
          updated.add(collectionId);
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to update collection:', error);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionTitle.trim()) return;

    setLoading(true);
    try {
      const newCollectionId = await createCollection(userId, newCollectionTitle, true);
      await addLinkToCollection(newCollectionId, link);
      
      // 新しいコレクションを一覧に追加
      const newCollection: Collection = {
        collectionId: newCollectionId,
        title: newCollectionTitle,
        uid: userId,
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setCollections(prev => [...prev, newCollection]);
      setSelectedCollections(prev => {
        const updated = new Set(prev);
        updated.add(newCollectionId);
        return updated;
      });
      setNewCollectionTitle('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
    setLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="コレクションに追加"
    >
      <div className="space-y-4">
        {/* 新規作成フォーム */}
        <div className="border-b pb-4">
          {isCreating ? (
            <form onSubmit={handleCreateCollection} className="space-y-2">
              <input
                type="text"
                value={newCollectionTitle}
                onChange={(e) => setNewCollectionTitle(e.target.value)}
                placeholder="コレクション名を入力"
                className="w-full p-2 border rounded text-base"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCreating(false)}
                >
                  キャンセル
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={!newCollectionTitle.trim() || loading}
                >
                  作成
                </Button>
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
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="py-4 space-y-2">
            {collections.length === 0 ? (
              <p className="text-center text-gray-500">
                コレクションがありません
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {collections.map((collection) => (
                  <div
                    key={collection.collectionId}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                  >
                    <span className="flex-1">{collection.title}</span>
                    <Button
                      variant={selectedCollections.has(collection.collectionId) ? "danger" : "primary"}
                      size="sm"
                      onClick={() => handleToggleCollection(collection.collectionId)}
                    >
                      {selectedCollections.has(collection.collectionId) ? '解除' : '追加'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CollectionModal;