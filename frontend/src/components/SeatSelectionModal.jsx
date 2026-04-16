import React, {useState, useEffect, useRef, useContext} from "react";
import "../styles.css";
import API_URL from "../config";
import {UserContext} from "../context/UserContext";

const SeatSelectionModal = ({ event, bookings: initialBookings, onSelectSeat, onSkip, onClose, fuzzyAssignSeat }) => {
  const totalSeats = event.max_participants;
  const [token, userRole] = useContext(UserContext);
  // ── WebSocket live seat state ──────────────────────────
  const [takenSeats, setTakenSeats] = useState(
    initialBookings.map(b => Number(b.seat_number))
  );
  const [lockedSeats, setLockedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isYoung, setIsYoung] = useState(false);
  const [isSenior, setIsSenior] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
  const wsUrl = API_URL.replace("http://", "ws://").replace("https://", "wss://");
  const ws = new WebSocket(`${wsUrl}/ws/events/${event.id}/seats`);
  wsRef.current = ws;

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === "seat_update") {
      setTakenSeats(data.taken_seats.map(Number));
      setLockedSeats((data.locked_seats || []).map(Number));

      setSelectedSeats(prev =>
        prev.filter(s => !data.taken_seats.includes(s))
      );
    }
  };

  const ping = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) ws.send("ping");
  }, 25000);

  return () => {
    clearInterval(ping);
    ws.close();
  };
}, [event.id]);



  const generateRows = (total) => {
    const rows = [];
    for (let i = 1; i <= total; i += 4) {
      rows.push([i, i + 1, i + 2, i + 3]);
    }
    return rows;
  };

const handleSeatClick = async (seat) => {
  // If seat is already selected → UNLOCK it
  if (selectedSeats.includes(seat)) {
    await fetch(`${API_URL}/events/${event.id}/unlock-seat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ seat_number: seat }),
    });

    setSelectedSeats(prev => prev.filter(s => s !== seat));
    return;
  }

  // If seat is not selected → LOCK it
  try {
    await fetch(`${API_URL}/events/${event.id}/lock-seat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ seat_number: seat }),
    });

    setSelectedSeats(prev => [...prev, seat]);
  } catch {
    alert("Seat just got locked by someone else");
  }
};

const renderSeat = (seat) => {
  if (!seat || seat > totalSeats) return null;

  const isTaken = takenSeats.includes(seat);              // Already booked
  const isMyLocked = selectedSeats.includes(seat);        // You locked it
  const isLockedByOthers = lockedSeats.includes(seat) && !isMyLocked; // Locked by someone else

  // CSS classes for seat state
  let seatClass = "seat-icon free";
  if (isTaken) seatClass = "seat-icon taken";
  else if (isLockedByOthers) seatClass = "seat-icon locked-others"; // ← NEW class
  else if (isMyLocked) seatClass = "seat-icon selected";

  return (
    <button
      key={seat}
      disabled={isTaken || isLockedByOthers}               // Disable interaction if booked or locked by others
      className={seatClass}
      onClick={() => handleSeatClick(seat)}
    >
      {seat}
      {isTaken && <span className="seat-x"></span>}
      {isLockedByOthers && <span className="seat-lock"></span>}  {/* optional lock icon */}
    </button>
  );
};

  const basePrice = event.post.price;
  const numTickets = Math.max(selectedSeats.length, 1);
  const seatFee = selectedSeats.length * 2;
  let totalPrice = (basePrice * numTickets) + seatFee;
  if (isYoung || isSenior) totalPrice = totalPrice * 0.5;

  const handleConfirm = () => {
    // Final check — make sure none of the selected seats got taken while choosing
    const conflict = selectedSeats.some(s => takenSeats.includes(s));
    if (conflict) {
      alert("One or more of your selected seats was just taken by another user. Please choose again.");
      setSelectedSeats(prev => prev.filter(s => !takenSeats.includes(s)));
      return;
    }
    onSelectSeat({ seats: selectedSeats, isYoung, isSenior, totalPrice });
  };

  const handleSkip = async () => {
  // Combine taken + locked seats (VERY IMPORTANT)
  const allTakenSeats = [
    ...takenSeats,
    ...lockedSeats
  ];

  const seat = fuzzyAssignSeat(event, allTakenSeats);

  if (!seat) {
    alert("No seats available");
    return;
  }

  // ✅ LOCK seat before payment (CRITICAL)
  try {
    await fetch(`${API_URL}/events/${event.id}/lock-seat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ seat_number: seat }),
    });
  } catch {
    alert("Seat just got taken. Try again.");
    return;
  }

  const skipPrice = isYoung || isSenior ? basePrice * 0.5 : basePrice;

  onSkip({
    seats: [seat],   // ✅ NOW WE PASS REAL SEAT
    isYoung,
    isSenior,
    totalPrice: skipPrice
  });
};

  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card seat-modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Choose Your Seat(s)</p>
          <button className="button" onClick={onClose}>X</button>
        </header>

        <section className="modal-card-body">
          <div className="driver-row">
            <div className="driver-seat">🧑‍✈️ Driver</div>
            <div className="entrance-door">⬅ Entrance</div>
          </div>

          <div className="bus-rows">
            {generateRows(totalSeats).map((row, rowIndex) => (
              <div key={rowIndex} className="bus-row">
                <div className="left-seats">
                  {renderSeat(row[0])}
                  {renderSeat(row[1])}
                </div>
                <div className="aisle"></div>
                <div className="right-seats">
                  {renderSeat(row[2])}
                  {renderSeat(row[3])}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "20px" }}>
            <label className="checkbox">
              <input type="checkbox" checked={isYoung}
                onChange={(e) => { setIsYoung(e.target.checked); if (e.target.checked) setIsSenior(false); }} />
              Young (3–25) — 50% discount
            </label>
            <label className="checkbox" style={{ marginLeft: "20px" }}>
              <input type="checkbox" checked={isSenior}
                onChange={(e) => { setIsSenior(e.target.checked); if (e.target.checked) setIsYoung(false); }} />
              Senior (65+) — 50% discount
            </label>
            <p style={{ fontSize: "12px", marginTop: "15px", color: "#777" }}>* Select place +2 EUR</p>
            <p style={{ fontSize: "12px", marginTop: "5px", color: "#777" }}>* Must show identity document upon arrival</p>
          </div>

          <div style={{ marginTop: "20px", fontSize: "14px" }}>
            <p>Base price per ticket: <strong>€{basePrice}</strong></p>
            {selectedSeats.length > 0 && <p>Seat fee: <strong>€{seatFee}</strong> ({selectedSeats.length} × €2)</p>}
            {(isYoung || isSenior) && <p style={{ color: "#2e7d32" }}>Discount applied: <strong>50% off</strong></p>}
          </div>

          <div style={{ marginTop: "15px", fontWeight: "bold" }}>
            Total Price: €{totalPrice.toFixed(2)}
          </div>
        </section>

        <footer className="modal-card-foot" style={{ width: "100%" }}>
          <div style={{ marginRight: "auto" }}>
            <button className="button is-danger is-light" onClick={handleSkip}>
              Continue without seat selection
            </button>
          </div>
          <button className="button is-primary" onClick={handleConfirm}>
            Confirm Selection
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SeatSelectionModal;