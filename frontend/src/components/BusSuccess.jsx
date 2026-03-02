import React, { useEffect, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import API_URL from "../config";

const BusSuccess = () => {
  const navigate = useNavigate();
  const [token] = useContext(UserContext);
  const [createdBookings, setCreatedBookings] = useState([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("busBookingData");
    if (!stored) return;

    const data = JSON.parse(stored);

    const createBookings = async () => {
      const results = [];

      for (const seat of data.seats) {
        const res = await fetch(`${API_URL}/events/${data.event_id}/book`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            seat_number: seat
          }),
        });

        const booking = await res.json();
        results.push(booking);
      }

      setCreatedBookings(results);
      sessionStorage.removeItem("busBookingData");
    };

    createBookings();
  }, [token]);

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