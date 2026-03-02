import React from "react";
import { Doughnut } from "react-chartjs-2";

const OccupancyCircle = ({ event }) => {
  const percentage = event.occupancy;

  const data = {
    datasets: [
      {
        data: [percentage, 100 - percentage],
        backgroundColor: [
          percentage >= 80
            ? "rgba(76, 175, 80, 0.9)"
            : percentage >= 50
            ? "rgba(255, 193, 7, 0.9)"
            : "rgba(244, 67, 54, 0.9)",
          "rgba(230, 230, 230, 0.3)"
        ],
        borderWidth: 0
      }
    ]
  };

  const options = {
    cutout: "70%",
    responsive: false,          // <-- IMPORTANT
    maintainAspectRatio: false, // <-- IMPORTANT
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    }
  };

  return (
    <div
      style={{
        width: "150px",
        height: "150px",
        position: "relative",
        margin: "10px"
      }}
    >
      <Doughnut data={data} options={options} />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "20px",
          fontWeight: "bold"
        }}
      >
        {percentage}%
      </div>

      <div style={{ textAlign: "center", marginTop: "10px", fontSize: "14px" }}>
        {event.date} {event.time}
        <br />
        {event.name}
      </div>
    </div>
  );
};

export default OccupancyCircle;