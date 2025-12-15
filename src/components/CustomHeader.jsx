import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/color';
import Animated, { FadeInDown } from 'react-native-reanimated';

const CustomHeader = ({
  title,
  onBackPress,
  rightComponent,
  showBackButton = true,
}) => {
  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <View style={styles.header}>
        {/* Left Side */}
        <View style={styles.headerLeft}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackPress}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <Animated.Text
          entering={FadeInDown.duration(400)}
          numberOfLines={1}
          style={styles.headerTitle}
        >
          {title}
        </Animated.Text>

        {/* Right Side */}
        <View style={styles.headerRight}>
          {rightComponent || <View style={styles.placeholder} />}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    paddingBottom: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    padding: 6,
  },
  headerTitle: {
    flex: 2,
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  placeholder: {
    width: 32,
  },
});

export default CustomHeader;
