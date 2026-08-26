import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const RESUMABLE_THRESHOLD = 10 * 1024 * 1024; // 10 MB

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      if (file.size > RESUMABLE_THRESHOLD) {
        await api.uploadFileResumable(file, (percent) => {
          setProgress(percent);
        });
      } else {
        await api.uploadFile(file, (percent) => {
          setProgress(percent);
        });
      }
      setTimeout(() => {
        onUploadSuccess();
        handleClose();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'File upload failed. Ensure file size and connection are correct.');
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleClose = () => {
    setFile(null);
    setProgress(0);
    setUploading(false);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex justify-center items-center p-4" onDragEnter={handleDrag}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={uploading ? undefined : handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          ></motion.div>

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-lg p-6 rounded-lg glass-panel-tailwind border border-white/10 bg-v30/95 shadow-xl flex flex-col z-10"
          >
            <button
              onClick={handleClose}
              disabled={uploading}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary p-1 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Close upload modal"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="text-center mb-6">
              <h2 className="font-heading font-bold text-xl mb-1 text-text-primary">Upload File to Vault</h2>
              <p className="text-xs text-text-secondary">Files are encrypted locally on your system prior to upload.</p>
            </div>

            {error && (
              <div className="flex items-center bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-md p-3 mb-4 text-left">
                <span>{error}</span>
              </div>
            )}

            {/* Drag Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center flex flex-col justify-center items-center min-h-[220px] transition-all relative ${dragActive ? 'bg-v10/5 border-v10 scale-[0.99]' : 'border-white/10 bg-white/[0.01]'} ${file ? 'border-solid border-v10/20 bg-white/[0.02]' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleChange}
                style={{ display: 'none' }}
              />

              {!file ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded bg-white/5 text-text-secondary flex justify-center items-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </div>
                  <p className="text-xs text-text-secondary max-w-[260px] leading-relaxed">
                    Drag and drop your file here, or click the button below to browse.
                  </p>

                  {/* Flat premium Browse Button */}
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="py-2 px-5 bg-v10 hover:bg-v10-hover text-white font-semibold text-xs rounded-md shadow-md transition-all"
                  >
                    Browse Files
                  </button>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-5 text-left">
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-md w-full">
                    <svg className="text-v10 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <div className="flex flex-col overflow-hidden flex-grow">
                      <span className="text-xs font-semibold text-text-primary truncate">{file.name}</span>
                      <span className="text-[10px] text-text-muted">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                    {!uploading && (
                      <button onClick={() => setFile(null)} className="p-1.5 text-text-muted hover:text-red-500 rounded-md hover:bg-red-500/10 transition-colors" aria-label="Remove file">
                        ✕
                      </button>
                    )}
                  </div>

                  {uploading && (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-v10 rounded-full transition-all duration-100" style={{ width: `${progress}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[9px] text-text-muted">
                        <span>{file.size > RESUMABLE_THRESHOLD ? 'Chunked Resumable Upload' : 'Uploading'}: {progress}%</span>
                        <span>{progress === 100 ? 'Writing registry...' : file.size > RESUMABLE_THRESHOLD ? 'Uploading chunks' : 'Streaming packets'}</span>
                      </div>
                    </div>
                  )}

                  {!uploading && (
                    <button
                      type="button"
                      onClick={handleUpload}
                      className="w-full py-2.5 bg-v10 hover:bg-v10-hover text-white font-semibold text-xs rounded-md shadow-md transition-all text-center"
                    >
                      Upload Securely
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
