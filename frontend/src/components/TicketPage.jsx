import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API_URL from "../config";

const TicketPage = ({ token, onClose, bookingId }) => {
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      const response = await fetch(`${API_URL}/booking/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setBooking(data);
    };

    fetchBooking();
  }, [bookingId, token]);

  if (!booking) return null;

  return (
    <div className="ticket-overlay">
      <div className="ticket-modal">
        <button className="close-btn" onClick={onClose}>×</button>

        <h1 className="title">Your Ticket</h1>
        <h2 className="subtitle">{booking.event?.date} {booking.event?.time}</h2>
        <h2 className="subtitle">{booking.event?.name}</h2>
        <h3 className="subtitle">Seat #{booking.seat_number}</h3>

        <img
          src={`data:image/png;base64,${booking.qr_code}`}
          alt="QR Code"
          style={{ width: "260px", marginBottom: "20px" }}
        />

      <button
        className="button is-link"
        onClick={() => generateTicketPDF(booking)}
      >
        Download Ticket (PDF)
      </button>
      </div>
    </div>
  );
};

export default TicketPage;


import jsPDF from "jspdf";

const generateTicketPDF = (booking) => {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();

  // --- Centered Logo ---
  const logoWidth = 100;
  const logoHeight = 40;
  const logoX = (pageWidth - logoWidth) / 2;

  const logo = "/images/img_8.png";
  doc.addImage(logo, "PNG", logoX, 10, logoWidth, logoHeight);

  // --- Centered Title ---
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");

  const title = "Ticket";
  const titleWidth = doc.getTextWidth(title);
  const titleX = (pageWidth - titleWidth) / 2;

  doc.text(title, titleX, 70);

  // --- Passenger Name (centered) ---
  const fullName = `${booking.user.name} ${booking.user.surname}`;
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");

  // --- Booking Details ---
  doc.setFontSize(14);
  let y = 105;
  doc.text(`Booking ID: ${booking.id}`, 10, y);
  doc.text(`Passenger: ${fullName}`, 10, y + 10);
  doc.text(`Event: ${booking.event.name}`, 10, y + 20);
  doc.text(`Date: ${booking.event.date}`, 10, y + 30);
  doc.text(`Time: ${booking.event.time}`, 10, y + 40);
  doc.text(`Seat Number: ${booking.seat_number}`, 10, y + 50);

  // --- Centered QR Code ---
  if (booking.qr_code) {
    const qrSize = 60; // make it nice and visible
    const qrX = (pageWidth - qrSize) / 2; // center horizontally
    const qrY = y + 60;

    doc.addImage(
      `data:image/png;base64,${booking.qr_code}`,
      "PNG",
      qrX,
      qrY,
      qrSize,
      qrSize
    );
  }

  // Save PDF
  doc.save(`ticket_${booking.id}.pdf`);
};