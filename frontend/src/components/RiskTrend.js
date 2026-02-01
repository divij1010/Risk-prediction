import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

function RiskTrend({ riskHistory }) {
  const [trendData, setTrendData] = useState(null);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    if (!riskHistory || riskHistory.length === 0) {
      setNoData(true);
      return;
    }

    const labels = riskHistory.map(item => item.timestamp);
    const risks = riskHistory.map(item => item.risk_level);

    setTrendData({
      labels: labels,
      datasets: [
        {
          label: "Risk Trend Over Time",
          data: risks,
          borderColor: "#2a5298",
          backgroundColor: "rgba(42,82,152,0.2)",
          tension: 0.4,
          pointRadius: 5
        }
      ]
    });
  }, [riskHistory]);

  if (noData) {
    return <p>No historical data available for this student.</p>;
  }

  if (!trendData) return null;

  return (
    <div style={{ width: "90%", margin: "30px auto" }}>
      <h3>Student Risk Trend</h3>
      <Line data={trendData} />
    </div>
  );
}

export default RiskTrend;