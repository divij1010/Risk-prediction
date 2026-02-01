import React, { useState, useEffect } from "react";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import TeacherDashboard from "./pages/TeacherDashboard";


function App() {
  const [viewMode, setViewMode] = useState(localStorage.getItem("viewMode") || "compact");

  useEffect(() => {
    localStorage.setItem("viewMode", viewMode);
  }, [viewMode]);

  const toggleView = () => setViewMode((v) => (v === "compact" ? "wide" : "compact"));

  const [showTeacher, setShowTeacher] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className={`App ${viewMode} ${theme === 'light' ? 'theme-light' : ''} ${switching ? 'theme-switching' : ''}`} style={{ padding: "20px" }}>
      <div className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="navbar">
          <div className="brand">
            <img className="logo-img" src="/logo.svg" alt="ASRIPS logo" style={{ width: 36, height: 36 }} />
            <div className="brand-text">
              <div style={{fontWeight:700}}>ASRIPS</div>
              <div style={{fontSize:11, opacity:0.9}}>Student Risk Prediction</div>
            </div>
          </div>
        </div>

        <div className="header-controls">
          <button className="view-toggle" onClick={() => setShowTeacher(s => !s)} aria-pressed={showTeacher} style={{marginRight: 8}}>
            <img src="/icons/teacher.svg" alt="Teacher" style={{width:16, height:16, marginRight:8}} /> {showTeacher ? 'App Dashboard' : 'Teacher Dashboard'}
          </button>

          <button className="view-toggle" onClick={toggleView} aria-pressed={viewMode === 'wide'}>
            <img src="/icons/expand.svg" alt="Toggle view" style={{width:16, height:16, marginRight:8}} /> {viewMode === "compact" ? "Switch to Wide view" : "Switch to Compact view"}
          </button>

          <button className="view-toggle" onClick={() => { setSwitching(true); setTheme(t => t === 'light' ? 'dark' : 'light'); setTimeout(()=>setSwitching(false), 380); }} style={{ marginLeft: 10 }} aria-label="Toggle theme">
            <img src={theme === 'light' ? '/icons/moon.svg' : '/icons/sun.svg'} alt="Theme" style={{width:16, height:16}} />
          </button>
        </div>
      </div>

      {showTeacher ? (
        <TeacherDashboard />
      ) : (
        <Dashboard viewMode={viewMode} setShowTeacher={setShowTeacher} />
      )}
    </div>
  );
}

export default App;
