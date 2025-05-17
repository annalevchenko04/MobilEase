// BenchmarkingGaugeChart.jsx
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const BenchmarkingGaugeChart = ({ currentValue, targetValue }) => {
  const percentage = (currentValue / targetValue) * 100;
  const cappedValue = Math.min(currentValue, targetValue);

  const chartData = {
    labels: ['Your Footprint', 'Recommended Limit'],
    datasets: [
      {
        data: [cappedValue, targetValue - cappedValue],
        backgroundColor: ['#36A2EB', '#E0E0E0'],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '70%',
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            if (context.label === 'Your Footprint') {
              return `Your usage: ${percentage.toFixed(1)}% of limit`;
            }
            return `Remaining: ${(100 - Math.min(percentage, 100)).toFixed(1)}%`;
          },
        },
      },
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          boxWidth: 12,
        },
      },
    },
  };

  return (
      <div
          style={{
              height: '380px',
              justifyContent: 'center',
              alignItems: 'center'
          }}
      >
          <h5 className="title is-5">Benchmarking Gauge</h5>
          <div style={{position: 'relative'}}>
              <Doughnut
                  data={chartData}
                  options={options}
                  width={1200}
                  height={1200}
              />

              <div
                  style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#333',
                  }}
              >
                  {currentValue} / {targetValue} kg CO₂e
              </div>
          </div>
      </div>
  );
};

export default BenchmarkingGaugeChart;
