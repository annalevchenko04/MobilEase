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

  const carPricing = state?.carPricing || null;
  const MIN_FEE = 0.30;

  // ORS distance + duration
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

    if (!data.routes || data.routes.length === 0) {
      console.error("ORS returned no route:", data);
      return { km: 0, minutes: 0 };
    }

    const summary = data.routes[0].summary;
    const km = summary.distance / 1000;
    const minutes = summary.duration / 60;

    return { km, minutes };
  }

  const handleLocationSelect = async ({ pickup, dropoff }) => {
    setLocations({ pickup, dropoff });

    if (pickup && dropoff) {
      const { km, minutes } = await calculateDistanceKm(pickup, dropoff);
      setDistanceKm(km);
      setTripMinutes(minutes);
    }
  };

  // Real price calculation
  useEffect(() => {
    if (!carPricing) return;

    const hoursFromMinutes = tripMinutes / 60;
    const timeCost = hoursFromMinutes * carPricing.price_per_hour;
    const distanceCost = distanceKm * carPricing.price_per_km;

    const total = timeCost + distanceCost + MIN_FEE;
    setTotalCost(total.toFixed(2));
  }, [tripMinutes, distanceKm, carPricing]);

  const handleConfirmBooking = async () => {
  try {
    if (!locations.pickup || !locations.dropoff) {
      console.error("Pickup or dropoff missing");
      return;
    }

    // Compute correct start/end times
    const start = new Date();
    const end = new Date(start.getTime() + tripMinutes * 60000);

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

        pickup_location: "Selected on map",
        dropoff_location: "Selected on map",

        pickup_lat: locations.pickup.lat,
        pickup_lng: locations.pickup.lng,
        dropoff_lat: locations.dropoff.lat,
        dropoff_lng: locations.dropoff.lng,

        kilometers_used: distanceKm
      }),
    });

    if (!rentalRes.ok) {
      console.error("Rental creation failed");
      return;
    }

    const rental = await rentalRes.json();
    sessionStorage.setItem("rental_id", rental.id);

    const stripeRes = await fetch(`${API_URL}/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: totalCost,
      type: "rent"   // <-- IMPORTANT
    })
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

      <p><strong>Duration:</strong> {tripMinutes.toFixed(1)} minutes</p>

      <LocationPicker onSelect={handleLocationSelect} />

      <p><strong>Distance:</strong> {distanceKm.toFixed(2)} km</p>

      <p><strong>Total Cost:</strong> €{totalCost}</p>

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
      >
        Confirm & Pay
      </button>
    </div>
  );
};

export default RentCar;