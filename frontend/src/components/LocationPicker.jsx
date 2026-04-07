import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
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

const carIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const dropoffIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function DropoffClickHandler({ onDropoff }) {
  useMapEvents({
    click(e) { onDropoff(e.latlng); },
  });
  return null;
}

// Pass car object (with current_lat, current_lng, current_location) and onSelect callback
function LocationPicker({ car, onSelect }) {
  console.log("CAR DATA:", car); // ← add this
  const [dropoff, setDropoff] = useState(null);

  const pickup = car?.current_lat && car?.current_lng
    ? { lat: car.current_lat, lng: car.current_lng }
    : null;

  const handleDropoff = (latlng) => {
    setDropoff(latlng);
    onSelect({ pickup, dropoff: latlng });
  };

  const center = pickup ? [pickup.lat, pickup.lng] : [54.8985, 23.9036];

  return (
    <div>
      <div style={{ marginBottom: 8, fontSize: 13, color: "#555", padding: "6px 0" }}>
        {pickup ? (
          <>
            <span style={{ color: "#605fc9", fontWeight: 600 }}>Pickup (car location):</span>{" "}
            {car.current_location || pickup.lat.toFixed(4) + ", " + pickup.lng.toFixed(4)}
            {" | "}
            {dropoff
              ? <><span style={{ color: "#c0392b", fontWeight: 600 }}>Dropoff:</span>{" "}{dropoff.lat.toFixed(4)}, {dropoff.lng.toFixed(4)}</>
              : <span style={{ color: "#888" }}>Click map to set dropoff location</span>
            }
          </>
        ) : (
          <span style={{ color: "#c0392b" }}>Car location not set yet — no pickup point available</span>
        )}
      </div>

      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "300px", width: "100%", borderRadius: 12, border: "1px solid #605fc9" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
      </MapContainer>
    </div>
  );
}

export default LocationPicker;
