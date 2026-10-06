import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import CryptoJS from 'crypto-js';
import { API_URL } from '@env';
import { APP_VERSION, isVersionOutdated } from '../utils/AppVersion';

export const CurrentLogin = createAsyncThunk(
  'user/login',
  async ({ config, username, password }, { rejectWithValue }) => {
    try {
      const response = await axios(config);
      if (response?.data?.status === 'true') {
        const user = response?.data?.data?.find(
          u =>
            String(u.user_id).trim().toLowerCase() ===
            String(username).trim().toLowerCase(),
        );
        

        if (!user) {
          Toast.show({
            type: 'error',
            text1: 'Invalid Username',
            text2: 'No user account found with this username.',
          });
          return rejectWithValue('User not found');
        }

        const hashedPassword = CryptoJS.MD5(password).toString();
        if (hashedPassword !== user.password) {
          Toast.show({
            type: 'error',
            text1: 'Invalid Password',
            text2: 'The password you entered is incorrect.',
          });
          return rejectWithValue('Incorrect password');
        }

        // 1. Check if account is inactive / deactivated
        if (String(user.inactive) === '1') {
          Toast.show({
            type: 'error',
            text1: 'Account Deactivated',
            text2: 'Your account has been deactivated. Please contact administrator.',
          });
          return rejectWithValue('User account is inactive');
        }

        // 2. Check min_required_version from API vs running app version
        const minRequiredVersion = user.min_required_version ;
        if (isVersionOutdated(APP_VERSION, minRequiredVersion)) {
          Toast.show({
            type: 'error',
            text1: 'Update Required',
            text2: `A new version (v${minRequiredVersion}) of STC is required. You are using v${APP_VERSION}. Please install the latest APK.`,
            visibilityTime: 5000,
          });
          return rejectWithValue('App version is outdated');
        }

        // 3. Check single active session: only one user/device logged in at a time
        if (String(user.login_status) === '0') {
          Toast.show({
            type: 'error',
            text1: 'Account Already Logged In',
            text2:
              'Only one active session is allowed at a time. This account is already logged in on another device.',
            visibilityTime: 4000,
          });
          return rejectWithValue('Account is already logged in on another device');
        }

        // 4. Mark login_status as '0' (Logged In) and update app_version on the server
        try {
          const formData = new FormData();
          formData.append('id', String(user.id));
          formData.append('inactive', String(user.inactive));
          formData.append('login_status', '0');
          formData.append('login_active_status', '0');
          formData.append('app_version', APP_VERSION);

          const postRes = await fetch(`${API_URL}logout_post.php`, {
            method: 'POST',
            body: formData,
          });
          const postResult = await postRes.json();
          console.log('logout_post response on login:', postResult);
        } catch (postErr) {
          console.log('Error updating login status on server:', postErr);
        }

        return { ...user, login_status: '0', inactive: '0', app_version: APP_VERSION };
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: response?.data?.message || 'Unable to authenticate.',
        });
        return rejectWithValue('Login failed');
      }
    } catch (error) {
      console.log('Login API Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Failed to connect to server. Please check your internet.',
      });
      return rejectWithValue(error?.message || 'Network error');
    }
  },
);

export const logoutUser = createAsyncThunk(
  'user/logout',
  async (_, { getState, dispatch }) => {
    const currentData = getState()?.Data?.currentData;
    if (currentData?.id) {
      try {
        const formData = new FormData();
        formData.append('id', String(currentData.id));
        formData.append('inactive', String(currentData.inactive || '0'));
        formData.append('login_status', '1');
        formData.append('login_active_status', '0');
        formData.append('app_version', APP_VERSION);

        const postRes = await fetch(`${API_URL}logout_post.php`, {
          method: 'POST',
          body: formData,
        });
        const postResult = await postRes.json();
        console.log('logout_post response on logout:', postResult);
      } catch (err) {
        console.log('Error updating logout status on server:', err);
      }
    }
    dispatch(setLogout());
    Toast.show({
      type: 'success',
      text1: 'Logged Out',
      text2: 'You have been logged out successfully.',
    });
  },
);

export const AuthSlice = createSlice({
  name: 'UsersData',
  initialState: {
    currentData: [],
    cartData: [],
    token: '',
    isLoggedIn: false,
    GrandCartTotalPrice: '0',
    Loading: false,
    AllProduct: [],
    accessData: [],
  },
  reducers: {
    setLoader: (state, action) => {
      state.Loading = action.payload;
    },
    setMyData: (state, action) => {
      state.currentData = action.payload;
    },
    setCartData: (state, action) => {
      state.cartData = action.payload;
    },
    setGrandCartTotalPrice: (state, action) => {
      state.GrandCartTotalPrice = action.payload;
    },
    setAllProducts: (state, action) => {
      state.AllProduct = action.payload;
    },
    setUserAccess: (state, action) => {
      state.accessData = action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload.data;
      state.isLoggedIn = !!action.payload.data;
    },
    setLogout: state => {
      state.token = '';
      state.currentData = [];
      state.isLoggedIn = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(CurrentLogin.fulfilled, (state, action) => {
        state.Loading = false;
        if (action.payload) {
          state.currentData = action.payload;
          state.token = action.payload.password;
          state.isLoggedIn = true;
        }
      })
      .addCase(CurrentLogin.rejected, state => {
        state.Loading = false;
      });
  },
});

export const {
  setMyData,
  setToken,
  setLogout,
  setLoader,
  setCartData,
  setGrandCartTotalPrice,
  setAllProducts,
  setUserAccess,
} = AuthSlice.actions;

export default AuthSlice.reducer;

