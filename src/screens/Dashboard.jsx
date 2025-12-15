import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Icon2 from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/color';
import { useDispatch } from 'react-redux';
import { setLogout } from '../store/authSlice';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../Context/CartContext';
const Dashboard = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { cartCount } = useCart();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const dashboardCards = [
    {
      id: 2,
      title: 'Upload Pic',
      icon: 'cloud-upload',
      value: '45',
      subtitle: 'Files uploaded',
      color: colors.success,
      screen: 'UploadPicScreen',
    },
    {
      id: 3,
      title: 'Receivable',
      icon: 'payments',
      value: '84,560',
      subtitle: 'Pending amount',
      color: colors.chart,
      screen: 'Receivable',
    },
    {
      id: 1,
      title: 'Payable',
      icon: 'money-off',
      value: '1,234',
      subtitle: 'Items in stock',
      color: colors.primary,
      screen: 'Payable',
    },
    {
      id: 4,
      title: 'Cash/Bank',
      icon: 'account-balance',
      value: '2,45,780',
      subtitle: 'Available balance',
      color: colors.primaryLight,
      screen: 'CashBank',
    },
  ];

  const quickActions = [
    { id: 1, title: 'Order', icon: 'shopping-cart', screen: 'OrderScreen' },
    {
      id: 2,
      title: 'Quotation',
      icon: 'description',
      screen: 'InquiryScreen',
    },
  ];

  const handleCardPress = screenName => {
    if (screenName) {
      navigation.navigate(screenName);
    }
  };

  const handleQuickActionPress = screenName => {
    if (screenName) {
      navigation.navigate(screenName);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="light-content" />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.companyName}>STC</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('CartScreen')}
          >
            <Ionicons name="cart-outline" size={28} color={colors.text} />
            <View
              style={[
                styles.notificationBadge,
                cartCount === 0 && { backgroundColor: colors.textSecondary },
              ]}
            >
              <Text style={styles.badgeText}>
                {cartCount > 9 ? '9+' : cartCount}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="notifications" size={24} color={colors.text} />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.iconCircle,
              { backgroundColor: 'rgba(255,215,0,0.1)' },
            ]}
            onPress={() => dispatch(setLogout())}
          >
            <Icon2 name="logout" size={22} color="#FFD700" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Welcome */}
        <Animated.View
          style={[
            styles.welcomeSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          style={[
            styles.quickActionsSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            {quickActions.map(action => (
              <Animated.View key={action.id} style={styles.quickActionWrapper}>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  activeOpacity={0.7}
                  onPress={() => handleQuickActionPress(action.screen)}
                >
                  <View style={styles.quickActionContent}>
                    <View style={styles.quickActionIcon}>
                      <Icon
                        name={action.icon}
                        size={28}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={styles.quickActionText}>{action.title}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Dashboard Cards */}
        <Animated.View
          style={[
            styles.cardsSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.cardsGrid}>
            {dashboardCards.map((card, index) => (
              <Animated.View
                key={card.id}
                style={[
                  styles.cardWrapper,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [40 + index * 10, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {/* ✅ Navigation added here */}
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => handleCardPress(card.screen)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.cardIcon,
                        { backgroundColor: card.color + '20' },
                      ]}
                    >
                      <Icon name={card.icon} size={24} color={card.color} />
                    </View>
                  </View>
                  <Text style={styles.cardValue}>{card.value}</Text>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View
          style={[
            styles.activitySection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityList}>
            {[1, 2, 3].map(item => (
              <Animated.View key={item} style={styles.activityItemWrapper}>
                <View style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Icon
                      name="check-circle"
                      size={20}
                      color={colors.success}
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>
                      Order #{1000 + item} completed
                    </Text>
                    <Text style={styles.activityTime}>2 hours ago</Text>
                  </View>
                  <Text style={styles.activityAmount}>+{item * 2500}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100, // Extra padding for bottom navigation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.card,
  },
  headerLeft: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconButton: {
    padding: 5,
    position: 'relative',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.danger,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  welcomeSection: {
    padding: 20,
    paddingBottom: 10,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  dateText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  quickActionsSection: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  quickActionWrapper: {
    flex: 1,
  },
  quickActionButton: {
    backgroundColor: colors.card,
    borderRadius: 15,
    padding: 20,
    height: 100,
    justifyContent: 'center',
  },
  quickActionContent: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  cardsSection: {
    padding: 20,
    paddingTop: 10,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  cardWrapper: {
    width: '47%',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    minHeight: 140,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  activitySection: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  activityList: {
    backgroundColor: colors.card,
    borderRadius: 15,
    overflow: 'hidden',
  },
  activityItemWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  activityAmount: {
    color: colors.success,
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 30,
  },
});
