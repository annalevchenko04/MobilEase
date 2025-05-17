// ActivityComparisonChart.jsx
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

const ActivityComparisonChart = ({ data }) => {
  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: "Activity Emissions (kg CO₂e)",
        data: Object.values(data),
        backgroundColor: "rgba(75,192,192,0.6)"
      }
    ]
  };

  const options = {
    responsive: true,
    // This is crucial to let the chart fill the container
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Activity Comparison" }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return <Bar data={chartData} options={options} />;
};

export default ActivityComparisonChart;
