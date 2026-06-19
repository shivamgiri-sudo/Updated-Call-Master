// frontend/src/AppV1.tsx
// New executive dashboard app with JWT auth — mounted at /v1/*
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
      <Routes>
        <Route path="/v1/login" element={<LoginPage />} />
        <Route path="/v1/executive" element={<RequireAuth><ExecutiveDashboard /></RequireAuth>} />
        <Route path="/v1" element={<Navigate to="/v1/executive" replace />} />
      </Routes>
    </AuthProvider>
  );
}
