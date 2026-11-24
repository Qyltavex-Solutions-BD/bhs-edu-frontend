# Production Architecture: Next.js App Router + Redux Toolkit

## 1. Purpose

This document defines a scalable, production-oriented architecture for a TypeScript application built with:

- Next.js App Router
- React Server Components
- Redux Toolkit
- React Redux
- RTK Query
- TypeScript

It is a reference architecture, not a rule that every application must copy verbatim. Start with the folders the product needs and add the optional layers only when their responsibilities exist.

## 2. Architectural principles

1. **Server-first rendering:** Pages and layouts remain Server Components unless they require browser APIs, React state, event handlers, or Redux.
2. **Redux is client state:** Redux stores globally shared, mutable client state. It is not the default location for data already available through Server Components.
3. **A store per request:** Never export a module-level Redux store singleton from an App Router application. Export a `makeStore` factory and instantiate it inside a Client Component provider.
4. **Feature ownership:** Business code is grouped by feature rather than by technical file type.
5. **Thin route layer:** The `app` directory owns routing, layouts, metadata, loading states, error boundaries, and composition. Business rules live outside it.
6. **Explicit server/client boundary:** Server-only modules and Client Components are visibly separated and named.
7. **One source of truth:** Do not mirror the same server entity in Next.js cache, an RTK Query cache, and a handwritten slice without a concrete need.
8. **Dependency direction:** Shared/core code must not import feature or route code. Features may depend on shared/core code.

## 3. Recommended project structure

