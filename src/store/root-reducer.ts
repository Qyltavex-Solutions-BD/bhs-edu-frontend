import { combineReducers } from '@reduxjs/toolkit';
import { schoolApi } from './api';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

/**
 * Redux reducer composition root.
 *
 * Feature reducers are registered here so store creation remains independent
 * from the React provider and can safely happen once per application request.
 */
export const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  [schoolApi.reducerPath]: schoolApi.reducer,
});

