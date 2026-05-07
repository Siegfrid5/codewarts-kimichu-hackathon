import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Sprout, LayoutDashboard, MessageSquare, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import FarmRegistration from './pages/FarmRegistration';
import Chatbot from './pages/Chatbot';
import Education from './pages/Education';
import LanguageToggle from './components/LanguageToggle';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { en } from './translations/en';
import { tl } from './translations/tl';
import './index.css';

function Navbar() {
  const { language } = useLanguage();
  const translations = language === 'en' ? en : tl;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      style={{
        position: 'fixed',
        top: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        padding: '0.75rem 1.5rem',
        borderRadius: '9999px',
        background: scrolled 
          ? 'rgba(255, 255, 255, 0.95)' 
          : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: scrolled ? 'blur(20px)' : 'blur(12px)',
        border: '1px solid var(--border-glass)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ margin: 0, fontWeight: 700, letterSpacing: '0.05em', fontSize: '1.25rem', color: 'var(--accent-primary)' }}>
            GABAYANI
          </h2>
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/education" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            Education
          </Link>
          <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            {translations.nav.dashboard}
          </Link>
          <Link to="/consultant" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            {translations.nav.consultant}
          </Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            {translations.nav.register}
          </Link>
          <LanguageToggle />
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/register" element={<FarmRegistration />} />
          <Route path="/consultant" element={<Chatbot />} />
          <Route path="/education" element={<Education />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
