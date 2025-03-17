// userSlice.js
import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { persistReducer } from 'redux-persist';

const initialState = {
  access_token: null,
  refresh_token: null,
  email: null,
  longitude: null,
  latitude: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.access_token = action.payload.access_token;
      state.refresh_token = action.payload.refresh_token;
      state.email = action.payload.email;
      state.longitude = action.payload.longitude;
      state.latitude = action.payload.latitude;
    },
    updateLocation: (state, action) => {
      state.longitude = action.payload.longitude;
      state.latitude = action.payload.latitude;
    },
    clearUser: (state) => {
      state.access_token = null;
      state.refresh_token = null;
      state.email = null;
      state.longitude = null;
      state.latitude = null;
    },
  },
});

export const { setUser, updateLocation, clearUser } = userSlice.actions;


const persistConfig = {
  key: 'user', 
  storage: AsyncStorage, 
  whitelist: ['access_token', 'refresh_token', 'email', 'longitude', 'latitude'], 
};

const persistedReducer = persistReducer(persistConfig, userSlice.reducer);

export default persistedReducer;