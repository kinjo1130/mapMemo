export interface Link {
  address: string;
  groupId: string;
  link: string;
  name: string;
  photoUrl: string;
  timestamp: string;
  userId: string;
  docId: string;
  lat: number | null;
  lng: number | null;
  userPictureUrl: string;
  displayName: string;
  groupName: string;
  groupPictureUrl: string;

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