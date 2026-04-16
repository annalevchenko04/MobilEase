import React, { useEffect, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import API_URL from "../config";

const BusSuccess = () => {
  const navigate = useNavigate();
  const [token] = useContext(UserContext);
  const [createdBookings, setCreatedBookings] = useState([]);

useEffect(() => {
  if (!token) return; // ✅ wait for token

  const stored = sessionStorage.getItem("busBookingData");
  if (!stored) return;

  let data;
  try {
    data = JSON.parse(stored);
  } catch (e) {
    console.error("Invalid session data");
    return;
  }

  if (!data.seats || data.seats.length === 0) {
    console.error("No seats found in booking data");
    return;
  }

  const validSeats = data.seats.filter(
    s => Number.isInteger(s) && s > 0
  );

  if (validSeats.length === 0) {
    console.error("No valid seats to book");
    return;
  }

  const createBookings = async () => {
    const results = [];
    let successCount = 0;

    console.log("Booking data:", data);
    console.log("Seats being booked:", validSeats);

    for (const seat of validSeats) {
      try {
        const res = await fetch(`${API_URL}/events/${data.event_id}/book`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ seat_number: seat }),
        });

        if (!res.ok) {
          console.error(`❌ Failed to book seat ${seat}`);
          continue;
        }

        const booking = await res.json();

        if (!booking?.seat_number) {
          console.error("❌ Invalid booking response:", booking);
          continue;
        }

        console.log(`✅ Seat ${seat} booked`);
        results.push(booking);
        successCount++;

      } catch (err) {
        console.error("❌ Booking error:", err);
      }
    }

    setCreatedBookings(results);

    // ✅ Only clear session if at least one success
    if (successCount > 0) {
      sessionStorage.removeItem("busBookingData");
    } else {
      console.warn("⚠️ No bookings succeeded — keeping session data");
    }
  };

  createBookings();

}, [token]); // ✅ ONLY token dependency
  return (
    <div className="box" style={{ border: "3px solid #605fc9", textAlign: "center" }}>
      <h1 className="title is-2">Bus Ticket Purchased!</h1>

      {createdBookings.length > 0 && (
        <>
          <p>Your seats:</p>
          <p style={{ fontWeight: "bold" }}>
            {createdBookings.map(b => b.seat_number).join(", ")}
          </p>

          <button
            className="button is-primary mt-4"
            onClick={() => navigate("/profile")}
          >
            View Ticket in Profile
          </button>
        </>
      )}
    </div>
  );
};

export default BusSuccess;