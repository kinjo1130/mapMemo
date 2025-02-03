
export interface Collection {
  title: string;
  uid: string;
  isPublic: boolean;
  collectionId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userIds?: string[];
  users?: CollectionUser[];
}

// Link Type (SubCollection)
export interface Link {
  address: string;
  groupId: string;
  link: string;
  name: string;
  photoUrl: string;
  timestamp: Timestamp;
  userId: string;
  docId: string;
  lat: number | null;
  lng: number | null;
  userPictureUrl: string;
  displayName: string;
  groupName: string;
  groupPictureUrl: string;
}

// Collection API Response Types
interface CollectionResponse {
  collections: Collection[];
  total: number;
}

interface CollectionWithLinks extends Collection {
  links: Link[];
}

// Collection Operation Types
interface CreateCollectionInput {
  title: string;
  isPublic: boolean;
}

interface UpdateCollectionInput {
  collectionId: string;
  title?: string;
  isPublic?: boolean;
}

interface AddLinkToCollectionInput {
  collectionId: string;
  link: Link;
}

// Error Responses
interface CollectionError {
  code: 'FORBIDDEN' | 'NOT_FOUND' | 'UNAUTHORIZED';
  message: string;
  status: 403 | 404 | 401;
}

export interface CollectionUser {
  uid: string;
  role: 'owner' | 'editor' | 'viewer';
  addedAt: any; // Timestamp
  displayName: string;
  pictureUrl: string;
  statusMessage: string;
}

export interface CollectionAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  show?: boolean;
}