import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/color';
import { API_URL } from '@env';
import { useCart } from '../Context/CartContext';
import Toast from 'react-native-toast-message';
import Share from 'react-native-share';
import { generatePDF } from '../utils/PDFGenerator';
import { decode } from 'base-64';
import { useSelector } from 'react-redux';

if (typeof atob === 'undefined') {
  global.atob = decode;
}

const InquiryScreen = ({ navigation }) => {
  const { loadCartFromOrder } = useCart();
  const currentData = useSelector(state => state.Data?.currentData);
  const real_name = currentData?.real_name;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [sharingId, setSharingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(
        `${API_URL}pending_quotation.php?_=${Date.now()}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();
      if (
        jsonData.status === 'true' &&
        jsonData.data &&
        Array.isArray(jsonData.data)
      ) {
        setData(jsonData.data);
      } else if (Array.isArray(jsonData)) {
        setData(jsonData);
      } else if (jsonData.data && Array.isArray(jsonData.data)) {
        setData(jsonData.data);
      } else {
        setData([]);
        if (!jsonData.data) {
          throw new Error('No data found in response');
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = amount => {
    if (!amount && amount !== 0) return 'N/A';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) return 'Invalid amount';

    return `${Math.round(numAmount).toLocaleString('en-PK')}`;
  };

  const handleEditOrder = async orderNo => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('order_no', orderNo);

      const response = await fetch(`${API_URL}pending_quotation_item.php`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.status === 'true' && result.data) {
        const headerData = result.header_data?.[0] || result.data_header?.[0];
        loadCartFromOrder(result.data, headerData);
        Toast.show({
          type: 'success',
          text1: 'Order Loaded',
          text2: 'Order items have been loaded into cart',
        });
        navigation.navigate('CartScreen');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load order items',
        });
      }
    } catch (error) {
      console.error('Edit order error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred while loading order',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async item => {
    try {
      const id = item.order_no || item.trans_no;
      setSharingId(id);

      const formData = new FormData();
      formData.append('trans_no', id);
      formData.append('type', item.type);

      const response = await fetch(`${API_URL}view_data.php`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('response', result);
      let headerData = null;
      let detailsData = [];

      if (result.status_header === 'true' && result.data_header?.length > 0) {
        headerData = result.data_header[0];
      }

      if (result.status_detail === 'true' && result.data_detail?.length > 0) {
        detailsData = result.data_detail;
      }

      if (!headerData) {
        throw new Error('Could not fetch order details');
      }
      const headerWithRealName = {
        ...headerData,
        real_name: real_name,
      };
      const filePath = await generatePDF(headerWithRealName, detailsData);

      const shareUrl = `file://${filePath}`;

      const shareOptions = {
        url: shareUrl,
        type: 'application/pdf',
        title: `Quotation ${headerData.trans_no}`,
        message: `Quotation ${headerData.trans_no} - ${headerData.name}`,
        subject: `Quotation ${headerData.trans_no}`,
        failOnCancel: false,
      };

      await Share.open(shareOptions);

      Toast.show({
        type: 'success',
        text1: 'Shared Successfully',
        text2: 'PDF has been generated and shared',
      });
    } catch (error) {
      console.error('Share error:', error);
      Toast.show({
        type: 'error',
        text1: 'Share Failed',
        text2: error.message || 'Could not share inquiry',
      });
    } finally {
      setSharingId(null);
    }
  };

  const CardItem = ({ item, index }) => (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.referenceContainer}>
            <Ionicons
              name="document-text"
              size={16}
              color={colors.primaryLight}
            />
            <Text style={styles.referenceLabel}>Reference:</Text>
            <Text style={styles.referenceValue} numberOfLines={1}>
              {item.reference || item.order_no || 'N/A'}
            </Text>
          </View>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: colors.success },
            ]}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Ionicons name="person" size={16} color={colors.textSecondary} />
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value} numberOfLines={1}>
            {item.name || 'N/A'}
          </Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="calendar" size={16} color={colors.textSecondary} />
          <Text style={styles.label}>Order Date:</Text>
          <Text style={styles.value}>{formatDate(item.ord_date)}</Text>
        </View>

        <View style={[styles.row, styles.totalRow]}>
          <Ionicons name="cash" size={18} color={colors.primary} />
          <Text style={styles.label}>Total:</Text>
          <Text style={styles.totalValue}>{formatCurrency(item.total)}</Text>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() =>
              navigation.navigate('InquiryDetailsScreen', {
                order_no: item.order_no || item.trans_no,
                type: item.type,
              })
            }
          >
            <Text style={styles.detailsButtonText}>Details</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.detailsButton, { marginLeft: 8 }]}
            onPress={() => handleEditOrder(item.order_no || item.trans_no)}
          >
            <Text style={styles.detailsButtonText}>Edit</Text>
            <Ionicons name="create-outline" size={16} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.detailsButton, { marginLeft: 8 }]}
            onPress={() => handleShare(item)}
            disabled={sharingId === (item.order_no || item.trans_no)}
          >
            {sharingId === (item.order_no || item.trans_no) ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Text style={styles.detailsButtonText}>Share</Text>
                <Ionicons
                  name="share-social-outline"
                  size={16}
                  color={colors.primary}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Ionicons name="alert-circle" size={64} color={colors.danger} />
          <Text style={styles.errorTitle}>Error Loading Data</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (data.length === 0) {
      return (
        <View style={styles.centered}>
          <Ionicons name="document" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No data available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item, index) =>
          `${item.reference || item.order_no || 'item'}-${index}`
        }
        renderItem={({ item, index }) => <CardItem item={item} index={index} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Inquiries"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity style={styles.headerButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        }
      />
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  cardContainer: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(42, 36, 31, 0.5)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  referenceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    marginRight: 4,
  },
  referenceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalRow: {
    backgroundColor: 'rgba(213, 155, 67, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(213, 155, 67, 0.2)',
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 10,
    marginRight: 8,
    width: 100,
  },
  value: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(213, 155, 67, 0.1)',
  },
  detailsButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    height: 12,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    padding: 6,
  },
});

export default InquiryScreen;
