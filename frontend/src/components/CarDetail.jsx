import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import API_URL from "../config";

const CarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [car, setCar] = useState(null);
  const [carImages, setCarImages] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
    const [bookingMsg, setBookingMsg] = useState(null);
  const [token] = useContext(UserContext);

  // Trip calculator
  const [totalCost, setTotalCost] = useState(0);
    const [minutes, setMinutes] = useState("");
    const [distance, setDistance] = useState("");
    const [days, setDays] = useState("");
    const [hours, setHours] = useState("");
  const MIN_FEE = 0.30;
    const [licenseStatus, setLicenseStatus] = useState(null);

useEffect(() => {
  if (!token) return;
  fetch(`${API_URL}/license/status`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(r => r.ok ? r.json() : null)
    .then(data => setLicenseStatus(data?.status || "none"))
    .catch(() => setLicenseStatus("none"));
}, [token]);

  useEffect(() => {
    const fetchCarDetail = async () => {
      try {
        const response = await fetch(`${API_URL}/cars/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Error fetching car details");

        const data = await response.json();
        setCar(data);
        setCarImages(data.images || []);
      } catch (error) {
        setErrorMessage("Could not fetch car details.");
      }
    };

    fetchCarDetail();
  }, [id, token]);

  // Calculate trip cost
useEffect(() => {
  if (!car) return;

  const d = Number(days) || 0;
  const h = Number(hours) || 0;
  const m = Number(minutes) || 0;
  const km = Number(distance) || 0;

  // Convert minutes to fractional hours
  const minuteCost = (m / 60) * car.price_per_hour;

  const cost =
    d * car.price_per_day +
    h * car.price_per_hour +
    minuteCost +
    km * car.price_per_km +
    MIN_FEE;

  setTotalCost(cost.toFixed(2));
}, [days, hours, minutes, distance, car]);

  const handleGoBack = () => navigate("/explorerent");

  if (errorMessage) {
    return <p style={{ color: "#f14668" }}>{errorMessage}</p>;
  }

  if (!car) {
    return <p>Loading car...</p>;
  }
const handleBookClick = () => {

  if (!licenseStatus || licenseStatus === "none") {
    setBookingMsg({
      type: "info",
      text: "Please upload your license before booking a car.",
      action: { label: "Upload License →", path: "/license/verify" }
    });
    return;
  }

  if (licenseStatus === "rejected") {
    setBookingMsg({
      type: "error",
      text: "Sorry, you are not allowed to book a car. Your license was rejected by our team."
    });
    return;
  }

  if (licenseStatus === "pending" || licenseStatus === "manual_review") {
    setBookingMsg({
      type: "warning",
      text: "Your license is currently under review. Please wait for approval before booking."
    });
    return;
  }

  navigate(`/rent/${car.id}`, {
    state: {
      carPricing: {
        price_per_hour: car.price_per_hour,
        price_per_day: car.price_per_day,
        price_per_km: car.price_per_km,
      }
    }
  });
};
  return (
    <div style={{ position: "relative" }}>
        <style>{`
      @keyframes fadeInUp { 
        from { opacity: 0; transform: translateY(8px); } 
        to { opacity: 1; transform: none; } 
      }
    `}</style>
      <button onClick={handleGoBack} className="button is-link">
        Back to Explore Cars
      </button>

      <br /><br />

      {/* HERO IMAGE */}
      <div
        style={{
          width: "100%",
          height: "350px",
          overflow: "hidden",
          borderRadius: "12px",
          marginBottom: "25px",
          border: "3px solid #605fc9"
        }}
      >
        {carImages.length > 0 ? (
          <img
            src={`${API_URL}${carImages[0].url}`}
            alt="Car"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#f0f0f0",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#888"
            }}
          >
            No Image Available
          </div>
        )}
      </div>

      {/* CAR TITLE */}
      <h1 className="title is-2">
        {car.brand} {car.model} ({car.year})
      </h1>

      {/* TWO-COLUMN LAYOUT */}
      <div className="columns is-variable is-4" style={{ alignItems: "stretch" }}>
        {/* LEFT — CAR INFO */}
        <div className="column is-half">
          <div
            className="box"
             style={{
                    height: "100%",
                    border: "3px solid #605fc9",
                    borderRadius: "12px",
                    background: "#f9f9ff",
                    fontSize: "1.6rem"
                  }}
          >

            <p><strong>Brand:</strong> {car.brand}</p>
            <p><strong>Model:</strong> {car.model}</p>
            <p><strong>Year:</strong> {car.year}</p>
               <br />
            <p><strong>Transmission:</strong> {car.transmission}</p>
            <p><strong>Fuel Type:</strong> {car.fuel_type}</p>
            <p><strong>Seats:</strong> {car.seats}</p>
            <p><strong>License Plate:</strong> {car.license_plate}</p>

            <br />

            <p><strong>Price per Hour:</strong> €{car.price_per_hour}</p>
            <p><strong>Price per Day:</strong> €{car.price_per_day}</p>
            <p><strong>Price per KM:</strong> €{car.price_per_km}</p>
          </div>
        </div>

        {/* RIGHT — TRIP CALCULATOR */}
        <div className="column is-half">
          <div
            className="box"
            style={{
                height: "100%",
                border: "3px solid #605fc9",
                borderRadius: "12px",
                background: "#f9f9ff"
          }}
          >
            <h5 className="title is-5" style={{ color: "#605fc9" }}>
              Trip Cost Calculator
            </h5>
<label className="label">Days</label>
<input
  type="number"
  className="input"
  min="0"
  value={days}
  onChange={(e) => setDays(e.target.value)}
/>

<label className="label">Hours</label>
<input
  type="number"
  className="input"
  min="0"
  value={hours}
  onChange={(e) => setHours(e.target.value)}
/>

<label className="label">Minutes</label>
<input
  type="number"
  className="input"
  min="0"
  max="59"
  value={minutes}
  onChange={(e) => {
    const val = e.target.value;
    if (val === "" || (Number(val) >= 0 && Number(val) <= 59)) {
      setMinutes(val);
    }
  }}
/>

            <br />

                        <label className="label">Distance (km)</label>
                        <input
                          type="number"
                          className={`input ${!distance ? "is-danger" : ""}`}
                          min="0"
                          value={distance}
                          onChange={(e) => {
                            const val = e.target.value;

                            if (val === "") {
                              setDistance("");
                              return;
                            }

                            if (Number(val) >= 0) {
                              setDistance(val);
                            }
                          }}
                        />
            <br />
            <br />

            <h5 className="title is-5" style={{ color: "#605fc9" }}>
              Estimated Cost: €{totalCost}
            </h5>
            <p style={{ fontSize: "0.9em", color: "#777" }}>
              Includes platform fee of €{MIN_FEE}.
            </p>
          </div>
        </div>
      </div>

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
  onClick={handleBookClick}
>
  Book This Car
</button>
{bookingMsg && (
  <div style={{
    marginTop: 14,
    padding: "14px 16px",
    borderRadius: 12,
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    background:
      bookingMsg.type === "error"   ? "#d6303110" :
      bookingMsg.type === "warning" ? "#e67e2210" :
                                      "#5352ed10",
    border: `1px solid ${
      bookingMsg.type === "error"   ? "#d6303140" :
      bookingMsg.type === "warning" ? "#e67e2240" :
                                      "#5352ed40"
    }`,
    animation: "fadeInUp 0.3s ease",
  }}>
    <span style={{ fontSize: 20 }}>
      {bookingMsg.type === "error" ? "✗" : bookingMsg.type === "warning" ? "⚠" : "🪪"}
    </span>
    <div style={{ flex: 1 }}>
      <div style={{
        fontSize: 13,
        color:
          bookingMsg.type === "error"   ? "#d63031" :
          bookingMsg.type === "warning" ? "#e67e22" :
                                          "#5352ed",
        fontWeight: 600,
        marginBottom: bookingMsg.action ? 8 : 0,
      }}>
        {bookingMsg.text}
      </div>
      {bookingMsg.action && (
        <span
          onClick={() => navigate(bookingMsg.action.path)}
          style={{
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            color: "#5352ed", textDecoration: "underline",
          }}
        >
          {bookingMsg.action.label}
        </span>
      )}
    </div>
    <span
      onClick={() => setBookingMsg(null)}
      style={{ fontSize: 16, cursor: "pointer", color: "#adb5bd", lineHeight: 1 }}
    >
      ×
    </span>
  </div>
)}
      {/* GALLERY */}
      <h2 className="title is-4" style={{ marginTop: "40px" }}>
        Gallery
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "15px"
        }}
      >
        {carImages.length > 1 ? (
          carImages.map((img, index) => (
            <div
              key={index}
              style={{
                width: "100%",
                height: "150px",
                overflow: "hidden",
                borderRadius: "10px",
                border: "2px solid #605fc9"
              }}
            >
              <img
                src={`${API_URL}${img.url}`}
                alt="Car gallery"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ))
        ) : (
          <p>No additional images</p>
        )}
      </div>
    </div>
  );
};

export default CarDetail;