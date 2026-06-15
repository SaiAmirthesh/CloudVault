import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import type { ShareLinkResponse } from '../services/api';

interface ShareModalProps {
  isOpen: boolean;
  fileId: string | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  fileId,
  onClose,
}) => {
  const [useExpiry, setUseExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareResult, setShareResult] = useState<ShareLinkResponse | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !fileId) return null;

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShareResult(null);
    setCopied(false);

    try {
      const expiryISO = useExpiry && expiresAt ? new Date(expiresAt).toISOString() : null;
      const passVal = usePassword && password ? password : undefined;

      const response = await api.createShareLink(fileId, expiryISO, passVal);
      setShareResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate share link.');
    } finally {
      setLoading(false);
    }
  };

  const getFullShareLink = () => {
    if (!shareResult) return '';
    return `${window.location.origin}/?share=${shareResult.token}`;
  };

  const handleCopy = () => {
    const link = getFullShareLink();
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setUseExpiry(false);
    setExpiresAt('');
    setUsePassword(false);
    setPassword('');
    setShareResult(null);
    setError(null);
    setCopied(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex justify-center items-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          ></motion.div>

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md p-6 rounded-lg glass-panel-tailwind border border-white/10 bg-v30/95 shadow-xl flex flex-col z-10"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary p-1 rounded-md transition-colors"
              aria-label="Close share modal"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="text-center mb-6">
              <h2 className="font-heading font-bold text-xl mb-1 text-text-primary">Secure File Sharing</h2>
              <p className="text-xs text-text-secondary">Configure link expirations and password protection for public downloads.</p>
            </div>

            {error && (
              <div className="flex items-center bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-md p-3 mb-4 text-left">
                <span>{error}</span>
              </div>
            )}

            {!shareResult ? (
              <form onSubmit={handleCreateShare} className="flex flex-col gap-4">
                {/* Expiry Date Toggle */}
                <div className="flex flex-col gap-2 bg-white/[0.01] border border-white/10 p-4 rounded-md text-left">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useExpiry}
                      onChange={(e) => setUseExpiry(e.target.checked)}
                      className="w-4 h-4 accent-v10 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-text-primary">Enable Expiration Date</span>
                  </label>

                  <AnimatePresence>
                    {useExpiry && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-1.5 mt-2.5 overflow-hidden"
                      >
                        <label htmlFor="share-expiry" className="text-[10px] font-semibold text-text-secondary uppercase">Expires At</label>
                        <input
                          id="share-expiry"
                          type="datetime-local"
                          value={expiresAt}
                          onChange={(e) => setExpiresAt(e.target.value)}
                          required
                          className="w-full text-xs p-2 bg-white/5 border border-white/10 rounded-md text-text-primary focus:outline-none focus:border-v10 focus:ring-1 focus:ring-v10"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password Toggle */}
                <div className="flex flex-col gap-2 bg-white/[0.01] border border-white/10 p-4 rounded-md text-left">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={usePassword}
                      onChange={(e) => setUsePassword(e.target.checked)}
                      className="w-4 h-4 accent-v10 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-text-primary">Enable Password Protection</span>
                  </label>

                  <AnimatePresence>
                    {usePassword && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-1.5 mt-2.5 overflow-hidden"
                      >
                        <label htmlFor="share-password" className="text-[10px] font-semibold text-text-secondary uppercase">Link Access Password</label>
                        <input
                          id="share-password"
                          type="password"
                          placeholder="Enter link password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full text-xs p-2 bg-white/5 border border-white/10 rounded-md text-text-primary focus:outline-none focus:border-v10 focus:ring-1 focus:ring-v10"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 bg-v10 hover:bg-v10-hover disabled:opacity-50 text-white font-semibold text-xs rounded-md shadow-md flex justify-center items-center transition-all"
                >
                  {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Generate Secure Link'}
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center text-center gap-4 py-2">
                <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex justify-center items-center text-green-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>

                <h3 className="font-heading font-semibold text-base text-text-primary">Secure Link Created</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Your link is ready. Anyone with this URL can download the file
                  {shareResult.passwordProtected ? ' by providing the password' : ''}
                  {shareResult.expiresAt ? ' until ' + new Date(shareResult.expiresAt).toLocaleString() : ''}.
                </p>

                <div className="flex w-full bg-white/5 border border-white/10 rounded-md p-1.5 items-center gap-1.5 mt-2">
                  <input
                    type="text"
                    readOnly
                    value={getFullShareLink()}
                    className="bg-transparent border-none outline-none text-xs text-text-primary flex-grow px-2"
                  />
                  <button
                    onClick={handleCopy}
                    className={`py-1.5 px-4 text-xs font-semibold rounded-md shadow-md shrink-0 transition-all ${copied ? 'bg-green-500 text-white' : 'bg-v10 hover:bg-v10-hover text-white'}`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
