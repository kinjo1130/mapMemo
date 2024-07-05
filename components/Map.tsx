import React, { useState, useEffect, useCallback } from "react";
import ReactMapGL, {
  Marker,
  Popup,
  ViewState,
  MapLayerMouseEvent,
  GeolocateControl,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Link } from "@/types/Link";

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
    zoom: 11,
    bearing: 0,
    pitch: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  const [selectedMarker, setSelectedMarker] = useState<Link | null>(null);

  useEffect(() => {
    const validLinks = links.filter(
      (link) =>
        typeof link.lng === "number" &&
        typeof link.lat === "number" &&
        !isNaN(link.lng) &&
        !isNaN(link.lat)
    );
    if (validLinks.length > 0) {
      setViewState((prevState) => ({
        ...prevState,
        longitude: validLinks[0].lng ?? DEFAULT_LONGITUDE,
        latitude: validLinks[0].lat ?? DEFAULT_LATITUDE,
      }));
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
  }, []);

  return (
    <div className="h-full w-full relative">
      <ReactMapGL
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
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
            >
              <div>
                <h3 className="font-bold">{selectedMarker.name}</h3>
                <p>{selectedMarker.address}</p>
              </div>
            </Popup>
          )}
      </ReactMapGL>
    </div>
  );
};

export default Map;
