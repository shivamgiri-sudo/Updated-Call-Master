// frontend/src/services/apiV1.ts
// API client for /api/v1 routes (new JWT-based auth + executive dashboard)
import axios, { AxiosInstance, AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ACCESS_KEY = 'cm_v1_access';
const REFRESH_KEY = 'cm_v1_refresh';

export const tokenStore = {
  getAccess: (): string | null => localStorage.getItem(ACCESS_KEY),
  getRefresh: (): string | null => localStorage.getItem(REFRESH_KEY),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

const client: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// Attach access token to every request
client.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;

// Auto-refresh on 401
client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) {
      tokenStore.clear();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    original._retry = true;

    if (!refreshing) {
      refreshing = client
        .post('/auth/refresh', { refreshToken })
        .then((r: any) => {
          const { accessToken, refreshToken: newRefresh } = r.data.data;
          tokenStore.set(accessToken, newRefresh);
          refreshing = null;
          return accessToken;
        })
        .catch(() => {
          tokenStore.clear();
          window.location.href = '/login';
          refreshing = null;
          return Promise.reject(error);
        });
    }

    const newToken = await refreshing;
    original.headers.Authorization = `Bearer ${newToken}`;
    return client(original);
  }
);

// Auth endpoints
export const authApi = {
  login: (email: string, password: string) =>
    client.post<{ success: boolean; data: LoginResult }>('/auth/login', { email, password }),
  logout: (refreshToken: string) =>
    client.post('/auth/logout', { refreshToken }),
  me: () =>
    client.get<{ success: boolean; data: UserDTO }>('/auth/me'),
};

// Executive endpoints
export const executiveApi = {
  summary: (params?: DateRangeParams) =>
    client.get<{ success: boolean; data: ExecutiveSummary }>('/executive/summary', { params }),
  scorecard: (params?: DateRangeParams) =>
    client.get<{ success: boolean; data: { processes: ProcessRow[]; dateRange: DateRange } }>('/executive/process-scorecard', { params }),
  dailyTrend: (params?: DateRangeParams) =>
    client.get<{ success: boolean; data: { trend: DailyPoint[]; dateRange: DateRange } }>('/executive/daily-trend', { params }),
};

// Types
export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserDTO;
}

export interface UserDTO {
  id: number;
  email: string;
  fullName: string;
  role: string;
  clientId: number;
  processCodes: string[] | null;
  branchCodes: string[] | null;
  lastLoginAt: string | null;
}

export interface DateRangeParams {
  from?: string;
  to?: string;
  processCode?: string;
  branchCode?: string;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface TrendPoint {
  value: number;
  direction: 'up' | 'down';
}

export interface ExecutiveSummary {
  kpis: {
    totalCalls: number;
    criticalCalls: number;
    avgQuality: number;
    processCount: number;
    branchCount: number;
  };
  trends: {
    calls: TrendPoint;
    quality: TrendPoint;
  };
  dateRange: DateRange;
}

export interface ProcessRow {
  processCode: string;
  processName: string;
  branchCode: string;
  calls: number;
  criticalCalls: number;
  quality: number;
  agentCount: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
}

export interface DailyPoint {
  date: string;
  calls: number;
  criticalCalls: number;
  avgQuality: number;
}

export interface RevenueForecast {
  current: { revenue: number; avgTicket: number; conversionRate: number };
  forecast: { monthly: number; quarterly: number; confidence: string };
  assumptions: { avgTicketSize: number; conversionRate: number; avgCallsPerDay: number; workingDays: number };
}

export default client;
