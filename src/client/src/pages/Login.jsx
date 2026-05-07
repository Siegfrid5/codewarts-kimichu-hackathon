import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, AlertTriangle } from 'lucide-react';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 64px)', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      background: 'var(--surface-1)'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo/brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--rounded-full)',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Leaf size={28} color="white" />
          </div>
          <h2 style={{ 
            margin: 0,
            fontSize: '30px',
            fontWeight: 700,
            letterSpacing: '-0.3px'
          }}>Welcome back</h2>
          <p style={{ 
            color: 'var(--ink-muted)', 
            marginTop: '8px',
            fontSize: '16px'
          }}>
            Sign in to your GaBayAni account
          </p>
        </div>

        {/* Login card */}
        <div style={{ 
          background: 'var(--canvas)',
          borderRadius: 'var(--rounded-xl)',
          padding: '40px 32px',
          boxShadow: 'var(--shadow-float)',
          border: '1px solid var(--hairline)'
        }}>
          {error && (
            <div style={{ 
              background: '#FDECEA',
              border: '1px solid rgba(231,76,60,0.2)',
              borderRadius: 'var(--rounded-md)',
              padding: '14px 16px', 
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--semantic-error)'
            }}>
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label">
                Username, Email, or Phone
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="form-input"
                placeholder="Enter your username, email, or phone"
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label className="form-label">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div style={{ 
            textAlign: 'center', 
            marginTop: '24px',
            fontSize: '15px',
            color: 'var(--ink-muted)' 
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ 
              color: 'var(--primary)', 
              fontWeight: 600,
              textDecoration: 'none'
            }}>
              Register your farm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
