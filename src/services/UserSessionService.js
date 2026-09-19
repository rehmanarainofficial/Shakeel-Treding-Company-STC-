import { AppState } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { API_URL } from '@env';
import { Store } from '../store/store';
import { setLogout } from '../store/authSlice';

let sessionCheckInterval = null;
let appStateSubscription = null;
let isLoggingOut = false;
let isCheckingSession = false;

export const performCompleteLogout = async (
  title = 'Logged Out',
  message = 'Your session has ended.',
) => {
  if (isLoggingOut) return;
  isLoggingOut = true;

  try {
    Store.dispatch(setLogout());
  } catch (err) {
    console.log('Error dispatching setLogout:', err);
  }

  try {
    await AsyncStorage.clear();
  } catch (err) {
    console.log('Error clearing AsyncStorage on logout:', err);
  }

  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    visibilityTime: 4000,
  });

  setTimeout(() => {
    isLoggingOut = false;
  }, 2000);
};

export const logoutUserManually = async () => {
  const state = Store.getState();
  const currentData = state?.Data?.currentData;
  if (currentData?.id) {
    try {
      const formData = new FormData();
      formData.append('id', String(currentData.id));
      formData.append('inactive', String(currentData.inactive || '0'));
      formData.append('login_status', '1');
      formData.append('login_active_status', '0');

      await axios.post(`${API_URL}logout_post.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 5000,
      });
    } catch (err) {
      console.log('Error notifying server on manual logout:', err);
    }
  }
  await performCompleteLogout('Logged Out', 'You have been logged out successfully.');
};

export const validateCurrentUserSession = async () => {
  if (isCheckingSession || isLoggingOut) return;

  const state = Store.getState();
  const currentData = state?.Data?.currentData;
  const token = state?.Data?.token;

  if (!token || !currentData || !currentData.id) {
    return;
  }

  isCheckingSession = true;
  try {
    const response = await axios.get(`${API_URL}users.php`, {
      timeout: 8000,
    });

    if (
      response.data &&
      (response.data.status === 'true' || response.data.status === true)
    ) {
      const users = response.data.data || [];
      const currentUserId = String(currentData.id);
      const currentUserName = String(currentData.user_id || '').toLowerCase();

      const matchedUser = users.find(
        u =>
          String(u.id) === currentUserId ||
          String(u.user_id || '').toLowerCase() === currentUserName,
      );

      if (!matchedUser) {
        await performCompleteLogout(
          'Account Removed',
          'Your user account is no longer available.',
        );
        return;
      }

      if (String(matchedUser.inactive) === '1') {
        await performCompleteLogout(
          'Account Deactivated',
          'Your account has been deactivated by administrator.',
        );
        return;
      }

      if (String(matchedUser.login_status) === '1') {
        await performCompleteLogout(
          'Session Ended',
          'You have been logged out remotely by administrator.',
        );
        return;
      }
    }
  } catch (error) {
    console.log('Session validation check error:', error.message);
  } finally {
    isCheckingSession = false;
  }
};

export const startSessionWatcher = () => {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
  }

  // Initial check
  validateCurrentUserSession();

  // Periodic check every 10 seconds
  sessionCheckInterval = setInterval(() => {
    validateCurrentUserSession();
  }, 10000);

  // AppState change listener (runs whenever user opens or switches back to the app)
  if (appStateSubscription) {
    appStateSubscription.remove();
  }
  appStateSubscription = AppState.addEventListener('change', nextAppState => {
    if (nextAppState === 'active') {
      validateCurrentUserSession();
    }
  });
};

export const stopSessionWatcher = () => {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
    sessionCheckInterval = null;
  }
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
};
