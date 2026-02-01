import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale);

function RiskChart({ risk }) {
  const value =
    risk === "Low" ? 1 : risk === "Medium" ? 2 : 3;

  const data = {
    labels: ["Low", "Medium", "High"],
    datasets: [
      {
        label: "Risk Level",
        data: [
          value === 1 ? 1 : 0,
          value === 2 ? 1 : 0,
          value === 3 ? 1 : 0
        ],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, max: 1.1 }
    }
  };

  return (
    <div style={{ marginTop: "10px", height: '140px' }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export default RiskChart;
