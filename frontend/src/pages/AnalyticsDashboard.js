import React, { useEffect, useState } from 'react';
import axios from 'axios';

function AnalyticsDashboard({ compact = false }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/analytics-summary');
      setSummary(res.data);
      setLastUpdated(new Date().toISOString());
    } catch (e) {
      console.error('Failed to load analytics', e);
      setError(e.message || 'Failed to fetch');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    const handler = () => {
      // re-fetch when a new prediction is created
      fetchAnalytics();
    };
    window.addEventListener('prediction:created', handler);
    return () => window.removeEventListener('prediction:created', handler);
  }, []);

  if (loading) return <div style={{ padding: 12 }}>Loading analytics...</div>;
  if (error) return <div style={{ padding: 12, color: 'red' }}>Analytics error: {error} <button onClick={fetchAnalytics}>Retry</button></div>;
  if (!summary) return <div style={{ padding: 12 }}>No analytics data available.</div>;

  const counts = summary.counts || {}; // { Low, Medium, High }
  const total = summary.total_students || (counts.Low || 0) + (counts.Medium || 0) + (counts.High || 0);

  return (
    <div style={{ padding: compact ? 8 : 12, background: compact ? 'transparent' : 'white', borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontWeight: 700 }}>Analytics</div>
        <div style={{ color: '#666', fontSize: 12 }}>Last: {lastUpdated ? new Date(lastUpdated).toLocaleString() : '—'}</div>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={fetchAnalytics}>Refresh</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
        <div style={{ padding: 8 }}>
          <div style={{ fontSize: 12, color: '#666' }}>Total students</div>
          <div style={{ fontWeight: 700 }}>{total}</div>
        </div>
        <div style={{ padding: 8 }}>
          <div style={{ fontSize: 12, color: '#666' }}>High risk</div>
          <div style={{ fontWeight: 700 }}>{counts.High || 0}</div>
        </div>
        <div style={{ padding: 8 }}>
          <div style={{ fontSize: 12, color: '#666' }}>Medium risk</div>
          <div style={{ fontWeight: 700 }}>{counts.Medium || 0}</div>
        </div>
        <div style={{ padding: 8 }}>
          <div style={{ fontSize: 12, color: '#666' }}>Low risk</div>
          <div style={{ fontWeight: 700 }}>{counts.Low || 0}</div>
        </div>
      </div>

      {!compact && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, color: '#333' }}>Preview rows: { (summary.rows || []).slice(0,3).map(r => ` ${r.student_id || r.id || ''}(${r.risk_level || r.risk})`).join(',') }</div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsDashboard;