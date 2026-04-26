import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler);

export default function GoldChart() {
  const userId = localStorage.getItem("userId");
  const API = process.env.REACT_APP_API_URL;

  const [monthlyGold, setMonthlyGold] = useState([]);

  useEffect(() => {
    fetchChartData();
  }, []);

  async function fetchChartData() {
    try {
      const res = await axios.get(`${API}/api/wallet/history/${userId}`);
      const history = res.data.history;

      const monthly = {}; // group by month

      history.forEach((h) => {
        if (h.type !== "convert" && h.type !== "wallet_payment") return;

        const month = new Date(h.created_at).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });

        if (!monthly[month]) monthly[month] = 0;

        monthly[month] += Number(h.gold_grams || 0);
      });

      setMonthlyGold(monthly);
    } catch (err) {
      console.error("Chart Fetch Error:", err);
    }
  }

  // Chart labels & data
  const labels = Object.keys(monthlyGold);
  const dataPoints = Object.values(monthlyGold);

  const data = {
    labels,
    datasets: [
      {
        label: "Gold Growth (grams)",
        data: dataPoints,
        fill: true,
        borderColor: "#FFD700",
        tension: 0.4,
        pointBackgroundColor: "#FFD700",
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(255,215,0,0.5)");
          gradient.addColorStop(1, "rgba(255,215,0,0)");
          return gradient;
        },
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.raw} g`,
        },
      },
    },
    scales: {
      y: {
        ticks: { color: "white" },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
      x: {
        ticks: { color: "#FFD700" },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ paddingBottom: "80px" }}>
      <h2 style={{ color: "#FFD700", marginBottom: "15px" }}>Gold Growth Chart</h2>

      {labels.length === 0 ? (
        <p style={{ color: "#ccc", textAlign: "center" }}>No gold data available.</p>
      ) : (
        <div
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(18px)",
            padding: "15px",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 4px 25px rgba(255,215,0,0.25)",
          }}
        >
          <Line data={data} options={options} />
        </div>
      )}
    </div>
  );
}
