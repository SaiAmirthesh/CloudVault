import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import type { UserInfoResponse } from '../services/api';

/*
 * Vibe Coder Formula:
 * - Structural Layout: Fullscreen centered flex card grid.
 * - Visual Aesthetic: Deep glassmorphism with dynamic input border glows and subtle radial backdrop.
 * - Motion Animation: Layout transitions with horizontal entry/exit of login vs register panels.
 */

interface AuthPageProps {
  initialMode: 'login' | 'register';
  onSuccess: (auth: UserInfoResponse) => void;
  onBackToHome: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode,
  onSuccess,
  onBackToHome,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        if (!name.trim()) throw new Error('Name is required');
        if (password.length < 8) throw new Error('Password must be at least 8 characters');
        const message = await api.register(name, email, password);
        if (message.includes('User registered')) {
          alert('Registration successful! Please log in to access your vault.');
          setMode('login');
          setPassword('');
        } else {
          throw new Error(message || 'Registration failed');
        }
      } else {
        await api.login(email, password);
        // Fetch user profile info to populate global authenticated state
        const userInfo = await api.getMe();
        if (!userInfo) {
          throw new Error('Failed to retrieve user profile after successful login.');
        }
        onSuccess(userInfo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setError(null);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-v60 text-text-primary px-4 overflow-hidden">
      {/* Decorative Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-v10/10 rounded-full blur-3xl pointer-events-none z-0 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Floating Background Glassmorphic Shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          className="absolute w-48 h-48 bg-white/2 border border-white/5 rounded-lg top-[10%] left-[10%] backdrop-blur-[1px]"
          animate={{ y: [0, -15, 0], rotate: [0, 45, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-64 h-64 bg-v10/2 border border-white/5 rounded-xl bottom-[10%] right-[10%] backdrop-blur-[2px]"
          animate={{ y: [0, 20, 0], rotate: [0, -30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back navigation */}
        <button
          onClick={onBackToHome}
          className="mb-6 flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors py-2 px-3 border border-white/5 bg-white/5 hover:bg-white/10 rounded-md"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Home
        </button>

        <motion.div
          layout
          className="w-full bg-v30/80 border border-white/10 backdrop-blur-md rounded-lg p-6 md:p-8 shadow-xl"
        >
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="flex items-center gap-2 font-heading font-bold text-lg mb-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#0066FF" />
                <path d="M2 17L12 22L22 17" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>CLOUD<span className="text-v10">VAULT</span></span>
            </div>
            <h2 className="font-heading font-bold text-xl text-center">
              {mode === 'login' ? 'Access Secure Vault' : 'Initialize Personal Vault'}
            </h2>
            <p className="text-xs text-text-secondary text-center max-w-[280px]">
              {mode === 'login'
                ? 'Enter credentials to open your secure vault.'
                : 'Secure your files with zero-knowledge vaulting.'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-md text-xs mb-4 text-left"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <div className="flex flex-col gap-1.5 text-left">
                <label htmlFor="auth-name" className="text-[10px] font-bold tracking-wider uppercase text-text-secondary">Full Name</label>
                <input
                  id="auth-name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full text-xs bg-white/5 border border-white/10 focus:border-v10 text-text-primary px-3 py-2.5 rounded-md outline-none transition-all placeholder:text-text-muted"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="auth-email" className="text-[10px] font-bold tracking-wider uppercase text-text-secondary">Email Address</label>
              <input
                id="auth-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-xs bg-white/5 border border-white/10 focus:border-v10 text-text-primary px-3 py-2.5 rounded-md outline-none transition-all placeholder:text-text-muted"
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="auth-password" className="text-[10px] font-bold tracking-wider uppercase text-text-secondary">Vault Password</label>
              <input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-xs bg-white/5 border border-white/10 focus:border-v10 text-text-primary px-3 py-2.5 rounded-md outline-none transition-all placeholder:text-text-muted"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              {mode === 'register' && (
                <small className="text-[10px] text-text-muted mt-0.5">Password must be at least 8 characters.</small>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full text-xs font-semibold py-2.5 bg-v10 hover:bg-v10-hover text-white rounded-md shadow-md transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <span className="spinner w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : mode === 'login' ? (
                'Access Vault'
              ) : (
                'Initialize Vault'
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-white/5 pt-4 text-center text-xs flex justify-center items-center gap-1.5 text-text-secondary">
            <span>
              {mode === 'login' ? "Don't have an account?" : 'Already have a secure vault?'}
            </span>
            <button
              onClick={toggleMode}
              className="font-semibold text-v10 hover:text-v10-hover transition-colors"
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
