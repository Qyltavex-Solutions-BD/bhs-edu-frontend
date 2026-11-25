import { fetchBaseQuery, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { handleMockRequest } from '@/src/mocks/mockAdapter';
import type { RootState } from '@/src/store';
import {
  setCredentials,
  triggerSessionExpired,
  type AppRole,
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

function resolveAppRole(roles: string[] = []): AppRole | undefined {
  if (roles.includes('ADMIN')) return 'SUPER_ADMIN';
  return (['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT'] as const).find(
    (candidate) => roles.includes(candidate)
  );
}

export function isJwtExpiringSoon(token: string, bufferSeconds = 30): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    if (!payload.exp) return false;
    return payload.exp * 1000 - Date.now() <= bufferSeconds * 1000;
  } catch {
    return false;
  }
}

const realApiQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

const PUBLIC_AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-otp',
  '/auth/resend-otp',
];

let activeRefreshPromise: Promise<boolean> | null = null;

async function silentRefreshSession(
  api: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2]
): Promise<boolean> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    const stateAuth = (api.getState() as RootState).auth;

    const refreshResult = await realApiQuery(
      {
        url: '/auth/refresh',
        method: 'POST',
        body: {},
      },
      api,
      extraOptions
    );

    if (refreshResult.error || !refreshResult.data) {
      return false;
    }

    const raw = refreshResult.data as {
      data?: {
        accessToken: string;
        user: {
          id: string;
          name: string;
          email: string;
          phone: string;
          roles: string[];
          permissions: string[];
        };
      };
      accessToken?: string;
      user?: {
        id: string;
        name: string;
        email: string;
        phone: string;
        roles: string[];
        permissions: string[];
      };
    };

    const payload = raw.data ?? raw;
    if (!payload.accessToken || !payload.user) {
      return false;
    }

    const mappedRole = resolveAppRole(payload.user.roles) ?? stateAuth.role;
    if (!mappedRole) {
      return false;
    }

    api.dispatch(
      setCredentials({
        accessToken: payload.accessToken,
        user: {
          id: payload.user.id,
          name: payload.user.name,
          email: payload.user.email,
          phone: payload.user.phone,
          role: mappedRole,
        },
        role: mappedRole,
        permissions: payload.user.permissions ?? [],
      })
    );

    return true;
  })().finally(() => {
    activeRefreshPromise = null;
  });

  return activeRefreshPromise;
}

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
  const isPublicAuthRequest = PUBLIC_AUTH_ENDPOINTS.some((path) =>
    request.url.startsWith(path)
  );

  const requireLiveApi = /^\/(?:notices|auth)(?:[/?]|$)/.test(request.url);

  if (!requireLiveApi && (useMockApi || request.url === '/bootstrap')) {
    const mockResult = await handleMockRequest(request.url, method, request.body);
    return mockResult.error
      ? { error: mockResult.error }
      : { data: mockResult.data };
  }

  // Proactive silent refresh before sending an authenticated request if access token is about to expire.
  if (!isPublicAuthRequest) {
    const currentAccessToken = (api.getState() as RootState).auth.accessToken;
    if (currentAccessToken && isJwtExpiringSoon(currentAccessToken, 30)) {
      await silentRefreshSession(api, extraOptions);
    }
  }

  let result = await realApiQuery(request, api, extraOptions);

  // Reactive silent refresh on 401 Unauthorized, then transparently retry original request.
  // Note: /auth/change-password can return 401/400 for wrong current password without meaning the JWT expired.
  if (
    result.error?.status === 401 &&
    !isPublicAuthRequest &&
    !request.url.startsWith('/auth/change-password')
  ) {
    const refreshed = await silentRefreshSession(api, extraOptions);
    if (refreshed) {
      result = await realApiQuery(request, api, extraOptions);
    } else {
      api.dispatch(triggerSessionExpired());
    }
  }

  if (!result.error) return { data: result.data };

  const status = typeof result.error.status === 'number' ? result.error.status : 500;

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
