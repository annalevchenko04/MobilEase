import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import { GeoJSON } from "react-leaflet";

const kaunasGeoJson = {
  type: "Feature",
  geometry: {
    coordinates: [[
      [23.788367911020742, 54.922149804039464],
      [23.747702276616224, 54.88447102983966],
      [23.84036724050995,  54.807640085267764],
      [23.971339582590986, 54.811188477754115],
      [24.201233545679656, 54.8175866858802],
      [24.14432901965307,  54.924255524655564],
      [24.103560379605028, 54.98315416533393],
      [23.763735885460676, 54.95832990368277],
      [23.788367911020742, 54.922149804039464],
    ]],
    type: "Polygon",
  },
};

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const carIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const dropoffIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const isInsideKaunas = (lat, lng) =>
  booleanPointInPolygon(point([lng, lat]), kaunasGeoJson);

async function fetchRoute(pickup, dropoff) {
  const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.routes && data.routes.length > 0) {
    // OSRM returns [lng, lat], Leaflet needs [lat, lng]
    return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  }
  return null;
}

function DropoffClickHandler({ onDropoff }) {
  useMapEvents({ click(e) { onDropoff(e.latlng); } });
  return null;
}

function LocationPicker({ car, onSelect }) {
  const [dropoff, setDropoff] = useState(null);
  const [error, setError]     = useState("");
  const [routeCoords, setRouteCoords] = useState(null);
  const [distance, setDistance]       = useState(null);

  const pickup = car?.current_lat && car?.current_lng
    ? { lat: car.current_lat, lng: car.current_lng }
    : null;

  useEffect(() => {
    if (!pickup || !dropoff) { setRouteCoords(null); setDistance(null); return; }
    fetchRoute(pickup, dropoff).then(coords => setRouteCoords(coords));

    // also compute straight-line km as fallback display
    const R = 6371;
    const dLat = (dropoff.lat - pickup.lat) * Math.PI / 180;
    const dLng = (dropoff.lng - pickup.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(pickup.lat * Math.PI/180) * Math.cos(dropoff.lat * Math.PI/180) *
              Math.sin(dLng/2)**2;
    setDistance((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1));
  }, [dropoff]);

  const handleDropoff = (latlng) => {
    if (!isInsideKaunas(latlng.lat, latlng.lng)) {
      setError("Dropoff must be inside Kaunas");
      return;
    }
    setError("");
    setDropoff(latlng);
    onSelect({ pickup, dropoff: latlng });
  };

  const center = pickup ? [pickup.lat, pickup.lng] : [54.8985, 23.9036];

  return (
    <div>
      <div style={{ marginBottom: 8, fontSize: 13, color: "#555", padding: "6px 0" }}>
        {pickup ? (
          <>
            <span style={{ color: "#605fc9", fontWeight: 600 }}>Pickup:</span>{" "}
            {car.current_location || pickup.lat.toFixed(4) + ", " + pickup.lng.toFixed(4)}
            {" | "}
            <span style={{ color: "#27ae60", fontWeight: 600 }}>Dropoff:</span>{" "}
            {dropoff
              ? <>{dropoff.lat.toFixed(4)}, {dropoff.lng.toFixed(4)}</>
              : <span style={{ color: "#888" }}>Click map to set dropoff location</span>
            }
          </>
        ) : (
          <span style={{ color: "#c0392b" }}>Car location not set yet — no pickup point available</span>
        )}
      </div>

      {error && <div style={{ color: "#c0392b", marginBottom: 8, fontSize: 13 }}>{error}</div>}

      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "300px", width: "100%", borderRadius: 12, border: "1px solid #605fc9" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <GeoJSON data={kaunasGeoJson} style={{ color: "#28a745", weight: 2, fillColor: "#28a745", fillOpacity: 0.15 }} />
        <DropoffClickHandler onDropoff={handleDropoff} />

        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={carIcon}>
            <Popup>Car is here — this is your pickup point</Popup>
          </Marker>
        )}

        {dropoff && (
          <Marker position={dropoff} icon={dropoffIcon}>
            <Popup>Your dropoff location</Popup>
          </Marker>
        )}

        {routeCoords && (
          <Polyline
            positions={routeCoords}
            pathOptions={{ color: "#605fc9", weight: 4, opacity: 0.8 }}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default LocationPicker;