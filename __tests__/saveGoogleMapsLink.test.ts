import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/googleMaps', () => ({
  getPlaceDetails: vi.fn().mockResolvedValue({
    name: 'Test Place',
    address: '123 Test St',
    photoUrl: 'https://photo.test',
    latitude: 35.0,
    longitude: 139.0,
  }),
}));

vi.mock('@/lib/saveMapLink', () => ({
  saveMapLink: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/User/getCurrentUser', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    userId: 'fallback-user',
    displayName: 'Fallback',
    pictureUrl: 'https://fallback.pic',
    statusMessage: '',
  }),
}));

vi.mock('@/lib/Group/getJoinGroupInfo', () => ({
  getJoinGroupInfo: vi.fn().mockResolvedValue({
    groupId: 'fallback-group',
    groupName: 'Fallback Group',
    members: ['user1'],
    pictureUrl: 'https://fallback-group.pic',
  }),
}));

import { saveGoogleMapsLink } from '@/lib/saveGoogleMapsLink';
import { saveMapLink } from '@/lib/saveMapLink';
import { getCurrentUser } from '@/lib/User/getCurrentUser';
import { getJoinGroupInfo } from '@/lib/Group/getJoinGroupInfo';

describe('saveGoogleMapsLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use provided userProfile instead of fetching from Firestore', async () => {
    const userProfile = {
      userId: 'user1',
      displayName: 'Provided User',
      pictureUrl: 'https://provided.pic',
      statusMessage: 'hi',
    };

    await saveGoogleMapsLink({
      mapUrl: 'https://maps.google.com/test',
      userId: 'user1',
      userProfile,
    });

    // getCurrentUserが呼ばれないことを確認
    expect(getCurrentUser).not.toHaveBeenCalled();

    // saveMapLinkに渡されるdisplayNameがuserProfileのもの
    expect(saveMapLink).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Provided User',
        userPictureUrl: 'https://provided.pic',
      })
    );
  });

  it('should use provided groupData instead of fetching from Firestore', async () => {
    const groupData = {
      groupId: 'group1',
      groupName: 'Provided Group',
      members: ['user1'],
      pictureUrl: 'https://provided-group.pic',
    };

    await saveGoogleMapsLink({
      mapUrl: 'https://maps.google.com/test',
      userId: 'user1',
      groupId: 'group1',
      groupData,
    });

    // getJoinGroupInfoが呼ばれないことを確認
    expect(getJoinGroupInfo).not.toHaveBeenCalled();

    expect(saveMapLink).toHaveBeenCalledWith(
      expect.objectContaining({
        groupName: 'Provided Group',
        groupPictureUrl: 'https://provided-group.pic',
      })
    );
  });

  it('should fallback to Firestore when userProfile not provided', async () => {
    await saveGoogleMapsLink({
      mapUrl: 'https://maps.google.com/test',
      userId: 'user1',
    });

    expect(getCurrentUser).toHaveBeenCalledWith('user1');
  });

  it('should fallback to Firestore when groupData not provided', async () => {
    await saveGoogleMapsLink({
      mapUrl: 'https://maps.google.com/test',
      userId: 'user1',
      groupId: 'group1',
    });

    expect(getJoinGroupInfo).toHaveBeenCalledWith('group1', 'user1');
  });

  it('should return error for invalid mapUrl', async () => {
    const result = await saveGoogleMapsLink({
      mapUrl: '',
      userId: 'user1',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
