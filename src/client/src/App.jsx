import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Sprout, Activity, LayoutDashboard, MessageSquare } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import FarmRegistration from './pages/FarmRegistration';
import Chatbot from './pages/Chatbot';
import './index.css';

function Navbar() {
  return (
    <nav style={{ padding: '1.5rem 0', borderBottom: '1px solid var(--border-glass)', marginBottom: '2rem' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Sprout size={32} color="var(--accent-primary)" />
          <h2 style={{ margin: 0, fontWeight: 700, letterSpacing: '0.05em' }}>
            <span className="text-gradient">GABAYANI</span>
          </h2>
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/dashboard" className="btn btn-secondary">
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link to="/consultant" className="btn btn-secondary">
            <MessageSquare size={18} />
            AI Consultant
          </Link>
          <Link to="/register" className="btn btn-primary">
            Register Farm
          </Link>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<FarmRegistration />} />
        <Route path="/consultant" element={<Chatbot />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
