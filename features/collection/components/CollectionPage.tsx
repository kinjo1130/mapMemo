import React from "react";

export const CollectionListPage :React.FC = () =>{
  //ここにコレクション関連のコンポーネントを分けることにする
  // 責務: コレクションを作成できる & 一覧を見ることができる
  return (
    <div>
      <button>コレクションを作成</button>
      {/* {collectionList.map((collection)=>{
        <div>
          <h2>collection.name</h2>
        </div>
      })} */}
    </div>
  )
}