```text
project-root/
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── src/
│   ├── app/                              # Routing and route composition only
│   │   ├── (public)/                     # Route group; omitted from the URL
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── products/
│   │   │       ├── page.tsx
│   │   │       ├── loading.tsx
│   │   │       ├── error.tsx             # Client error boundary
│   │   │       └── [productId]/
│   │   │           ├── page.tsx
│   │   │           └── not-found.tsx
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/                          # Public HTTP boundary when required
│   │   │   ├── health/route.ts
│   │   │   └── webhooks/
│   │   │       └── provider/route.ts
│   │   ├── global-error.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── not-found.tsx
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   │
│   ├── features/                         # Vertical business modules
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   │   ├── auth.api.ts           # RTK Query endpoints, client only
│   │   │   │   └── auth.server.ts        # Server-side data access
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── UserMenu.tsx
│   │   │   ├── model/
│   │   │   │   ├── auth.slice.ts
│   │   │   │   ├── auth.selectors.ts
│   │   │   │   ├── auth.types.ts
│   │   │   │   └── auth.schemas.ts
│   │   │   ├── server/
│   │   │   │   ├── actions.ts
│   │   │   │   └── policies.ts
│   │   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   └── index.ts                  # Feature's intentional public API
│   │   │
│   │   ├── cart/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── model/
│   │   │   │   ├── cart.slice.ts
│   │   │   │   ├── cart.selectors.ts
│   │   │   │   └── cart.types.ts
│   │   │   └── index.ts
│   │   │
│   │   └── products/
│   │       ├── api/
│   │       │   ├── products.api.ts
│   │       │   └── products.server.ts
│   │       ├── components/
│   │       ├── model/
│   │       ├── server/
│   │       └── index.ts
│   │
│   ├── store/                            # Redux composition root
│   │   ├── StoreProvider.tsx             # 'use client'; owns store instance
│   │   ├── store.ts                      # makeStore(), types, middleware
│   │   ├── hooks.ts                      # Typed Redux hooks
│   │   ├── root-reducer.ts
│   │   └── listener-middleware.ts        # Optional cross-feature reactions
│   │
│   ├── components/                       # Cross-feature presentation
│   │   ├── ui/                           # Design-system primitives
│   │   ├── layout/                       # Header, footer, sidebar
│   │   ├── feedback/                     # Empty, loading, error states
│   │   └── forms/                        # Generic form controls
│   │
│   ├── lib/                              # Framework/infrastructure adapters
│   │   ├── api/
│   │   │   ├── base-api.ts               # Shared RTK Query base API
│   │   │   ├── base-query.ts             # Auth refresh/error normalization
│   │   │   └── api-error.ts
│   │   ├── auth/
│   │   │   ├── session.server.ts
│   │   │   └── permissions.ts
│   │   ├── db/                           # ORM/client; server-only
│   │   ├── env/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   ├── observability/
│   │   │   ├── logger.ts
│   │   │   ├── metrics.ts
│   │   │   └── tracing.ts
│   │   ├── security/
│   │   ├── validation/
│   │   └── utils/
│   │
│   ├── config/                           # Typed application configuration
│   │   ├── app.ts
│   │   ├── navigation.ts
│   │   └── feature-flags.ts
│   │
│   ├── types/                            # Truly global TypeScript types
│   │   ├── api.ts
│   │   └── global.d.ts
│   │
│   ├── instrumentation.ts                # Monitoring initialization
│   └── proxy.ts                          # Request-level redirects/guards only
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── fixtures/
│   └── setup/
│
├── docs/
│   ├── architecture/
│   ├── adr/                              # Architecture Decision Records
│   └── runbooks/
│
├── .env.example
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## 4. Layer responsibilities

| Layer | Owns | Must not own |
| --- | --- | --- |
| `app/` | Routes, layouts, metadata, loading/error UI, route handlers, composition | Redux slices, reusable business rules, large data-access implementations |
| `features/` | Feature UI, domain state, validation, selectors, endpoints, policies | Global framework setup or unrelated feature internals |
| `store/` | Store factory, reducer composition, middleware, typed hooks, provider | Business UI and server secrets |
| `components/ui/` | Reusable, domain-neutral primitives | API calls and domain workflows |
| `lib/` | Infrastructure adapters, security, server integrations, shared API plumbing | Product-specific screen composition |
| `config/` | Typed, non-secret configuration | Runtime mutable state |
| `tests/` | Cross-cutting test setup and end-to-end suites | Production runtime code |

## 5. State ownership decision matrix

Choose the narrowest owner that satisfies the requirement.

| State/data | Recommended owner |
| --- | --- |
| URL filters, page number, sorting, selected tab that should be shareable | URL `searchParams` |
| Server-rendered page data | Async Server Component + server `fetch`/data-access function |
| Form input and validation state | Form library or local component state |
| Modal open/closed for one component | Local `useState` |
| Theme, cart, multi-step workflow, globally shared mutable UI state | Redux slice |
| Client-only server data with caching/refetch/invalidation requirements | RTK Query |
| Authentication session | Secure server cookie/session; optionally expose a minimal client-safe user projection |
| Database records used only during server rendering | Server data layer, never Redux |
| Derived values | Memoized selector; do not duplicate them in state |

### Redux should contain

- Global mutable client state
- State shared by distant Client Components
- Cross-route workflows that intentionally persist
- Optimistic client state
- RTK Query cache for browser-initiated requests

### Redux should not contain by default

- Server Component results that are only rendered once
- Request/response objects, class instances, promises, functions, or other non-serializable values
- Secrets, access tokens, database credentials, or complete secure sessions
- Every input field or one-component UI toggle
- Values already represented by the URL

## 6. Redux composition root

### `src/store/store.ts`

The application exports a factory, not a singleton.

```ts
import { configureStore } from '@reduxjs/toolkit'
import { rootReducer } from './root-reducer'
import { baseApi } from '@/lib/api/base-api'

export const makeStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
    preloadedState: preloadedState as RootState | undefined,
    devTools: process.env.NODE_ENV !== 'production',
  })

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
```

In a real implementation, avoid unsafe casts by defining a precise preloaded-state type appropriate for the installed Redux Toolkit version.

### `src/store/StoreProvider.tsx`

```tsx
'use client'

import { useRef } from 'react'
import { Provider } from 'react-redux'
import { makeStore, type AppStore } from './store'

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null)

  if (storeRef.current === null) {
    storeRef.current = makeStore()
  }

  return <Provider store={storeRef.current}>{children}</Provider>
}
```

The provider is a Client Component because React Redux uses context. Server Components must not call Redux hooks or read/write the store.

### `src/store/hooks.ts`

```ts
'use client'

