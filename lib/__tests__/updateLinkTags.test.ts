import { describe, it, expect, vi, beforeEach } from 'vitest';

// Firebaseモジュールをモック
const mockUpdateDoc = vi.fn();
const mockDoc = vi.fn().mockReturnValue('mock-doc-ref');

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
}));

vi.mock('@/lib/init/firebase', () => ({
  db: 'mock-db',
}));

import { updateLinkTags } from '../Links/updateLinkTags';

describe('updateLinkTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('指定したdocIdのタグを更新する', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    await updateLinkTags('doc123', ['カフェ', 'デート']);

    expect(mockDoc).toHaveBeenCalledWith('mock-db', 'Links', 'doc123');
    expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', { tags: ['カフェ', 'デート'] });
  });

  it('空のタグ配列で更新できる', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    await updateLinkTags('doc456', []);

    expect(mockDoc).toHaveBeenCalledWith('mock-db', 'Links', 'doc456');
    expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', { tags: [] });
  });

  it('Firestoreエラー時に例外をスローする', async () => {
    mockUpdateDoc.mockRejectedValue(new Error('Firestore error'));

    await expect(updateLinkTags('doc789', ['test'])).rejects.toThrow('Firestore error');
  });
});
