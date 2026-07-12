import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { BrandLogo } from './BrandLogo';
import type { FileResponse, UserInfoResponse } from '../services/api';

interface DashboardProps {
  user: UserInfoResponse;
  onLogout: () => void;
  onOpenUpload: () => void;
  onOpenShare: (fileId: string) => void;
  onOpenSettings: () => void;
  refreshTrigger: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onLogout,
  onOpenUpload,
  onOpenShare,
  onOpenSettings,
  refreshTrigger,
}) => {
  const [files, setFiles] = useState<FileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [currentTab, setCurrentTab] = useState<'all' | 'folders' | 'shared'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFiles(0, 100);
      setFiles(data.content || []);
    } catch {
      setError('Failed to fetch files from vault.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFiles();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshTrigger]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}"?`)) {
      try {
        await api.deleteFile(id);
        setFiles((prev) => prev.filter((f) => f.id !== id));
      } catch {
        alert('Failed to delete file.');
      }
    }
  };

  const handleDownload = async (id: string, filename: string) => {
    try {
      await api.downloadFile(id, filename);
    } catch {
      alert('Failed to download file.');
    }
  };

  const getCategory = (contentType: string): string => {
    const type = contentType.toLowerCase();
    if (type.startsWith('image/')) return 'Images';
    if (type.startsWith('audio/') || type.startsWith('video/')) return 'Media';
    if (
      type.includes('pdf') ||
      type.includes('word') ||
      type.includes('excel') ||
      type.includes('powerpoint') ||
      type.includes('office') ||
      type.includes('text/plain')
    ) {
      return 'Documents';
    }
    if (
      type.includes('zip') ||
      type.includes('tar') ||
      type.includes('gzip') ||
      type.includes('rar') ||
      type.includes('7z')
    ) {
      return 'Archives';
    }
    if (
      type.includes('javascript') ||
      type.includes('typescript') ||
      type.includes('json') ||
      type.includes('html') ||
      type.includes('css') ||
      type.includes('xml')
    ) {
      return 'Code';
    }
    return 'Others';
  };

  const categoriesList = ['Images', 'Documents', 'Media', 'Archives', 'Code', 'Others'];

  const getCategoryCount = (catName: string) => {
    return files.filter((f) => getCategory(f.contentType) === catName).length;
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.filename.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedCategory) {
      return matchesSearch && getCategory(file.contentType) === selectedCategory;
    }

    if (currentTab === 'folders' && !selectedCategory) {
      return false;
    }

    return matchesSearch;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Images':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        );
      case 'Documents':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        );
      case 'Media':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
        );
      case 'Archives':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="12" y1="3" x2="12" y2="21"></line>
            <line x1="8" y1="8" x2="16" y2="8"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
            <line x1="8" y1="16" x2="16" y2="16"></line>
          </svg>
        );
      case 'Code':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        );
      default:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
        );
    }
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentTab('folders');
  };

  const handleBreadcrumbHome = () => {
    setSelectedCategory(null);
    setCurrentTab('all');
  };

  return (
    <div className="flex w-full min-h-screen bg-v60 text-text-primary overflow-hidden">
      {/* Sidebar Nav Shell */}
      <aside className="w-64 shrink-0 bg-v30 border-r border-white/5 p-5 flex flex-col justify-between h-screen sticky top-0">
        <div>
          <div className="mb-8">
            <BrandLogo size={22} />
          </div>

          <nav className="flex flex-col gap-1">
            <button
              onClick={() => { setCurrentTab('all'); setSelectedCategory(null); }}
              className={`flex items-center gap-2.5 text-xs font-semibold tracking-wide py-2.5 px-3 rounded-md text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all text-left w-full ${currentTab === 'all' && !selectedCategory ? 'bg-v10/10 text-v10 hover:bg-v10/15' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              All Vault Files
            </button>

            <button
              onClick={() => { setCurrentTab('folders'); setSelectedCategory(null); }}
              className={`flex items-center gap-2.5 text-xs font-semibold tracking-wide py-2.5 px-3 rounded-md text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all text-left w-full ${currentTab === 'folders' ? 'bg-v10/10 text-v10 hover:bg-v10/15' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              Categories
            </button>

          </nav>
        </div>

        <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2.5 p-1.5 rounded-md hover:bg-white/5 transition-all text-left w-full cursor-pointer group"
            title="Open Vault Settings"
          >
            <div className="w-8 h-8 shrink-0 rounded bg-v10 text-white flex items-center justify-center font-bold text-xs shadow-md group-hover:scale-105 transition-transform">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-xs font-semibold text-text-primary truncate w-32 group-hover:text-v10 transition-colors">{user?.name || 'Vault User'}</span>
              <span className="text-[10px] text-text-muted truncate w-32">{user?.email || 'user@cloudvault.com'}</span>
            </div>
          </button>
          <button
            onClick={onLogout}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary border border-white/10 hover:border-white/20 text-[10px] font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all"
            aria-label="Log Out"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 px-8 flex justify-between items-center bg-v60 shrink-0">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-md py-1.5 px-3 w-full max-w-sm transition-all focus-within:border-v10 focus-within:ring-1 focus-within:ring-v10">
            <svg className="text-text-muted shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search files inside your secure vault..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-text-primary text-xs w-full"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                const isLight = document.documentElement.classList.toggle('light');
                localStorage.setItem('cv_theme', isLight ? 'light' : 'dark');
              }}
              className="p-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary rounded-md transition-all"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            </button>

            <button
              onClick={onOpenUpload}
              className="text-xs font-semibold py-2 px-4 bg-v10 hover:bg-v10-hover text-white rounded-md shadow-md flex items-center gap-1.5 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Upload File
            </button>
          </div>
        </header>

        {/* Content Panel */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto flex-grow">
          {/* Breadcrumbs matrix */}
          <nav aria-label="Breadcrumbs">
            <ol className="flex items-center text-[11px] text-text-secondary font-medium tracking-wide">
              <li>
                <button onClick={handleBreadcrumbHome} className="hover:text-text-primary hover:underline transition-colors uppercase">
                  Vault Home
                </button>
              </li>
              {selectedCategory && (
                <li className="flex items-center gap-1">
                  <svg className="text-text-muted mx-1" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                  <span aria-current="page" className="text-v10 font-bold uppercase">
                    {selectedCategory}
                  </span>
                </li>
              )}
            </ol>
          </nav>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-md p-3 text-left">
              <span>{error}</span>
            </div>
          )}

          {/* Folders Tab / Bento Grid - Categories */}
          {currentTab === 'folders' && !selectedCategory && (
            <div className="flex flex-col gap-4">
              <h2 className="font-heading font-bold text-lg text-left text-text-primary">Categories</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                {categoriesList.map((cat) => {
                  const count = getCategoryCount(cat);
                  return (
                    <motion.div
                      key={cat}
                      whileHover={{ y: -1 }}
                      onClick={() => handleCategoryClick(cat)}
                      className="p-4 rounded-md glass-panel-tailwind border border-white/5 bg-v30/40 hover:bg-v30/70 cursor-pointer flex items-center gap-3.5 transition-all"
                    >
                      <div className="w-10 h-10 rounded bg-v10/10 text-v10 flex justify-center items-center shrink-0">
                        {getCategoryIcon(cat)}
                      </div>
                      <div className="flex flex-col text-left">
                        <h3 className="font-semibold text-sm text-text-primary leading-tight mb-0.5">{cat}</h3>
                        <span className="text-[10px] text-text-muted">{count} {count === 1 ? 'file' : 'files'}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Files List View */}
          {(!selectedCategory && currentTab === 'all') || selectedCategory ? (
            <div className="flex flex-col gap-4 flex-grow">
              <div className="flex justify-between items-center">
                <h2 className="font-heading font-bold text-lg text-text-primary">
                  {selectedCategory ? `${selectedCategory} Files` : 'All Secured Files'}
                </h2>
                <span className="text-[10px] font-bold bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-md text-text-secondary uppercase">
                  {filteredFiles.length} {filteredFiles.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 flex-grow">
                  <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <p className="text-xs text-text-secondary">Decrypting vault contents...</p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-8 rounded-md border border-white/5 bg-v30/40 gap-4 flex-grow">
                  <div className="w-12 h-12 rounded bg-v10/8 text-v10 flex justify-center items-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1 items-center">
                    <h3 className="text-sm font-semibold text-text-primary">No vault files found</h3>
                    <p className="max-w-xs text-xs text-text-secondary leading-relaxed">
                      {searchQuery
                        ? 'No results match your search query.'
                        : selectedCategory
                          ? `You haven't uploaded any ${selectedCategory.toLowerCase()} yet.`
                          : 'Your secure vault is empty. Upload a file to start securing your data.'}
                    </p>
                  </div>
                  {!searchQuery && !selectedCategory && (
                    <button
                      onClick={onOpenUpload}
                      className="text-xs font-semibold py-2 px-4 bg-v10 hover:bg-v10-hover text-white rounded-md shadow-md transition-all"
                    >
                      Upload Your First File
                    </button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border border-white/5 bg-v30/40 overflow-hidden w-full shadow-md">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-text-primary">
                          <th scope="col" className="py-3 px-4 font-semibold">Name</th>
                          <th scope="col" className="py-3 px-4 font-semibold">Category</th>
                          <th scope="col" className="py-3 px-4 font-semibold">Size</th>
                          <th scope="col" className="py-3 px-4 font-semibold">Uploaded At</th>
                          <th scope="col" className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {filteredFiles.map((file) => {
                            const fileCategory = getCategory(file.contentType);
                            return (
                              <motion.tr
                                key={file.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="border-b border-white/10 hover:bg-white/5 transition-colors text-text-secondary"
                              >
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2 max-w-[280px]">
                                    <span className="text-v10 shrink-0">
                                      {getCategoryIcon(fileCategory)}
                                    </span>
                                    <span className="font-semibold text-text-primary truncate" title={file.filename}>
                                      {file.filename}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-[10px] font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded uppercase text-text-secondary">
                                    {fileCategory}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-text-secondary">
                                  {formatBytes(file.size)}
                                </td>
                                <td className="py-3 px-4 text-text-secondary">
                                  {new Date(file.uploadedAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => handleDownload(file.id, file.filename)}
                                      className="w-7 h-7 rounded border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary flex justify-center items-center transition-all"
                                      title="Download File"
                                      aria-label={`Download ${file.filename}`}
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => onOpenShare(file.id)}
                                      className="w-7 h-7 rounded border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary flex justify-center items-center transition-all"
                                      title="Create Share Link"
                                      aria-label={`Share ${file.filename}`}
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                                        <polyline points="16 6 12 2 8 6"></polyline>
                                        <line x1="12" y1="2" x2="12" y2="15"></line>
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDelete(file.id, file.filename)}
                                      className="w-7 h-7 rounded border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary flex justify-center items-center hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all"
                                      title="Delete File"
                                      aria-label={`Delete ${file.filename}`}
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </motion.tr>
                            );
                          })}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
};
