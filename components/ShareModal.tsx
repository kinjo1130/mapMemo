import React, { useState } from 'react';
import { Copy, Check, Globe, Lock } from 'lucide-react';
import Modal from './Modal';
import type { Collection } from '@/types/Collection';
import { updateCollectionShare, generateShareURL } from '@/lib/Collection';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection;
  onUpdate: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  collection,
  onUpdate
}) => {
  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(collection.isPublic);
  const [updating, setUpdating] = useState(false);

  const shareUrl = generateShareURL(collection.collectionId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleTogglePublic = async () => {
    try {
      setUpdating(true);
      await updateCollectionShare(collection.collectionId, !isPublic);
      setIsPublic(!isPublic);
      onUpdate();
    } catch (error) {
      console.error('Failed to update share settings:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="コレクションを共有"
    >
      <div className="space-y-4 p-4">
        {/* 公開設定 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            {isPublic ? (
              <Globe className="w-5 h-5 text-blue-600" />
            ) : (
              <Lock className="w-5 h-5 text-gray-600" />
            )}
            <span className="font-medium">
              {isPublic ? '公開' : '非公開'}
            </span>
          </div>
          <button
            onClick={handleTogglePublic}
            disabled={updating}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${isPublic 
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50`}
          >
            {isPublic ? '非公開にする' : '公開する'}
          </button>
        </div>

        {/* 共有URL */}
        {isPublic && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              共有URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 p-2 border rounded-md bg-gray-50 text-sm"
              />
              <button
                onClick={handleCopy}
                className="p-2 text-gray-600 hover:text-blue-600"
                aria-label="URLをコピー"
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-500 mt-4">
          {isPublic 
            ? 'URLを知っている人はだれでもこのコレクションを閲覧できます'
            : 'このコレクションはあなただけが閲覧できます'}
        </div>
      </div>
    </Modal>
  );
};

export default ShareModal;