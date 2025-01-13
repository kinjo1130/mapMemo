import React, { useState } from 'react';
import { Share2, Copy, Check, Globe, Lock } from 'lucide-react';
import { generateShareURL, updateCollectionShare } from '@/lib/Collection';
import type { Collection } from '@/types/Collection';

interface ShareSettingsProps {
  collection: Collection;
  onUpdate: () => void;
}

const ShareSettings: React.FC<ShareSettingsProps> = ({ collection, onUpdate }) => {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isPublic, setIsPublic] = useState(collection.isPublic);

  const handleShare = async () => {
    const url = generateShareURL(collection.collectionId);
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setShowTooltip(true);
      setTimeout(() => {
        setCopied(false);
        setShowTooltip(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleTogglePublic = async () => {
    setUpdating(true);
    try {
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
    <div className="flex items-center gap-4">
      {/* 公開設定切り替えボタン */}
      <button
        onClick={handleTogglePublic}
        disabled={updating}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
          ${isPublic 
            ? 'text-gray-700 bg-gray-100 hover:bg-gray-200' 
            : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
          } disabled:opacity-50 transition-colors`}
      >
        {isPublic ? (
          <>
            <Globe className="w-4 h-4" />
            公開中
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            非公開
          </>
        )}
      </button>

      {/* シェアボタン - 公開時のみ表示 */}
      {isPublic && (
        <div className="relative">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
            aria-label="共有"
          >
            {copied ? (
              <Check className="w-5 h-5" />
            ) : (
              <Share2 className="w-5 h-5" />
            )}
            シェア
          </button>
          
          {showTooltip && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
              URLをコピーしました
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShareSettings;