import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import { colors } from '../utils/color';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '@env';
import { useSelector } from 'react-redux';

const PendingIssueOrderScreen = () => {
  const { id, role_id } = useSelector(state => state.Data.currentData);
  const navigation = useNavigation();
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrderData = async () => {
    try {
      setError(null);
      const formData = new FormData();
      formData.append('user_id', id);
      formData.append('role_id', role_id);

      const response = await fetch(`${API_URL}get_pending_issue_report.php`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.status === 'true' && result.data) {
        setOrderData(result.data);
      } else {
        setError('No data available');
        setOrderData([]);
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderData();
  };

  const formatValue = value => {
    // Check if value is numeric
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // Remove minus sign and decimal points
      return Math.abs(parseInt(numValue)).toLocaleString();
    }
    return value;
  };

  const getValueColor = (value, key) => {
    // Only apply color logic to pending_amount field
    if (key && key.toLowerCase() === 'pending_amount') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        return numValue < 0 ? colors.success : colors.danger;
      }
    }
    return colors.text;
  };

  const renderCard = (item, index) => {
    // Convert object to array of key-value pairs
    const entries = Object.entries(item);

    return (
      <View key={index} style={styles.card}>
        <View style={styles.cardContent}>
          {entries.map(([key, value], idx) => {
            // Create rows with 2 items each
            if (idx % 2 === 0) {
              const nextEntry = entries[idx + 1];
              return (
                <View key={idx} style={styles.infoRowContainer}>
                  <View style={styles.infoRowHalf}>
                    <Text style={styles.infoLabel}>{key}</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: getValueColor(value, key) },
                      ]}
                    >
                      {formatValue(value)}
                    </Text>
                  </View>

                  {nextEntry && (
                    <View style={styles.infoRowHalf}>
                      <Text style={styles.infoLabel}>{nextEntry[0]}</Text>
                      <Text
                        style={[
                          styles.infoValue,
                          { color: getValueColor(nextEntry[1], nextEntry[0]) },
                        ]}
                      >
                        {formatValue(nextEntry[1])}
                      </Text>
                    </View>
                  )}
                </View>
              );
            }
            return null;
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Pending Issue Order"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
        rightComponent={
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('MainTabs', { screen: 'Dashboard' })
            }
            style={{ padding: 4 }}
          >
            <Ionicons name="home" size={24} color="#fff" />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading order data...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color={colors.danger}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrderData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orderData.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons
            name="document-text-outline"
            size={60}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>No pending orders available</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.resultHeader}>
            <Text style={styles.resultText}>
              {orderData.length} {orderData.length === 1 ? 'Order' : 'Orders'}
            </Text>
          </View>
          {orderData.map(renderCard)}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  resultHeader: {
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 12,
  },
  infoRowContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 8,
  },
  infoRowHalf: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
});

export default PendingIssueOrderScreen;
