import React, { useEffect, useState } from "react";
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
  const userId = localStorage.getItem("userId") || "self";
  const token = localStorage.getItem("token");
  const API = process.env.REACT_APP_API_URL;
  const [monthlyGold, setMonthlyGold] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    fetchChartData();
  }, []);

  async function fetchChartData() {
    try {
      setError("");
      const res = await axios.get(`${API}/api/wallet/history/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const history = Array.isArray(res.data) ? res.data : res.data?.history || [];
      const monthly = {};

      history.forEach((entry) => {
        if (entry.type !== "convert" && entry.type !== "wallet_payment") return;

        const month = new Date(entry.created_at).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });

        if (!monthly[month]) monthly[month] = 0;
        monthly[month] += Number(entry.gold || 0);
      });

      setMonthlyGold(monthly);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load Digi Gold chart.");
      setMonthlyGold({});
    }
  }

  const labels = Object.keys(monthlyGold);
  const dataPoints = Object.values(monthlyGold);

  const data = {
    labels,
    datasets: [
      {
        label: "Digi Gold Growth (grams)",
        data: dataPoints,
        fill: true,
        borderColor: "#c89b3c",
        tension: 0.4,
        pointBackgroundColor: "#c89b3c",
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(200,155,60,0.45)");
          gradient.addColorStop(1, "rgba(200,155,60,0)");
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
          label: (ctx) => `${Number(ctx.raw || 0).toFixed(4)} g`,
        },
      },
    },
    scales: {
      y: {
        ticks: { color: "#7a5a28" },
        grid: { color: "rgba(122,90,40,0.12)" },
      },
      x: {
        ticks: { color: "#7a5a28" },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ paddingBottom: "80px" }}>
      <div style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(18px)", padding: "18px", borderRadius: "16px", border: "1px solid rgba(169,126,39,0.12)", boxShadow: "0 16px 36px rgba(133, 104, 74, 0.08)" }}>
        <h2 style={{ color: "#4b3519", margin: 0 }}>Digi Gold Growth Chart</h2>
        <p style={{ color: "#8a6b49", margin: "8px 0 16px" }}>
          This graph shows how much gold was accumulated through Digi Gold conversions and scheme usage over time.
        </p>

        {error ? (
          <p style={{ color: "#a33a2b", margin: 0 }}>{error}</p>
        ) : labels.length === 0 ? (
          <p style={{ color: "#8a6b49", margin: 0 }}>No Digi Gold growth data available yet.</p>
        ) : (
          <Line data={data} options={options} />
        )}
      </div>
    </div>
  );
}
