import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function RiskPie({ risk, confidence }) {
  const conf = typeof confidence === 'number' ? confidence : 0;

  // Default labels and colors for Low/Medium/High
  let labels = ["Low", "Medium", "High"];
  let backgroundColor = ["#4CAF50", "#FFC107", "#F44336"];
  let datasetData;

  // If a valid risk is provided, show that slice. Otherwise show a neutral 'No prediction' slice.
  if (risk === "Low" || risk === "Medium" || risk === "High") {
    datasetData = [
      risk === "Low" ? 1 : 0,
      risk === "Medium" ? 1 : 0,
      risk === "High" ? 1 : 0,
    ];
  } else {
    labels = ["No prediction"];
    backgroundColor = ["#9E9E9E"];
    datasetData = [1];
  }

  const data = {
    labels,
    datasets: [
      {
        data: datasetData,
        backgroundColor,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,  // Hide legend since it's single value
      },
      tooltip: {
        callbacks: {
          label: () => `${risk ?? 'Unknown'} Risk - Confidence: ${(conf * 100).toFixed(2)}%`
        }
      }
    }
  };

  return (
    <div className="pie-wrapper" style={{ margin: "0 auto" }}>
      <Pie data={data} options={options} />
      <div className="pie-overlay">
        <div className="risk-label">{risk ?? 'Unknown'}</div>
        <div className="risk-confidence">{(conf * 100).toFixed(0)}%</div>
      </div>
    </div>
  );
}

export default RiskPie;