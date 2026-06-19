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
      {/* ── LEFT: Gradient hero panel ── */}
      <div style={S.left}>
        <div style={S.leftBg} />
        <div style={S.leftContent}>
          {/* Logo */}
          <div style={S.topLogo}>
            <div style={S.logoSquare}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 12 19.79 19.79 0 011.61 3.4 2 2 0 013.59 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 9.91a16 16 0 006.08 6.08l1.08-.88a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </div>
            <span style={S.topLogoLabel}>Call Master</span>
          </div>

          {/* Hero text */}
          <h1 style={S.heroTitle}>Enterprise Analytics<br/>Command Center</h1>
          <p style={S.heroSub}>
            Real-time call intelligence, quality monitoring, and performance insights across all your BPO operations.
          </p>

          {/* Feature pills */}
          <div style={S.pills}>
            {['16+ Processes', '1M+ Calls Tracked', '50+ QA Parameters', 'Multi-Branch'].map(t => (
              <span key={t} style={S.pill}>{t}</span>
            ))}
          </div>

          {/* Decorative metric cards */}
          <div style={S.metricRow}>
            <div style={S.metricCard}>
              <div style={S.metricVal}>32.5K</div>
              <div style={S.metricLbl}>Calls this month</div>
            </div>
            <div style={S.metricCard}>
              <div style={S.metricVal}>67.0%</div>
              <div style={S.metricLbl}>Avg Quality Score</div>
            </div>
            <div style={S.metricCard}>
              <div style={S.metricVal}>11</div>
              <div style={S.metricLbl}>Active Processes</div>
            </div>
          </div>
        </div>

        {/* Floating blobs */}
        <div style={S.blob1} />
        <div style={S.blob2} />
        <div style={S.blob3} />
      </div>

      {/* ── RIGHT: Login form ── */}
      <div style={S.right}>
        <div style={S.formWrap}>
          <h2 style={S.formTitle}>Welcome back</h2>
          <p style={S.formSub}>Enter your credentials to access the dashboard</p>

          {error && (
            <div role="alert" style={S.errorBox}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={S.field}>
              <label style={S.label} htmlFor="email">Email address</label>
              <div style={S.inputWrap}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={S.inputIcon}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  id="email" type="email" autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  style={S.input} placeholder="you@company.com"
                  required disabled={loading}
                />
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label} htmlFor="password">Password</label>
              <div style={S.inputWrap}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={S.inputIcon}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input
                  id="password" type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  style={{ ...S.input, paddingRight: 44 }}
                  placeholder="••••••••" required disabled={loading}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} style={S.eyeBtn} tabIndex={-1} aria-label={showPw ? 'Hide' : 'Show'}>
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <button type="submit" style={loading ? { ...S.btn, opacity: 0.7, cursor: 'not-allowed' } : S.btn} disabled={loading}>
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={S.spinner} /> Signing in…
                  </span>
                : 'Sign in to Dashboard'
              }
            </button>
          </form>

          <div style={S.divider}><span style={S.dividerLine} /><span style={S.dividerText}>Secure Access</span><span style={S.dividerLine} /></div>

          <div style={S.trustRow}>
            <div style={S.trustItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>256-bit encryption</span>
            </div>
            <div style={S.trustItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>RBAC protected</span>
            </div>
          </div>

          <p style={S.hint}>Need access? Contact your system administrator.</p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(15px,-20px) scale(1.05)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-10px,15px) scale(0.95)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(8px,12px)} }
        input:focus { outline: none; border-color: #7C5CFC !important; box-shadow: 0 0 0 4px rgba(124,92,252,0.10) !important; }
        button[type=submit]:hover:not(:disabled) { background: linear-gradient(135deg, #6B4FE0 0%, #5E38D4 100%) !important; box-shadow: 0 12px 32px rgba(124,92,252,0.4) !important; transform: translateY(-1px); }
        button[type=submit]:active:not(:disabled) { transform: translateY(0); }
        .metric-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
      `}</style>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex', minHeight: '100dvh', fontFamily: "'Inter', -apple-system, sans-serif",
  },

  /* ── LEFT ── */
  left: {
    flex: '1 1 58%', position: 'relative', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '48px',
  },
  leftBg: {
    position: 'absolute', inset: 0, zIndex: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #7C5CFC 25%, #a855f7 50%, #3DD5C8 80%, #06b6d4 100%)',
  },
  leftContent: {
    position: 'relative', zIndex: 2, maxWidth: 480, color: '#fff',
  },
  topLogo: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 },
  logoSquare: {
    width: 40, height: 40, borderRadius: 12,
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  topLogoLabel: { fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.2px' },
  heroTitle: {
    fontSize: 38, fontWeight: 800, lineHeight: 1.2,
    letterSpacing: '-0.8px', marginBottom: 18,
    textShadow: '0 2px 20px rgba(0,0,0,0.15)',
  },
  heroSub: {
    fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)',
    marginBottom: 32, maxWidth: 400,
  },
  pills: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 40 },
  pill: {
    padding: '6px 14px', borderRadius: 999,
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.2)',
    fontSize: 12, fontWeight: 600, color: '#fff',
  },
  metricRow: { display: 'flex', gap: 12 },
  metricCard: {
    flex: 1, padding: '16px 14px', borderRadius: 14,
    background: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.18)',
    textAlign: 'center', transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'default',
  },
  metricVal: { fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', marginBottom: 2 },
  metricLbl: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500 },

  /* Blobs */
  blob1: {
    position: 'absolute', width: 300, height: 300, borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)', top: -60, right: -60,
    animation: 'float1 8s ease-in-out infinite', zIndex: 1,
  },
  blob2: {
    position: 'absolute', width: 200, height: 200, borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)', bottom: 80, left: -40,
    animation: 'float2 10s ease-in-out infinite', zIndex: 1,
  },
  blob3: {
    position: 'absolute', width: 120, height: 120, borderRadius: '50%',
    background: 'rgba(61,213,200,0.2)', bottom: -20, right: 120,
    animation: 'float3 7s ease-in-out infinite', zIndex: 1,
  },

  /* ── RIGHT ── */
  right: {
    flex: '0 0 440px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '48px 44px', background: '#FFFFFF',
  },
  formWrap: { width: '100%', maxWidth: 360 },
  formTitle: { fontSize: 24, fontWeight: 700, color: '#1A1D23', letterSpacing: '-0.4px', marginBottom: 6 },
  formSub: { fontSize: 14, color: '#6B7280', marginBottom: 28 },
  errorBox: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 10, color: '#DC2626', padding: '12px 14px',
    fontSize: 13, marginBottom: 20, lineHeight: 1.5,
  },
  field: { marginBottom: 20 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 7 },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  input: {
    width: '100%', display: 'block',
    background: '#F9FAFB', border: '1.5px solid #E5E7EB',
    borderRadius: 12, color: '#1A1D23', fontSize: 14,
    padding: '12px 14px 12px 40px',
    fontFamily: "'Inter', sans-serif",
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', padding: 4,
  },
  btn: {
    width: '100%', padding: '13px 16px', marginTop: 6,
    background: 'linear-gradient(135deg, #7C5CFC 0%, #6B4FE0 100%)',
    border: 'none', borderRadius: 12,
    color: '#fff', fontSize: 14, fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(124,92,252,0.35)',
    transition: 'background 0.15s, box-shadow 0.2s, transform 0.15s',
    fontFamily: "'Inter', sans-serif",
  },
  spinner: {
    display: 'inline-block', width: 14, height: 14,
    border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff',
    borderRadius: '50%', animation: 'spin 0.7s linear infinite',
  },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 18px' },
  dividerLine: { flex: 1, height: 1, background: '#E5E7EB' },
  dividerText: { fontSize: 11, color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' },
  trustRow: { display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 16 },
  trustItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' },
  hint: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 12 },
};
