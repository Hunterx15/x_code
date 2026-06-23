import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../authSlice';
import { injectStore } from '../utils/axiosClient';

export const store = configureStore({
  reducer: {
    auth: authReducer
  }
});

// P2-2: Inject the store into the axios client so its 401 interceptor
// can dispatch logoutUser without creating a circular import
// (authSlice imports axiosClient, so axiosClient cannot import authSlice).
injectStore(store);

