import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store/useStore';
import { leaderboardApi } from './utils/api';
import './styles/globals.css';

// ── Eagerly loaded (always needed immediately) ───────────────
import Sidebar  from './components/Sidebar';

// ── Lazily loaded pages (only loaded when user navigates) ────
const AuthPage       = lazy(() => import('./pages/AuthPage'));
const GlobePage      = lazy(() => import('./pages/GlobePage'));
const DashboardPage  = lazy(() => import('./pages/DashboardPage'));
const WarsPage       = lazy(() => import('./pages/WarsPage'));
const LeaderboardPage= lazy(() => import('./pages/LeaderboardPage'));
const ReposPage      = lazy(() => import('./pages/ReposPage'));
const ProfilePage    = lazy(() => import('./pages/ProfilePage'));

// ── Page loading fallback ────────────────────────────────────
function PageLoader({ label = 'LOADING...' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100%', background: 'var(--void)', gap: '1rem',
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid var(--steel)',
        borderTopColor: 'var(--glow)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '0.65rem', color: 'var(--frost)',
        letterSpacing: '0.3em',
      }}>
        {label}
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ── Protected layout wrapper ─────────────────────────────────
function ProtectedLayout({ children, label }) {
  const { user, token, refreshUser, setNotifications } = useStore();
  const location = useLocation();

  useEffect(() => {
    if (token && !user) refreshUser();
  }, [token]);

  // Poll notifications every 30s
  useEffect(() => {
    if (!token) return;
    const fetchNotifs = () =>
      leaderboardApi.notifications()
        .then(r => setNotifications(r.data.notifications, r.data.unread))
        .catch(() => {});
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, [token]);

  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Each page gets its own Suspense so only THAT page shows a loader */}
        <Suspense fallback={<PageLoader label={label} />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

// ── Root App ─────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--ink)',
            color: 'var(--text)',
            border: '1px solid var(--steel)',
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600,
            letterSpacing: '0.05em',
          },
          success: { iconTheme: { primary: 'var(--grass)', secondary: 'var(--void)' } },
          error:   { iconTheme: { primary: 'var(--blood)', secondary: 'var(--void)' } },
        }}
      />
      <Routes>
        {/* Auth page — lazily loaded, no sidebar */}
        <Route path="/login" element={
          <Suspense fallback={<PageLoader label="INITIALIZING..." />}>
            <AuthPage />
          </Suspense>
        } />

        {/* Protected routes — each page lazy loaded independently */}
        <Route path="/" element={
          <ProtectedLayout label="LOADING GLOBE...">
            <GlobePage />
          </ProtectedLayout>
        } />
        <Route path="/dashboard" element={
          <ProtectedLayout label="LOADING DASHBOARD...">
            <DashboardPage />
          </ProtectedLayout>
        } />
        <Route path="/wars" element={
          <ProtectedLayout label="LOADING WAR ROOM...">
            <WarsPage />
          </ProtectedLayout>
        } />
        <Route path="/leaderboard" element={
          <ProtectedLayout label="LOADING LEADERBOARD...">
            <LeaderboardPage />
          </ProtectedLayout>
        } />
        <Route path="/repos" element={
          <ProtectedLayout label="LOADING REPOSITORIES...">
            <ReposPage />
          </ProtectedLayout>
        } />
        <Route path="/profile" element={
          <ProtectedLayout label="LOADING EMPIRE...">
            <ProfilePage />
          </ProtectedLayout>
        } />
        <Route path="/profile/:username" element={
          <ProtectedLayout label="LOADING PROFILE...">
            <ProfilePage />
          </ProtectedLayout>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
