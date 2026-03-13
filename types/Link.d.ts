import { Timestamp } from "firebase/firestore";

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
  categories: string[];
  tags: string[];
  placeId?: string;
  rating?: number | null;
  userRatingsTotal?: number | null;
  priceLevel?: number | null;
  openingHours?: string[] | null;
  website?: string | null;
  phoneNumber?: string | null;
  googleMapsUrl?: string | null;
  businessStatus?: string | null;
  editorialSummary?: string | null;
}
export interface PlaceDetails {
  name: string;
  address: string;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  categories: string[];
  placeId: string;
  rating: number | null;
  userRatingsTotal: number | null;
  priceLevel: number | null;
  openingHours: string[] | null;
  website: string | null;
  phoneNumber: string | null;
  googleMapsUrl: string | null;
  businessStatus: string | null;
  editorialSummary: string | null;
}
export interface SaveMapLinkParams {
  userId: string;
  groupId: string;
  link: string;
  placeDetails: PlaceDetails;
  displayName: string;
  userPictureUrl: string;
  groupName: string;
  members: string[];
  groupPictureUrl: string;
}