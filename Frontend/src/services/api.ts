/**
 * API Service for Cloud Vault Backend
 *
 * Security design:
 *  - JWT is stored in an HttpOnly, Secure, SameSite=Strict cookie managed entirely
 *    by the backend. This file never reads or writes the JWT — the browser handles it.
 *  - All fetch() calls use `credentials: 'include'` so the browser automatically
 *    attaches the HttpOnly cookie without JavaScript being able to read it.
 *  - CSRF protection: The backend sets an XSRF-TOKEN cookie (readable by JS, not HttpOnly).
 *    We read it and send it as X-XSRF-TOKEN header on all state-changing requests.
 *  - No auth state is stored in localStorage — session state is verified via GET /auth/me.
 */

const API_BASE = 'http://localhost:8080';

// ── Type Definitions ──────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
}

export interface UserInfoResponse {
  email: string;
  name: string;
}

export interface FileResponse {
  id: string;
  filename: string;
  size: number;
  contentType: string;
  uploadedAt: string;
}

export interface FilePageResponse {
  content: FileResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ShareLinkResponse {
  id: string;
  token: string;
  sharePath: string;
  expiresAt: string;
  passwordProtected: boolean;
  createdAt: string;
}

export interface StartUploadResponse {
  uploadId: string;
  chunkSize: number;
  totalParts: number;
  status: string;
}

export interface UploadPartResponse {
  partNumber: number;
  size: number;
  etag: string;
}

export interface UploadStatusResponse {
  uploadId: string;
  fileName: string;
  totalSize: number;
  totalParts: number;
  status: string;
  uploadedParts: number[];
  missingParts: number[];
}

// ── CSRF Token Helpers ────────────────────────────────────────────────────────

/**
 * Reads the XSRF-TOKEN cookie set by the backend (it is NOT HttpOnly — readable by JS).
 * Returns null if not present (e.g., for unauthenticated requests).
 */
function getCsrfToken(): string | null {
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('XSRF-TOKEN='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

/**
 * Builds headers for a state-changing request (POST, PUT, DELETE, PATCH).
 * Includes X-XSRF-TOKEN for CSRF protection when the token is available.
 */
function getMutationHeaders(isMultipart = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  const csrf = getCsrfToken();
  if (csrf) {
    headers['X-XSRF-TOKEN'] = csrf;
  }
  return headers;
}

// ── Base fetch with credentials ───────────────────────────────────────────────

/**
 * Wrapper around fetch that always includes credentials (cookies).
 * The HttpOnly JWT cookie and CSRF cookie are sent automatically.
 */
async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include', // Always send cookies (HttpOnly JWT + CSRF)
  });
}

// ── API Client ────────────────────────────────────────────────────────────────

