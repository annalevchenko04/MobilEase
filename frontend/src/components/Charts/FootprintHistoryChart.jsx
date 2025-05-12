import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

const FootprintHistoryChart = ({ data }) => {
  const reversed = [...data].reverse();

  const chartData = {
    labels: reversed.map(d => new Date(d.timestamp).toLocaleDateString()),
    datasets: [
    {
      label: "Carbon Footprint (kg CO₂e)",
      data: reversed.map(d => d.value),

        fill: false,
        borderColor: "rgba(75,192,192,1)",
        tension: 0.2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return <div style={{ height: "300px" }}>
     <h5 className="title is-5">Your Carbon Footprint Over Time</h5>
    <Line data={chartData} options={options}/>
  </div>;
};

export default FootprintHistoryChart;
