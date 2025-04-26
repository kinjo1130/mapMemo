import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import ReactMapGL, {
  Marker,
  Popup,
  ViewState,
  MapLayerMouseEvent,
  GeolocateControl,
  MapRef,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Link } from "@/types/Link";
import { X, Navigation, MapPin, Check } from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface MapProps {
  links: Link[];
}

const DEFAULT_LONGITUDE = 139.6503;
const DEFAULT_LATITUDE = 35.6762;

const Map: React.FC<MapProps> = ({ links }) => {
  const [viewState, setViewState] = useState<ViewState>({
    longitude: DEFAULT_LONGITUDE,
    latitude: DEFAULT_LATITUDE,
    zoom: 9,
    bearing: 0,
    pitch: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  const [selectedMarker, setSelectedMarker] = useState<Link | null>(null);
  const [selectedMarkers, setSelectedMarkers] = useState<Link[]>([]);
  const [isRouteSelectionMode, setIsRouteSelectionMode] = useState(false);

  const mapRef = useRef<MapRef>(null);

  // 表示されるリンクに基づいて地図の表示範囲を調整する
  useEffect(() => {
    const validLinks = links.filter(
      (link) =>
        typeof link.lng === "number" &&
        typeof link.lat === "number" &&
        !isNaN(link.lng) &&
        !isNaN(link.lat)
    );

    if (validLinks.length === 0) {
      // 有効なリンクがない場合はデフォルト位置を表示
      setViewState((prevState) => ({
        ...prevState,
        longitude: DEFAULT_LONGITUDE,
        latitude: DEFAULT_LATITUDE,
        zoom: 9,
      }));
      return;
    }

    if (validLinks.length === 1) {
      // リンクが1つだけの場合はその位置を中心に表示
      setViewState((prevState) => ({
        ...prevState,
        longitude: validLinks[0].lng ?? DEFAULT_LONGITUDE,
        latitude: validLinks[0].lat ?? DEFAULT_LATITUDE,
        zoom: 13, // 単一のピンの場合は少し拡大
      }));
      return;
    }

    // 複数のリンクがある場合は、すべてのリンクが表示されるように範囲を調整
    if (mapRef.current && validLinks.length > 1) {
      // すべてのリンクの座標を含む境界ボックスを計算
      const bounds = validLinks.reduce(
        (box, link) => {
          return {
            minLng: Math.min(box.minLng, link.lng ?? DEFAULT_LONGITUDE),
            maxLng: Math.max(box.maxLng, link.lng ?? DEFAULT_LONGITUDE),
            minLat: Math.min(box.minLat, link.lat ?? DEFAULT_LATITUDE),
            maxLat: Math.max(box.maxLat, link.lat ?? DEFAULT_LATITUDE),
          };
        },
        {
          minLng: Infinity,
          maxLng: -Infinity,
          minLat: Infinity,
          maxLat: -Infinity,
        }
      );

      // 境界ボックスに合わせて地図の表示範囲を調整
      // パディングを追加して、ピンが画面の端に表示されないようにする
      mapRef.current.fitBounds(
        [
          [bounds.minLng, bounds.minLat],
          [bounds.maxLng, bounds.maxLat],
        ],
        {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1000, // アニメーション時間（ミリ秒）
        }
      );
    }
  }, [links]);

  const validLinks = links.filter(
    (link) =>
      typeof link.lng === "number" &&
      typeof link.lat === "number" &&
      !isNaN(link.lng) &&
      !isNaN(link.lat)
  );

  const handleMarkerClick = useCallback((e: MapLayerMouseEvent, link: Link) => {
    e.originalEvent.stopPropagation();
    
    if (isRouteSelectionMode) {
      // ルート選択モードの場合、選択したマーカーをリストに追加または削除
      setSelectedMarkers(prevMarkers => {
        const isAlreadySelected = prevMarkers.some(marker => marker.docId === link.docId);
        
        if (isAlreadySelected) {
          // すでに選択されている場合は、そのマーカーを削除
          return prevMarkers.filter(marker => marker.docId !== link.docId);
        } else {
          // 選択されていない場合は、そのマーカーを追加
          return [...prevMarkers, link];
        }
      });
    } else {
      // 通常モードの場合は、単一のマーカーを選択
      setSelectedMarker(link);
      
      // ピンをクリックしたときに、地図の表示位置を調整して、ポップアップが画面内に収まるようにする
      if (mapRef.current && link.lng && link.lat) {
        // ポップアップの高さを考慮して、少し上にオフセットする
        mapRef.current.panTo({
          lng: link.lng,
          lat: link.lat - 0.003 // 緯度を少し南にずらす（ポップアップの高さに応じて調整）
        }, {
          duration: 500 // アニメーション時間（ミリ秒）
        });
      }
    }
  }, [isRouteSelectionMode]);

  // 現在位置を取得する関数
const getCurrentPosition = async (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
};

// Google マップでルート表示を開く関数
const openRouteInGoogleMaps = async () => {
  if (selectedMarkers.length < 2) {
    alert('ルート案内には少なくとも2つのポイントを選択してください');
    return;
  }

  try {
    // 現在位置を取得
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    
    console.log("現在位置:", latitude, longitude);
    
    // Google Maps APIの形式に従ったURLを構築
    let googleMapsUrl = 'https://www.google.com/maps/dir/?api=1';
    
    // 出発地点として現在の正確な位置を設定
    googleMapsUrl += `&origin=${latitude},${longitude}`;
    
    // 最後のマーカーを目的地として設定
    const destination = selectedMarkers[selectedMarkers.length - 1];
    googleMapsUrl += `&destination=${destination.lat},${destination.lng}`;
    
    // 中間地点がある場合は経由地として追加（最後のマーカー以外すべて）
    if (selectedMarkers.length > 1) {
      const waypoints = selectedMarkers.slice(0, selectedMarkers.length - 1)
        .map(marker => `${marker.lat},${marker.lng}`)
        .join('|');
      
      googleMapsUrl += `&waypoints=${waypoints}`;
    }
    
    // 交通手段を設定（車）
    googleMapsUrl += '&travelmode=driving';
    
    // 新しいタブでGoogle Mapsを開く
    window.open(googleMapsUrl, '_blank');
    
  } catch (error) {
    console.error("位置情報の取得に失敗しました:", error);
    alert("位置情報の取得に失敗しました。ブラウザの位置情報へのアクセスを許可してください。");
  }
};

  // ルート選択モードをトグルする関数
  const toggleRouteSelectionMode = () => {
    setIsRouteSelectionMode(!isRouteSelectionMode);
    if (isRouteSelectionMode) {
      // ルート選択モードを終了する場合は選択をクリア
      setSelectedMarkers([]);
    } else {
      // ルート選択モードを開始する場合は単一選択をクリア
      setSelectedMarker(null);
    }
  };

  // 選択したマーカーを全て解除する関数
  const clearAllSelectedMarkers = () => {
    setSelectedMarkers([]);
    // すべて解除したらルート選択モードも終了
    setIsRouteSelectionMode(false);
  };

  // ズームレベルに応じたマーカーのスタイル設定を計算する
  const getMarkerStyle = useMemo(() => {
    return (zoom: number, isSelected: boolean) => {
      // ズームレベルに応じたピンのサイズ調整
      // ズーム値が小さい（広域表示）ほど小さく、大きい（詳細表示）ほど大きくする
      const baseSize = Math.max(zoom - 5, 2); // 最小サイズは2
      const size = isSelected ? baseSize * 1.2 : baseSize; // 選択中は少し大きく
      
      // ラベル（地点名）の表示設定
      // ズームレベルが一定以上の場合のみラベルを表示
      const showLabel = zoom >= 10;
      
      // ピンか点かを決定
      // ズームレベルが小さい場合（10未満）は点表示、それ以上はピン表示
      const usePin = zoom >= 10;
      
      return { size, showLabel, usePin };
    };
  }, []);

  return (
    <div className="h-full w-full relative">
      <ReactMapGL
        {...viewState}
        ref={mapRef}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v11?optimize=true&language=ja"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <GeolocateControl
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
          showUserHeading={true}
          style={{ position: "absolute", top: 10, right: 10 }}
        />

        {/* ルート選択ボタン */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-2">
          <button
            onClick={toggleRouteSelectionMode}
            className={`p-2 px-3 rounded-full shadow-md flex items-center ${
              isRouteSelectionMode ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
            }`}
            title={isRouteSelectionMode ? 'ルート選択モードを終了' : 'ルート選択モードを開始'}
          >
            <MapPin size={20} />
            <span className="ml-2 text-sm font-medium whitespace-nowrap">
              {isRouteSelectionMode ? 'ルート選択中' : 'ルート選択'}
            </span>
          </button>
          
          {isRouteSelectionMode && selectedMarkers.length >= 2 && (
            <button
              onClick={openRouteInGoogleMaps}
              className="p-2 px-3 bg-green-500 text-white rounded-full shadow-md flex items-center"
              title="選択したピン間のルートを表示"
            >
              <Navigation size={20} />
              <span className="ml-2 text-sm font-medium whitespace-nowrap">ルート表示</span>
            </button>
          )}
        </div>

        {/* 選択中のマーカー数と選択解除ヘルプの表示 */}
        {isRouteSelectionMode && (
          <div className="absolute top-2 left-40 z-10 bg-white p-2 rounded shadow-md">
            <div className="text-sm font-medium flex items-center justify-between">
              <span>{selectedMarkers.length} 地点を選択中</span>
              {selectedMarkers.length > 0 && (
                <button 
                  onClick={clearAllSelectedMarkers}
                  className="ml-2 text-red-500 hover:text-red-700 text-xs bg-red-50 px-2 py-1 rounded"
                  title="全ての選択を解除"
                >
                  <span>全て解除</span>
                </button>
              )}
            </div>
            {selectedMarkers.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                ※ 番号つきのピンをタップすると選択解除できます
              </div>
            )}
          </div>
        )}

        {validLinks.map((link) => {
          const isSelected = selectedMarkers.some(marker => marker.docId === link.docId);
          const { size, showLabel, usePin } = getMarkerStyle(viewState.zoom, isSelected);
          return (
            <Marker
              key={link.docId}
              longitude={link.lng ?? DEFAULT_LONGITUDE}
              latitude={link.lat ?? DEFAULT_LATITUDE}
              onClick={(e: any) => handleMarkerClick(e, link)}
            >
              <div className="marker-container">
                {/* ズームレベルに応じて表示を切り替え */}
                {usePin ? (
                  <div 
                    style={{ 
                      transform: `scale(${size / 10})`, 
                      transformOrigin: 'bottom center' 
                    }}
                  >
                    <MapPin 
                      size={24} 
                      color={isSelected ? "#1d4ed8" : "#ef4444"} 
                      fill={isSelected ? "#93c5fd" : "#fca5a5"} 
                      strokeWidth={2} 
                    />
                  </div>
                ) : (
                  <div 
                    style={{ 
                      width: `${size * 3}px`, 
                      height: `${size * 3}px` 
                    }}
                    className={`rounded-full border-2 ${
                      isSelected 
                        ? "bg-blue-200 border-blue-600" 
                        : "bg-red-200 border-red-600"
                    }`}
                  />
                )}
                
                {/* 選択されたマーカーには番号を表示 */}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border-2 border-white shadow-md">
                    {selectedMarkers.findIndex(marker => marker.docId === link.docId) + 1}
                  </div>
                )}
                
                {/* ズームレベルが十分ある場合は地点名を表示 */}
                {showLabel && (
                  <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-white px-2 py-0.5 rounded text-xs font-medium shadow-md">
                    {link.name}
                  </div>
                )}
              </div>
            </Marker>
          );
        })}

        {!isRouteSelectionMode && selectedMarker &&
          typeof selectedMarker.lng === "number" &&
          typeof selectedMarker.lat === "number" && (
            <Popup
              longitude={selectedMarker.lng}
              latitude={selectedMarker.lat}
              anchor="bottom"
              onClose={() => setSelectedMarker(null)}
              maxWidth="200px"
              className="map-popup-compact"
              closeOnClick={false}
              closeButton={false}
              offset={[0, -5]} // マーカーからのオフセット
            >
              <div className="flex flex-col p-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm">{selectedMarker.name}</h3>
                  <button
                    type="button"
                    onClick={() => setSelectedMarker(null)}
                    className="p-1 bg-gray-100 rounded-full hover:bg-gray-200"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                {selectedMarker.photoUrl && (
                  <div className="my-1">
                    <img 
                      src={selectedMarker.photoUrl} 
                      alt={selectedMarker.name} 
                      className="w-full h-20 object-cover rounded"
                    />
                  </div>
                )}
                
                <p className="text-gray-600 text-xs mb-1">{selectedMarker.address}</p>
                
                <div className="flex flex-wrap text-xs gap-1 mb-1">
                  {selectedMarker.displayName && (
                    <div className="flex items-center bg-gray-100 rounded px-1 py-0.5">
                      <span className="text-gray-700">
                        {selectedMarker.displayName}
                      </span>
                    </div>
                  )}
                  
                  {selectedMarker.groupName && (
                    <div className="flex items-center bg-gray-100 rounded px-1 py-0.5">
                      <span className="text-gray-700">
                        {selectedMarker.groupName}
                      </span>
                    </div>
                  )}
                </div>
                
                {selectedMarker.link && (
                  <a 
                    href={selectedMarker.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 text-xs flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    地図を開く
                  </a>
                )}
              </div>
            </Popup>
          )}
      </ReactMapGL>
    </div>
  );
};

export default Map;
