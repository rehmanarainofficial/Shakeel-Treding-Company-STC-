import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
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

const DailyDispatchScreen = () => {
  const { id, role_id } = useSelector(state => state.Data.currentData);
  const navigation = useNavigation();
  const [dispatchData, setDispatchData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDispatchData = async () => {
    try {
      setError(null);
      const formData = new FormData();
      formData.append('user_id', id);
      formData.append('role_id', role_id);

      const response = await fetch(`${API_URL}get_daily_dispatched.php`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.status === 'true' && result.data) {
        setDispatchData(result.data);
        setFilteredData(result.data);
      } else {
        setError('No data available');
        setDispatchData([]);
        setFilteredData([]);
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
    fetchDispatchData();
  }, []);

  const handleSearch = query => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredData(dispatchData);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = dispatchData.filter(item => {
      const driverName = (item.driver_name || '').toLowerCase();
      const vehicleNo = (item.vehicle_no || '').toLowerCase();
      const reference = (item.reference || '').toLowerCase();

      return (
        driverName.includes(lowercaseQuery) ||
        vehicleNo.includes(lowercaseQuery) ||
        reference.includes(lowercaseQuery)
      );
    });

    setFilteredData(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setSearchQuery('');
    fetchDispatchData();
  };

  const renderDispatchCard = item => (
    <View key={item.reference} style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.infoRowContainer}>
          <View style={styles.infoRowHalf}>
            <Ionicons
              name="person-circle-outline"
              size={16}
              color={colors.primary}
            />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{item.name}</Text>
            </View>
          </View>

          <View style={styles.infoRowHalf}>
            <Ionicons name="call-outline" size={16} color={colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Contact</Text>
              <Text style={styles.infoValue}>{item.contact_no}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRowContainer}>
          <View style={styles.infoRowHalf}>
            <Ionicons
              name="document-text-outline"
              size={16}
              color={colors.primary}
            />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Reference</Text>
              <Text style={styles.infoValue}>{item.reference}</Text>
            </View>
          </View>

          <View style={styles.infoRowHalf}>
            <Ionicons name="receipt-outline" size={16} color={colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Gate Pass</Text>
              <Text style={styles.infoValue}>{item.gate_pass_no}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRowContainer}>
          <View style={styles.infoRowHalf}>
            <Ionicons name="person-outline" size={16} color={colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Driver</Text>
              <Text style={styles.infoValue}>{item.driver_name}</Text>
            </View>
          </View>

          <View style={styles.infoRowHalf}>
            <Ionicons name="car-outline" size={16} color={colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Vehicle</Text>
              <Text style={styles.infoValue}>{item.vehicle_no}</Text>
            </View>
          </View>
        </View>

        <View style={styles.quantityContainer}>
          <View style={styles.quantityBox}>
            <Text style={styles.quantityLabel}>Boxes</Text>
            <Text style={styles.quantityValue}>{item.boxes}</Text>
          </View>
          <View style={styles.quantityBox}>
            <Text style={styles.quantityLabel}>Pieces</Text>
            <Text style={styles.quantityValue}>{item.pcs}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Daily Dispatched"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by driver, vehicle, or reference..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading dispatch data...</Text>
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
            onPress={fetchDispatchData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons
            name="search-outline"
            size={60}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No results found' : 'No dispatch data available'}
          </Text>
          {searchQuery && (
            <Text style={styles.emptySubText}>
              Try searching with different keywords
            </Text>
          )}
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
              {filteredData.length}{' '}
              {filteredData.length === 1 ? 'Result' : 'Results'}
            </Text>
          </View>
          {filteredData.map(renderDispatchCard)}
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
  searchContainer: {
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 8,
  },
  quantityBox: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 3,
  },
  quantityValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
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
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default DailyDispatchScreen;
