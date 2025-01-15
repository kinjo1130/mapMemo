import React, { useState } from 'react';
import Modal from './Modal';
import { addUserToCollection } from '@/lib/Collection';
import { Copy, Check, Users } from 'lucide-react';
import type { Collection, CollectionUser } from '@/types/Collection';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection;
  onUpdate: () => void;
}

const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  collection,
  onUpdate
}) => {
  const [copied, setCopied] = useState(false);
  const [inviteLink] = useState(() => {
    const isDev = process.env.NODE_ENV === 'development';
    const baseUrl = isDev ? process.env.NEXT_PUBLIC_LIFF_URL_DEV : process.env.NEXT_PUBLIC_LIFF_URL_PROD;
    return `${baseUrl}/collections/invite/${collection.collectionId}`;
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy invite link:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="コレクションに招待"
    >
      <div className="p-4 space-y-4">
        {/* 現在のメンバー一覧 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Users className="w-4 h-4" />
            メンバー
          </h3>
          <div className="bg-gray-50 rounded-lg p-2 space-y-1">
            {collection.users?.map((user: CollectionUser) => (
              <div key={user.uid} className="flex justify-between items-center text-sm">
                <span>{user.uid}</span>
                <span className="text-gray-500">{user.role}</span>
              </div>
            )) || (
              <div className="text-sm text-gray-500">メンバーはいません</div>
            )}
          </div>
        </div>

        {/* 招待リンク */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">招待リンク</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 p-2 text-sm bg-gray-50 border rounded-md"
            />
            <button
              onClick={handleCopy}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            このリンクを共有して、他のユーザーをコレクションに招待できます
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default InviteModal;