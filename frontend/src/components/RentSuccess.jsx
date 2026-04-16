import React, { useEffect, useContext, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import API_URL from "../config";

const RentSuccess = () => {
  const navigate = useNavigate();
  const [token] = useContext(UserContext);
  const [rentalId, setRentalId] = useState(null);
  const [rental, setRental] = useState(null);
  const hasFetched = useRef(false); // ← prevent double fetch

  useEffect(() => {
  if (!token) return;
  if (hasFetched.current) return;
  hasFetched.current = true;

  const id = localStorage.getItem("rental_id");

  if (!id) return;

  setRentalId(id);
  localStorage.removeItem("rental_id");

  const confirmAndFetch = async () => {
    try {
      await fetch(`${API_URL}/rentals/${id}/confirm-payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const res = await fetch(`${API_URL}/rentals/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setRental(data);
    } catch (err) {
      console.error(err);
    }
  };

  confirmAndFetch();
}, [token]);

  const downloadAgreement = () => {
    const link = document.createElement("a");
    link.href = `${API_URL}/rentals/${rentalId}/agreement`;
    link.target = "_blank";
    link.download = `RentalAgreement_${rentalId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: 560, margin: "60px auto", fontFamily: "inherit" }}>
      <div style={{
        background: "#fff", borderRadius: 16,
        border: "1px solid #e9ecef",
        boxShadow: "0 8px 32px #00000012",
        overflow: "hidden"
      }}>
        {/* Green header */}
        <div style={{
          background: "linear-gradient(135deg, #00b894, #00cec9)",
          padding: "36px 24px", textAlign: "center"
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", fontSize: 28, color: "#fff"
          }}>✓</div>
          <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>
            Payment Successful!
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", marginTop: 8, fontSize: 14 }}>
            Your car rental has been confirmed.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px" }}>
          {rental ? (
            <div style={{
              background: "#f8f9ff", borderRadius: 10,
              border: "1px solid #e0e0f0", padding: "16px 18px",
              marginBottom: 20
            }}>
              <div style={{
                fontSize: 10, letterSpacing: 2, color: "#605fc9",
                fontFamily: "monospace", marginBottom: 12
              }}>
                RENTAL SUMMARY
              </div>
              {[
                ["📍 Pickup",     rental.pickup_location],
                ["🏁 Drop-off",   rental.dropoff_location],
                ["📅 Start",      new Date(rental.start_datetime).toLocaleString("en-GB")],
                ["📅 End",        new Date(rental.end_datetime).toLocaleString("en-GB")],
                ["🛣 Distance",   `${Number(rental.kilometers_used).toFixed(2)} km`],
                ["💶 Total Paid", `€${rental.total_price}`],
              ].map(([label, value]) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "6px 0", borderBottom: "1px solid #f1f3f5",
                  fontSize: 13
                }}>
                  <span style={{ color: "#868e96", flexShrink: 0 }}>{label}</span>
                  <span style={{
                    fontWeight: 600, color: "#2d3436",
                    maxWidth: 300, textAlign: "right", fontSize: 12
                  }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: "center", padding: "20px 0",
              color: "#868e96", fontSize: 13, marginBottom: 20
            }}>
              Loading rental details...
            </div>
          )}

          {rentalId && (
            <button
              onClick={downloadAgreement}
              style={{
                width: "100%", padding: "13px 0",
                background: "linear-gradient(135deg, #605fc9, #3742fa)",
                color: "#fff", border: "none", borderRadius: 10,
                fontWeight: 700, fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, marginBottom: 12
              }}
            >
              <i className="fa-solid fa-file-pdf"></i>
              Download Rental Agreement
            </button>
          )}

          <button
            onClick={() => navigate("/")}
            style={{
              width: "100%", padding: "11px 0",
              background: "#fff", color: "#605fc9",
              border: "2px solid #605fc9", borderRadius: 10,
              fontWeight: 600, fontSize: 14, cursor: "pointer"
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
      <p style={{ textAlign: "center", fontSize: 12, color: "#adb5bd", marginTop: 16 }}>
        Keep your rental agreement for your records.
      </p>
    </div>
  );
};

export default RentSuccess;