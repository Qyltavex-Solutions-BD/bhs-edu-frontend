'use client';

import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from 'next/navigation';
import { useCallback, useMemo } from 'react';

type SearchParamInit = URLSearchParams | Record<string, string>;

type SetSearchParamsArg = SearchParamInit | ((prev: URLSearchParams) => SearchParamInit);

/**
 * React Router-compatible search params, backed by the Next.js App Router.
 * Updates replace or push the current path without a full reload.
 */
export function useSearchParams(): [
  URLSearchParams,
  (next: SetSearchParamsArg, opts?: { replace?: boolean }) => void,
] {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useNextSearchParams();
  const params = useMemo(() => new URLSearchParams(sp.toString()), [sp]);

  const setSearchParams = useCallback(
    (next: SetSearchParamsArg, opts?: { replace?: boolean }) => {
      const current = new URLSearchParams(sp.toString());
      const result = typeof next === 'function' ? next(current) : next;
      const resolved = result instanceof URLSearchParams ? result : new URLSearchParams(result);
      const qs = resolved.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (opts?.replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [pathname, router, sp]
  );

  return [params, setSearchParams];
}

/** Next.js route params normalized to a single string, matching the previous router. */
export function useParams<
  T extends Record<string, string | undefined> = Record<string, string | undefined>,
>(): T {
  const raw = useNextParams();
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(raw)) {
    out[key] = Array.isArray(value) ? value[0] : value;
  }
  return out as T;
}
