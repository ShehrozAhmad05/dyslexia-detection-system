import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Pages (to be created)
// import Home from './pages/Home';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Dashboard from './pages/Dashboard';
// import Assessment from './pages/Assessment';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Multimodal Dyslexia Detection System</h1>
          <p>AI-Powered Early Screening & Support</p>
        </header>
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Add more routes as components are created */}
        </Routes>
      </div>
    </Router>
  );
}

// Temporary home page component
const HomePage = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>Welcome to Dyslexia Detection System</h2>
    <p>Your comprehensive AI-powered assessment platform</p>
    <div style={{ marginTop: '2rem' }}>
      <h3>Features:</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li>📝 Handwriting Analysis</li>
        <li>⌨️ Keystroke Dynamics Assessment</li>
        <li>👁️ Reading Pattern Evaluation</li>
        <li>🧠 AI-Powered Risk Assessment</li>
        <li>📊 Explainable Results</li>
        <li>🎯 Personalized Therapy Recommendations</li>
      </ul>
    </div>
  </div>
);

export default App;
