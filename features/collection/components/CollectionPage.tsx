import React, { useState } from "react";
import { X } from "lucide-react";
import { useCollection } from "../hooks/useCollection";

export const CollectionListPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createCollection, collectionList } = useCollection();

  const handleCreateCollection = async () => {
    const res = await createCollection({ title, isPublic });
    if (!res.isOk) {
      const errorMessage = res.message || "コレクションの作成に失敗しました。もう一度お試しください。";
      setError(errorMessage);
      return;
    }
    setIsModalOpen(false);
    setError(null);
    setTitle("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 p-4">
      <div className="flex justify-end mb-4">
        <button
          className="text-white px-4 py-2 rounded shadow bg-primary hover:bg-gray-200"
          onClick={() => setIsModalOpen(true)}
        >
          コレクションを作成
        </button>
      </div>
      <div className="">
        {collectionList.map((collection) => (
          <div key={collection.collectionId} className="bg-white p-4 rounded shadow mb-4">
            <h2 className="text-xl font-bold">{collection.title}</h2>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold mb-4">コレクションを作成</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="mb-4">
              <label className="block text-gray-700">タイトル</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">公開設定</label>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="mr-2"
              />
              公開する
            </div>
            <button
              onClick={handleCreateCollection}
              className="bg-primary text-white px-4 py-2 rounded shadow hover:bg-primary-dark"
            >
              作成
            </button>
          </div>
        </div>
      )}
    </div>
  );
};