import { useDispatch, useSelector, useStore } from 'react-redux'
import type { AppDispatch, AppStore, RootState } from './store'

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<AppStore>()
```

### Provider placement

Place `StoreProvider` at the lowest layout that contains every consumer:

- Root layout: only when most of the application needs the same client store.
- Dashboard layout: when Redux is only required in authenticated application routes.
- Feature/route boundary: when state must be destroyed after leaving that workflow.

Lower provider placement reduces client-side JavaScript and naturally resets route-scoped state.

## 7. Feature module contract

Each feature exposes a small public API through `index.ts`. Other modules should not deep-import its internal files.

```text
features/orders/
├── api/
│   ├── orders.api.ts
│   └── orders.server.ts
├── components/
│   ├── OrderList.tsx
│   └── OrderStatusButton.tsx
├── model/
│   ├── orders.slice.ts
│   ├── orders.selectors.ts
│   ├── orders.schemas.ts
│   └── orders.types.ts
├── server/
│   ├── actions.ts
│   └── policies.ts
├── utils/
└── index.ts
```

Example public API:

```ts
export { OrderList } from './components/OrderList'
export { selectPendingOrders } from './model/orders.selectors'
export { ordersReducer } from './model/orders.slice'
export type { Order } from './model/orders.types'
```

Do not export internal helpers unless another feature has a legitimate dependency on them.

## 8. RTK Query architecture

Use one base API for one backend domain, then inject endpoints from features. Multiple base APIs are reasonable when authentication, base URLs, or ownership boundaries differ.

### Shared base API

```ts
// src/lib/api/base-api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    credentials: 'include',
  }),
  tagTypes: ['User', 'Product', 'Order'],
  endpoints: () => ({}),
})
```

### Feature endpoint injection

```ts
// src/features/products/api/products.api.ts
import { baseApi } from '@/lib/api/base-api'
import type { Product } from '../model/products.types'

export const productsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProducts: build.query<Product[], void>({
      query: () => '/products',
      providesTags: ['Product'],
    }),
  }),
})

export const { useGetProductsQuery } = productsApi
```

### RTK Query rules

- Use RTK Query for client-side fetching and cache lifecycle.
- Prefer async Server Components and server-side `fetch`/repositories for server-rendered data.
- Use tags for targeted invalidation; avoid invalidating the entire API after every mutation.
- Normalize API errors in a custom base query.
- Keep endpoint definitions close to the feature that owns them.
- Use optimistic updates only when rollback behavior is defined and tested.
- Do not copy RTK Query results into a normal slice unless the user is editing a separate draft.

## 9. Request and data flows

### Server-rendered read flow

```text
Browser request
  -> Next.js route/layout (Server Component)
  -> feature server data-access function
  -> backend/database
  -> validation and authorization
  -> rendered Server Component payload
  -> browser
```

### Interactive client read flow

```text
Client Component
  -> generated RTK Query hook
  -> /api route or external backend
  -> base query error normalization
  -> RTK Query cache
  -> subscribed Client Components
```

### Mutation flow

```text
User action
  -> Client Component or Server Action
  -> schema validation
  -> authorization
  -> application/backend service
  -> persistence
  -> cache invalidation (RTK Query tags and/or Next.js path/tag)
  -> UI refresh
