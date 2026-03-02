import React, { useEffect, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import API_URL from "../config";

const RentSuccess = () => {
  const navigate = useNavigate();
  const [token] = useContext(UserContext);

  const [rentalId, setRentalId] = useState(null);

  useEffect(() => {
    const id = sessionStorage.getItem("rental_id");

    if (id) {
      setRentalId(id); // store it for UI
      sessionStorage.removeItem("rental_id");
    } else {
      console.error("No rental ID found after payment");
    }
  }, []);

const downloadAgreement = () => {
  window.open(`${API_URL}/rentals/${rentalId}/agreement`, "_blank");
};

  const goToProfile = () => {
    navigate("/profile");
  };

  return (
    <div className="box" style={{ border: "3px solid #605fc9", textAlign: "center" }}>
      <h1 className="title is-2">Payment Successful!</h1>


<br/>
{rentalId && (
  <>
    <p>You can now download your rental agreement.</p>
        <div style={{ display: "flex", justifyContent: "center", marginTop: "15px" }}>
      <button
        className="button is-primary is-medium"
        style={{
          backgroundColor: "#605fc9",
          borderColor: "#605fc9",
          color: "white",
          width: "20%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px"
        }}
        onClick={downloadAgreement}
      >
        <i className="fa-solid fa-download"></i>
      </button>
    </div>
  </>
)}
    </div>
  );
};

export default RentSuccess;