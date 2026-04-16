import React, { useState, useEffect, useContext } from 'react';
import { format, startOfWeek, addDays, subWeeks, addWeeks, isSameDay, isToday } from 'date-fns';
import EventModal from './EventModal';
import ErrorMessage from "./ErrorMessage";
import { UserContext } from "../context/UserContext";
import AdminBookings from "./AdminBookings";
import SeatSelectionModal from "./SeatSelectionModal";
import QRModal from "./QRModal";
import BulkEventModal from "./BulkEventModal";
import { useLocation } from "react-router-dom";
import API_URL from "../config";

const Schedule = () => {
  const [token, userRole, username, userId] = useContext(UserContext);
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
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkTemplateDate, setBulkTemplateDate] = useState(null);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState("");
const [cancelModalOpen, setCancelModalOpen] = useState(false);
const [bookingToCancel, setBookingToCancel] = useState(null);
  // ── Filter state ─────────────────────────────────────────
  const [searchRoute, setSearchRoute] = useState("");
  const [filterTime, setFilterTime] = useState("all");
  // ─────────────────────────────────────────────────────────

  const location = useLocation();
  const eventNameFilter = location.state?.eventName || null;

// Change useEffect to separate concerns:
useEffect(() => {
  fetchBookings(); // only on mount
}, []); // <-- empty deps

useEffect(() => {
  const days = [...Array(7)].map((_, i) => addDays(weekStart, i));
  setWeekDays(days);
  fetchEvents(); // only re-runs when week changes
}, [weekStart]);

const confirmCancelBooking = async () => {
  if (!bookingToCancel) return;

  await handleCancelBooking(bookingToCancel);

  setCancelModalOpen(false);
  setBookingToCancel(null);
};
  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!response.ok) { console.error("Failed to fetch event bookings"); return []; }
    return await response.json();
  };

  const openSeatModal = async (event) => {
    const bookingsForEvent = await fetchEventBookings(event.id);
    setEventBookings(bookingsForEvent);
    setSelectedEventForSeats(event);
    setSeatModalOpen(true);
  };

