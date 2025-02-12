import { Timestamp } from "firebase/firestore";

export type Group = {
  groupId: string;
  groupName: string;
  members: string[];
  pictureUrl?: string;
  updatedAt?: Timestamp;
}