export const api = {
  // ── Auth endpoints ────────────────────────────────────────────────────────

  /**
   * Registers a new user. Backend sets HttpOnly JWT cookie on success.
   * Returns user info (email, name) — no token in response body.
   */
  async register(name: string, email: string, password: string): Promise<string> {
    const res = await apiFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(err.message || 'Registration failed');
    }
    return res.text();
  },

  /**
   * Logs in the user. Backend sets HttpOnly JWT cookie on success.
   * Returns JWT token in response body.
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(err.message || 'Login failed');
    }
    return res.json();
  },

  /**
   * Logs out the user.
   * - Server increments tokenVersion → all existing JWTs are invalidated
   * - Server clears the HttpOnly cookie via Set-Cookie: ...; Max-Age=0
   */
  async logout(): Promise<void> {
    await apiFetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getMutationHeaders(),
    });
    // Cookie is cleared by the server. No localStorage to clean up.
  },

  /**
   * Verifies the current session and returns user info.
   * Returns null if not authenticated (401).
   * Use this on app load instead of checking localStorage.
   */
  async getMe(): Promise<UserInfoResponse | null> {
    const res = await apiFetch(`${API_BASE}/auth/me`);
    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) return null;
    return res.json();
  },

  // ── File endpoints ────────────────────────────────────────────────────────

  async getFiles(page = 0, size = 20): Promise<FilePageResponse> {
    const res = await apiFetch(
      `${API_BASE}/files?page=${page}&size=${size}&sort=uploadedAt,desc`
    );
    if (!res.ok) {
      throw new Error('Failed to fetch files');
    }
    return res.json();
  },

  uploadFile(file: File, onProgress: (percent: number) => void): Promise<{ fileId: string; filename: string }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/files/upload`, true);
      // withCredentials sends the HttpOnly JWT cookie — no manual token needed
      xhr.withCredentials = true;

      // Include CSRF token header for the upload POST
      const csrf = getCsrfToken();
      if (csrf) {
        xhr.setRequestHeader('X-XSRF-TOKEN', csrf);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 201 || xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            reject(new Error('Invalid upload response'));
          }
        } else {
          reject(new Error('Upload failed with status ' + xhr.status));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };

      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  },

  // ── Resumable Upload Endpoints ───────────────────────────────────────────────

  async startResumableUpload(fileName: string, totalSize: number, contentType: string): Promise<StartUploadResponse> {
    const res = await apiFetch(`${API_BASE}/uploads`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify({
        fileName,
        totalSize,
        contentType: contentType || 'application/octet-stream',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to initiate resumable upload' }));
      throw new Error(err.message || 'Failed to initiate resumable upload');
    }
    return res.json();
  },

  uploadPart(
    uploadId: string,
    partNumber: number,
    chunk: Blob,
    fileName: string,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<UploadPartResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', `${API_BASE}/uploads/${uploadId}/parts/${partNumber}`, true);
      xhr.withCredentials = true;

      const csrf = getCsrfToken();
      if (csrf) {
        xhr.setRequestHeader('X-XSRF-TOKEN', csrf);
      }

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress(event.loaded, event.total);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error(`Invalid response for part ${partNumber}`));
          }
        } else {
          reject(new Error(`Failed to upload part ${partNumber} (status ${xhr.status})`));
        }
      };

      xhr.onerror = () => {
        reject(new Error(`Network error uploading part ${partNumber}`));
      };

      const formData = new FormData();
      formData.append('file', chunk, fileName);
      xhr.send(formData);
    });
  },

  async getResumableUploadStatus(uploadId: string): Promise<UploadStatusResponse> {
    const res = await apiFetch(`${API_BASE}/uploads/${uploadId}`);
    if (!res.ok) {
      throw new Error('Failed to get upload status');
    }
    return res.json();
  },

  async completeResumableUpload(uploadId: string): Promise<{ id: string; originalFileName: string }> {
    const res = await apiFetch(`${API_BASE}/uploads/${uploadId}/complete`, {
      method: 'POST',
      headers: getMutationHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to complete resumable upload' }));
      throw new Error(err.message || 'Failed to complete resumable upload');
    }
    return res.json();
  },

  async abortResumableUpload(uploadId: string): Promise<void> {
    await apiFetch(`${API_BASE}/uploads/${uploadId}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });
  },

  /**
   * Performs a full chunked resumable upload for a given file.
   * Uploads file in 10MB chunks, tracking progress and finalizing upon completion.
   */
  async uploadFileResumable(
    file: File,
    onProgress: (percent: number) => void
  ): Promise<{ id: string; originalFileName: string }> {
    // 1. Start upload session
    const session = await this.startResumableUpload(
      file.name,
      file.size,
      file.type || 'application/octet-stream'
    );

    const uploadId = session.uploadId;
    const chunkSize = session.chunkSize || (10 * 1024 * 1024);
    const totalParts = session.totalParts || (session as any).TotalParts || Math.ceil(file.size / chunkSize);
    let totalUploadedBytes = 0;

    // 2. Upload each chunk sequentially
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const start = (partNumber - 1) * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      let lastLoadedForPart = 0;

      await this.uploadPart(uploadId, partNumber, chunk, file.name, (loaded) => {
        const delta = loaded - lastLoadedForPart;
        lastLoadedForPart = loaded;
        totalUploadedBytes += delta;
        const overallPercent = Math.min(99, Math.round((totalUploadedBytes / file.size) * 100));
        onProgress(overallPercent);
      });
    }

    // 3. Complete upload
    const result = await this.completeResumableUpload(uploadId);
    onProgress(100);
    return result;
  },

  async downloadFile(id: string, filename: string): Promise<void> {
    const res = await apiFetch(`${API_BASE}/files/${id}`);
    if (!res.ok) throw new Error('Download failed');

    // Retrieve headers from the actual response
    const contentDisposition = res.headers.get('Content-Disposition');
    let actualFilename = filename;

    // Parse the filename from Content-Disposition if it's there
    if (contentDisposition && contentDisposition.includes('filename=')) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
            actualFilename = match[1];
        }
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = actualFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  async deleteFile(id: string): Promise<void> {
    const res = await apiFetch(`${API_BASE}/files/${id}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete file');
  },

  // ── Sharing endpoints ─────────────────────────────────────────────────────

  async createShareLink(id: string, expiresAt: string | null, password?: string): Promise<ShareLinkResponse> {
    const body: Record<string, string | null | undefined> = {};
    if (expiresAt) body.expiresAt = expiresAt;
    if (password) body.password = password;

    const res = await apiFetch(`${API_BASE}/files/${id}/share`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Failed to create share link');
    return res.json();
  },

  /**
   * Downloads a shared file.
   * Password is sent via X-Share-Password header (not query param)
   * to avoid exposure in server logs and browser history.
   */
  async downloadSharedFile(token: string, password?: string, filename = 'shared_file'): Promise<void> {
    const headers: Record<string, string> = {};
    if (password) {
      // Password in header — not in URL, not in logs, not in browser history
      headers['X-Share-Password'] = password;
    }

    const res = await fetch(`${API_BASE}/share/${token}`, {
      headers,
      // Note: no credentials here — shared downloads are public (no auth cookie needed)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Access denied or invalid password' }));
      throw new Error(err.message || 'Access denied or invalid password');
    }

    const blob = await res.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;

    const disposition = res.headers.get('Content-Disposition');
    let finalFilename = filename;
    if (disposition && disposition.indexOf('filename=') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) {
        finalFilename = matches[1].replace(/['"]/g, '');
        finalFilename = decodeURIComponent(finalFilename);
      }
    }

    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(objectUrl);
  },
};
