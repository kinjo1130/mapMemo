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
  isCurrentTrip?: boolean; // 現在の旅行用かどうか
  tripOrder?: number; // 訪問順序
}
export interface PlaceDetails {
  name: string;
  address: string;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
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
