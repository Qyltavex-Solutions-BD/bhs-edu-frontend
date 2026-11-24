import { configureStore } from '@reduxjs/toolkit';
import { schoolApi } from './api';
import { listenerMiddleware } from './listener-middleware';
import { rootReducer } from './root-reducer';

/**
 * Creates an isolated Redux store instance.
 *
 * App Router applications must not share a module-level store between server
 * requests. The client StoreProvider owns one instance for its lifetime.
 */
export const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .prepend(listenerMiddleware.middleware)
        .concat(schoolApi.middleware),
    devTools: process.env.NODE_ENV !== 'production',
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

