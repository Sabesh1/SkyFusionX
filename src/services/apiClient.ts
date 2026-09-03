// Centralized API Client bridging frontend services to FastAPI backend

export const API_BASE_URL = '';

class ApiClient {
  private isBackendOnline: boolean = false;
  private lastHealthCheck: number = 0;
  private checkPromise: Promise<boolean> | null = null;

  async checkHealth(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastHealthCheck < 5000 && this.checkPromise) {
      return this.checkPromise;
    }

    this.lastHealthCheck = now;
    this.checkPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const response = await fetch(`${API_BASE_URL}/health`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          this.isBackendOnline = data.status === 'ok';
          return this.isBackendOnline;
        }
        this.isBackendOnline = false;
        return false;
      } catch {
        this.isBackendOnline = false;
        return false;
      }
    })();

    return this.checkPromise;
  }

  get isConnected(): boolean {
    return this.isBackendOnline;
  }

  async get<T>(endpoint: string): Promise<T | null> {
    const isOnline = await this.checkHealth();
    if (!isOnline) return null;

    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
      });
      if (!response.ok) return null;
      return (await response.json()) as T;
    } catch {
      return null;
    }
  }

  async post<T, B = unknown>(endpoint: string, body: B): Promise<T | null> {
    const isOnline = await this.checkHealth();
    if (!isOnline) return null;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) return null;
      return (await response.json()) as T;
    } catch {
      return null;
    }
  }
  
  async patch<T, B = unknown>(endpoint: string, body: B): Promise<T | null> {
    const isOnline = await this.checkHealth();
    if (!isOnline) return null;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) return null;
      return (await response.json()) as T;
    } catch {
      return null;
    }
  }
  
  async delete(endpoint: string): Promise<boolean> {
    const isOnline = await this.checkHealth();
    if (!isOnline) return false;

    try {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers,
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  createEventSource(endpoint: string): EventSource | null {
    if (!this.isBackendOnline) return null;
    try {
      return new EventSource(`${API_BASE_URL}${endpoint}`);
    } catch {
      return null;
    }
  }
}

export const apiClient = new ApiClient();
