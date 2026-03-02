import React, { useState } from "react";
import "../styles.css";

const SeatSelectionModal = ({ event, bookings, onSelectSeat, onSkip, onClose }) => {
  const totalSeats = event.max_participants;
  const takenSeats = bookings.map(b => Number(b.seat_number));

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isYoung, setIsYoung] = useState(false);
  const [isSenior, setIsSenior] = useState(false);

  const generateRows = (total) => {
    const rows = [];
    for (let i = 1; i <= total; i += 4) {
      rows.push([i, i + 1, i + 2, i + 3]);
    }
    return rows;
  };

  const handleSeatClick = (seat) => {
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seat));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const renderSeat = (seat) => {
    if (!seat || seat > totalSeats) return null;

    const isTaken = takenSeats.includes(seat);
    const isSelected = selectedSeats.includes(seat);

    return (
      <button
        key={seat}
        disabled={isTaken}
        className={`seat-icon ${isTaken ? "taken" : isSelected ? "selected" : "free"}`}
        onClick={() => handleSeatClick(seat)}
      >
        {seat}
        {isTaken && <span className="seat-x">✖</span>}
      </button>
    );
  };

  // PRICE CALCULATION
  const basePrice = event.post.price;
  const seatFee = selectedSeats.length * 2;

  let totalPrice = basePrice * selectedSeats.length + seatFee;

  if (isYoung || isSenior) {
    totalPrice = totalPrice * 0.5;
  }

  const handleConfirm = () => {
    onSelectSeat({
      seats: selectedSeats,
      isYoung,
      isSenior,
      totalPrice,
    });
  };

  const handleSkip = () => {
    const skipPrice = isYoung || isSenior ? basePrice * 0.5 : basePrice;

    onSkip({
      seats: [],
      isYoung,
      isSenior,
      totalPrice: skipPrice,
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

{/* DISCOUNT CHECKBOXES */}
<div style={{ marginTop: "20px" }}>
  <label className="checkbox">
    <input
      type="checkbox"
      checked={isYoung}
      onChange={(e) => {
        setIsYoung(e.target.checked);
        if (e.target.checked) setIsSenior(false);
      }}
    />
    Young (3–25) — 50% discount
  </label>

  <label className="checkbox" style={{ marginLeft: "20px" }}>
    <input
      type="checkbox"
      checked={isSenior}
      onChange={(e) => {
        setIsSenior(e.target.checked);
        if (e.target.checked) setIsYoung(false);
      }}
    />
    Senior (65+) — 50% discount
  </label>

  <p style={{ fontSize: "12px", marginTop: "15px", color: "#777" }}>
    * Select place +2 EUR
  </p>
  <p style={{ fontSize: "12px", marginTop: "5px", color: "#777" }}>
    * Must show identity document upon arrival
  </p>
</div>

{/* PRICE BREAKDOWN */}
<div style={{ marginTop: "20px", fontSize: "14px" }}>
  <p>Base price per ticket: <strong>€{basePrice}</strong></p>

  {selectedSeats.length > 0 && (
    <p>
      Seat fee: <strong>€{seatFee}</strong> ({selectedSeats.length} × €2)
    </p>
  )}

  {(isYoung || isSenior) && (
    <p style={{ color: "#2e7d32" }}>
      Discount applied: <strong>50% off</strong>
    </p>
  )}
</div>

{/* TOTAL PRICE */}
<div style={{ marginTop: "15px", fontWeight: "bold" }}>
  Total Price: €{totalPrice.toFixed(2)}
</div>

</section>   {/* <-- THIS WAS MISSING */}

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