import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../context/UserContext";
import API_URL from "../config";
import TicketSalesChart from "./Charts/TicketSalesChart";
import OccupancyCircle from "./Charts/OccupancyCircle";
import {Link} from "react-router-dom";

const Analytics = () => {
  const [token, userRole] = useContext(UserContext);
  const [dateFilter, setDateFilter] = useState("");
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

  const [revenueStats, setRevenueStats] = useState({ daily: [] });
const [chartMode, setChartMode] = useState("tickets"); // "tickets" | "revenue"

useEffect(() => {
  if (userRole !== "admin") return;
  fetch(`${API_URL}/admin/analytics/revenue`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => setRevenueStats(data));
}, [userRole, token]);
const [rentalRevenueStats, setRentalRevenueStats] = useState({ daily: [] });

useEffect(() => {
  if (userRole !== "admin") return;
  fetch(`${API_URL}/admin/analytics/rental-revenue`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => setRentalRevenueStats(data));
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
      <div className="has-text-centered" style={{ marginBottom: 16, display: "flex", gap: 8, justifyContent: "center" }}>
  {[
    { key: "tickets", label: "🎟 Tickets Sold" },
    { key: "revenue", label: "🚌 Bus Revenue" },
    { key: "rental", label: "🚗 Car Rental Revenue" },
  ].map(({ key, label }) => (
    <button
      key={key}
      className={`button is-medium ${chartMode === key ? "is-primary" : "is-primary is-outlined"}`}
      style={{ borderWidth: '3px' }}
      onClick={() => setChartMode(key)}
    >
      {label}
    </button>
  ))}
</div>

<div style={{ marginBottom: "40px" }}>
  <TicketSalesChart
    data={
      chartMode === "tickets" ? ticketStats :
      chartMode === "revenue" ? revenueStats :
      rentalRevenueStats
    }
    valueKey={chartMode === "tickets" ? "count" : "total"}
    yLabel={
      chartMode === "tickets" ? "Tickets Sold" :
      chartMode === "revenue" ? "Bus Revenue (€)" :
      "Car Rental Revenue (€)"
    }
    isRevenue={chartMode !== "tickets"}
  />
</div>
<h1 className="title is-2">Occupancy heatmap</h1>

{/* Date filter */}
<div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
  <input
    type="date"
    className="input"
    style={{ maxWidth: 200 }}
    value={dateFilter}
    onChange={e => { setDateFilter(e.target.value); setSelectedRoute(null); setSelectedDate(null); }}
  />
  {dateFilter && (
    <button className="button is-small is-light" onClick={() => { setDateFilter(""); setSelectedRoute(null); setSelectedDate(null); }}>
      Clear
    </button>
  )}
</div>

{/* Routes filtered by date */}
{!selectedRoute && (
  <div>
    <h2 className="title is-5">
      {dateFilter
        ? `Routes on ${new Date(dateFilter).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`
        : "Select Route"}
    </h2>
    {Object.keys(groupedByRoute)
      .filter(route =>
        !dateFilter || groupedByRoute[route].some(ev => ev.date === dateFilter)
      )
      .map(route => (
        <button
          key={route}
          className="button is-link is-light"
          style={{ margin: "5px" }}
          onClick={() => { setSelectedRoute(route); setSelectedDate(dateFilter || null); }}
        >
          {route}
        </button>
      ))}
    {dateFilter && Object.keys(groupedByRoute).filter(route =>
      groupedByRoute[route].some(ev => ev.date === dateFilter)
    ).length === 0 && (
      <p style={{ color: "#868e96", fontSize: 13 }}>No routes found for this date.</p>
    )}
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
        {new Date(date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
      </button>
    ))}
    <br/>
    <button className="button is-danger is-light" style={{ marginTop: "20px" }} onClick={() => setSelectedRoute(null)}>
      Back
    </button>
  </div>
)}

{selectedRoute && selectedDate && (
  <div>
    <h2 className="title is-4">
      {selectedRoute} — {new Date(selectedDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
    </h2>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center", marginTop: "20px" }}>
      {groupedByRoute[selectedRoute]
        .filter(ev => ev.date === selectedDate)
        .map(ev => (
          <OccupancyCircle key={ev.event_id} event={ev} />
        ))}
    </div>
    <br/>
    <button className="button is-danger is-light" style={{ marginTop: "20px" }} onClick={() => { setSelectedDate(null); if (dateFilter) setSelectedRoute(null); }}>
      Back to {dateFilter ? "Routes" : "Dates"}
    </button>
  </div>
)}
    </div>
  );
};

export default Analytics;