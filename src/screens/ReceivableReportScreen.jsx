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

const ReceivableReportScreen = () => {
  const { user_id, role_id } = useSelector(state => state.Data.currentData);
  const navigation = useNavigation();
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchReportData = async () => {
    try {
      setError(null);
      const formData = new FormData();
      formData.append('user_id', user_id);
      formData.append('role_id', role_id);

      const response = await fetch(`${API_URL}get_receivable_report.php`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.status === 'true' && result.data) {
        // Filter out items with zero balance
        const filteredData = result.data.filter(
          item => parseFloat(item.Balance) !== 0,
        );
        setReportData(filteredData);
      } else {
        setError('No data available');
        setReportData([]);
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
    fetchReportData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReportData();
  };

  const formatBalance = balance => {
    const numBalance = parseFloat(balance);
    // Remove minus sign for negative values
    return Math.abs(parseInt(numBalance)).toLocaleString();
  };

  const getBalanceColor = balance => {
    const numBalance = parseFloat(balance);
    return numBalance < 0 ? colors.success : colors.danger;
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Receivable"
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
          <Text style={styles.loadingText}>Loading report data...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color={colors.danger}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchReportData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : reportData.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons
            name="document-text-outline"
            size={60}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>No receivable data available</Text>
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
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.nameColumn]}>Name</Text>
              <Text style={[styles.headerCell, styles.balanceColumn]}>
                Balance
              </Text>
            </View>

            {/* Table Rows */}
            {reportData.map((item, index) => (
              <View
                key={item.debtor_no}
                style={[
                  styles.tableRow,
                  index % 2 === 0 ? styles.evenRow : styles.oddRow,
                ]}
              >
                <Text
                  style={[styles.dataCell, styles.nameColumn]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.dataCell,
                    styles.balanceColumn,
                    { color: getBalanceColor(item.Balance) },
                  ]}
                >
                  {formatBalance(item.Balance)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Total Records: {reportData.length}
            </Text>
          </View>
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
  tableContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  headerCell: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  evenRow: {
    backgroundColor: colors.card,
  },
  oddRow: {
    backgroundColor: colors.background,
  },
  dataCell: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'left',
  },
  nameColumn: {
    flex: 2,
    paddingRight: 8,
  },
  balanceColumn: {
    flex: 1,
    fontWeight: '600',
    textAlign: 'right',
  },
  footer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
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

export default ReceivableReportScreen;