const fetchEvents = async () => {
  const weekEnd = format(addDays(weekStart, 6), 'yyyy-MM-dd');
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  const response = await fetch(
    `${API_URL}/events?start=${weekStartStr}&end=${weekEnd}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await response.json();
  setEvents(data);
};

  const handleAddEvent = (date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
    setCurrentEvent(null);
    setActiveModal(true);
  };

  const handleBulkCreate = (date) => {
    setBulkTemplateDate(format(date, 'yyyy-MM-dd'));
    setBulkModalOpen(true);
  };

  const handleUpdateEvent = (event) => {
    setSelectedDate(event.date);
    setCurrentEvent(event);
    setActiveModal(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const response = await fetch(`${API_URL}/event/${eventId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
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
    fetchEvents();
    setCurrentEvent(null);
  };

  const showTooltip = (event, e) => {
    setTooltip({ visible: true, event, position: { x: e.pageX, y: e.pageY } });
  };

  const hideTooltip = () => {
    setTooltip({ visible: false, event: null, position: { x: 0, y: 0 } });
  };

  const startPayment = async (event, data) => {
    try {
      sessionStorage.setItem("busBookingData", JSON.stringify({
        event_id: event.id, seats: data.seats, isYoung: data.isYoung, isSenior: data.isSenior
      }));
      const res = await fetch(`${API_URL}/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: data.totalPrice, type: "bus" })
      });
      const session = await res.json();
      const stripe = window.Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
      await stripe.redirectToCheckout({ sessionId: session.id });
    } catch (err) {
      console.error("Payment error:", err);
    }
  };

  // ── Fuzzy Logic ──────────────────────────────────────────
  function trimf(x, a, b, c) {
    if (x < a || x > c) return 0;
    if (x === b) return 1;
    if (x < b) return (x - a) / (b - a);
    return (c - x) / (c - b);
  }
  function trapmf(x, a, b, c, d) {
    if (x < a || x > d) return 0;
    if (x >= b && x <= c) return 1;
    if (x < b) return (x - a) / (b - a);
    return (d - x) / (d - c);
  }
  function fuzzifyOccupancy(rate) {
    return { low: trapmf(rate,0.0,0.0,0.25,0.5), medium: trimf(rate,0.25,0.5,0.75), high: trapmf(rate,0.5,0.75,1.0,1.0) };
  }
  function fuzzifyPosition(pos) {
    return { front: trapmf(pos,0.0,0.0,0.20,0.35), middle: trimf(pos,0.30,0.50,0.70), rear: trapmf(pos,0.65,0.80,1.0,1.0) };
  }
  function fuzzifyNeighbourPressure(pressure) {
    return { low: trapmf(pressure,0.0,0.0,0.1,0.4), medium: trimf(pressure,0.3,0.5,0.7), high: trapmf(pressure,0.6,0.9,1.0,1.0) };
  }
  function fuzzifySeatType(type) {
    return { window: trapmf(type,0.7,0.9,1.0,1.0), aisle: trimf(type,0.2,0.5,0.8), middle: trapmf(type,0.0,0.0,0.1,0.3) };
  }
  function applyRules(occ, pos, nbr, stype) {
    const rules = [
      [stype.window,"good"],[stype.aisle,"fair"],
      [Math.min(stype.window,nbr.low),"excellent"],[Math.min(stype.window,nbr.medium),"good"],
      [Math.min(stype.window,nbr.high),"fair"],[Math.min(stype.aisle,nbr.low),"good"],
      [Math.min(stype.aisle,nbr.medium),"fair"],[Math.min(stype.aisle,nbr.high),"poor"],
      [Math.min(pos.middle,nbr.low),"excellent"],[pos.middle,"good"],
      [pos.front,"poor"],[Math.min(pos.front,occ.high),"poor"],
      [pos.rear,"fair"],[Math.min(pos.rear,occ.high),"poor"],
      [Math.min(occ.low,nbr.low,pos.middle,stype.window),"excellent"],
      [Math.min(occ.high,nbr.high),"poor"],
      [Math.min(occ.medium,stype.window,pos.middle),"excellent"],
      [Math.min(occ.high,stype.window,nbr.low),"good"],
    ];
    const aggregated = { poor:0, fair:0, good:0, excellent:0 };
    for (const [strength, output] of rules) aggregated[output] = Math.max(aggregated[output], strength);
    return aggregated;
  }
  function defuzzify(aggregated) {
    const sets = [{ center:0.15,agg:aggregated.poor },{ center:0.40,agg:aggregated.fair },{ center:0.65,agg:aggregated.good },{ center:0.90,agg:aggregated.excellent }];
    let num = 0, den = 0;
    for (const s of sets) { num += s.center * s.agg; den += s.agg; }
    return den === 0 ? 0.5 : num / den;
  }
  function computeSeatInputs(seat, totalSeats, takenSeats) {
    const posInRow = seat % 4;
    const seatType = (posInRow === 1 || posInRow === 0) ? 1.0 : 0.5;
    const seatPosition = (seat - 1) / (totalSeats - 1);
    const neighbourPressure = ((takenSeats.includes(seat-1)?1:0) + (takenSeats.includes(seat+1)?1:0)) / 2;
    const occupancyRate = takenSeats.length / totalSeats;
    return { seatType, seatPosition, neighbourPressure, occupancyRate };
  }
  function fuzzyAssignSeat(event, bookings) {
    const totalSeats = event.max_participants;
    const takenSeats = bookings; // already numbers
    let bestSeat = null, bestScore = -Infinity;
    for (let seat = 1; seat <= totalSeats; seat++) {
      if (takenSeats.includes(seat)) continue;
      const { seatType, seatPosition, neighbourPressure, occupancyRate } = computeSeatInputs(seat, totalSeats, takenSeats);
      const suitability = defuzzify(applyRules(fuzzifyOccupancy(occupancyRate), fuzzifyPosition(seatPosition), fuzzifyNeighbourPressure(neighbourPressure), fuzzifySeatType(seatType)));
      if (suitability > bestScore) { bestScore = suitability; bestSeat = seat; }
    }
    return bestSeat;
  }
  // ────────────────────────────────────────────────────────

  const handleCancelBooking = async (bookingId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error cancelling booking");
      setErrorMessage("");
      setBulkSuccessMsg("Booking cancelled successfully");
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (error) {
      setErrorMessage("Failed to cancel the booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const matchesTimeFilter = (time) => {
    if (filterTime === "all") return true;
    const hour = parseInt((time || "00:00").split(":")[0]);
    if (filterTime === "morning") return hour >= 5 && hour < 12;
    if (filterTime === "afternoon") return hour >= 12 && hour < 17;
    if (filterTime === "evening") return hour >= 17 || hour < 5;
    return true;
  };

  const baseFilteredEvents = eventNameFilter
    ? events.filter(e => e.name === eventNameFilter)
    : events;

const getOccupancyForEvent = (eventItem) => {
  const booked = eventItem.bookings_count || 0;
  const pct = eventItem.max_participants > 0
    ? Math.round((booked / eventItem.max_participants) * 100)
    : 0;
  return { booked, pct };
};

  const timeFilters = [
    { key: "all", label: "All Times"},
    { key: "morning", label: "Morning"},
    { key: "afternoon", label: "Afternoon" },
    { key: "evening", label: "Evening"},
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
        <h2 className="title is-2" style={{ margin: 0 }}>Routes' Schedule</h2>
        {userRole === "admin" && (
          <button
            className="button is-warning is-outlined"
            style={{ borderWidth: 2, fontWeight: 600 }}
            onClick={() => { setBulkTemplateDate(format(weekStart, 'yyyy-MM-dd')); setBulkModalOpen(true); }}
          >
            📅 Bulk Create Events
          </button>
        )}
      </div>

      {/* ── Week Navigation ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
        margin: "16px 0", padding: "12px 20px",
        background: "#f8f9ff", borderRadius: 12, border: "1px solid #e0e0f0"
      }}>
        <button
          className="button is-primary is-outlined"
          style={{ borderWidth: 2 }}
          onClick={() => setWeekStart(subWeeks(weekStart, 1))}
        >← Prev</button>
        <span className="title is-5" style={{ margin: 0, color: "#605fc9" }}>
          {format(weekStart, 'MMMM yyyy')}
        </span>
        <button
          className="button is-primary is-outlined"
          style={{ borderWidth: 2 }}
          onClick={() => setWeekStart(addWeeks(weekStart, 1))}
        >Next →</button>
      </div>

      {/* ── Filter Bar ── */}
      <div style={{
        display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
        marginBottom: 20, padding: "14px 18px",
        background: "#f8f9ff", borderRadius: 12, border: "1px solid #e0e0f0"
      }}>
        <input
          type="text"
          placeholder="🔍 Search route..."
          value={searchRoute}
          onChange={e => setSearchRoute(e.target.value)}
          style={{
            padding: "8px 14px", borderRadius: 8,
            border: "1px solid #ced4da", fontSize: 13,
            minWidth: 200, outline: "none", flex: 1
          }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {timeFilters.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setFilterTime(key)}
              style={{
                padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: `1px solid ${filterTime === key ? "#605fc9" : "#dee2e6"}`,
                background: filterTime === key ? "#605fc9" : "#fff",
                color: filterTime === key ? "#fff" : "#495057",
                cursor: "pointer", transition: "all 0.2s"
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
        {(searchRoute || filterTime !== "all") && (
          <button
            onClick={() => { setSearchRoute(""); setFilterTime("all"); }}
            style={{
              padding: "7px 12px", borderRadius: 8, fontSize: 12,
              border: "1px solid #dee2e6", background: "#fff",
              color: "#868e96", cursor: "pointer"
            }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Success message ── */}
      {bulkSuccessMsg && (
        <div className="notification is-success is-light has-text-centered" style={{ maxWidth: 500, margin: "0 auto 16px" }}>
          {bulkSuccessMsg}
          <button className="delete" onClick={() => setBulkSuccessMsg("")} />
        </div>
      )}

      <ErrorMessage message={errorMessage} />

      {/* ── Week Grid ── */}
      <div className="columns is-multiline">
        {weekDays.map((day) => {
          const dayEvents = baseFilteredEvents
            .filter((eventItem) => {
              const eventDateTime = new Date(`${eventItem.date}T${eventItem.time || "00:00"}`);
              if (userRole === "admin") return true;
              return eventDateTime >= new Date();
            })
            .filter((eventItem) =>
              eventItem.event_type === "public" ||
              (eventItem.event_type === "private" && eventItem.creator_id === userId)
            )
            .filter((eventItem) => isSameDay(new Date(eventItem.date), day))
            .filter((eventItem) =>
              searchRoute === "" ||
              eventItem.name.toLowerCase().includes(searchRoute.toLowerCase())
            )
            .filter((eventItem) => matchesTimeFilter(eventItem.time))
            .sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"));

          const isCurrentDay = isToday(day);

          return (
            <div
              key={day}
              className={`column box day-card ${isCurrentDay ? 'current-day' : ''}`}
              style={{
                borderTop: isCurrentDay ? "3px solid #605fc9" : "3px solid transparent",
                borderRadius: 12,
                minHeight: 120,
                padding: "14px 10px",
              }}
            >
              {/* Day header */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                marginBottom: 10, paddingBottom: 10,
                borderBottom: "1px solid #f0f0f8"
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: 1,
                  color: isCurrentDay ? "#605fc9" : "#868e96",
                  textTransform: "uppercase"
                }}>
                  {format(day, 'EEEE')}
                </span>
                <span style={{
                  fontSize: isCurrentDay ? 22 : 18, fontWeight: 800,
                  color: isCurrentDay ? "#605fc9" : "#2d3436",
                  lineHeight: 1.2
                }}>
                  {format(day, 'd')}
                </span>
                <span style={{ fontSize: 11, color: "#adb5bd" }}>
                  {format(day, 'MMM')}
                </span>
                {isCurrentDay && (
                  <span style={{
                    marginTop: 4, fontSize: 9, fontWeight: 700,
                    background: "#605fc9", color: "#fff",
                    padding: "2px 8px", borderRadius: 10, letterSpacing: 1
                  }}>
                    TODAY
                  </span>
                )}
              </div>

              {/* Admin add button */}
              {userRole === "admin" && (
                <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 8 }}>
                  <button
                    className="button is-primary is-small"
                    style={{ fontSize: 11, padding: "4px 10px" }}
                    onClick={() => handleAddEvent(day)}
                  >
                    + Add
                  </button>
                </div>
              )}

              {/* Events */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dayEvents.length === 0 && (
                  <div style={{ textAlign: "center", color: "#dee2e6", fontSize: 11, padding: "10px 0" }}>
                    No trips
                  </div>
                )}
                {dayEvents.map((eventItem) => {
                  const booking = bookings.find(b => b.event_id === eventItem.id && b.user_id === userId);
                  const { booked, pct } = getOccupancyForEvent(eventItem);
                  const occupancyColor = pct >= 90 ? "#d63031" : pct >= 60 ? "#e67e22" : "#00b894";

                  return (
                    <div
                      key={eventItem.id}
                      style={{
                        background: booking ? "#f0fff4" : "#fff",
                        border: `1px solid ${booking ? "#00b89440" : "#e9ecef"}`,
                        borderLeft: `3px solid ${booking ? "#00b894" : "#605fc9"}`,
                        borderRadius: 8,
                        padding: "10px 12px",
                        cursor: eventItem.creator_id === userId ? "pointer" : "default",
                        transition: "box-shadow 0.2s",
                        boxShadow: "0 1px 4px #0000000a",
                      }}
                      onClick={() => eventItem.creator_id === userId && handleUpdateEvent(eventItem)}
                      onMouseEnter={(e) => { showTooltip(eventItem, e); e.currentTarget.style.boxShadow = "0 4px 12px #00000015"; }}
                      onMouseLeave={(e) => { hideTooltip(); e.currentTarget.style.boxShadow = "0 1px 4px #0000000a"; }}
                    >
                      {/* Route name */}
                      <div style={{ fontWeight: 700, fontSize: 12, color: "#2d3436", marginBottom: 3 }}>
                        {eventItem.name}
                      </div>

                      {/* Time + duration */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: "#605fc9",
                          background: "#f3f0ff", padding: "2px 7px", borderRadius: 5
                        }}>
                          🕐 {eventItem.time}
                        </span>
                        {eventItem.duration && (
                          <span style={{ fontSize: 10, color: "#adb5bd" }}>
                            {eventItem.duration}h
                          </span>
                        )}
                      </div>

                      {/* Occupancy bar */}
                      {eventItem.max_participants && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#868e96", marginBottom: 3 }}>
                            <span>Seats</span>
                            <span style={{ color: occupancyColor, fontWeight: 600 }}>
                              {booked}/{eventItem.max_participants}
                            </span>
                          </div>
                          <div style={{ background: "#f1f3f5", borderRadius: 4, height: 4, overflow: "hidden" }}>
                            <div style={{
                              width: `${pct}%`, height: "100%",
                              background: occupancyColor,
                              borderRadius: 4, transition: "width 0.5s"
                            }} />
                          </div>
                        </div>
                      )}

                      {/* Booked badge */}
                      {booking && (
                        <div style={{
                          fontSize: 10, fontWeight: 700, color: "#00b894",
                          marginBottom: 6, letterSpacing: 0.5
                        }}>
                          ✓ BOOKED · Seat {booking.seat_number}
                        </div>
                      )}

                      {/* Book button */}
                      {eventItem.event_type === 'public' && userRole !== 'admin' && !booking && pct < 100 && (
                        <button
                          className="button is-info is-small"
                          style={{ width: "100%", fontSize: 11, fontWeight: 600 }}
                          onClick={(e) => { e.stopPropagation(); openSeatModal(eventItem); }}
                        >
                          🎟 Book Ticket
                        </button>
                      )}

                      {/* Sold out */}
                      {eventItem.event_type === 'public' && userRole !== 'admin' && !booking && pct >= 100 && (
                        <div style={{
                          textAlign: "center", fontSize: 10, fontWeight: 700,
                          color: "#d63031", padding: "4px 0"
                        }}>
                          SOLD OUT
                        </div>
                      )}

                      {/* Cancel booking */}
                      {eventItem.event_type === 'public' && booking && (
                        <button
                          className="button is-danger is-small is-outlined"
                          style={{ width: "100%", fontSize: 11 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookingToCancel(booking.id);
                            setCancelModalOpen(true);
                          }}
                        >
                          Cancel Booking
                        </button>
                      )}

                      {/* Admin delete */}
                      {userRole === "admin" && (
                        <button
                          className="button is-danger is-small is-outlined"
                          style={{ width: "100%", fontSize: 11, marginTop: 4 }}
                          onClick={(e) => { e.stopPropagation(); handleDeleteEvent(eventItem.id); }}
                        >
                          🗑 Delete
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tooltip ── */}
      {tooltip.visible && tooltip.event && (
        <div style={{
          position: "fixed",
          left: tooltip.position.x + 12,
          top: tooltip.position.y - 10,
          background: "#2d3436",
          color: "#fff",
          borderRadius: 10,
          padding: "12px 16px",
          fontSize: 12,
          zIndex: 9999,
          minWidth: 200,
          boxShadow: "0 8px 24px #00000040",
          pointerEvents: "none"
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: "#a29bfe" }}>
            {tooltip.event.name}
          </div>
          {tooltip.event.description && (
            <div style={{ marginBottom: 4, color: "#dfe6e9" }}>{tooltip.event.description}</div>
          )}
          <div>📅 {tooltip.event.date}</div>
          <div>🕐 {tooltip.event.time}</div>
          <div>⏱ {tooltip.event.duration}h duration</div>
          <div>👥 {tooltip.event.max_participants} seats</div>
          {tooltip.event.room_number && <div>📍 {tooltip.event.room_number}</div>}
        </div>
      )}

      {/* ── Modals ── */}
      {activeModal && (
        <EventModal
          event={currentEvent}
          selectedDate={selectedDate}
          handleClose={handleModalClose}
          handleDeleteEvent={handleDeleteEvent}
        />
      )}

      {userRole === "admin" && (
        <div style={{ marginTop: 24 }}>
          <button
            className="button is-warning"
            onClick={() => setShowBookings(prev => !prev)}
          >
            {showBookings ? "Hide Bookings" : "Show Bookings"}
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
            startPayment(selectedEventForSeats, data);
          }}
          onClose={() => setSeatModalOpen(false)}
          fuzzyAssignSeat={(event, takenSeats) => {
            let bestSeat = null, bestScore = -Infinity;

            for (let seat = 1; seat <= event.max_participants; seat++) {
              if (takenSeats.includes(seat)) continue;

              const { seatType, seatPosition, neighbourPressure, occupancyRate } =
                computeSeatInputs(seat, event.max_participants, takenSeats);

              const score = defuzzify(
                applyRules(
                  fuzzifyOccupancy(occupancyRate),
                  fuzzifyPosition(seatPosition),
                  fuzzifyNeighbourPressure(neighbourPressure),
                  fuzzifySeatType(seatType)
                )
              );

              if (score > bestScore) {
                bestScore = score;
                bestSeat = seat;
              }
            }

            return bestSeat;
          }}
        />
      )}

      {ticketModalOpen && (
        <QRModal booking={ticketBooking} onClose={() => setTicketModalOpen(false)} />
      )}

      {bulkModalOpen && (
        <BulkEventModal
          token={token}
          templateDate={bulkTemplateDate}
          onClose={() => setBulkModalOpen(false)}
          onDone={(count) => {
            setBulkModalOpen(false);
            setBulkSuccessMsg(`✅ Successfully created ${count} event${count !== 1 ? "s" : ""}!`);
            fetchEvents();
          }}
        />
      )}
      {cancelModalOpen && (
  <div className="modal is-active">
    <div
      className="modal-background"
      onClick={() => setCancelModalOpen(false)}
    ></div>

    <div className="modal-card">
      <header className="modal-card-head">
        <p className="modal-card-title">Cancel Booking</p>
        <button
          className="delete"
          aria-label="close"
          onClick={() => setCancelModalOpen(false)}
        ></button>
      </header>

      <section className="modal-card-body">
        <p>
          Are you sure you want to cancel this booking?
        </p>
        <p style={{ marginTop: 10, color: "#d63031", fontWeight: 600 }}>
          ⚠ Money will not be returned.
        </p>
      </section>

      <footer
          className="modal-card-foot"
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%"
          }}
        >
          <button
            className="button"
            onClick={() => setCancelModalOpen(false)}
          >
            Keep Booking
          </button>

          <button
            className="button is-danger"
            onClick={confirmCancelBooking}
          >
            Cancel Booking
          </button>
        </footer>
    </div>
  </div>
)}
    </div>
  );
};



export default Schedule;
