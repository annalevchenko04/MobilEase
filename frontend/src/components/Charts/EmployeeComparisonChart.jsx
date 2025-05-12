// EmployeeComparisonChart.jsx
import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const EmployeeComparisonChart = ({ employees }) => {
  const labels = employees.map(emp => emp.name);
  const footprints = employees.map(emp => emp.totalFootprint);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Total Carbon Footprint (kg CO₂e)",
        data: footprints,
        backgroundColor: "rgba(153,102,255,0.6)"
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Fill container
    plugins: {
      legend: { position: "top" }
    },
    scales: {
  y: {
    beginAtZero: true,
    suggestedMax: 1000  // adjust as needed based on typical max footprint
  }
}

  };

  return (
      <div style={{height: "380px"}}>
        <h5 className="title is-5">Employee Carbon Footprint Comparison</h5>
        <Bar data={chartData} options={options}/>
      </div>
  );

};

export default EmployeeComparisonChart;