```

Choose either a Server Action or an RTK Query mutation for a single interaction unless both caches genuinely need coordination.

## 10. Server and client boundaries

### Server-only concerns

- Database and ORM clients
- Secret environment variables
- Session verification
- Authorization policies
- Private service credentials
- Server-side repositories
- Revalidation calls

Mark sensitive modules with `server-only` where appropriate, and never import them into a module with `'use client'`.

### Client concerns

- Redux Provider and hooks
- Browser event handlers
- Browser storage
- RTK Query React hooks
- Interactive UI state
- Client analytics SDK calls

Keep `'use client'` at the smallest practical boundary. It defines an import boundary, so everything imported below it becomes part of the client graph.

## 11. Authentication and authorization

1. Store the authoritative session in a secure, `HttpOnly`, `Secure`, appropriately configured cookie.
2. Authenticate and authorize on the server for every protected operation.
3. Treat route guards as user experience improvements, not the security boundary.
4. Redux may hold a minimal client-safe user projection and UI permissions, but the server must re-check permission before mutations or sensitive reads.
5. Avoid persisting access tokens in `localStorage` when cookie-based sessions are available.
6. Never serialize secrets into Redux preloaded state or Client Component props.

## 12. Error handling

Use errors at the correct layer:

- `error.tsx`: Route-segment render failures and retry UI.
- `global-error.tsx`: Root-level rendering failures.
- RTK Query error normalization: Network/API errors in Client Components.
- Domain errors: Typed expected failures such as insufficient inventory.
- `not-found()`: Missing route resources.
- Structured server logs: Unexpected failures with request/correlation IDs.

Do not expose stack traces, database errors, or internal service responses to users.

Recommended API error shape:

```ts
type ApiError = {
  code: string
  message: string
  fieldErrors?: Record<string, string[]>
  requestId?: string
}
```

## 13. Validation and type boundaries

- Validate environment variables at startup.
- Validate untrusted request bodies, search params, form data, webhook payloads, and external API responses.
- Generate types from an API schema when a reliable OpenAPI/GraphQL contract exists.
- Keep domain types inside their feature.
- Keep DTOs separate from UI view models when their shapes or lifecycles differ.
- Do not trust TypeScript types at runtime.

## 14. Testing strategy

### Unit tests

- Reducers and actions
- Selectors
- Validation schemas
- Domain policies
- Pure transformations

### Integration tests

- Store configuration and middleware
- RTK Query endpoints with mocked HTTP boundaries
- Feature components with a fresh store per test
- Route handlers and server actions
- Authentication and authorization failures

### End-to-end tests

- Authentication lifecycle
- Critical business journeys
- Route navigation and route-specific state reset
- Mutation followed by cache refresh
- Permission boundaries
- Error and recovery paths

Each test must create a fresh store. Never reuse one store across test cases.

## 15. Performance rules

- Default to Server Components to reduce client JavaScript.
- Put Redux Provider at the narrowest useful boundary.
- Select the smallest state possible with typed selectors.
- Memoize expensive derived data with `createSelector`.
- Avoid selectors that create a new object or array on every call.
- Lazy-load large client-only modules.
- Use `loading.tsx` and focused `Suspense` boundaries for meaningful streaming states.
- Start independent server requests together and await them in parallel.
- Paginate or virtualize large lists.
- Measure bundle size, Web Vitals, server latency, and API error rates in CI/production.

## 16. Environment and configuration

```text
.env.example          # Committed names and safe examples
.env.local            # Developer secrets; ignored
.env.test             # Test-only configuration
deployment secrets    # Production values managed by the platform
```

Only variables prefixed with `NEXT_PUBLIC_` may be included in the client bundle. Treat every public variable as visible to anyone.

Keep server and client environment schemas separate so a Client Component cannot accidentally import a server secret.

## 17. Observability and operations

A production application should provide:

- Structured JSON logging in production
- Request/correlation IDs propagated across services
- Error tracking with release/version metadata
- OpenTelemetry traces for important server operations
- Metrics for latency, throughput, cache behavior, and failure rates
- Health/readiness endpoints where the hosting platform needs them
- Audit logs for sensitive administrative actions
- Runbooks for common incidents and rollback

Initialize server observability through `instrumentation.ts` rather than scattering setup across routes.

## 18. Import and dependency rules

Recommended alias configuration:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Allowed dependency direction:

```text
app -> features -> components/lib -> types/config
           |
           +-> store contracts
