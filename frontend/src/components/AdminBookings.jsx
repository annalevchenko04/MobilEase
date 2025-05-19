import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import UserAvatar from "./UserAvatar";

const API_URL = 'https://k548-esp-2.onrender.com';
const AdminBookings = () => {
  const [token, userRole, username, userId,] = useContext(UserContext);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/events`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch events");
      const data = await response.json();
      setEvents(data);

      // Fetch bookings for each event
      data.forEach((event) => fetchEventBookings(event.id));
    } catch (error) {
      setErrorMessage("Error loading events. Please try again.");
    }
  };

  const fetchEventBookings = async (eventId) => {
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/bookings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch bookings");
      const data = await response.json();

      setBookings((prev) => ({ ...prev, [eventId]: data }));
    } catch (error) {
      setErrorMessage("Error fetching bookings. Please try again.");
    }
  };

  const handleCancelBooking = async (bookingId) => {
  setLoading(true);
  try {
    const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Error cancelling booking");
    }

    alert("Booking is canceled");

    fetchEvents();
  } catch (error) {
    setErrorMessage("Failed to cancel the booking. Please try again.");
  } finally {
    setLoading(false);
  }
};


  return (
  <div>
    <br/>
    <h2 className="title is-2">Manage Bookings</h2>
    {errorMessage && <p className="error">{errorMessage}</p>}

    {/* Add a wrapper for the table with horizontal and vertical scrolling */}
    <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
      <table className="table is-fullwidth is-bordered">
        <thead>
          <tr>
            <th>Event Name</th>
            <th>Date</th>
            <th>Time</th>
            <th>Description</th>
            <th>Participants</th>
            <th>Max</th>
          </tr>
        </thead>
        <tbody>
          {events
            .filter((event) => event.event_type === 'public' && event.creator_id === userId)
            .map((event) => (
              <tr key={event.id}>
                <td>{event.name}</td>
                <td>{event.date}</td>
                <td>{event.time}</td>
                <td>{event.description}</td>
                <td>
                  {bookings[event.id] ? (
                    bookings[event.id].length > 0 ? (
                      <ul>
                        {bookings[event.id].map((booking) => (
                          <li key={booking.id} style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                            <figure className="media-left" style={{ marginRight: "10px" }}>
                              <p className="image is-48x48">
                                <UserAvatar user_id={booking.user_id} />
                              </p>
                            </figure>
                            <span style={{ marginRight: "10px" }}>{booking.user.email}</span>
                            <button
                              className="button is-danger is-small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelBooking(booking.id, event.id); // Cancel booking handler
                              }}
                            >
                              Decline
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "No bookings"
                    )
                  ) : (
                    "Loading..."
                  )}
                </td>

                <td>{event.max_participants}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </div>
);

};

export default AdminBookings;
