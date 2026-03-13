import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSetDoc = vi.fn().mockResolvedValue(undefined);
const mockRunTransaction = vi.fn().mockResolvedValue(undefined);
const mockDoc = vi.fn().mockReturnValue({ id: 'generated-doc-id' });
const mockCollection = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
  runTransaction: (...args: any[]) => mockRunTransaction(...args),
  arrayUnion: vi.fn((val) => val),
}));

vi.mock('@/lib/init/firebase', () => ({
  db: 'mock-db',
}));

import { saveMapLink } from '@/lib/saveMapLink';

const baseParams = {
  userId: 'user1',
  groupId: '',
  link: 'https://maps.google.com/test',
  placeDetails: {
    name: 'Test Place',
    address: '123 Test St',
    photoUrl: 'https://photo.test',
    latitude: 35.6762,
    longitude: 139.6503,
  },
  displayName: 'Test User',
  userPictureUrl: 'https://pic.test',
  groupName: '',
  members: [] as string[],
  groupPictureUrl: '',
};

describe('saveMapLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetDoc.mockResolvedValue(undefined);
    mockRunTransaction.mockResolvedValue(undefined);
    mockDoc.mockReturnValue({ id: 'generated-doc-id' });
  });

  it('should use setDoc with pre-generated ID instead of addDoc+updateDoc', async () => {
    await saveMapLink(baseParams);

    // setDocが呼ばれること（addDoc+updateDocではなく）
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        docId: 'generated-doc-id',
        userId: 'user1',
        name: 'Test Place',
      })
    );
  });

  it('should not run group transaction for personal links', async () => {
    await saveMapLink(baseParams);

    // グループなしの場合、runTransactionは呼ばれない
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it('should run setDoc and group transaction in parallel for group links', async () => {
    const groupParams = {
      ...baseParams,
      groupId: 'group1',
      groupName: 'Test Group',
      members: ['user1'],
    };

    await saveMapLink(groupParams);

    // 両方呼ばれる
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
  });
});