```

Rules:

- A shared UI component cannot import a business feature.
- A feature cannot deep-import another feature's internal files.
- Server modules cannot import client-only hooks or components.
- Client modules cannot import server-only repositories or secrets.
- Circular feature dependencies must be removed by extracting a shared contract or changing ownership.

## 19. Naming conventions

| Concern | Convention | Example |
| --- | --- | --- |
| React component | PascalCase | `OrderList.tsx` |
| Redux slice | feature + `.slice` | `cart.slice.ts` |
| Selectors | feature + `.selectors` | `cart.selectors.ts` |
| RTK Query endpoints | feature + `.api` | `products.api.ts` |
| Server data module | feature + `.server` | `products.server.ts` |
| Runtime schema | feature + `.schemas` | `orders.schemas.ts` |
| Tests | source name + `.test` | `cart.slice.test.ts` |
| E2E test | journey + `.spec` | `checkout.spec.ts` |

## 20. Anti-patterns

Avoid these patterns:

- `export const store = configureStore(...)` at module scope
- Calling Redux hooks from Server Components
- Making the root layout a Client Component only to install providers
- Putting all reducers, API endpoints, and UI into global `redux/`, `services/`, and `components/` dumping grounds
- Storing all backend responses permanently in handwritten slices
- Keeping route filters only in Redux when they belong in the URL
- Using `useEffect` to initialize state required for the first server/client render
- Trusting client-side role checks as authorization
- Storing non-serializable objects in Redux
- One enormous API slice file containing every business domain
- Cross-feature deep imports
- Catching errors without logging, recovery, or user feedback

## 21. Production readiness checklist

### Architecture

- [ ] App Router route layer is thin.
- [ ] Store is created with `makeStore`, not exported as a singleton.
- [ ] Redux is only accessed from Client Components.
- [ ] Each feature has a clear public API and owner.
- [ ] Route-specific state resets or has a route-scoped provider.

### Security

- [ ] Every protected server operation performs authorization.
- [ ] Cookies and security headers are configured for the deployment environment.
- [ ] Secrets never enter client bundles, props, logs, or Redux state.
- [ ] Inputs and external responses are runtime validated.
- [ ] Dependencies and container images are scanned.

### Data and caching

- [ ] Next.js server cache and RTK Query cache responsibilities are documented.
- [ ] Mutations invalidate the correct tags/paths.
- [ ] No duplicate source of truth exists without justification.
- [ ] Authenticated/user-specific pages have correct dynamic/cache behavior.

### Quality

- [ ] Type checking, linting, unit tests, and builds run in CI.
- [ ] Critical workflows have integration and end-to-end tests.
- [ ] Accessibility checks cover keyboard use, labels, focus, and contrast.
- [ ] Loading, empty, error, and permission-denied states exist.

### Operations

- [ ] Logs, errors, metrics, and traces include release metadata.
- [ ] Health checks and alerts are configured.
- [ ] Database migrations and rollbacks are tested.
- [ ] Deployment supports rollback and zero/low-downtime releases.
- [ ] Incident runbooks and ownership are documented.

## 22. Recommended adoption order

1. Establish `app`, `features`, `store`, `components`, and `lib` boundaries.
2. Implement the per-request-safe store factory and Client Component provider.
3. Move each domain into a vertical feature folder.
4. Decide state ownership using the matrix in this document.
5. Add a shared RTK Query base API and inject feature endpoints.
6. Add runtime validation and server-side authorization boundaries.
7. Add testing, observability, CI gates, and operational runbooks.
8. Record important deviations as Architecture Decision Records.

## 23. Official references

- [Redux Toolkit Setup with Next.js](https://redux.js.org/usage/nextjs)
- [Redux Toolkit Usage Guide](https://redux.js.org/toolkit/usage/usage-guide)
- [Next.js App Router project organization](https://nextjs.org/docs/app/getting-started/project-structure)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js data fetching](https://nextjs.org/docs/app/getting-started/fetching-data)

---

The central design decision is simple: use Next.js for server rendering, routing, server data access, and server caching; use Redux Toolkit for intentionally shared and mutable client state; and use RTK Query when the browser owns the server-data request lifecycle.
