import axios from 'axios';
import { store } from './store'; 
import { clearUser, setUser } from './userSlice'; 
import AsyncStorage from '@react-native-async-storage/async-storage';


const baseURL = 'https://haki-backend-zpiz.onrender.com/api';
// const baseURL = 'https://b88e-196-96-162-224.ngrok-free.app/api'; 

const axiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the access token to the header
axiosInstance.interceptors.request.use(
  async (config) => {
    const { user } = store.getState();
    const accessToken = user.access_token;

    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors and refresh tokens
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Prevent infinite loops

      const { user } = store.getState();
      const refreshToken = user.refresh_token;

      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(`${baseURL}/refresh`, {}, { //  Empty body
            headers: {
              'Authorization': `Bearer ${refreshToken}`,
              'Content-Type': 'application/json'
            },
          });

          const newAccessToken = refreshResponse.data.access_token;
          const newRefreshToken = refreshToken;  // Refresh tokens should not normally rotate.  If they *do* rotate on your backend, you will need to update this line.

          // Update the access token in Redux store and AsyncStorage
          store.dispatch(setUser({
            ...user,  // Preserve other user data like email, location
            access_token: newAccessToken,
            refresh_token: newRefreshToken  //Only update refresh token if your server sends a new one
          }));

          //Also update the token in the async storage

            try {
                await AsyncStorage.setItem('user', JSON.stringify({
                  ...user, // Preserve other user data like email, location
                  access_token: newAccessToken,
                  refresh_token: newRefreshToken  //Only update refresh token if your server sends a new one
                }));
              } catch (error) {
                console.error('Error saving user to AsyncStorage:', error);
              }

          // Retry the original request with the new access token
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);

        } catch (refreshError) {
          // Handle refresh token error (e.g., invalid refresh token)
          console.error('Refresh token error:', refreshError);

          // Clear user data from Redux store and AsyncStorage
          store.dispatch(clearUser());
          try {
            await AsyncStorage.removeItem('user');
          } catch (error) {
            console.error('Error clearing user from AsyncStorage:', error);
          }

          // Redirect to login screen or display an error message
          // (Implement your navigation logic here)
          // For example:  navigation.navigate('Login');
          return Promise.reject(refreshError); //Reject the promise so the original request fails
        }
      } else {
        // No refresh token available, clear user data and redirect to login
        store.dispatch(clearUser());
         try {
            await AsyncStorage.removeItem('user');
          } catch (error) {
            console.error('Error clearing user from AsyncStorage:', error);
          }
        return Promise.reject(error); 
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;