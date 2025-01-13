import React, { useState } from 'react';
import { Globe, Lock, Share2, Copy, Users, Check } from 'lucide-react';
import type { Collection } from '@/types/Collection';
import { generateShareURL } from '@/lib/Collection';

interface CollectionCardProps {
  collection: Collection;
  onSelect: (collection: Collection) => void;
  currentUserId: string;
  onCopyCollection?: (collection: Collection) => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  onSelect,
  currentUserId,
  onCopyCollection
}) => {
  const [copied, setCopied] = useState(false);
  const isOwner = collection.uid === currentUserId;
  const isEditor = collection.users?.some(
    user => user.uid === currentUserId && ['owner', 'editor'].includes(user.role)
  );

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!collection.isPublic) return;

    try {
      const url = generateShareURL(collection.collectionId);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyCollection?.(collection);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '日付なし';
    const date = timestamp.toDate();
    return date instanceof Date && !isNaN(date.valueOf())
      ? date.toLocaleDateString('ja-JP')
      : '日付なし';
  };

  return (
    <div
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect(collection)}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-lg">{collection.title}</h3>
          <div className="flex items-center space-x-2">
            {collection.users && collection.users.length > 1 && (
              <Users className="w-4 h-4 text-gray-500" />
            )}
            {collection.isPublic ? (
              <Globe className="w-4 h-4 text-gray-500" />
            ) : (
              <Lock className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>作成日: {formatDate(collection.createdAt)}</span>
          <div className="flex items-center space-x-2">
            {!isOwner && !isEditor && (
              <button
                onClick={handleCopy}
                className="p-1 hover:text-blue-600"
                title="コレクションをコピー"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            {collection.isPublic && (
              <button
                onClick={handleShare}
                className="p-1 hover:text-blue-600"
                title="URLをコピー"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionCard;