import React, { useState, useEffect, useContext } from 'react';
import { format, startOfWeek, addDays, subWeeks, addWeeks, isSameDay, isToday } from 'date-fns';
import EventModal from './EventModal';
import ErrorMessage from "./ErrorMessage";
import { UserContext } from "../context/UserContext";
import AdminBookings from "./AdminBookings";

const API_URL = 'https://esp548backend-ejbafshcc5a8eea3.northeurope-01.azurewebsites.net';
const Schedule = () => {
  const [token, userRole, username, userId,] = useContext(UserContext);
  const [events, setEvents] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weekDays, setWeekDays] = useState([]);
  const [activeModal, setActiveModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [tooltip, setTooltip] = useState({ visible: false, event: null, position: { x: 0, y: 0 } });
  const [loading, setLoading] = useState(false);
  const [showBookings, setShowBookings] = useState(false);


  useEffect(() => {
    const days = [...Array(7)].map((_, i) => addDays(weekStart, i));
    setWeekDays(days);
    fetchEvents();
    fetchBookings();
  }, [weekStart]);

const fetchBookings = async () => {
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch bookings");
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      setErrorMessage("Error fetching bookings. Please try again.");
    }
  };


  const fetchEvents = async () => {
    const requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };
    try {
      const userResponse = await fetch(`${API_URL}/verify-token/${token}`, requestOptions);
      if (!userResponse.ok) throw new Error("Failed to fetch user info");
      const userData = await userResponse.json();
      setCurrentUser(userData);
      console.log("Current User:", currentUser);


      const response = await fetch(`${API_URL}/events`, requestOptions);
      if (!response.ok) throw new Error("Failed to fetch events");
      const data = await response.json();
      setEvents(data);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Error loading events. Please try again.");
    }
  };

  const handleAddEvent = (date) => {
    const dateOnly = format(date, 'yyyy-MM-dd');
    setSelectedDate(dateOnly);
    setCurrentEvent(null); // Clear current event for a new event
    setActiveModal(true);
  };

  const handleUpdateEvent = (event) => {
    setSelectedDate(event.date);
    setCurrentEvent(event); // Set current event for update
    setActiveModal(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      const requestOptions = {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      try {
        const response = await fetch(`${API_URL}/event/${eventId}`, requestOptions);
        if (!response.ok) throw new Error("Failed to delete event");
        fetchEvents();
        setErrorMessage("");
      } catch (error) {
        setErrorMessage("Error deleting event. Please try again.");
      }
    }
  };

  const handleModalClose = () => {
    setActiveModal(false);
    fetchEvents(); // Refresh events when modal closes
    setCurrentEvent(null); // Reset current event
  };

  // Functions to show/hide tooltip
  const showTooltip = (event, e) => {
    setTooltip({
      visible: true,
      event,
      position: { x: e.pageX, y: e.pageY } // Get mouse position
    });
  };

  const hideTooltip = () => {
    setTooltip({ visible: false, event: null, position: { x: 0, y: 0 } });
  };

  const handleAssignToEvent = async (event) => {
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ event_id: event.id }), // Send event ID in the body
  };

  try {
    const response = await fetch(`${API_URL}/events/${event.id}/book`, requestOptions);
    if (!response.ok) throw new Error("Failed to book event");

    const bookingData = await response.json();
    alert(`Successfully assigned to event: ${event.name}`);
    fetchEvents(); // Refresh events to see updated bookings
    fetchBookings();
  } catch (error) {
    setErrorMessage("Limit of participants is reached. No places.");
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

    // Remove the cancelled booking from state without needing to reload
    setBookings((prevBookings) => prevBookings.filter((b) => b.id !== bookingId));
  } catch (error) {
    setErrorMessage("Failed to cancel the booking. Please try again.");
  } finally {
    setLoading(false);
  }
};


  return (
      <div>
        <h2 className="title is-2">Events' Schedule</h2>
        <br/>
        <br/>
        <div className="columns is-centered">
          <button className="button is-primary is-outlined is-normal"
                  style={{
                        borderWidth: '3px', // Increase border thickness
                    margin: '10px',
                  }}
                  onClick={() => setWeekStart(subWeeks(weekStart, 1))}>← Previous Week
          </button>
          <span className="title is-5">{format(weekStart, 'MMMM yyyy')}</span>
          <button
                    className="button is-primary is-outlined is-normal"
                    style={{
                        borderWidth: '3px', // Increase border thickness
                       margin: '10px',
                    }}
                    onClick={() => setWeekStart(addWeeks(weekStart, 1))}>Next Week →</button>
        </div>
        <br/>
        <br/>
        <ErrorMessage message={errorMessage}/>
        <br/>
        <div className="columns is-multiline">
          {weekDays.map((day) => (
              <div key={day} className={`column box day-card ${isToday(day) ? 'current-day' : ''}`}>
                <div className="day">
                  <span className="day-name">{format(day, 'EEEE')}</span>
                  <span className="day-date">{format(day, 'MMM d')}</span>
                </div>
                <div className="has-text-centered">
                  <button className="button is-primary mt-3" onClick={() => handleAddEvent(day)}>
                    New Event
                  </button>
                </div>
                <br/>
                <div className="day-events">
                  {events
                      .filter((eventItem) => isSameDay(new Date(eventItem.date), day))
                      .filter((eventItem) => eventItem.event_type === 'public' || (eventItem.event_type === 'private' && eventItem.creator_id === userId))
                      .map((eventItem) => {
                        const booking = bookings.find(
                            (b) => b.event_id === eventItem.id && b.user_id === userId // Renamed 'event' to 'eventItem'
                        );

                        return (
                            <div
                                key={eventItem.id}
                                className={`event-card ${eventItem.event_type === 'public' ? 'public-event' : 'private-event'}`}
                                onClick={() => eventItem.creator_id === userId && handleUpdateEvent(eventItem)}
                                onMouseEnter={(e) => showTooltip(eventItem, e)} // Show tooltip on hover
                                onMouseLeave={hideTooltip} // Hide tooltip when not hovering
                            >
                              <div className="event-name">{eventItem.name}</div>
                              <div className="event-time">{eventItem.time}</div>

                              {/* Assign to Event button */}
                              {eventItem.event_type === 'public' && userRole !== 'admin' && !booking && (
                                  <button
                                      className="button is-info mt-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAssignToEvent(eventItem);
                                      }}
                                  >
                                    Assign to Event
                                  </button>
                              )}

                              {/* Cancel Booking button */}
                              {eventItem.event_type === 'public' && booking && (
                                  <div>
                                    <button
                                        className="button is-danger mt-2"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCancelBooking(booking.id); // Cancel booking handler
                                        }}
                                    >
                                      Cancel Booking
                                    </button>
                                  </div>
                              )}
                            </div>
                        );
                      })}
                </div>

              </div>
          ))}
        </div>
        <br/>
        <br/>
        {tooltip.visible && (
            <div className="tooltip" style={{left: tooltip.position.x, top: tooltip.position.y}}>
              <h4>{tooltip.event.name}</h4>
              <p>{tooltip.event.description}</p>
              <p>{`Date: ${tooltip.event.date}`}</p>
              <p>{`Time: ${tooltip.event.time}`}</p>
              <p>{`Duration: ${tooltip.event.duration} min`}</p>
              <p>{`Participants: ${tooltip.event.max_participants}`}</p>
              <p>{`Address: ${tooltip.event.room_number}`}</p>
              <p><strong>Type:</strong> {tooltip.event.event_type}</p> {/* New line for event type */}
            </div>
        )}
        {activeModal && (
            <EventModal
                event={currentEvent}
                selectedDate={selectedDate}
                handleClose={handleModalClose}
                handleDeleteEvent={handleDeleteEvent}
            />
        )}

{userRole === "admin" && (
  <div>
    <button
      className="button is-warning mt-3"
      onClick={() => setShowBookings((prev) => !prev)}
    >
      {showBookings ? "Hide Bookings" : "Show Event Bookings"}
    </button>

    {showBookings && <AdminBookings />}
  </div>
)}

      </div>
  );
};

export default Schedule;
