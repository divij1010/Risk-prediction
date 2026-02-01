import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function CohortComparison() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/cohort-stats");
        const cohorts = res.data.cohorts || [];
        const labels = cohorts.map((c) => c.cohort);

        const low = cohorts.map((c) => c.counts.Low || 0);
        const med = cohorts.map((c) => c.counts.Medium || 0);
        const high = cohorts.map((c) => c.counts.High || 0);

        setData({ labels, datasets: [
          { label: "Low", backgroundColor: "#4CAF50", data: low },
          { label: "Medium", backgroundColor: "#FFC107", data: med },
          { label: "High", backgroundColor: "#F44336", data: high },
        ] });
      } catch (e) {
        console.error("Error fetching cohort stats", e);
      }
    };

    fetch();
  }, []);

  if (!data) return <p>Loading cohort comparison...</p>;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
    scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
  };

  return (
    <div style={{ height: 300 }}>
      <h3>Cohort Risk Comparison</h3>
      <Bar data={data} options={options} />
    </div>
  );
}

export default CohortComparison;
