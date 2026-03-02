import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function LocationPicker({ onSelect }) {
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        if (!pickup) {
          setPickup(e.latlng);
          onSelect({ pickup: e.latlng, dropoff });
        } else {
          setDropoff(e.latlng);
          onSelect({ pickup, dropoff: e.latlng });
        }
      },
    });
    return null;
  }

  return (
    <MapContainer
      center={[54.8985, 23.9036]}
      zoom={12}
      style={{ height: "300px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler />

      {pickup && <Marker position={pickup} />}
      {dropoff && <Marker position={dropoff} />}
    </MapContainer>
  );
}

export default LocationPicker;