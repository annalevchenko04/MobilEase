import React, { useState, useRef } from "react";
import { Line } from "react-chartjs-2";

const TicketSalesChart = ({ data, valueKey = "count", yLabel = "Tickets Sold", isRevenue = false }) => {
  const [mode, setMode] = useState("daily");
  const [selectedMonth, setSelectedMonth] = useState(null);
  const chartRef = useRef(null);

  const formatLabel = (value, mode) => {
    if (mode === "daily") {
      return new Date(value).toLocaleDateString("en-GB", {
        day: "numeric", month: "short"
      });
    }
    if (mode === "weekly") {
      const start = new Date(value);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
    }
    if (mode === "monthly") {
      const [year, month] = value.split("-");
      return new Date(year, month - 1).toLocaleDateString("en-GB", {
        month: "long", year: "numeric"
      });
    }
    return value;
  };

  const dataset = (() => {
    const raw = data[mode] || [];
    if (mode === "weekly" && selectedMonth) {
      return raw.filter(d => d.week.startsWith(selectedMonth));
    }
    return raw;
  })();

  const labels = dataset.map(d =>
    mode === "daily"   ? formatLabel(d.date, "daily") :
    mode === "weekly"  ? formatLabel(d.week, "weekly") :
                         formatLabel(d.month, "monthly")
  );

  const values = dataset.map(d => d[valueKey]);


  const handleClick = (event) => {
    const chart = chartRef.current;
    if (!chart) return;
    const points = chart.getElementsAtEventForMode(event.nativeEvent, "nearest", { intersect: true }, false);
    if (!points.length) return;

    const index = points[0].index;

    // Click on monthly → drill into weekly
    if (mode === "monthly") {
      const clickedMonth = dataset[index].month.slice(0, 7); // "2026-03"
      setSelectedMonth(clickedMonth);
      setMode("weekly");
    }

    // Click on weekly → drill into daily
    if (mode === "weekly") {
      const weekStart = dataset[index].week.slice(0, 10); // "2026-03-09"
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const endStr = weekEnd.toISOString().slice(0, 10);
      // Filter daily data for that week
      setSelectedMonth(weekStart + "__" + endStr);
      setMode("daily_filtered");
    }
  };

  // daily_filtered mode — show only days within selected week
  const finalDataset = (() => {
    if (mode === "daily_filtered" && selectedMonth) {
      const [start, end] = selectedMonth.split("__");
      return (data.daily || []).filter(d => d.date >= start && d.date <= end);
    }
    return dataset;
  })();

  const finalLabels = finalDataset.map(d =>
    mode === "daily" || mode === "daily_filtered" ? formatLabel(d.date, "daily") :
    mode === "weekly"  ? formatLabel(d.week, "weekly") :
                         formatLabel(d.month, "monthly")
  );

  const finalValues = finalDataset.map(d => d[valueKey]);

const chartData = {
  labels: finalLabels,
  datasets: [
    {
      label: isRevenue ? "Revenue Earned" : "Tickets Sold",
      data: finalValues,
      borderColor: "#605fc9",
      backgroundColor: "rgba(96, 95, 201, 0.2)",
      tension: 0.3,
      pointRadius: 5,
      pointHoverRadius: 8,
      pointBackgroundColor: "#605fc9",
    }
  ]
};

  const chartOptions = {
  responsive: true,
  plugins: {
    tooltip: {
      enabled: true,
      callbacks: {
        label: (context) => {
          const value = context.parsed.y;
          return isRevenue
            ? `Revenue: €${value.toFixed(2)}`
            : `Tickets Sold: ${value}`;
        }
      }
    },
    legend: { display: false },
  },
  scales: {
    x: {
      ticks: { maxRotation: 45 },
      title: {
        display: true,
        text: mode === "daily" || mode === "daily_filtered" ? "Date" :
              mode === "weekly" ? "Week" : "Month",
        color: "#868e96",
        font: { size: 12, family: "Arial" },
        padding: { top: 8 }
      }
    },
    y: {
        title: {
        display: true,
        text: yLabel,  // ← use prop
        color: "#868e96",
        font: { size: 12, family: "Arial" },
        padding: { bottom: 8 }
      },
      beginAtZero: true,
      ticks: {
        stepSize: isRevenue ? undefined : 1,
        precision: isRevenue ? 2 : 0,
        callback: isRevenue
          ? (value) => `€${value.toFixed(2)}`  // ← show € symbol on revenue
          : undefined
      }
    }
  },
  onHover: (event, elements) => {
    event.native.target.style.cursor = elements.length ? "pointer" : "default";
  },
};

  const getBreadcrumb = () => {
    if (mode === "daily") return "Daily";
    if (mode === "monthly") return "Monthly";
    if (mode === "weekly") return selectedMonth
      ? `Weekly — ${new Date(selectedMonth).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`
      : "Weekly";
    if (mode === "daily_filtered") {
      const [start] = selectedMonth.split("__");
      const weekOf = new Date(start).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      return `Daily — Week of ${weekOf}`;
    }
  };

  const canDrillUp = mode === "weekly" || mode === "daily_filtered";

  const handleDrillUp = () => {
    if (mode === "daily_filtered") {
      setMode("weekly");
      setSelectedMonth(selectedMonth.split("__")[0].slice(0, 7));
    } else if (mode === "weekly") {
      setMode("monthly");
      setSelectedMonth(null);
    }
  };

  return (
    <div>
      {/* Mode selector */}
      <div style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: 10 }}>
        {["daily", "weekly", "monthly"].map(m => (
          <button
            key={m}
            className={`button ${mode === m || (mode === "daily_filtered" && m === "daily") ? "is-primary" : ""}`}
            onClick={() => { setMode(m); setSelectedMonth(null); }}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Breadcrumb + drill up */}
      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, color: "#868e96", fontFamily: "monospace" }}>
           {getBreadcrumb()}
        </span>
        {canDrillUp && (
          <button
            className="button is-small is-light"
            onClick={handleDrillUp}
          >
            ← Drill Up
          </button>
        )}
        {(mode === "monthly" || mode === "weekly") && (
          <span style={{ fontSize: 11, color: "#adb5bd" }}>
            Click a point to drill down
          </span>
        )}
      </div>

      <Line
        ref={chartRef}
        data={chartData}
        options={chartOptions}
        onClick={handleClick}
      />
    </div>
  );
};

export default TicketSalesChart;