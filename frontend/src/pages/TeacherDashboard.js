import React, { useEffect, useState } from "react";
import axios from "axios";
import CohortComparison from "../components/CohortComparison";
import RiskTrend from "../components/RiskTrend";

function TeacherDashboard() {
  const [summary, setSummary] = useState(null);
  const [cohorts, setCohorts] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/teacher-summary");
        setSummary(res.data);
        const r2 = await axios.get("http://127.0.0.1:8000/cohort-stats");
        setCohorts(r2.data.cohorts || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetch();
  }, []);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [historyForStudent, setHistoryForStudent] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  if (!summary) return <p>Loading teacher dashboard...</p>;

  const exportCohortsCSV = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/cohort-stats");
      const cohorts = res.data.cohorts || [];
      // Build CSV
      let csv = "cohort,low,medium,high,top_students\n";
      cohorts.forEach(c => {
        const tops = (c.top_students || []).map(s => `${s.student_id}(${s.high_count})`).join("|");
        csv += `${c.cohort},${c.counts.Low},${c.counts.Medium},${c.counts.High},"${tops}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'cohort_stats.csv'; a.click(); URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
  };

  const viewHistory = async (student_id) => {
    setLoadingHistory(true);
    setSelectedStudent(student_id);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/student-history/${student_id}`);
      const timestamps = res.data.timestamps || [];
      const risks = res.data.risks || [];
      const mapped = timestamps.map((t, idx) => ({ timestamp: new Date(t).toLocaleString(), risk_level: risks[idx] === 'Low' ? 1 : risks[idx] === 'Medium' ? 2 : 3 }));
      setHistoryForStudent(mapped);
    } catch (e) {
      console.error(e);
      setHistoryForStudent([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const exportCohort = async (cohortKey) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/cohort-export?cohort=${cohortKey}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `cohort_${cohortKey}.csv`; a.click(); window.URL.revokeObjectURL(url);
    } catch (e) { console.error(e); alert('Export failed'); }
  };

  const exportStudentReport = async (student_id) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/student-report/${student_id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `student_${student_id}_report.csv`; a.click(); window.URL.revokeObjectURL(url);
    } catch (e) { console.error(e); alert('Export failed'); }
  };

  const sendAlertForStudent = async (student_id) => {
    const message = window.prompt(`Enter alert message for ${student_id}`);
    if (!message) return;
    try {
      const res = await axios.post('http://127.0.0.1:8000/send-alert', { student_id, message, method: 'manual' });
      if (res.data && res.data.status === 'ok') alert('Alert queued');
      else alert('Alert request failed');
    } catch (e) { console.error(e); alert('Alert failed'); }
  };

  return (
    <div className="teacher-dashboard" style={{ maxWidth: 1000, margin: "20px auto" }}>
      <h2>Teacher Dashboard</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <div className="teacher-card" style={{ background: "white", padding: 12, borderRadius: 8 }}>
          <div style={{ color: "#666" }}>Total Students</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{summary.total_students}</div>
        </div>

        <div className="teacher-card" style={{ background: "white", padding: 12, borderRadius: 8 }}>
          <div style={{ color: "#666" }}>Avg Confidence</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{Math.round((summary.avg_confidence || 0) * 100)}%</div>
        </div>

        <div className="teacher-card" style={{ background: "white", padding: 12, borderRadius: 8 }}>
          <div style={{ color: "#666" }}>High Risk</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{summary.counts.High || 0}</div>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <button className="btn-icon" onClick={exportCohortsCSV} style={{ padding: '8px 12px', borderRadius: 6, background: '#2a5298', color: 'white', border: 'none' }}><img src="/icons/download.svg" alt="Export" style={{width:14, height:14, marginRight:8}}/> Export Cohort CSV</button>
        </div> 
      </div>

      <CohortComparison />

      <h3 style={{ marginTop: 20 }}>Cohort Details</h3>
      <div className="teacher-card" style={{ background: "white", padding: 12, borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={{ padding: 8 }}>Cohort</th>
              <th style={{ padding: 8 }}>Low</th>
              <th style={{ padding: 8 }}>Medium</th>
              <th style={{ padding: 8 }}>High</th>
              <th style={{ padding: 8 }}>Top High Students</th>
            </tr>
          </thead>
          <tbody>
            {cohorts.map((c) => (
              <tr key={c.cohort}>
                <td style={{ padding: 8 }}>{c.cohort}</td>
                <td style={{ padding: 8 }}>{c.counts.Low}</td>
                <td style={{ padding: 8 }}>{c.counts.Medium}</td>
                <td style={{ padding: 8 }}>{c.counts.High}</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => exportCohort(c.cohort)} style={{ marginRight: 8, padding: '6px 10px', borderRadius: 6 }}>Export Cohort</button>
                  {c.top_students.map(s=> (
                  <div key={s.student_id} style={{ display: 'inline-block', marginRight: 8 }}>
                    {s.student_id} ({s.high_count}) 
                    <button className="btn-icon" onClick={() => viewHistory(s.student_id)} style={{ marginLeft: 6, padding: '4px 8px', borderRadius: 6 }}><img src="/icons/eye.svg" alt="View" style={{width:14, height:14}}/></button>
                    <button className="btn-icon" onClick={() => exportStudentReport(s.student_id)} style={{ marginLeft: 6, padding: '4px 8px', borderRadius: 6 }}><img src="/icons/download.svg" alt="Export" style={{width:14, height:14}}/></button>
                    <button className="btn-icon" onClick={() => sendAlertForStudent(s.student_id)} style={{ marginLeft: 6, padding: '4px 8px', borderRadius: 6 }}><img src="/icons/bell.svg" alt="Alert" style={{width:14, height:14}}/></button>
                  </div>
                ))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginTop: 20 }}>Top High Risk Students</h3>
      <div className="teacher-card" style={{ background: "white", padding: 12, borderRadius: 8 }}>
        <ul>
          {(summary.top_high_students || []).map(s => (
            <li key={s.student_id} style={{ marginBottom: 6 }}>
              {s.student_id} — {s.high_count} high-risk events
              <button className="btn-icon" onClick={() => viewHistory(s.student_id)} style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 6 }}><img src="/icons/eye.svg" alt="View" style={{width:14, height:14}}/></button>
              <button className="btn-icon" onClick={() => exportStudentReport(s.student_id)} style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 6 }}><img src="/icons/download.svg" alt="Export" style={{width:14, height:14}}/></button>
              <button className="btn-icon" onClick={() => sendAlertForStudent(s.student_id)} style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 6 }}><img src="/icons/bell.svg" alt="Alert" style={{width:14, height:14}}/></button>
            </li>
          ))}
        </ul>
      </div>

      {selectedStudent && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h3 style={{ margin: 0 }}>History for {selectedStudent}</h3>
            <button onClick={() => { setSelectedStudent(null); setHistoryForStudent(null); }} style={{ marginLeft: 12 }}>Close</button>
            {loadingHistory && <span style={{ marginLeft: 8 }}>Loading...</span>}
          </div>
          {historyForStudent ? (
            <div style={{ background: 'white', padding: 12, borderRadius: 8, marginTop: 8 }}>
              <RiskTrend riskHistory={historyForStudent} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;
