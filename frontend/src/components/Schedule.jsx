import React, { useState, useEffect, useContext } from 'react';
import { format, startOfWeek, addDays, subWeeks, addWeeks, isSameDay, isToday } from 'date-fns';
import EventModal from './EventModal';
import ErrorMessage from "./ErrorMessage";
import { UserContext } from "../context/UserContext";
import AdminBookings from "./AdminBookings";
import SeatSelectionModal from "./SeatSelectionModal";
import QRModal from "./QRModal";
import { useLocation } from "react-router-dom";

import API_URL from "../config";
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
  const [seatModalOpen, setSeatModalOpen] = useState(false);
const [selectedEventForSeats, setSelectedEventForSeats] = useState(null);
const [ticketBooking, setTicketBooking] = useState(null);
const [ticketModalOpen, setTicketModalOpen] = useState(false);
const [eventBookings, setEventBookings] = useState([]);
const location = useLocation();
const eventNameFilter = location.state?.eventName || null;

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

const fetchEventBookings = async (eventId) => {
  const response = await fetch(`${API_URL}/events/${eventId}/bookings`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error("Failed to fetch event bookings");
    return [];
  }

  return await response.json();
};
const openSeatModal = async (event) => {
  const bookingsForEvent = await fetchEventBookings(event.id);
  setEventBookings(bookingsForEvent);
  setSelectedEventForSeats(event);
  setSeatModalOpen(true);
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

  const startPayment = async (event, data) => {
  try {
    const price = data.totalPrice;

    sessionStorage.setItem("busBookingData", JSON.stringify({
      event_id: event.id,
      seats: data.seats,
      isYoung: data.isYoung,
      isSenior: data.isSenior
    }));

    const res = await fetch(`${API_URL}/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: price,
        type: "bus"   // <-- IMPORTANT
      })
    });


    const session = await res.json();

    const stripe = window.Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

    await stripe.redirectToCheckout({ sessionId: session.id });

  } catch (err) {
    console.error("Payment error:", err);
  }
};

  const hideTooltip = () => {
    setTooltip({ visible: false, event: null, position: { x: 0, y: 0 } });
  };
/**
 * MobilEase - Fuzzy Logic Seat Assignment
 *
 * Proper fuzzy logic implementation using:
 * - Linguistic variables with membership functions
 * - Mamdani-style fuzzy inference
 * - Centroid defuzzification
 *
 * Linguistic input variables:
 *   1. occupancyRate     (0.0 - 1.0)  → LOW, MEDIUM, HIGH
 *   2. seatPosition      (0.0 - 1.0)  → FRONT, MIDDLE, REAR  (normalised seat index)
 *   3. neighbourPressure (0.0 - 1.0)  → LOW, MEDIUM, HIGH    (how many neighbours are taken)
 *   4. seatType          (0.0 - 1.0)  → WINDOW=1.0, AISLE=0.5, MIDDLE=0.0
 *
 * Output variable:
 *   suitability (0.0 - 1.0) → POOR, FAIR, GOOD, EXCELLENT
 */

// ─────────────────────────────────────────────
// 1. MEMBERSHIP FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Triangular membership function
 * Returns degree of membership for value x in triangle (a, b, c)
 * where b is the peak (degree = 1.0)
 */
function trimf(x, a, b, c) {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x < b) return (x - a) / (b - a);
  return (c - x) / (c - b);
}

/**
 * Trapezoidal membership function
 * Returns degree of membership for value x in trapezoid (a, b, c, d)
 * where b-c is the flat top (degree = 1.0)
 */
function trapmf(x, a, b, c, d) {
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x < b) return (x - a) / (b - a);
  return (d - x) / (d - c);
}

// ─────────────────────────────────────────────
// 2. FUZZIFICATION
// Converts crisp inputs into degrees of membership
// ─────────────────────────────────────────────

function fuzzifyOccupancy(rate) {
  return {
    low:    trapmf(rate, 0.0, 0.0, 0.25, 0.5),
    medium: trimf(rate,  0.25, 0.5, 0.75),
    high:   trapmf(rate, 0.5, 0.75, 1.0, 1.0),
  };
}

function fuzzifyPosition(pos) {
  // pos = 0.0 (front) → 1.0 (rear)
  return {
    front:  trapmf(pos, 0.0,  0.0,  0.20, 0.35),
    middle: trimf(pos,  0.30, 0.50, 0.70),
    rear:   trapmf(pos, 0.65, 0.80, 1.0,  1.0),
  };
}

function fuzzifyNeighbourPressure(pressure) {
  // 0.0 = both neighbours free, 0.5 = one taken, 1.0 = both taken
  return {
    low:    trapmf(pressure, 0.0, 0.0, 0.1, 0.4),
    medium: trimf(pressure,  0.3, 0.5, 0.7),
    high:   trapmf(pressure, 0.6, 0.9, 1.0, 1.0),
  };
}

function fuzzifySeatType(type) {
  // type is already a crisp value: 1.0=window, 0.5=aisle, 0.0=middle
  return {
    window:  trapmf(type, 0.7, 0.9, 1.0, 1.0),
    aisle:   trimf(type,  0.2, 0.5, 0.8),
    middle:  trapmf(type, 0.0, 0.0, 0.1, 0.3),
  };
}

// ─────────────────────────────────────────────
// 3. FUZZY RULE BASE
// 18 rules mapping input combinations → output suitability
// Each rule fires at the MIN of its antecedent memberships (Mamdani AND)
// ─────────────────────────────────────────────

function applyRules(occ, pos, nbr, stype) {
  const rules = [
    // ── Seat type rules (fire on seat type alone, position-independent) ──
    // Window seat is always a strong baseline
    [stype.window,                                                  "good"],
    // Aisle is decent
    [stype.aisle,                                                   "fair"],

    // ── Neighbour pressure modifiers ──
    // Window + empty neighbours → best possible
    [Math.min(stype.window, nbr.low),                              "excellent"],
    [Math.min(stype.window, nbr.medium),                           "good"],
    [Math.min(stype.window, nbr.high),                             "fair"],

    [Math.min(stype.aisle, nbr.low),                               "good"],
    [Math.min(stype.aisle, nbr.medium),                            "fair"],
    [Math.min(stype.aisle, nbr.high),                              "poor"],

    // ── Position rules ──
    // Middle of bus with empty neighbours → excellent
    [Math.min(pos.middle, nbr.low),                                "excellent"],
    // Middle of bus baseline (even with some neighbours)
    [pos.middle,                                                    "good"],
    // Front row is less desirable regardless of occupancy
    [pos.front,                                                     "poor"],
    [Math.min(pos.front,  occ.high),                               "poor"],
    // Rear row is slightly worse
    [pos.rear,                                                      "fair"],
    [Math.min(pos.rear,   occ.high),                               "poor"],

    // ── Combined occupancy rules ──
    [Math.min(occ.low,    nbr.low,    pos.middle, stype.window),   "excellent"],
    [Math.min(occ.high,   nbr.high),                               "poor"],
    [Math.min(occ.medium, stype.window, pos.middle),               "excellent"],
    [Math.min(occ.high,   stype.window, nbr.low),                  "good"],
  ];

  // Aggregate: for each output set, keep the MAX firing strength (Mamdani)
  const aggregated = { poor: 0, fair: 0, good: 0, excellent: 0 };
  for (const [strength, output] of rules) {
    aggregated[output] = Math.max(aggregated[output], strength);
  }
  return aggregated;
}

// ─────────────────────────────────────────────
// 4. DEFUZZIFICATION
// Centroid method: weighted average over output universe [0, 1]
// poor=0.15, fair=0.4, good=0.65, excellent=0.9
// ─────────────────────────────────────────────

function defuzzify(aggregated) {
  const outputSets = [
    { name: "poor",      center: 0.15, agg: aggregated.poor },
    { name: "fair",      center: 0.40, agg: aggregated.fair },
    { name: "good",      center: 0.65, agg: aggregated.good },
    { name: "excellent", center: 0.90, agg: aggregated.excellent },
  ];

  let numerator = 0;
  let denominator = 0;

  for (const set of outputSets) {
    numerator   += set.center * set.agg;
    denominator += set.agg;
  }

  if (denominator === 0) return 0.5; // fallback: neutral score
  return numerator / denominator;
}

// ─────────────────────────────────────────────
// 5. CRISP INPUT PREPARATION
// Converts raw seat data into normalised [0,1] values
// ─────────────────────────────────────────────

function computeSeatInputs(seat, totalSeats, takenSeats) {
  const SEATS_PER_ROW = 4;

  // Seat type: window=1.0, aisle=0.5, middle=0.0
  const posInRow = seat % SEATS_PER_ROW;
  let seatType;
  if (posInRow === 1 || posInRow === 0) seatType = 1.0; // window
  else seatType = 0.5;                                  // aisle (4-seat layout has no true middle)

  // Seat position: normalised front→rear [0, 1]
  const seatPosition = (seat - 1) / (totalSeats - 1);

  // Neighbour pressure: 0.0=both free, 0.5=one taken, 1.0=both taken
  const leftTaken  = takenSeats.includes(seat - 1) ? 1 : 0;
  const rightTaken = takenSeats.includes(seat + 1) ? 1 : 0;
  const neighbourPressure = (leftTaken + rightTaken) / 2;

  // Occupancy rate: how full is the bus overall
  const occupancyRate = takenSeats.length / totalSeats;

  return { seatType, seatPosition, neighbourPressure, occupancyRate };
}

// ─────────────────────────────────────────────
// 6. MAIN FUNCTION — drop-in replacement
// ─────────────────────────────────────────────

/**
 * Assigns the best available seat using fuzzy logic inference.
 *
 * @param {Object} event     - Schedule object with max_participants
 * @param {Array}  bookings  - Array of booking objects with seat_number
 * @returns {number|null}    - Best seat number, or null if bus is full
 */
function fuzzyAssignSeat(event, bookings) {
  const totalSeats = event.max_participants;
  const takenSeats = bookings.map(b => b.seat_number);

  let bestSeat  = null;
  let bestScore = -Infinity;

  for (let seat = 1; seat <= totalSeats; seat++) {
    if (takenSeats.includes(seat)) continue;

    // Step 1: Prepare crisp inputs
    const { seatType, seatPosition, neighbourPressure, occupancyRate } =
      computeSeatInputs(seat, totalSeats, takenSeats);

    // Step 2: Fuzzify
    const occ   = fuzzifyOccupancy(occupancyRate);
    const pos   = fuzzifyPosition(seatPosition);
    const nbr   = fuzzifyNeighbourPressure(neighbourPressure);
    const stype = fuzzifySeatType(seatType);

    // Step 3: Apply rule base
    const aggregated = applyRules(occ, pos, nbr, stype);

    // Step 4: Defuzzify → crisp suitability score [0, 1]
    const suitability = defuzzify(aggregated);

    if (suitability > bestScore) {
      bestScore = suitability;
      bestSeat  = seat;
    }
  }

  return bestSeat;
}

// function fuzzyAssignSeat(event, bookings) {
//   const totalSeats = event.max_participants;
//   const taken = bookings.map(b => b.seat_number);
//
//   let bestSeat = null;
//   let bestScore = -Infinity;
//
//   for (let seat = 1; seat <= totalSeats; seat++) {
//     if (taken.includes(seat)) continue;
//
//     let score = 0;
//
//     // Window seats
//     const isWindow = (seat % 4 === 1) || (seat % 4 === 0);
//     if (isWindow) score += 5;
//
//     // Aisle seats
//     const isAisle = (seat % 4 === 2) || (seat % 4 === 3);
//     if (isAisle) score += 2;
//
//     // Avoid front row
//     if (seat <= 4) score -= 3;
//
//     // Avoid last row
//     if (seat > totalSeats - 4) score -= 2;
//
//     // Neighbor logic
//     const left = seat - 1;
//     const right = seat + 1;
//
//     if (!taken.includes(left) && !taken.includes(right)) score += 4;
//     if (taken.includes(left) && taken.includes(right)) score -= 6;
//
//     // Prefer middle rows
//     const row = Math.ceil(seat / 4);
//     const midRow = Math.ceil((totalSeats / 4) / 2);
//     score -= Math.abs(row - midRow);
//
//     // Pick best
//     if (score > bestScore) {
//       bestScore = score;
//       bestSeat = seat;
//     }
//   }
//
//   return bestSeat;
// }


const bookSeat = async (event, seatNumber) => {
  const response = await fetch(`${API_URL}/events/${event.id}/book`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      seat_number: seatNumber
    }),
  });

  if (!response.ok) throw new Error("Failed to book event");

  const bookingData = await response.json();

  setSeatModalOpen(false);
  setTicketBooking(bookingData);
  setTicketModalOpen(true);

  fetchEvents();
  fetchBookings();
};

// Apply event name filter if coming from PostDetail
const filteredEvents = eventNameFilter
  ? events.filter(e => e.name === eventNameFilter)
  : events;


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
        <h2 className="title is-2">Routes' Schedule</h2>
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
                {userRole === "admin" && (
                <div className="has-text-centered">
                  <button className="button is-primary mt-3" onClick={() => handleAddEvent(day)}>
                    New Event
                  </button>
                </div> )}
                <br/>
                <div className="day-events">
                  {filteredEvents .filter((eventItem) => {
                        // Combine date + time into a single Date object
                        const eventDateTime = new Date(
                          `${eventItem.date}T${eventItem.time || "00:00"}`
                        );

                        const now = new Date();

                        // Admin sees ALL events (past + today + future)
                        if (userRole === "admin") return true;

                        // Users see only today or future events
                        return eventDateTime >= now;
                      })
                      .filter((eventItem) =>
                        eventItem.event_type === "public" ||
                        (eventItem.event_type === "private" && eventItem.creator_id === userId)
                      )
                      .filter((eventItem) => isSameDay(new Date(eventItem.date), day))
                      .map((eventItem) => {
                        const booking = bookings.find(
                          (b) => b.event_id === eventItem.id && b.user_id === userId
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
                                        openSeatModal(eventItem);
                                      }}
                                    >
                                      Book Ticket(s)
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
              <p>{`Duration: ${tooltip.event.duration} h`}</p>
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



    {seatModalOpen && (
      <SeatSelectionModal
        event={selectedEventForSeats}
        bookings={eventBookings}
        onSelectSeat={(data) => startPayment(selectedEventForSeats, data)}
        onSkip={(data) => {
          const seat = fuzzyAssignSeat(selectedEventForSeats, eventBookings);

          const basePrice = selectedEventForSeats.post.price;
          const discountedPrice = (data.isYoung || data.isSenior)
            ? basePrice * 0.5
            : basePrice;

          startPayment(selectedEventForSeats, {
            seats: [seat],
            isYoung: data.isYoung,
            isSenior: data.isSenior,
            totalPrice: discountedPrice
          });
        }}
        onClose={() => setSeatModalOpen(false)}
      />
    )}


        {ticketModalOpen && (
  <QRModal
    booking={ticketBooking}
    onClose={() => setTicketModalOpen(false)}
  />
)}
      </div>
  );
};

export default Schedule;
