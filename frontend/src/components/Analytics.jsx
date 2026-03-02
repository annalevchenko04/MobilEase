import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../context/UserContext";
import API_URL from "../config";
import TicketSalesChart from "./Charts/TicketSalesChart";
import OccupancyCircle from "./Charts/OccupancyCircle";
import {Link} from "react-router-dom";

const Analytics = () => {
  const [token, userRole] = useContext(UserContext);

  const [ticketStats, setTicketStats] = useState({ daily: [] });
  const [occupancy, setOccupancy] = useState([]);
  const groupedByRoute = occupancy.reduce((acc, ev) => {
    if (!acc[ev.name]) acc[ev.name] = [];
    acc[ev.name].push(ev);
    return acc;
  }, {});
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  // Fetch ticket stats
  useEffect(() => {
    if (userRole !== "admin") return;

    const fetchTicketStats = async () => {
      const res = await fetch(`${API_URL}/admin/analytics/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTicketStats(data);
    };

    fetchTicketStats();
  }, [userRole, token]);

  // Fetch occupancy stats
  useEffect(() => {
    if (userRole !== "admin") return;

    const fetchOccupancy = async () => {
      const res = await fetch(`${API_URL}/admin/analytics/occupancy`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setOccupancy(data);
    };

    fetchOccupancy();
  }, [userRole, token]);

  if (userRole !== "admin") {
    return <p>You do not have access to admin analytics.</p>;
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <h1 className="title is-2">Admin Analytics Dashboard</h1>
      <br/>
      <div style={{ marginBottom: "40px" }}>
        <TicketSalesChart data={ticketStats} />
      </div>

 <h1 className="title is-2">Occupancy heatmap</h1>

      {!selectedRoute && (
  <div>
    <h2 className="title is-5">Select Route</h2>
    {Object.keys(groupedByRoute).map(route => (
      <button
        key={route}
        className="button is-link is-light"
        style={{ margin: "5px" }}
        onClick={() => setSelectedRoute(route)}
      >
        {route}
      </button>
    ))}
  </div>
)}
{selectedRoute && !selectedDate && (
  <div>
    <h2 className="title is-4">{selectedRoute}</h2>

    {[...new Set(groupedByRoute[selectedRoute].map(ev => ev.date))].map(date => (
      <button
        key={date}
        className="button is-primary is-light"
        style={{ margin: "5px" }}
        onClick={() => setSelectedDate(date)}
      >
        {date}
      </button>
    ))}
<br/>
    <button
      className="button is-danger is-light"
      style={{ marginTop: "20px" }}
      onClick={() => setSelectedRoute(null)}
    >
      Back
    </button>
  </div>
)}
      {selectedRoute && selectedDate && (
  <div>
    <h2 className="title is-4">
      {selectedRoute} — {selectedDate}
    </h2>

    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "20px",
        justifyContent: "center",
        marginTop: "20px"
      }}
    >
      {groupedByRoute[selectedRoute]
        .filter(ev => ev.date === selectedDate)
        .map(ev => (
          <OccupancyCircle key={ev.event_id} event={ev} />
        ))}
    </div>
<br/>
    <button
      className="button is-danger is-light"
      style={{ marginTop: "20px" }}
      onClick={() => setSelectedDate(null)}
    >
      Back to Dates
    </button>
  </div>
)}
    </div>
  );
};

export default Analytics;