import { Link } from "@/types/Link";
import { Timestamp } from "firebase/firestore";

type Collection = {
  title: string;
  uid: string;
  collectionId: string;
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /*
  編集権限とか欲しくなったら、ここにisOwnerとかを追加する
  */
}

type CollectionList = Collection[]

type CollectionListInLink = Link
