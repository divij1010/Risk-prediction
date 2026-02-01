import React, { useState, useEffect } from "react";
import axios from "axios";
import RiskChart from "./RiskChart";
import RiskPie from "./RiskPie";
import RiskTrend from "./RiskTrend";

function ResultCard({ result, studentId }) {
  const [riskHistory, setRiskHistory] = useState([]);

  useEffect(() => {
    if (studentId) {
      const fetchRiskHistory = async () => {
        try {
          const response = await axios.get(`http://127.0.0.1:8000/student-history/${studentId}`);
          console.log(response.data);  // For debugging

          // Transform data: Zip timestamps and risks into array of objects, map risks to numbers
          const mappedData = response.data.timestamps.map((ts, index) => ({
            timestamp: new Date(ts).toLocaleTimeString(),  // Nicer format for X-axis
            risk_level: response.data.risks[index] === "Low" ? 1 :
                        response.data.risks[index] === "Medium" ? 2 : 3
          }));

          setRiskHistory(mappedData);
        } catch (error) {
          console.error("Error fetching risk history:", error);
        }
      };

      fetchRiskHistory();
    }
  }, [studentId]);  // Re-fetch when studentId changes

  const [followUp, setFollowUp] = useState(false);

  const timestamp = new Date().toLocaleString();

  const exportJSON = () => {
    const payload = {
      student_id: result.student_id || studentId,
      risk_level: result.risk_level,
      confidence: result.confidence,
      recommended_action: result.recommended_action,
      reasons: result.reasons,
      generated_at: timestamp,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prediction_${payload.student_id || 'unknown'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendAlert = () => {
    // Placeholder demo action
    alert(`Alert sent for student ${result.student_id || studentId} (demo)`);
  };

  return (
    <div className="result-card">
      <div className="result-header">
        <h2 className="result-title">Prediction Result</h2>
        <div>
          <span className="badge">{result.risk_level}</span>
          <span className="confidence">Confidence: {(result.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div className="quick-stats" style={{marginTop: '12px'}}>
        <div className="stat">
          <div className="stat-title">Student</div>
          <div className="stat-value">{result.student_id || studentId || '—'}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Predicted</div>
          <div className="stat-value">{timestamp}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Follow-up</div>
          <div className="stat-value">{followUp ? 'Requested' : 'None'}</div>
        </div>
        <div className="actions">
          <button className="btn-icon" onClick={exportJSON}><img src="/icons/download.svg" alt="Download" style={{width:14, height:14}}/> Export JSON</button>
          <button className="btn-icon" onClick={sendAlert} style={{marginLeft: '8px'}}><img src="/icons/bell.svg" alt="Alert" style={{width:14, height:14}}/> Send Alert</button>
          <button className="btn-icon" onClick={() => setFollowUp(!followUp)} style={{marginLeft: '8px'}}><img src="/icons/flag.svg" alt="Follow" style={{width:14, height:14}}/> {followUp ? 'Unmark Follow-up' : 'Mark Follow-up'}</button>
        </div> 
      </div>

      <div className="result-visuals">
        <div>
          <RiskPie risk={result.risk_level} confidence={result.confidence} />
          <div className="legend" style={{marginTop: '12px'}}>
            <span className="legend-item"><span className="dot low"></span>Low</span>
            <span className="legend-item"><span className="dot medium"></span>Medium</span>
            <span className="legend-item"><span className="dot high"></span>High</span>
          </div>
        </div>
        <div className="bar-wrapper">
          <RiskChart risk={result.risk_level} />
        </div>
      </div>

      <h3 style={{marginTop: '22px'}}>Top reasons</h3>
      <ul className="reason-list">
        {result.reasons?.length ? result.reasons.map((reason, index) => (
          <li key={index}><span className="reason-bullet">•</span> {reason}</li>
        )) : <li>No specific reasons provided.</li>}
      </ul>

      <h3>Recommended Action</h3>
      <p>{result.recommended_action}</p>

      {/* ✅ Only render trend if studentId exists and history loaded */}
      {studentId && riskHistory.length > 0 && (
        <>
          <h3>Risk Trend Over Time</h3>
          <RiskTrend riskHistory={riskHistory} />  {/* Pass transformed data as prop */}
        </>
      )}
    </div>
  );
}

export default ResultCard;