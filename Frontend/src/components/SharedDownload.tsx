import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

interface SharedDownloadProps {
  token: string;
  onGoHome: () => void;
}

export const SharedDownload: React.FC<SharedDownloadProps> = ({ token, onGoHome }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.downloadSharedFile(token, password || undefined);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Access denied. Please check your password or link validity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-v60 text-text-primary w-full relative overflow-y-auto">
      {/* Header */}
      <nav className="h-16 w-full max-w-5xl px-6 flex items-center justify-start z-10">
        <div className="flex items-center gap-2 font-heading font-bold text-base select-none cursor-pointer" onClick={onGoHome}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#0066FF" />
            <path d="M2 17L12 22L22 17" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>CLOUD<span className="text-v10">VAULT</span></span>
        </div>
      </nav>

      {/* Main Card */}
      <main className="flex-grow flex justify-center items-center w-full max-w-5xl p-6 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md p-6 rounded-lg glass-panel-tailwind border border-white/10 bg-v30/95 shadow-xl flex flex-col items-center gap-4 text-center"
        >
          <div className="w-12 h-12 rounded bg-v10/10 text-v10 flex justify-center items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>

          <h1 className="font-heading font-bold text-lg text-text-primary">Shared File Download</h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            You have been granted access to download a secure document from Cloud Vault.
            Decrypt and download the packet below.
          </p>

          {error && (
            <div className="w-full flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-md p-3 text-left">
              <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="w-full flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-500 text-xs rounded-md p-3 text-left">
              <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Decryption complete. Your download has started!</span>
            </div>
          )}

          <form onSubmit={handleDownload} className="flex flex-col gap-4 w-full text-left">
            <div className="flex flex-col gap-1.5 w-full">
              <label htmlFor="portal-password" className="text-xs font-semibold text-text-primary">Access Password</label>
              <input
                id="portal-password"
                type="password"
                placeholder="Enter password (if protected)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs p-2.5 bg-white/5 border border-white/10 focus:border-v10 focus:outline-none focus:ring-1 focus:ring-v10 rounded-md text-text-primary transition-all"
                autoComplete="current-password"
              />
              <small className="text-[10px] text-text-muted">
                Leave blank if this shared link does not have password protection configured.
              </small>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-v10 hover:bg-v10-hover disabled:opacity-50 text-white font-semibold text-xs rounded-md shadow-md flex justify-center items-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Decrypting Payload...</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Download Secure File</span>
                </>
              )}
            </button>
          </form>

          <button
            onClick={onGoHome}
            className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-xs font-semibold text-text-primary rounded-md transition-all text-center"
          >
            Go to CloudVault Homepage
          </button>
        </motion.div>
      </main>

      <footer className="w-full py-6 text-center text-[10px] text-text-muted">
        <p>&copy; 2026 CLOUD VAULT. Security and privacy is our absolute directive.</p>
      </footer>
    </div>
  );
};
