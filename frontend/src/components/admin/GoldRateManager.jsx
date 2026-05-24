import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function GoldRateManager() {
  const API = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  
  const [gold24K, setGold24K] = useState('');
  const [gold22K, setGold22K] = useState('');
  const [gold18K, setGold18K] = useState('');
  const [silver, setSilver] = useState('');
  const [currentRate, setCurrentRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCurrentRate();
  }, []);

  const fetchCurrentRate = async () => {
    try {
      const res = await axios.get(`${API}/api/gold-rate/current`);
      const data = res.data?.data;
      setCurrentRate(data);
      setGold24K(data?.gold24K || '');
      setGold22K(data?.gold22K || '');
      setGold18K(data?.gold18K || '');
      setSilver(data?.silver || '');
    } catch (error) {
      setMessage('Error fetching current rates');
    }
  };

  const handleSetRates = async () => {
    if (!gold24K || !gold22K || !gold18K || !silver) {
      setMessage('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API}/api/gold-rate/set`,
        {
          gold24K: Number(gold24K),
          gold22K: Number(gold22K),
          gold18K: Number(gold18K),
          silver: Number(silver)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage('Gold rates updated successfully!');
      setCurrentRate(res.data?.data);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating rates');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshLive = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API}/api/gold-rate/refresh`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage('Live rates refreshed successfully!');
      setCurrentRate(res.data?.data);
      setGold24K(res.data?.data?.gold24K || '');
      setGold22K(res.data?.data?.gold22K || '');
      setGold18K(res.data?.data?.gold18K || '');
      setSilver(res.data?.data?.silver || '');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error refreshing live rates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={cardStyle}
      >
        <h2 style={titleStyle}>Gold Rate Manager</h2>

        <div style={currentRateStyle}>
          <h3>Current Rates</h3>
          {currentRate && (
            <div style={rateGridStyle}>
              <div>24K: ₹{currentRate.gold24K?.toLocaleString('en-IN')}/g</div>
              <div>22K: ₹{currentRate.gold22K?.toLocaleString('en-IN')}/g</div>
              <div>18K: ₹{currentRate.gold18K?.toLocaleString('en-IN')}/g</div>
              <div>Silver: ₹{currentRate.silver?.toLocaleString('en-IN')}/g</div>
            </div>
          )}
        </div>

        <div style={formStyle}>
          <h3>Update Rates</h3>
          
          <div style={inputGroupStyle}>
            <label>24K Gold Rate (₹/g)</label>
            <input
              type="number"
              value={gold24K}
              onChange={(e) => setGold24K(e.target.value)}
              placeholder="Enter 24K rate"
              style={inputStyle}
            />
          </div>

          <div style={inputGroupStyle}>
            <label>22K Gold Rate (₹/g)</label>
            <input
              type="number"
              value={gold22K}
              onChange={(e) => setGold22K(e.target.value)}
              placeholder="Enter 22K rate"
              style={inputStyle}
            />
          </div>

          <div style={inputGroupStyle}>
            <label>18K Gold Rate (₹/g)</label>
            <input
              type="number"
              value={gold18K}
              onChange={(e) => setGold18K(e.target.value)}
              placeholder="Enter 18K rate"
              style={inputStyle}
            />
          </div>

          <div style={inputGroupStyle}>
            <label>Silver Rate (₹/g)</label>
            <input
              type="number"
              value={silver}
              onChange={(e) => setSilver(e.target.value)}
              placeholder="Enter silver rate"
              style={inputStyle}
            />
          </div>

          <div style={buttonGroupStyle}>
            <motion.button
              onClick={handleSetRates}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                ...buttonStyle,
                background: '#c89b3c',
                color: '#fff'
              }}
            >
              {loading ? 'Updating...' : 'Update Rates'}
            </motion.button>

            <motion.button
              onClick={handleRefreshLive}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                ...buttonStyle,
                background: '#e0b254',
                color: '#3e2b16'
              }}
            >
              {loading ? 'Refreshing...' : 'Refresh Live Rates'}
            </motion.button>
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                marginTop: 15,
                padding: 12,
                borderRadius: 8,
                background: message.includes('Error') ? '#fee' : '#efe',
                color: message.includes('Error') ? '#c33' : '#3c3',
                textAlign: 'center'
              }}
            >
              {message}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const containerStyle = {
  padding: '20px',
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #fffdf8 0%, #fff4df 100%)',
};

const cardStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  background: 'rgba(255,255,255,0.88)',
  backdropFilter: 'blur(18px)',
  borderRadius: 16,
  padding: 24,
  border: '1px solid rgba(169,126,39,0.12)',
  boxShadow: '0 16px 36px rgba(133, 104, 74, 0.08)',
};

const titleStyle = {
  textAlign: 'center',
  color: '#4b3519',
  marginBottom: 24,
};

const currentRateStyle = {
  background: '#fffaf5',
  borderRadius: 12,
  padding: 16,
  marginBottom: 24,
  border: '1px solid rgba(169,126,39,0.16)',
};

const rateGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 12,
  marginTop: 12,
  fontSize: 14,
  color: '#6f5334',
};

const formStyle = {
  marginTop: 24,
};

const inputGroupStyle = {
  marginBottom: 16,
};

const inputStyle = {
  width: '100%',
  padding: 12,
  borderRadius: 8,
  border: '1px solid rgba(169,126,39,0.16)',
  fontSize: 14,
  boxSizing: 'border-box',
  marginTop: 6,
};

const buttonGroupStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  marginTop: 20,
};

const buttonStyle = {
  padding: 12,
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: 14,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};
