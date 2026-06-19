// frontend/src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/glass.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/executive', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.root}>
      <div style={styles.bg} />

      <form style={styles.card} onSubmit={handleSubmit} noValidate>
        <div style={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="rgba(66,153,225,0.15)" />
            <path d="M13 20h14M20 13v14" stroke="#63b3ed" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1 style={styles.title}>Call Master</h1>
        <p style={styles.subtitle}>Executive Dashboard</p>

        {error && (
          <div style={styles.error} role="alert">
            {error}
          </div>
        )}

        <label style={styles.label} htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          placeholder="you@company.com"
          autoComplete="email"
          required
          disabled={loading}
        />

        <label style={styles.label} htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          disabled={loading}
        />

        <button type="submit" style={loading ? { ...styles.btn, opacity: 0.7 } : styles.btn} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg)',
    position: 'relative',
    overflow: 'hidden',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(66,153,225,0.12) 0%, transparent 70%),' +
      'radial-gradient(ellipse 50% 50% at 80% 80%, rgba(128,90,213,0.08) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: 400,
    margin: '0 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 'var(--radius-xl)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.40)',
    padding: '40px 36px',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  logo: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    margin: 0,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: '-0.5px',
    background: 'linear-gradient(135deg,#63b3ed,#9f7aea)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    margin: '4px 0 28px',
    textAlign: 'center',
    fontSize: 14,
    color: 'var(--color-text-muted)',
  },
  error: {
    background: 'rgba(252,129,129,0.10)',
    border: '1px solid rgba(252,129,129,0.30)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-danger)',
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 20,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text)',
    fontSize: 15,
    padding: '11px 14px',
    outline: 'none',
    transition: 'border-color 150ms ease',
    fontFamily: 'var(--font-sans)',
  },
  btn: {
    marginTop: 28,
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #4299e1, #805ad5)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 150ms ease, transform 150ms ease',
    letterSpacing: '0.2px',
  },
};
