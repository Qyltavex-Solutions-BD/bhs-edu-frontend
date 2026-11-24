import { fetchBaseQuery, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { handleMockRequest } from '@/src/mocks/mockAdapter';
import type { RootState } from '@/src/store';
import {
  AUTH_STORAGE_KEY,
  triggerSessionExpired,
} from '@/src/store/slices/authSlice';

import { env } from '@/src/lib/env';

export interface ApiRequest {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  responseHandler?: (response: Response) => Promise<unknown>;
}

export interface ApiError {
  status: number;
  message: string;
}

const useMockApi = env.NEXT_PUBLIC_USE_MOCK_API;
const apiBaseUrl = env.NEXT_PUBLIC_API_URL;

const realApiQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    let token = (getState() as RootState).auth.accessToken;

    if (!token && typeof window !== 'undefined') {
      try {
        const storedSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (storedSession) token = JSON.parse(storedSession)?.accessToken;
      } catch {
        // Storage can be unavailable in restricted/private browser contexts.
      }
    }

    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

/**
 * Routes requests to the configured backend while preserving the frontend-only
 * mock database for endpoints that have not been implemented yet.
 */
export const hybridBaseQuery: BaseQueryFn<ApiRequest, unknown, ApiError> = async (
  request,
  api,
  extraOptions
) => {
  const method = request.method ?? 'GET';

  const requireLiveApi = /^\/(?:notices|auth)(?:[/?]|$)/.test(request.url);

  if (!requireLiveApi && (useMockApi || request.url === '/bootstrap')) {
    const mockResult = await handleMockRequest(request.url, method, request.body);
    return mockResult.error
      ? { error: mockResult.error }
      : { data: mockResult.data };
  }

  const result = await realApiQuery(request, api, extraOptions);
  if (!result.error) return { data: result.data };

  const status = typeof result.error.status === 'number' ? result.error.status : 500;

  if (status === 401 && !request.url.includes('/auth/login')) {
    api.dispatch(triggerSessionExpired());
  }

  if (!requireLiveApi && (status === 404 || result.error.status === 'FETCH_ERROR')) {
    const fallback = await handleMockRequest(request.url, method, request.body);
    if (!fallback.error) return { data: fallback.data };
  }

  const errorData = result.error.data as
    | {
        message?: string;
        errors?: Array<{ field: string; message: string; value?: unknown }>;
      }
    | undefined;

  return {
    error: {
      status,
      message:
        errorData?.errors?.[0]?.message ??
        errorData?.message ??
        'API request failed',
    },
  };
};

