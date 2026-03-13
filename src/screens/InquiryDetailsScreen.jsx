import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import { colors } from '../utils/color';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { API_URL } from '@env';

const InquiryDetailsScreen = ({ route, navigation }) => {
  const { order_no, type } = route.params;
  const [loading, setLoading] = useState(true);
  const [headerData, setHeaderData] = useState(null);
  const [detailsData, setDetailsData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('trans_no', order_no);
      formData.append('type', type);

      const response = await fetch(`${API_URL}view_data.php`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.status_header === 'true' && result.data_header?.length > 0) {
        setHeaderData(result.data_header[0]);
      }

      if (result.status_detail === 'true' && result.data_detail?.length > 0) {
        setDetailsData(result.data_detail);
      } else {
        setDetailsData([]);
      }
    } catch (err) {
      console.error('Error fetching details:', err);
      setError('Failed to load details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderHeaderInfo = () => {
    if (!headerData) return null;

    const fields = [
      {
        label: 'Reference',
        value: headerData.reference,
        icon: 'document-text',
      },
      { label: 'Transaction No', value: headerData.trans_no, icon: 'receipt' },
      { label: 'Date', value: headerData.trans_date, icon: 'calendar' },
      { label: 'Customer', value: headerData.name, icon: 'person' },
      { label: 'Salesman', value: headerData.salesman, icon: 'briefcase' },
    ];

    return (
      <View style={styles.headerCard}>
        <Text style={styles.sectionTitle}>Order Information</Text>
        {fields.map((field, index) => (
          <View key={index} style={styles.headerRow}>
            <View style={styles.labelContainer}>
              <Ionicons
                name={field.icon}
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.headerLabel}>{field.label}:</Text>
            </View>
            <Text style={styles.headerValue}>{field.value || 'N/A'}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderDetailItem = (item, index) => {
    const gridKeys = Object.keys(item).filter(
      key =>
        key !== 'id' && key !== 'description' && key !== 'long_description',
    );

    return (
      <View key={index} style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <Text style={styles.itemNumber}>Item {index + 1}</Text>
          {item.stock_id && <Text style={styles.stockId}>{item.stock_id}</Text>}
        </View>

        <View style={styles.gridContainer}>
          {gridKeys.map((key, i) => (
            <View key={i} style={styles.gridItem}>
              <Text style={styles.gridLabel}>
                {key.replace(/_/g, ' ').toUpperCase()}
              </Text>
              <Text style={styles.gridValue}>{item[key] || '-'}</Text>
            </View>
          ))}
        </View>

        {(item.description || item.long_description) && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>DESCRIPTION</Text>
            <Text style={styles.descriptionText}>
              {item.description}
              {item.long_description ? `\n${item.long_description}` : ''}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Inquiry Details"
        onBackPress={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={50} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {renderHeaderInfo()}

          <Text style={styles.sectionTitle}>Items ({detailsData.length})</Text>
          {detailsData.map((item, index) => renderDetailItem(item, index))}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 16,
  },
  errorText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.background,
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  headerValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  detailCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  itemNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  stockId: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: 'rgba(213, 155, 67, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 12,
    borderRadius: 8,
  },
  descriptionLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
});

export default InquiryDetailsScreen;
