import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { X } from "lucide-react";

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
        {validLinks.map((link) => (
          <Marker
            key={link.docId}
            longitude={link.lng ?? DEFAULT_LONGITUDE}
            latitude={link.lat ?? DEFAULT_LATITUDE}
            color="red"
            onClick={(e: any) => handleMarkerClick(e, link)}
          />
        ))}

        {selectedMarker &&
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
