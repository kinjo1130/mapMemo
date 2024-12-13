import { useState } from "react"

export const useCollection = ()=>{
  const [collectionList , setCollectionList] = useState([])
  return {
    collectionList: [],
    createCollection: {},
    deleteCollection: {},
    updateCollection: {},
  }
}