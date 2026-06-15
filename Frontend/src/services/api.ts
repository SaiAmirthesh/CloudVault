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

  async downloadFile(id: string, filename: string): Promise<void> {
    const res = await apiFetch(`${API_BASE}/files/${id}`);
    if (!res.ok) throw new Error('Download failed');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
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
