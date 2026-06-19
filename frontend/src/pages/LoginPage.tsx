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
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/v1/executive', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.page}>
      {/* Decorative blob — matches reference */}
      <div style={S.blob1} />
      <div style={S.blob2} />

      <div style={S.card}>
        {/* Logo */}
        <div style={S.logoRow}>
          <div style={S.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 12 19.79 19.79 0 011.61 3.4 2 2 0 013.59 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 9.91a16 16 0 006.08 6.08l1.08-.88a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
          </div>
          <span style={S.logoName}>Call Master</span>
        </div>

        <h1 style={S.title}>Welcome back</h1>
        <p style={S.subtitle}>Sign in to your executive dashboard</p>

        {error && (
          <div role="alert" style={S.error}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={S.field}>
            <label style={S.label} htmlFor="email">Email</label>
            <input
              id="email" type="email" autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              style={S.input} placeholder="you@company.com"
              required disabled={loading}
            />
          </div>

          <div style={S.field}>
            <label style={S.label} htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password" type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                style={{ ...S.input, paddingRight: 42 }}
                placeholder="••••••••" required disabled={loading}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} style={S.eyeBtn} tabIndex={-1} aria-label={showPw ? 'Hide' : 'Show'}>
                {showPw
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <button type="submit" style={loading ? { ...S.btn, opacity: 0.7 } : S.btn} disabled={loading}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={S.spinner} /> Signing in…
                </span>
              : 'Sign in to Dashboard'
            }
          </button>
        </form>

        <p style={S.hint}>Contact your administrator for access</p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { outline: none; border-color: #7C5CFC !important; box-shadow: 0 0 0 3px rgba(124,92,252,0.12) !important; }
        button[type=submit]:hover:not(:disabled) { background: #5B3FD9 !important; box-shadow: 0 8px 24px rgba(124,92,252,0.35) !important; }
      `}</style>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#F0F2F8', fontFamily: 'var(--font)', position: 'relative', overflow: 'hidden',
  },
  blob1: {
    position: 'absolute', width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,92,252,0.18) 0%, transparent 70%)',
    top: -100, right: -100, pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(61,213,200,0.15) 0%, transparent 70%)',
    bottom: -80, left: -80, pointerEvents: 'none',
  },
  card: {
    position: 'relative', zIndex: 1, background: '#fff',
    borderRadius: 20, padding: '40px 36px',
    width: '100%', maxWidth: 380,
    boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
    margin: '0 16px',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoIcon: {
    width: 34, height: 34, borderRadius: 9, background: '#7C5CFC',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(124,92,252,0.35)',
  },
  logoName: { fontSize: 15, fontWeight: 700, color: '#1A1D23', letterSpacing: '-0.2px' },
  title: { fontSize: 22, fontWeight: 700, color: '#1A1D23', marginBottom: 6, letterSpacing: '-0.3px' },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 24 },
  error: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 8, color: '#EF4444', padding: '10px 12px',
    fontSize: 12, marginBottom: 18,
  },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 },
  input: {
    width: '100%', display: 'block',
    background: '#F9FAFB', border: '1.5px solid #E5E7EB',
    borderRadius: 10, color: '#1A1D23', fontSize: 13,
    padding: '10px 13px', fontFamily: 'var(--font)',
    transition: 'border-color 0.12s, box-shadow 0.12s',
  },
  eyeBtn: {
    position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', padding: 4,
  },
  btn: {
    width: '100%', padding: '12px', marginTop: 8,
    background: '#7C5CFC', border: 'none', borderRadius: 10,
    color: '#fff', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'background 0.12s, box-shadow 0.12s',
    boxShadow: '0 4px 16px rgba(124,92,252,0.30)',
    fontFamily: 'var(--font)',
  },
  spinner: {
    display: 'inline-block', width: 13, height: 13,
    border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff',
    borderRadius: '50%', animation: 'spin 0.7s linear infinite',
  },
  hint: { textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 18 },
};
