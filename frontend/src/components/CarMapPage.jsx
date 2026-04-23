import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import API_URL from "../config";

// 🚗 Car icon
const carIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/296/296216.png",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

// 📍 User icon
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64572.png",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

const CarMapPage = () => {
  const [cars, setCars] = useState([]);
  const [userPosition, setUserPosition] = useState(null);
  const navigate = useNavigate();

  // 🚗 Load cars
  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_URL}/cars`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        console.log("CARS RESPONSE:", data);

        if (Array.isArray(data)) {
          setCars(data);
        } else {
          setCars([]);
          console.error("Expected array but got:", data);
        }
      });
  }, []);

  // 📍 Get user location
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.error("Geolocation error:", err);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    <div style={{ height: "100vh" }}>
      <MapContainer
        center={
          userPosition
            ? [userPosition.lat, userPosition.lng]
            : [54.8985, 23.9036] // Kaunas fallback
        }
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* 📍 User marker */}
        {userPosition && (
          <Marker
            position={[userPosition.lat, userPosition.lng]}
            icon={userIcon}
          >
            <Popup>📍You are here </Popup>
          </Marker>
        )}

        {/* 🚗 Cars */}
        {cars.map(car =>
          car.current_lat != null && car.current_lng != null ? (
            <Marker
              key={car.id}
              position={[car.current_lat, car.current_lng]}
              icon={carIcon}
            >
              <Popup>
                <div>
                  <strong>
                    {car.brand} {car.model} ({car.year})
                  </strong>
                  <br />
                  €{car.price_per_hour}/hr
                  <br />
                  <br />
                  <button
                    onClick={() =>
                      navigate(`/car/${car.id}`, {
                        state: { carPricing: car },
                      })
                    }
                    style={{
                      background: "#605fc9",
                      color: "white",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Select Car
                  </button>
                </div>
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </div>
  );
};

export default CarMapPage;