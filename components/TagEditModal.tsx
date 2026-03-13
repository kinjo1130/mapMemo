import React, { useState, useCallback, useEffect } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import Modal from './Modal';
import { updateLinkTags } from '@/lib/Links/updateLinkTags';
import type { Link } from '@/types/Link';

interface TagEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: Link;
  onTagsUpdated: (docId: string, tags: string[]) => void;
}

const TagEditModal: React.FC<TagEditModalProps> = ({ isOpen, onClose, link, onTagsUpdated }) => {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTags(link.tags || []);
      setNewTag('');
      setError('');
    }
  }, [isOpen, link]);

  const handleAddTag = useCallback(() => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setError('このタグは既に追加されています');
      return;
    }
    setTags(prev => [...prev, trimmed]);
    setNewTag('');
    setError('');
  }, [newTag, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateLinkTags(link.docId, tags);
      onTagsUpdated(link.docId, tags);
      onClose();
    } catch (err) {
      console.error('Failed to update tags:', err);
      setError('タグの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }, [link.docId, tags, onTagsUpdated, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="タグを編集">
      <div className="space-y-4">
        <div className="text-sm text-gray-600 truncate">
          {link.name}
        </div>

        {/* タグ入力 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="タグを入力..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={30}
          />
          <button
            onClick={handleAddTag}
            disabled={!newTag.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        {/* タグ一覧 */}
        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {tags.length === 0 ? (
            <p className="text-xs text-gray-400">タグがありません</p>
          ) : (
            tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                <Tag className="w-3 h-3" />
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-0.5 hover:text-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>

        {/* カテゴリ表示 */}
        {link.categories && link.categories.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">カテゴリ（自動取得）</p>
            <div className="flex flex-wrap gap-1">
              {link.categories.map(cat => (
                <span
                  key={cat}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 保存ボタン */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TagEditModal;
