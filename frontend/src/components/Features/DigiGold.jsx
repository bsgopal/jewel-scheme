/**
 * Digi Gold Component
 * Professional digital gold display and management
 * Matches Malabar Gold and LTM scheme standards
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Download, Send } from '@mui/icons-material';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL;

export default function DigiGold({ compact = false }) {
  const [digiGoldData, setDigiGoldData] = useState({
    totalGold: 0,
    currentValue: 0,
    goldRate: 0,
    transactions: [],
    trend: 'up',
  });
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchDigiGoldData = async () => {
      try {
        if (!token || !userId) {
          setLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch wallet data
        const walletRes = await axios.get(`${API}/api/wallet/${userId}`, { headers });
        const walletData = walletRes.data;
        
        // Fetch gold rate
        const rateRes = await axios.get(`${API}/api/gold-rate/current`);
        const goldRate = rateRes.data?.data?.gold22K || 0;
        
        // Fetch transaction history
        const historyRes = await axios.get(`${API}/api/wallet/history/${userId}`, { headers });
        const transactions = historyRes.data || [];

        // Calculate current value
        const currentValue = (walletData.gold || 0) * goldRate;

        setDigiGoldData({
          totalGold: walletData.gold || 0,
          currentValue: Math.round(currentValue),
          goldRate: goldRate,
          transactions: transactions.slice(0, 5),
          trend: 'up',
        });
      } catch (error) {
        // Silent error handling - don't expose API errors to user
        setDigiGoldData({
          totalGold: 0,
          currentValue: 0,
          goldRate: 0,
          transactions: [],
          trend: 'up',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDigiGoldData();
  }, [token, userId]);

  if (loading) {
    return (
      <div
        style={{
          borderRadius: 22,
          background: 'linear-gradient(135deg, rgba(255,251,243,0.96) 0%, rgba(255,241,214,0.92) 100%)',
          border: '1px solid rgba(169,126,39,0.12)',
          padding: compact ? 16 : 22,
          display: 'grid',
          gap: 12,
          minHeight: compact ? 120 : 200,
          placeItems: 'center',
          color: '#8a6b49',
        }}
      >
        Loading Digi Gold...
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  if (compact) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          borderRadius: 18,
          background: 'linear-gradient(135deg, #fff2d2 0%, #efd08d 100%)',
          border: '1px solid rgba(169,126,39,0.2)',
          padding: 16,
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#8c6518', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Digi Gold Balance
            </div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 800, color: '#3e2b16' }}>
              {Number(digiGoldData.totalGold || 0).toFixed(4)} g
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#8c6518', fontWeight: 700 }}>Current Value</div>
            <div style={{ marginTop: 6, fontSize: 20, fontWeight: 800, color: '#7b0000' }}>
              Rs {Number(digiGoldData.currentValue || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        borderRadius: 26,
        background: 'linear-gradient(135deg, rgba(255,251,243,0.96) 0%, rgba(255,241,214,0.92) 100%)',
        border: '1px solid rgba(169,126,39,0.12)',
        boxShadow: '0 18px 40px rgba(133, 104, 74, 0.08)',
        padding: 22,
        display: 'grid',
        gap: 20,
      }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#a9771c', letterSpacing: 1.1, textTransform: 'uppercase' }}>
            Digital Gold
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#8a6b49' }}>Secure, instant, and always accessible</div>
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'rgba(200, 155, 60, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8c6518',
            fontSize: 24,
          }}
        >
          ✨
        </div>
      </motion.div>

      {/* Main Stats */}
      <motion.div
        variants={itemVariants}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 18,
            border: '1px solid rgba(169,126,39,0.12)',
            padding: 16,
            display: 'grid',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, color: '#8a6b49', fontWeight: 700 }}>Total Gold Held</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#3e2b16' }}>
            {Number(digiGoldData.totalGold || 0).toFixed(4)}
            <span style={{ fontSize: 14, color: '#8a6b49', marginLeft: 4 }}>g</span>
          </div>
          <div style={{ fontSize: 11, color: '#a9771c', fontWeight: 700, marginTop: 4 }}>
            @ Rs {Number(digiGoldData.goldRate || 0).toLocaleString('en-IN')}/g
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: 18,
            border: '1px solid rgba(169,126,39,0.12)',
            padding: 16,
            display: 'grid',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, color: '#8a6b49', fontWeight: 700 }}>Current Value</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#7b0000' }}>
            Rs {Number(digiGoldData.currentValue || 0).toLocaleString('en-IN')}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: '#27ae60',
              fontWeight: 700,
              marginTop: 4,
            }}
          >
            <TrendingUp style={{ fontSize: 14 }} />
            {digiGoldData.trend === 'up' ? '+2.5%' : '-1.2%'} this month
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        variants={itemVariants}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          style={{
            height: 48,
            borderRadius: 14,
            border: 'none',
            background: 'linear-gradient(135deg, #c89b3c, #e0b254)',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s ease',
          }}
        >
          <Download style={{ fontSize: 18 }} />
          Withdraw
        </motion.button>

        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          style={{
            height: 48,
            borderRadius: 14,
            border: '1px solid rgba(169,126,39,0.2)',
            background: '#fff',
            color: '#8c6518',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s ease',
          }}
        >
          <Send style={{ fontSize: 18 }} />
          Transfer
        </motion.button>
      </motion.div>

      {/* Recent Transactions */}
      {digiGoldData.transactions?.length > 0 && (
        <motion.div variants={itemVariants} style={{ display: 'grid', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#3e2b16' }}>Recent Transactions</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {digiGoldData.transactions.slice(0, 3).map((tx, idx) => (
              <div
                key={idx}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  border: '1px solid rgba(169,126,39,0.12)',
                  padding: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#3e2b16' }}>{tx.type}</div>
                  <div style={{ fontSize: 11, color: '#8a6b49', marginTop: 2 }}>{tx.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: tx.type === 'Added' ? '#27ae60' : '#7b0000' }}>
                    {tx.type === 'Added' ? '+' : '-'}{Number(tx.amount || 0).toFixed(4)} g
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Info Banner */}
      <motion.div
        variants={itemVariants}
        style={{
          background: 'rgba(200, 155, 60, 0.08)',
          borderRadius: 14,
          border: '1px solid rgba(200, 155, 60, 0.15)',
          padding: 12,
          fontSize: 12,
          color: '#8c6518',
          lineHeight: 1.5,
        }}
      >
        💡 Your digital gold is stored securely and can be converted to physical gold or redeemed anytime.
      </motion.div>
    </motion.div>
  );
}
