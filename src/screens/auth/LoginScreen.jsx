import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { colors } from '../../utils/color';
import { CurrentLogin, setLoader } from '../../store/authSlice';
import { API_URL } from '@env';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const Loading = useSelector(state => state.Data.Loading);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loginUser = async () => {
    if (!username.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Please enter your username or email',
      });
      return;
    } else if (!password.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter your password' });
      return;
    }

    dispatch(setLoader(true));
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${API_URL}users.php`,
      headers: {},
    };

    try {
      const res = await dispatch(CurrentLogin({ config, username, password }));
      dispatch(setLoader(false));

      if (res.payload) {
        Toast.show({
          type: 'success',
          text1: 'Login successful!',
          visibilityTime: 1500,
        });
        navigation.replace('MainTabs');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Invalid credentials',
          text2: 'Your username or password is incorrect',
        });
      }
    } catch (err) {
      dispatch(setLoader(false));
      Toast.show({
        type: 'error',
        text1: 'Network error',
        text2: 'Please check your internet connection',
      });
    } finally {
      dispatch(setLoader(false));
    }
  };

  return (
    <LinearGradient
      colors={[colors.background, '#2A231E', colors.primaryDark]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <LinearGradient
            colors={[colors.primaryDark, colors.primaryLight]}
            style={styles.logoCircle}
          >
            <Text style={styles.logoText}>STC</Text>
          </LinearGradient>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Log in to manage your tile projects and explore elegant designs.
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Icon
              name="account-outline"
              size={22}
              color={colors.primaryLight}
            />
            <TextInput
              placeholder="Email or Username"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              onChangeText={setUsername}
              value={username}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Icon name="lock-outline" size={22} color={colors.primaryLight} />
            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showPassword}
              style={styles.input}
              onChangeText={setPassword}
              value={password}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={colors.primaryLight}
              />
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, { opacity: Loading ? 0.7 : 1 }]}
            onPress={loginUser}
            disabled={Loading}
          >
            {Loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <LinearGradient
                colors={[colors.primaryLight, colors.primaryDark]}
                style={styles.gradientBtn}
              >
                <Text style={styles.buttonText}>Login</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    elevation: 8,
  },
  logoText: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryLight,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    width: '88%',
    alignSelf: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(213,155,67,0.3)',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(213,155,67,0.25)',
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 10,
    marginLeft: 10,
  },
  button: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  gradientBtn: {
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 25,
    color: colors.textSecondary,
    fontSize: 13,
  },
});
