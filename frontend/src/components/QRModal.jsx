import React from "react";
import jsPDF from "jspdf";

const generateTicketPDF = (booking) => {
  const doc = new jsPDF();
  const logo = "/images/img_8.png";
  doc.addImage(logo, "PNG", 10, 10, 40, 40);
  doc.setFontSize(22);
  doc.text("MobilEase Ticket", 60, 25);
  doc.setFontSize(14);
  doc.text(`Booking ID: ${booking.id}`, 10, 60);
  doc.text(`Event: ${booking.event.name}`, 10, 70);
  doc.text(`Date: ${booking.event.date}`, 10, 80);
  doc.text(`Time: ${booking.event.time}`, 10, 90);
  doc.text(`Seat Number: ${booking.seat_number}`, 10, 100);
  if (booking.qr_code) {
    doc.text("Scan QR Code:", 10, 120);
    doc.addImage(
      `data:image/png;base64,${booking.qr_code}`,
      "PNG", 10, 130, 80, 80
    );
  }
  doc.save(`ticket_${booking.id}.pdf`);
};

const QRModal = ({ booking, onClose }) => {
  if (!booking) return null;

  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card" style={{ maxWidth: "400px" }}>
        <header className="modal-card-head">
          <p className="modal-card-title">Your Ticket</p>
        </header>
        <section className="modal-card-body" style={{ textAlign: "center" }}>
          <h3 className="title is-5">Seat #{booking.seat_number}</h3>
          <img
            src={`data:image/png;base64,${booking.qr_code}`}
            alt="QR Code"
            style={{ width: "250px", marginBottom: "20px" }}
          />
          <p style={{ fontSize: "13px", color: "#27ae60", marginBottom: "12px" }}>
            ✅ A confirmation email with your ticket PDF has been sent to your inbox.
          </p>
          <button
            className="button is-link"
            onClick={() => generateTicketPDF(booking)}
          >
            Download Ticket (PDF)
          </button>
        </section>
        <footer className="modal-card-foot">
          <button className="button" onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
};

export default QRModal;