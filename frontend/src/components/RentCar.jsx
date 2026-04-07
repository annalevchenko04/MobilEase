import React, { useContext, useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import API_URL from "../config";
import LocationPicker from "../components/LocationPicker";

const RentCar = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const [token] = useContext(UserContext);

  const [locations, setLocations] = useState({});
  const [distanceKm, setDistanceKm] = useState(0);
  const [tripMinutes, setTripMinutes] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [car, setCar] = useState(null);

  const [rentalType, setRentalType] = useState("hourly");
  const [rentalDays, setRentalDays] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [manualKm, setManualKm] = useState(0);

  const carPricing = state?.carPricing || null;
  const MIN_FEE = 0.30;

  const getAddress = async (lat, lng) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  };

  useEffect(() => {
    fetch(`${API_URL}/cars/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setCar(data));
  }, [id, token]);

  async function calculateDistanceKm(pickup, dropoff) {
    const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
      method: "POST",
      headers: {
        "Authorization": process.env.REACT_APP_ORS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates: [
          [pickup.lng, pickup.lat],
          [dropoff.lng, dropoff.lat]
        ]
      }),
    });
    const data = await res.json();
    if (!data.routes || data.routes.length === 0) return { km: 0, minutes: 0 };
    const summary = data.routes[0].summary;
    return { km: summary.distance / 1000, minutes: summary.duration / 60 };
  }

  const handleLocationSelect = async ({ pickup, dropoff }) => {
    setLocations({ pickup, dropoff });
    if (pickup && dropoff) {
      const { km, minutes } = await calculateDistanceKm(pickup, dropoff);
      setDistanceKm(km);
      if (rentalType === "hourly") setTripMinutes(minutes);
    }
  };

  // Cost calculation
  useEffect(() => {
    if (!carPricing) return;

    if (rentalType === "hourly") {
      const hoursFromMinutes = tripMinutes / 60;
      const timeCost = hoursFromMinutes * carPricing.price_per_hour;
      const distanceCost = distanceKm * carPricing.price_per_km;
      setTotalCost((timeCost + distanceCost + MIN_FEE).toFixed(2));

    } else if (rentalType === "daily") {
      const dayCost = rentalDays * carPricing.price_per_day;
      const distanceCost = manualKm * carPricing.price_per_km;
      setTotalCost((dayCost + distanceCost + MIN_FEE).toFixed(2));

    } else if (rentalType === "custom" && startDateTime && endDateTime) {
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      const hours = (end - start) / 3600000;

      if (hours <= 0) { setTotalCost(MIN_FEE.toFixed(2)); return; }

      let cost;
      if (hours < 24) {
        cost = hours * carPricing.price_per_hour + manualKm * carPricing.price_per_km;
      } else {
        const days = Math.ceil(hours / 24);
        cost = days * carPricing.price_per_day + manualKm * carPricing.price_per_km;
      }
      setTotalCost((cost + MIN_FEE).toFixed(2));
    }
  }, [tripMinutes, distanceKm, carPricing, rentalType, rentalDays, startDateTime, endDateTime, manualKm]);

  const handleConfirmBooking = async () => {
    try {
      if (!locations.dropoff) return;

      let start, end;

      if (rentalType === "hourly") {
        start = new Date();
        end = new Date(start.getTime() + tripMinutes * 60000);
      } else if (rentalType === "daily") {
        start = new Date(`${startDate}T${startTime || "09:00"}`);
        end = new Date(start);
        end.setDate(end.getDate() + rentalDays);
      } else {
        start = new Date(startDateTime);
        end = new Date(endDateTime);
      }

      const dropoffAddress = await getAddress(locations.dropoff.lat, locations.dropoff.lng);

      const rentalRes = await fetch(`${API_URL}/rentals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          car_id: id,
          start_datetime: start.toISOString(),
          end_datetime: end.toISOString(),
          pickup_location: car?.current_location || "Car location",
          pickup_lat: car?.current_lat,
          pickup_lng: car?.current_lng,
          dropoff_location: dropoffAddress,
          dropoff_lat: locations.dropoff?.lat,
          dropoff_lng: locations.dropoff?.lng,
          kilometers_used: rentalType === "hourly" ? distanceKm : manualKm,
        }),
      });

      if (!rentalRes.ok) { console.error("Rental creation failed"); return; }

      const rental = await rentalRes.json();
      localStorage.setItem("rental_id", rental.id);

      const stripeRes = await fetch(`${API_URL}/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalCost, type: "rent" }),
      });

      const stripeData = await stripeRes.json();
      const stripe = window.Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
      await stripe.redirectToCheckout({ sessionId: stripeData.id });

    } catch (error) {
      console.error("Stripe error:", error);
    }
  };

  return (
    <div className="box" style={{ border: "3px solid #605fc9" }}>
      <h1 className="title is-3">Confirm Your Booking</h1>

      {/* Rental type selector */}
      <div style={{ marginBottom: 24 }}>
        <label className="label">Rental Type</label>
        <div style={{ display: "flex", gap: 12 }}>
          {["hourly", "daily", "custom"].map(type => (
            <div
              key={type}
              onClick={() => setRentalType(type)}
              style={{
                flex: 1, padding: "16px", borderRadius: 12, cursor: "pointer",
                border: `2px solid ${rentalType === type ? "#605fc9" : "#dee2e6"}`,
                background: rentalType === type ? "#f3f3ff" : "#fff",
                textAlign: "center", transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>
                {type === "hourly" ? "⏱" : type === "daily" ? "📅" : "✏️"}
              </div>
              <div style={{ fontWeight: 700, color: rentalType === type ? "#605fc9" : "#495057" }}>
                {type === "hourly" ? "Hourly" : type === "daily" ? "Daily" : "Custom"}
              </div>
              <div style={{ fontSize: 12, color: "#868e96", marginTop: 4 }}>
                {type === "hourly"
                  ? `€${carPricing?.price_per_hour}/hr + €${carPricing?.price_per_km}/km`
                  : type === "daily"
                  ? `€${carPricing?.price_per_day}/day + €${carPricing?.price_per_km}/km`
                  : "Pick exact dates & times"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily options */}
      {rentalType === "daily" && (
        <div style={{ marginBottom: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              className="input"
              min={new Date().toISOString().split("T")[0]}
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Start Time</label>
            <input
              type="time"
              className="input"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Number of Days</label>
            <input
              type="number"
              className="input"
              min={1}
              max={30}
              value={rentalDays}
              onChange={e => setRentalDays(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <div>
            <label className="label">Estimated Distance (km)</label>
            <input
              type="number"
              className="input"
              min={0}
              value={manualKm}
              onChange={e => setManualKm(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      )}

      {/* Custom options */}
      {rentalType === "custom" && (
        <div style={{ marginBottom: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label className="label">Start Date & Time</label>
            <input
              type="datetime-local"
              className="input"
              min={new Date().toISOString().slice(0, 16)}
              value={startDateTime}
              onChange={e => setStartDateTime(e.target.value)}
            />
          </div>
          <div>
            <label className="label">End Date & Time</label>
            <input
              type="datetime-local"
              className="input"
              min={startDateTime || new Date().toISOString().slice(0, 16)}
              value={endDateTime}
              onChange={e => setEndDateTime(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Estimated Distance (km)</label>
            <input
              type="number"
              className="input"
              min={0}
              value={manualKm}
              onChange={e => setManualKm(parseFloat(e.target.value) || 0)}
            />
          </div>
          {startDateTime && endDateTime && (
            <div style={{
              gridColumn: "1 / -1", padding: "10px 14px", borderRadius: 8,
              background: "#f3f3ff", border: "1px solid #605fc940",
              fontSize: 13, color: "#605fc9",
            }}>
              ⏱ Duration: {((new Date(endDateTime) - new Date(startDateTime)) / 3600000).toFixed(1)} hours
              {" — "}
              {((new Date(endDateTime) - new Date(startDateTime)) / 3600000) < 24
                ? `Billed hourly @ €${carPricing?.price_per_hour}/hr`
                : `Billed daily @ €${carPricing?.price_per_day}/day × ${Math.ceil((new Date(endDateTime) - new Date(startDateTime)) / 86400000)} days`
              }
              {manualKm > 0 && ` + €${carPricing?.price_per_km}/km × ${manualKm} km`}
            </div>
          )}
        </div>
      )}

      <LocationPicker car={car} onSelect={handleLocationSelect} />

      {/* Summary */}
      <div style={{
        marginTop: 20, padding: "16px", borderRadius: 12,
        background: "#f9f9ff", border: "2px solid #605fc9",
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#605fc9", fontFamily: "monospace", marginBottom: 10 }}>
          BOOKING SUMMARY
        </div>

        {rentalType === "hourly" && (
          <>
            <p><strong>Duration:</strong> {tripMinutes.toFixed(1)} min ({(tripMinutes / 60).toFixed(2)} hrs)</p>
            <p><strong>Distance:</strong> {distanceKm.toFixed(2)} km</p>
          </>
        )}

        {rentalType === "daily" && (
          <>
            <p><strong>Start:</strong> {startDate} {startTime}</p>
            <p><strong>Duration:</strong> {rentalDays} day{rentalDays > 1 ? "s" : ""}</p>
            {startDate && (
              <p><strong>End:</strong> {(() => {
                const end = new Date(`${startDate}T${startTime || "09:00"}`);
                end.setDate(end.getDate() + rentalDays);
                return end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
              })()}</p>
            )}
            <p><strong>Estimated Distance:</strong> {manualKm} km</p>
          </>
        )}

        {rentalType === "custom" && startDateTime && endDateTime && (
          <>
            <p><strong>Start:</strong> {new Date(startDateTime).toLocaleString("en-GB")}</p>
            <p><strong>End:</strong> {new Date(endDateTime).toLocaleString("en-GB")}</p>
            <p><strong>Duration:</strong> {((new Date(endDateTime) - new Date(startDateTime)) / 3600000).toFixed(1)} hours</p>
            <p><strong>Estimated Distance:</strong> {manualKm} km</p>
          </>
        )}

        <p style={{ fontSize: 18, fontWeight: 800, color: "#605fc9", marginTop: 8 }}>
          Total: €{totalCost}
        </p>
      </div>

      <button
        className="button is-primary is-medium"
        style={{
          backgroundColor: "#605fc9",
          borderColor: "#605fc9",
          color: "white",
          width: "100%",
          borderRadius: "10px",
          marginTop: "20px"
        }}
        onClick={handleConfirmBooking}
        disabled={
          (rentalType === "daily" && !startDate) ||
          (rentalType === "custom" && (!startDateTime || !endDateTime))
        }
      >
        Confirm & Pay
      </button>
    </div>
  );
};

export default RentCar;