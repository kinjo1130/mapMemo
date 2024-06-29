import React, { useState } from "react";
import { Grid, List, MapPin, Trash2 } from "lucide-react";
import { Link } from "@/types/Link";
import useDeleteDocument from "@/hooks/useDeleteDocument";

interface LinkListProps {
  links: Link[];
}

const LinkList: React.FC<LinkListProps> = ({ links }) => {
  const [columns, setColumns] = useState<1 | 2 | 3>(1);
  const { deleteDocument, loading, error } = useDeleteDocument();

  const layoutOptions = [
    { cols: 1, icon: <List size={24} /> },
    { cols: 2, icon: <Grid size={24} /> },
    { cols: 3, icon: <Grid size={24} /> },
  ] as const;

  const getGridStyle = (): React.CSSProperties => {
    return {
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gap: "1rem",
    };
  };

  const handleDelete = async (id: string | number) => {
    console.log(`削除: ID ${id} のアイテム`);
    await deleteDocument('Links', id.toString());
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex justify-end space-x-2">
        {layoutOptions.map((option) => (
          <button
            key={option.cols}
            onClick={() => setColumns(option.cols)}
            className={`p-2 rounded ${
              columns === option.cols
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            aria-label={`${option.cols}列表示に切り替え`}
          >
            {option.icon}
          </button>
        ))}
      </div>

      <ul style={getGridStyle()} className="sm:grid-cols-1">
        {links.map((link) => (
          <li
            key={link.docId}
            className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex h-48">
              <div className="w-1/3 relative">
                <div className="absolute inset-0 bg-gray-200">
                  <img
                    src={link.photoUrl || "/api/placeholder/150/150"}
                    alt={link.name || "場所の画像"}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="w-2/3 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{link.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{link.address}</p>
                  <a
                    href={link.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 flex items-center mb-2 underline"
                  >
                    <MapPin size={16} className="mr-2 flex-shrink-0" />
                    <span>Google Map</span>
                  </a>
                </div>
                <button
                  onClick={() => handleDelete(link.docId)}
                  className="text-red-500 hover:text-red-700 flex items-center self-start"
                  aria-label="アイテムを削除"
                >
                  <Trash2 size={16} className="mr-2 flex-shrink-0" />
                  {columns === 1 && <span>削除</span>}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LinkList;
