import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import FarmRegistration from './pages/FarmRegistration';
import Chatbot from './pages/Chatbot';
import Education from './pages/Education';
import Login from './pages/Login';
import LanguageToggle from './components/LanguageToggle';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { en } from './translations/en';
import { tl } from './translations/tl';
import './index.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="container" style={{ 
        textAlign: 'center', 
        marginTop: '8rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid var(--primary-light)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>Loading...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function Navbar() {
  const { language } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth();
  const translations = language === 'en' ? en : tl;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path) => location.pathname === path;

  const navLinkStyle = (path) => ({
    textDecoration: 'none',
    padding: '10px 20px',
    borderRadius: 'var(--rounded-pill)',
    fontSize: '14px',
    fontWeight: isActive(path) ? 600 : 500,
    color: isActive(path) ? 'var(--on-primary)' : 'var(--ink)',
    background: isActive(path) ? 'var(--primary)' : 'transparent',
    transition: 'all 0.25s ease',
    whiteSpace: 'nowrap',
    minHeight: '40px',
    display: 'inline-flex',
    alignItems: 'center'
  });

  return (
    <>
      <nav
        id="top-nav"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: '64px',
          padding: '0 var(--space-xl)',
          background: scrolled
            ? 'rgba(255, 255, 255, 0.97)'
            : 'var(--canvas)',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: `1px solid ${scrolled ? 'var(--hairline)' : 'transparent'}`,
          boxShadow: scrolled ? '0 1px 0 var(--hairline)' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Logo */}
          <Link to="/" style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--rounded-full)',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <span style={{ fontSize: '24px' }}>🌿</span>
            </div>
            <span style={{
              fontWeight: 800,
              fontSize: '20px',
              letterSpacing: '-0.3px',
              color: 'var(--primary)',
            }}>
              GaBayAni
            </span>
          </Link>

          {/* Desktop nav links */}
          <div style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
          }}
            className="nav-links-desktop"
          >
            <Link to="/education" style={navLinkStyle('/education')}>
              Education
            </Link>
            <Link to="/dashboard" style={navLinkStyle('/dashboard')}>
              {translations.nav.dashboard}
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/consultant" style={navLinkStyle('/consultant')}>
                  {translations.nav.consultant}
                </Link>
                <Link to="/register" style={navLinkStyle('/register')}>
                  {translations.nav.register}
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    ...navLinkStyle(''),
                    cursor: 'pointer',
                    border: 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/consultant" style={navLinkStyle('/consultant')}>
                  {translations.nav.consultant}
                </Link>
                <Link to="/login" style={navLinkStyle('/login')}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary" style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  minHeight: '40px'
                }}>
                  {translations.nav.register}
                </Link>
              </>
            )}
            <LanguageToggle />
          </div>

          {/* Mobile hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              color: 'var(--ink)',
            }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <span style={{ fontSize: '24px' }}>❌</span> : <span style={{ fontSize: '24px' }}>📋</span>}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="mobile-nav-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            top: '64px',
            zIndex: 999,
            background: 'rgba(27, 52, 33, 0.5)',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            style={{
              background: 'var(--canvas)',
              padding: 'var(--space-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              borderBottom: '1px solid var(--hairline)',
              boxShadow: 'var(--shadow-overlay)',
              animation: 'slideUp 0.25s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Link to="/education" style={{ ...navLinkStyle('/education'), width: '100%', justifyContent: 'flex-start' }}>
              Education
            </Link>
            <Link to="/dashboard" style={{ ...navLinkStyle('/dashboard'), width: '100%', justifyContent: 'flex-start' }}>
              {translations.nav.dashboard}
            </Link>
            <Link to="/consultant" style={{ ...navLinkStyle('/consultant'), width: '100%', justifyContent: 'flex-start' }}>
              {translations.nav.consultant}
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/register" style={{ ...navLinkStyle('/register'), width: '100%', justifyContent: 'flex-start' }}>
                  {translations.nav.register}
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    ...navLinkStyle(''),
                    width: '100%',
                    justifyContent: 'flex-start',
                    cursor: 'pointer',
                    border: 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ ...navLinkStyle('/login'), width: '100%', justifyContent: 'flex-start' }}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary" style={{
                  width: '100%',
                  marginTop: '8px'
                }}>
                  {translations.nav.register}
                </Link>
              </>
            )}
            <div style={{ marginTop: '8px' }}>
              <LanguageToggle />
            </div>
          </div>
        </div>
      )}

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}

function Footer() {
  return (
    <footer style={{
      background: 'var(--inverse-canvas)',
      color: 'var(--inverse-ink-muted)',
      padding: '64px 32px 32px',
      marginTop: 'var(--space-section)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-xl)'
      }}>
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-md)' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--rounded-full)',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '18px' }}>🌿</span>
            </div>
            <span style={{ color: 'var(--inverse-ink)', fontWeight: 800, fontSize: '18px' }}>
              GaBayAni
            </span>
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, opacity: 0.7 }}>
            Guided Agricultural Bulletin and Advisory for Yield and Nutrition Intelligence.
          </p>
        </div>

        {/* Data Sources */}
        <div>
          <h4 style={{ color: 'var(--inverse-ink)', fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 'var(--space-md)', textTransform: 'uppercase' }}>
            Data Sources
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            <span>PAGASA Weather</span>
            <span>Department of Agriculture</span>
            <span>OpenWeather API</span>
          </div>
        </div>

        {/* Platform */}
        <div>
          <h4 style={{ color: 'var(--inverse-ink)', fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 'var(--space-md)', textTransform: 'uppercase' }}>
            Platform
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            <Link to="/dashboard" style={{ color: 'var(--inverse-ink-muted)', textDecoration: 'none' }}>Dashboard</Link>
            <Link to="/education" style={{ color: 'var(--inverse-ink-muted)', textDecoration: 'none' }}>Education</Link>
            <Link to="/consultant" style={{ color: 'var(--inverse-ink-muted)', textDecoration: 'none' }}>AI Consultant</Link>
            <Link to="/register" style={{ color: 'var(--inverse-ink-muted)', textDecoration: 'none' }}>Register Farm</Link>
          </div>
        </div>

        {/* About */}
        <div>
          <h4 style={{ color: 'var(--inverse-ink)', fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 'var(--space-md)', textTransform: 'uppercase' }}>
            About
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            <span>Codewarts Hackathon</span>
            <span>Team Kimichu</span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        marginTop: 'var(--space-xxl)',
        paddingTop: 'var(--space-lg)',
        borderTop: '1px solid var(--inverse-surface-1)',
        textAlign: 'center',
        fontSize: '13px',
        opacity: 0.6
      }}>
        &copy; 2026 GaBayAni — Built for Filipino Farmers 🌾
      </div>
    </footer>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Navbar />
          <main style={{ paddingTop: '64px' }}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<FarmRegistration />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/consultant" element={
                <ProtectedRoute>
                  <Chatbot />
                </ProtectedRoute>
              } />
              <Route path="/education" element={<Education />} />
            </Routes>
          </main>
          <Footer />
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
