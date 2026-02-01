import React, { useState } from "react";
import axios from "axios";

function StudentForm({ setResult, setStudentId }) {
  const [formData, setFormData] = useState({
    student_id: "",
    attendance_current: "",
    attendance_prev: "",
    assignment_delay_avg: "",
    marks_std: "",
    lms_logins: "",
    total_days: ""
  });
  const [errorMsg, setErrorMsg] = useState('');
  const postEndpoints = [
    'http://127.0.0.1:8000/predict',
    'http://localhost:8000/predict',
    '/predict'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setErrorMsg('');
  };

  // Try post to a list of endpoints in order until success; collect attempt details for better errors
  const tryPostPredict = async (payload) => {
    const attempts = [];
    for (const url of postEndpoints) {
      try {
        const res = await axios.post(url, payload);
        return res;
      } catch (err) {
        const status = err.response ? err.response.status : null;
        const body = err.response ? err.response.data : null;
        attempts.push({ url, status, body, message: err.message });
        // If server-side error (5xx), stop and surface details immediately
        if (status && status >= 500) {
          const e = new Error(`Server error at ${url}: ${status}`);
          e.attempts = attempts;
          throw e;
        }
        // otherwise continue to next endpoint
      }
    }
    const e = new Error('All endpoints failed');
    e.attempts = attempts;
    throw e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      student_id: formData.student_id,
      attendance_current: Number(formData.attendance_current),
      attendance_prev: Number(formData.attendance_prev),
      assignment_delay_avg: Number(formData.assignment_delay_avg),
      marks_std: Number(formData.marks_std),
      lms_logins: Number(formData.lms_logins),
      total_days: Number(formData.total_days)
    };

    try {
      const response = await tryPostPredict(payload);
      setResult(response.data);
      setStudentId(formData.student_id);  // Set studentId for history fetch

      // Notify other parts of the app (analytics) that a new prediction was created
      try {
        window.dispatchEvent(new CustomEvent('prediction:created', { detail: { student_id: formData.student_id } }));
      } catch (e) { /* ignore */ }

      setErrorMsg('');
    } catch (error) {
      console.error("Prediction error:", error);
      // Format attempts if available
      let details = '';
      if (error.attempts && Array.isArray(error.attempts)) {
        details = error.attempts.map(a => `${a.url} => ${a.status || 'no-response'} : ${a.body ? JSON.stringify(a.body) : a.message}`).join('; ');
      } else if (error.response && error.response.data) {
        details = JSON.stringify(error.response.data);
      } else {
        details = error.message || 'No details';
      }
      setErrorMsg(`Failed to connect to backend. Tried endpoints: ${postEndpoints.join(', ')}. Error: ${details}.\nMake sure the backend is running (e.g. run: uvicorn backend.main:app --reload)`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Enter Student Data</h2>
      {errorMsg && <div style={{ background: '#ffe6e6', color: '#900', padding: 8, borderRadius: 6, marginBottom: 8 }}>{errorMsg}</div>}
      <label>Student ID</label><br />
      <input
        type="text"
        name="student_id"
        onChange={handleChange}
        required
      /><br />
      <label>Attendance Current</label><br />
      <input type="number" name="attendance_current" onChange={handleChange} required /><br />

      <label>Attendance Previous</label><br />
      <input type="number" name="attendance_prev" onChange={handleChange} required /><br />

      <label>Assignment Delay Average</label><br />
      <input type="number" name="assignment_delay_avg" onChange={handleChange} required /><br />

      <label>Marks Standard Deviation</label><br />
      <input type="number" name="marks_std" onChange={handleChange} required /><br />

      <label>LMS Logins</label><br />
      <input type="number" name="lms_logins" onChange={handleChange} required /><br />

      <label>Total Days</label><br />
      <input type="number" name="total_days" onChange={handleChange} required /><br /><br />

      <button type="submit">Predict Risk</button>
    </form>
  );
}

export default StudentForm;