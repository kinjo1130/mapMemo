import React, { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from "react-beautiful-dnd";
import { Link } from "@/types/Link";
import { Collection } from "@/types/Collection";
import { MapPin, Calendar, Trash2, Plus, FileText } from "lucide-react";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "@/lib/init/firebase";
import Map from "./Map";
import Button from "./Button";
import Toast from "./Toast";

interface TripPlannerProps {
  collection: Collection;
  links: Link[];
  onUpdateLinks: () => Promise<void>;
}

const TripPlanner: React.FC<TripPlannerProps> = ({
  collection,
  links,
  onUpdateLinks,
}) => {
  const [tripLinks, setTripLinks] = useState<Link[]>([]);
  const [otherLinks, setOtherLinks] = useState<Link[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  const [itinerary, setItinerary] = useState<string>("");

  // リンクを現在の旅行用と非旅行用に分類
  useEffect(() => {
    const trip = links
      .filter((link) => link.isCurrentTrip)
      .sort((a, b) => (a.tripOrder || 0) - (b.tripOrder || 0));
    const other = links.filter((link) => !link.isCurrentTrip);
    setTripLinks(trip);
    setOtherLinks(other);
  }, [links]);

  // ドラッグ＆ドロップの処理
  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination) return;

      const { source, destination } = result;

      // 同じリスト内での並び替え
      if (source.droppableId === destination.droppableId) {
        if (source.droppableId === "tripList") {
          const items = Array.from(tripLinks);
          const [reorderedItem] = items.splice(source.index, 1);
          items.splice(destination.index, 0, reorderedItem);

          // 順序を更新
          const updatedItems = items.map((item, index) => ({
            ...item,
            tripOrder: index,
          }));

          setTripLinks(updatedItems);

          // Firestoreの更新
          try {
            for (const item of updatedItems) {
              const linkRef = doc(
                db,
                `collections/${collection.collectionId}/links/${item.docId}`
              );
              await updateDoc(linkRef, {
                tripOrder: item.tripOrder,
              });
            }
            setToast({
              message: "旅行の順序が更新されました",
              type: "success",
            });
          } catch (error) {
            console.error("Error updating trip order:", error);
            setToast({
              message: "順序の更新中にエラーが発生しました",
              type: "error",
            });
          }
        }
      } else {
        // 異なるリスト間での移動
        if (source.droppableId === "otherList" && destination.droppableId === "tripList") {
          // 非旅行用から旅行用へ
          const sourceItems = Array.from(otherLinks);
          const destItems = Array.from(tripLinks);
          const [movedItem] = sourceItems.splice(source.index, 1);
          
          // 旅行用としてマーク
          const updatedItem = {
            ...movedItem,
            isCurrentTrip: true,
            tripOrder: destItems.length,
          };
          
          destItems.splice(destination.index, 0, updatedItem);
          
          setOtherLinks(sourceItems);
          setTripLinks(destItems);
          
          // Firestoreの更新
          try {
            const linkRef = doc(
              db,
              `collections/${collection.collectionId}/links/${updatedItem.docId}`
            );
            await updateDoc(linkRef, {
              isCurrentTrip: true,
              tripOrder: updatedItem.tripOrder,
            });
            setToast({
              message: "ピンが旅行に追加されました",
              type: "success",
            });
          } catch (error) {
            console.error("Error adding to trip:", error);
            setToast({
              message: "ピンの追加中にエラーが発生しました",
              type: "error",
            });
          }
        } else if (source.droppableId === "tripList" && destination.droppableId === "otherList") {
          // 旅行用から非旅行用へ
          const sourceItems = Array.from(tripLinks);
          const destItems = Array.from(otherLinks);
          const [movedItem] = sourceItems.splice(source.index, 1);
          
          // 非旅行用としてマーク
          const updatedItem = {
            ...movedItem,
            isCurrentTrip: false,
            tripOrder: undefined,
          };
          
          destItems.splice(destination.index, 0, updatedItem);
          
          // 残りの旅行用ピンの順序を更新
          const updatedSourceItems = sourceItems.map((item, index) => ({
            ...item,
            tripOrder: index,
          }));
          
          setTripLinks(updatedSourceItems);
          setOtherLinks(destItems);
          
          // Firestoreの更新
          try {
            // 移動したアイテムを更新
            const linkRef = doc(
              db,
              `collections/${collection.collectionId}/links/${updatedItem.docId}`
            );
            await updateDoc(linkRef, {
              isCurrentTrip: false,
              tripOrder: null,
            });
            
            // 残りのアイテムの順序を更新
            for (const item of updatedSourceItems) {
              const itemRef = doc(
                db,
                `collections/${collection.collectionId}/links/${item.docId}`
              );
              await updateDoc(itemRef, {
                tripOrder: item.tripOrder,
              });
            }
            
            setToast({
              message: "ピンが旅行から削除されました",
              type: "success",
            });
          } catch (error) {
            console.error("Error removing from trip:", error);
            setToast({
              message: "ピンの削除中にエラーが発生しました",
              type: "error",
            });
          }
        }
      }

      // リンクリストを再読み込み
      await onUpdateLinks();
    },
    [tripLinks, otherLinks, collection.collectionId, onUpdateLinks]
  );

  // 旅程の生成
  const generateItinerary = useCallback(() => {
    if (tripLinks.length === 0) {
      setToast({
        message: "旅行用のピンがありません",
        type: "error",
      });
      return;
    }

    setIsGeneratingItinerary(true);

    try {
      let itineraryText = `# ${collection.title} 旅程\n\n`;

      tripLinks.forEach((link, index) => {
        itineraryText += `## ${index + 1}. ${link.name}\n`;
        itineraryText += `住所: ${link.address}\n`;
        itineraryText += `[Google Map](${link.link})\n\n`;
      });

      setItinerary(itineraryText);
      setIsGeneratingItinerary(false);
      setToast({
        message: "旅程が生成されました",
        type: "success",
      });
    } catch (error) {
      console.error("Error generating itinerary:", error);
      setIsGeneratingItinerary(false);
      setToast({
        message: "旅程の生成中にエラーが発生しました",
        type: "error",
      });
    }
  }, [tripLinks, collection.title]);

  // 旅程のコピー
  const copyItinerary = useCallback(() => {
    if (!itinerary) {
      setToast({
        message: "コピーする旅程がありません",
        type: "error",
      });
      return;
    }

    navigator.clipboard.writeText(itinerary);
    setToast({
      message: "旅程がクリップボードにコピーされました",
      type: "success",
    });
  }, [itinerary]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">旅行プランナー</h2>
        <p className="text-gray-600 mb-4">
          ピンをドラッグ＆ドロップして訪問順序を決定します。右側のリストから旅行に追加したいピンを左側にドラッグしてください。
        </p>
        <div className="flex flex-wrap gap-4 mb-6">
          <Button
            onClick={generateItinerary}
            disabled={tripLinks.length === 0 || isGeneratingItinerary}
            className="flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            旅程を生成
          </Button>
          {itinerary && (
            <Button onClick={copyItinerary} className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              旅程をコピー
            </Button>
          )}
        </div>
      </div>

      {itinerary && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">生成された旅程</h3>
          <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
            {itinerary}
          </pre>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/2">
          <div className="bg-white shadow-md rounded-lg p-4 mb-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              現在の旅行
            </h3>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="tripList">
                {(provided: DroppableProvided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="min-h-[200px] border-2 border-dashed border-blue-200 rounded-lg p-4"
                  >
                    {tripLinks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
                        <Plus className="w-12 h-12 mb-2" />
                        <p>右側のリストからピンをドラッグして追加</p>
                      </div>
                    ) : (
                      tripLinks.map((link, index) => (
                        <Draggable
                          key={link.docId}
                          draggableId={link.docId}
                          index={index}
                        >
                          {(provided: DraggableProvided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg p-4 mb-3 flex items-center"
                            >
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3">
                                {index + 1}
                              </div>
                              <div className="flex-grow">
                                <h4 className="font-semibold">{link.name}</h4>
                                <p className="text-sm text-gray-600 truncate">
                                  {link.address}
                                </p>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {tripLinks.length > 0 && (
            <div className="h-[400px] bg-white shadow-md rounded-lg p-4">
              <h3 className="text-lg font-bold mb-4">旅行マップ</h3>
              <Map links={tripLinks} />
            </div>
          )}
        </div>

        <div className="lg:w-1/2">
          <div className="bg-white shadow-md rounded-lg p-4">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-gray-600" />
              利用可能なピン
            </h3>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="otherList">
                {(provided: DroppableProvided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="min-h-[200px]"
                  >
                    {otherLinks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
                        <MapPin className="w-12 h-12 mb-2" />
                        <p>利用可能なピンがありません</p>
                      </div>
                    ) : (
                      otherLinks.map((link, index) => (
                        <Draggable
                          key={link.docId}
                          draggableId={link.docId}
                          index={index}
                        >
                          {(provided: DraggableProvided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg p-4 mb-3 flex items-center"
                            >
                              <div className="flex-shrink-0 w-12 h-12 mr-3">
                                <img
                                  src={link.photoUrl || "/api/placeholder/150/150"}
                                  alt={link.name}
                                  className="w-full h-full object-cover rounded-md"
                                />
                              </div>
                              <div className="flex-grow">
                                <h4 className="font-semibold">{link.name}</h4>
                                <p className="text-sm text-gray-600 truncate">
                                  {link.address}
                                </p>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default TripPlanner;
