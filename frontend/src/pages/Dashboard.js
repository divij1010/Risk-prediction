import React, { useState, useEffect } from "react";
import StudentForm from "../components/StudentForm";
import ResultCard from "../components/ResultCard";

function Dashboard({ viewMode = 'compact', setShowTeacher }) {
  const [result, setResult] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    // Quick hero stats for teachers and general view
    fetch("http://localhost:8000/teacher-summary")
      .then((r) => r.json())
      .then((data) => setSummary(data))
      .catch((_) => setSummary(null));
  }, []);

  const renderHero = () => {
    if (!summary) return (
      <div className="hero">
        <div className="hero-card">
          <div className="hero-stat">
            <div className="title">Loading summary...</div>
          </div>
        </div>
      </div>
    );

    const counts = summary.counts || { Low: 0, Medium: 0, High: 0 };
    const total = summary.total_students || 0;
    const avg_conf = Math.round((summary.avg_confidence || 0) * 100) / 100;
    const highPercent = total > 0 ? Math.round((counts.High / (counts.Low + counts.Medium + counts.High)) * 100) : 0;

    return (
      <div className="hero">
        <div className="hero-card" onClick={() => setShowTeacher ? setShowTeacher(true) : null} style={{ cursor: setShowTeacher ? 'pointer' : 'default' }}>
          <div className="hero-stat">
            <div className="title">Total students</div>
            <div className="value">{total}</div>
          </div>
          <div className="hero-stat">
            <div className="title">Average confidence</div>
            <div className="value">{avg_conf}%</div>
          </div>
          <div className="hero-stat">
            <div className="title">High risk share</div>
            <div className="value">{highPercent}%</div>
          </div>
          <div className="kpi-chip">Click to open teacher dashboard →</div>
        </div>
      </div>
    );
  };

  // If there is no prediction yet, show the form centered and full-width for better UX
  if (!result || !studentId) {
    return (
      <div>
        {renderHero()}
        <div className="centered-column">
          <div className="result-card" style={{ marginBottom: 18 }}>
            <h2 style={{marginTop:0}}>No prediction yet</h2>
            <p>Fill the form to the right and submit to view a prediction.</p>
          </div>
          <div>
            <StudentForm setResult={setResult} setStudentId={setStudentId} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {renderHero()}
      <div className={`app-container ${viewMode}`}>
        <div>
          <ResultCard result={result} studentId={studentId} />
        </div>

        <div>
          <StudentForm setResult={setResult} setStudentId={setStudentId} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;