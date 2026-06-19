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
      {/* Left panel — branding */}
      <div style={S.left}>
        <div style={S.leftInner}>
          <div style={S.logoRow}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
              <rect width="32" height="32" rx="8" fill="#3b82f6" opacity=".15"/>
              <path d="M8 22 L16 10 L24 22" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11 18 L21 18" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={S.logoText}>Call Master</span>
          </div>
          <h1 style={S.headline}>Enterprise Analytics<br/>Command Center</h1>
          <p style={S.tagline}>Real-time insights across processes, branches,<br/>agents and quality outcomes.</p>
          <div style={S.statGrid}>
            {[
              { label: 'Live Processes', value: '16+' },
              { label: 'Calls Tracked', value: '1M+' },
              { label: 'QA Parameters', value: '50+' },
            ].map(s => (
              <div key={s.label} style={S.stat}>
                <div style={S.statVal}>{s.value}</div>
                <div style={S.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={S.right}>
        <form style={S.form} onSubmit={handleSubmit} noValidate>
          <h2 style={S.formTitle}>Sign in</h2>
          <p style={S.formSub}>Access your executive dashboard</p>

          {error && (
            <div role="alert" style={S.errorBox}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5"/>
                <path d="M8 5v4M8 11v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <div style={S.fieldGroup}>
            <label style={S.label} htmlFor="email">Email address</label>
            <input
              id="email" type="email" autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              style={S.input} placeholder="you@company.com"
              required disabled={loading}
            />
          </div>

          <div style={S.fieldGroup}>
            <label style={S.label} htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password" type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                style={{ ...S.input, paddingRight: 44 }}
                placeholder="••••••••" required disabled={loading}
              />
              <button
                type="button" onClick={() => setShowPw(v => !v)}
                style={S.pwToggle} aria-label={showPw ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPw ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" style={loading ? { ...S.btn, opacity: 0.6, cursor: 'not-allowed' } : S.btn} disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <span style={S.btnSpinner} /> Signing in…
              </span>
            ) : 'Sign In'}
          </button>

          <p style={S.hint}>Contact your administrator to get access.</p>
        </form>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important; outline: none; }
        button[type=submit]:hover:not(:disabled) { background: #2563eb !important; }
      `}</style>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex', minHeight: '100dvh',
    background: 'var(--bg-base)', fontFamily: 'var(--font-sans)',
  },
  left: {
    flex: '1 1 55%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #0b1628 50%, #0d1f3c 100%)',
    borderRight: '1px solid var(--border-subtle)',
    padding: '48px',
  },
  leftInner: { maxWidth: 440 },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 },
  logoText: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' },
  headline: {
    fontSize: 34, fontWeight: 700, lineHeight: 1.25,
    color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 16,
  },
  tagline: { fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 48 },
  statGrid: { display: 'flex', gap: 32 },
  stat: {},
  statVal: { fontSize: 24, fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' },
  statLabel: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' },

  right: {
    flex: '0 0 420px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '48px 40px', background: 'var(--bg-surface)',
  },
  form: { width: '100%', maxWidth: 340 },
  formTitle: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 },
  formSub: { fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 },

  errorBox: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
    background: 'var(--status-danger-bg)', border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 'var(--r-md)', color: '#ef4444', padding: '10px 12px',
    fontSize: 12, marginBottom: 20, lineHeight: 1.5,
  },

  fieldGroup: { marginBottom: 18 },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 },
  input: {
    width: '100%', display: 'block',
    background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
    borderRadius: 'var(--r-md)', color: 'var(--text-primary)', fontSize: 13,
    padding: '10px 12px', transition: 'border-color var(--t-fast), box-shadow var(--t-fast)',
    fontFamily: 'var(--font-sans)',
  },
  pwToggle: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: 'var(--text-muted)',
    cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'color var(--t-fast)',
  },
  btn: {
    width: '100%', padding: '11px 16px', marginTop: 8,
    background: 'var(--accent-blue)', border: 'none',
    borderRadius: 'var(--r-md)', color: '#fff', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'background var(--t-fast)', letterSpacing: '0.1px',
    fontFamily: 'var(--font-sans)',
  },
  btnSpinner: {
    display: 'inline-block', width: 14, height: 14,
    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
    borderRadius: '50%', animation: 'spin 0.7s linear infinite',
  },
  hint: { marginTop: 20, textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' },
};
