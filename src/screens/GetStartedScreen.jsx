import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../utils/color';

const { height } = Dimensions.get('window');

export default function GetStartedScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={[colors.background, '#2A231E', colors.primaryDark]}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY }] },
        ]}
      >
        {/* Optional subtle company logo placeholder */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[colors.primaryDark, colors.primaryLight]}
            style={styles.logoCircle}
          >
            <Text style={styles.logoText}>STC</Text>
          </LinearGradient>
        </View>

        <Text style={styles.title}>Shakeel Trading Company</Text>

        <Text style={styles.subtitle}>Elegant Tiles for Modern Homes</Text>
      </Animated.View>

      <TouchableOpacity
        style={styles.buttonWrapper}
        onPress={() => navigation.navigate('login')}
      >
        <LinearGradient
          colors={[colors.primaryLight, colors.primaryDark]}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 26,
    marginTop: -40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    elevation: 10,
    shadowColor: colors.primaryLight,
  },
  logoCircle: {
    flex: 1,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    color: colors.primaryLight,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  buttonWrapper: {
    position: 'absolute',
    bottom: height * 0.08,
    alignSelf: 'center',
    width: '80%',
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
