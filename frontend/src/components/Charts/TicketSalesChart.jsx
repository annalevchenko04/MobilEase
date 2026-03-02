import React, { useState } from "react";
import { Line } from "react-chartjs-2";

const TicketSalesChart = ({ data }) => {
  const [mode, setMode] = useState("daily"); // daily | weekly | monthly

  const dataset = data[mode] || [];

  const labels = dataset.map(d =>
    mode === "daily" ? d.date :
    mode === "weekly" ? d.week :
    d.month
  );

  const values = dataset.map(d => d.count);

  const chartData = {
    labels,
    datasets: [
      {
        label: `Tickets Sold (${mode})`,
        data: values,
        borderColor: "#605fc9",
        backgroundColor: "rgba(96, 95, 201, 0.2)",
        tension: 0.3
      }
    ]
  };

  return (
    <div>

      {/* Mode selector */}
      <div style={{ marginBottom: "15px" }}>
        <button
          className={`button ${mode === "daily" ? "is-primary" : ""}`}
          onClick={() => setMode("daily")}
        >
          Daily
        </button>
        <button
          className={`button ${mode === "weekly" ? "is-primary" : ""}`}
          onClick={() => setMode("weekly")}
          style={{ marginLeft: "10px" }}
        >
          Weekly
        </button>
        <button
          className={`button ${mode === "monthly" ? "is-primary" : ""}`}
          onClick={() => setMode("monthly")}
          style={{ marginLeft: "10px" }}
        >
          Monthly
        </button>
      </div>

      <Line data={chartData} />
    </div>
  );
};

export default TicketSalesChart;