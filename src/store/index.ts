import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import { schoolApi } from './api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [schoolApi.reducerPath]: schoolApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(schoolApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
