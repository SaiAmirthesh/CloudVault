import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import type { UserInfoResponse } from '../services/api';

interface ProfileSettingsProps {
  user: UserInfoResponse;
  onBackToDashboard: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onBackToDashboard }) => {
  const [userName, setUserName] = useState(user.name);
  const [totalFilesCount, setTotalFilesCount] = useState(0);
  const [usedBytes, setUsedBytes] = useState(0);
  const [loading, setLoading] = useState(true);

  // Storage Limit (e.g. 50 MB for Free Starter plan)
  const STORAGE_LIMIT_BYTES = 50 * 1024 * 1024; // 50 MB

  const calculateStorage = async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const data = await api.getFiles(0, 100);
      setTotalFilesCount(data.content.length);
      const totalSize = data.content.reduce((acc, file) => acc + file.size, 0);
      setUsedBytes(totalSize);
    } catch {
      console.error('Failed to compute storage allocation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateStorage();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      // Note: In a full implementation, this would call a PATCH /auth/profile endpoint.
      // Display name updates are stored in session state only (not localStorage).
      alert('Settings saved! (Profile name update requires a backend PATCH /auth/profile endpoint)');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPercentUsed = () => {
    if (usedBytes === 0) return 0;
    const pct = (usedBytes / STORAGE_LIMIT_BYTES) * 100;
    return Math.min(Math.round(pct * 100) / 100, 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto p-6 flex flex-col gap-6"
    >
      {/* Header */}
      <header className="flex flex-col items-start gap-4">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold px-4 py-2 rounded-md transition-all"
          aria-label="Go back"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Vault
        </button>
        <h1 className="font-heading font-bold text-2xl text-left text-text-primary">Vault Configuration</h1>
      </header>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Left Card - Profile Details */}
        <div className="p-6 rounded-lg border border-white/5 bg-v30/60 flex flex-col gap-4 text-left">
          <div>
            <h2 className="font-heading font-semibold text-base text-text-primary">Profile Details</h2>
            <p className="text-xs text-text-secondary">Update your profile parameters.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="settings-name" className="text-xs font-semibold text-text-primary">Profile Display Name</label>
              <input
                id="settings-name"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="w-full text-xs p-2.5 bg-white/5 border border-white/10 rounded-md text-text-primary focus:outline-none focus:border-v10 focus:ring-1 focus:ring-v10 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="settings-email" className="text-xs font-semibold text-text-primary">Registered Vault Email</label>
              <input
                id="settings-email"
                type="email"
                readOnly
                value={user?.email || ''}
                className="w-full text-xs p-2.5 bg-white/5 border border-white/5 text-text-muted rounded-md cursor-not-allowed select-none focus:outline-none"
                title="Registered email cannot be modified"
              />
              <small className="text-[10px] text-text-muted">Your email is permanently linked to your encryption keys.</small>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 mt-2 bg-v10 hover:bg-v10-hover text-white font-semibold text-xs rounded-md shadow-md transition-all text-center"
            >
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Right Card - Storage allocations */}
        <div className="p-6 rounded-lg border border-white/5 bg-v30/60 flex flex-col gap-4 text-left justify-between">
          <div>
            <h2 className="font-heading font-semibold text-base text-text-primary">Storage Quota</h2>
            <p className="text-xs text-text-secondary">Review your current byte allocations.</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 flex-grow">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <p className="text-xs text-text-secondary">Computing storage quotas...</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6 w-full py-2">
              {/* Circular telemtry gauge */}
              <div
                className="relative w-28 h-28 rounded-full flex justify-center items-center shrink-0 circular-progress-box-tailwind"
                style={{ '--percent': `${getPercentUsed()}%` } as React.CSSProperties}
              >
                <div className="absolute w-[94px] h-[94px] rounded-full bg-v30"></div>
                <div className="relative z-10 flex flex-col items-center leading-none">
                  <span className="text-lg font-bold font-heading text-text-primary mb-0.5">{getPercentUsed()}%</span>
                  <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider">Used</span>
                </div>
              </div>

              {/* Telmetery detail logs */}
              <div className="flex flex-col gap-2.5 flex-grow w-full text-xs">
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-text-secondary">Used Storage:</span>
                  <span className="font-semibold text-v10">{formatBytes(usedBytes)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-text-secondary">Allocated Quota:</span>
                  <span className="font-semibold text-text-primary">{formatBytes(STORAGE_LIMIT_BYTES)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Total Vault Files:</span>
                  <span className="font-semibold text-v10">{totalFilesCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Module */}
        <div className="p-6 rounded-lg border border-white/5 bg-v30/60 flex flex-col gap-4 text-left md:col-span-2">
          <div>
            <h2 className="font-heading font-semibold text-base text-text-primary">Security Configurations</h2>
            <p className="text-xs text-text-secondary">Encryption parameters and compliance modules active on your account.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <div className="p-4 rounded-lg border border-white/5 bg-v30/20 flex items-start gap-3">
              <div className="p-2 rounded bg-green-500/10 text-green-500 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-semibold text-xs text-text-primary mb-0.5">Zero-Knowledge Active</h3>
                <p className="text-[10px] text-text-muted leading-relaxed">Encryption keys are kept only on your device.</p>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-white/5 bg-v30/20 flex items-start gap-3">
              <div className="p-2 rounded bg-green-500/10 text-green-500 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                </svg>
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-semibold text-xs text-text-primary mb-0.5">AES-GCM 256 Payload</h3>
                <p className="text-[10px] text-text-muted leading-relaxed">Document data is chunked and encrypted locally.</p>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-white/5 bg-v30/20 flex items-start gap-3 opacity-40">
              <div className="p-2 rounded bg-white/5 text-text-secondary shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-semibold text-xs text-text-primary mb-0.5">Multi-Factor Auth</h3>
                <p className="text-[10px] text-text-muted leading-relaxed">Additional authorization parameters. (Pro plan)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
