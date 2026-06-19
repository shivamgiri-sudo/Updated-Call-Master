// frontend/src/AppV1.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import './styles/glass.css';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.10)', borderTopColor: '#4299e1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/v1/login" replace />;
}

export default function AppV1() {
  return (
    <AuthProvider>
      {/* Relative paths — parent already matched /v1/* */}
      <Routes>
        <Route path="login"     element={<LoginPage />} />
        <Route path="executive" element={<RequireAuth><ExecutiveDashboard /></RequireAuth>} />
        <Route path="*"         element={<Navigate to="/v1/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
