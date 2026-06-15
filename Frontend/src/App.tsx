import { useState, useEffect } from 'react';
import Lenis from 'lenis';

import { api } from './services/api';
import type { UserInfoResponse } from './services/api';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { FileUploadModal } from './components/FileUploadModal';
import { ShareModal } from './components/ShareModal';
import { SharedDownload } from './components/SharedDownload';
import { ProfileSettings } from './components/ProfileSettings';

function App() {
  // Auth state: null = loading, undefined = not authenticated, object = authenticated user
  const [user, setUser] = useState<UserInfoResponse | null | undefined>(null);
  const [shareToken, setShareToken] = useState<string | null>(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    return params.get('share');
  });
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'register' | 'dashboard' | 'settings'>('landing');

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareFileId, setShareFileId] = useState<string | null>(null);

  // Trigger to refresh files listing on successful uploads/deletions
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isAuthenticated = user !== null && user !== undefined;
  const isLoading = user === null;

  // ── Session Check on Mount ────────────────────────────────────────────────
  // Instead of reading from localStorage (XSS-vulnerable), we verify the session
  // by calling GET /auth/me. The HttpOnly JWT cookie is sent automatically.
  // If the cookie is valid, the server returns user info. If not, returns null.
  useEffect(() => {
    api.getMe().then((info) => {
      setUser(info ?? undefined); // undefined = not authenticated
      if (info) {
        setCurrentView('dashboard');
      }
    });
  }, []);

  // ── Theme Preference ──────────────────────────────────────────────────────
  // Theme is a UI preference only — safe to keep in localStorage (no sensitive data)
  useEffect(() => {
    const savedTheme = localStorage.getItem('cv_theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  // ── Smooth Scroll (Landing Page only) ────────────────────────────────────
  useEffect(() => {
    let lenisInstance: Lenis | null = null;
    let frameId: number | null = null;

    if (!isAuthenticated && !shareToken && !isLoading) {
      lenisInstance = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
      });

      const raf = (time: number) => {
        lenisInstance?.raf(time);
        frameId = requestAnimationFrame(raf);
      };

      frameId = requestAnimationFrame(raf);
    }

    return () => {
      if (lenisInstance) {
        lenisInstance.destroy();
      }
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [isAuthenticated, shareToken, isLoading]);

  // ── Auth Handlers ─────────────────────────────────────────────────────────

  const handleAuthSuccess = (authData: UserInfoResponse) => {
    setUser(authData);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out from your secure vault?')) {
      try {
        // POST /auth/logout: server invalidates tokenVersion + clears HttpOnly cookie
        await api.logout();
      } catch {
        // Even if network fails, clear local state
      }
      setUser(undefined);
      setCurrentView('landing');
    }
  };

  const openLogin = () => {
    setCurrentView('login');
  };

  const openRegister = () => {
    setCurrentView('register');
  };

  const handleOpenShare = (fileId: string) => {
    setShareFileId(fileId);
    setIsShareOpen(true);
  };

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const goHome = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('share');
    window.history.pushState({}, '', url.toString());
    setShareToken(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  // While session is being verified, show nothing (or a loader)
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span className="spinner" />
      </div>
    );
  }

  // 1. Shared Download Route (public — no auth needed)
  if (shareToken) {
    return (
      <SharedDownload
        token={shareToken}
        onGoHome={goHome}
      />
    );
  }

  // 2. Authenticated Dashboard / Settings Area
  if (isAuthenticated) {
    return (
      <>
        {currentView === 'dashboard' ? (
          <Dashboard
            user={user!}
            onLogout={handleLogout}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenShare={handleOpenShare}
            onOpenSettings={() => setCurrentView('settings')}
            refreshTrigger={refreshTrigger}
          />
        ) : (
          <ProfileSettings
            user={user!}
            onBackToDashboard={() => {
              setCurrentView('dashboard');
              setRefreshTrigger((prev) => prev + 1);
            }}
          />
        )}

        {/* Upload Overlay Modal */}
        <FileUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />

        {/* Share Link Overlay Modal */}
        <ShareModal
          isOpen={isShareOpen}
          fileId={shareFileId}
          onClose={() => {
            setIsShareOpen(false);
            setShareFileId(null);
          }}
        />
      </>
    );
  }

  // 3. Auth Page Route
  if (currentView === 'login' || currentView === 'register') {
    return (
      <AuthPage
        initialMode={currentView}
        onSuccess={handleAuthSuccess}
        onBackToHome={() => setCurrentView('landing')}
      />
    );
  }

  // 4. Public Landing Page
  return (
    <LandingPage
      onGetStarted={openRegister}
      onLogin={openLogin}
    />
  );
}

export default App;
