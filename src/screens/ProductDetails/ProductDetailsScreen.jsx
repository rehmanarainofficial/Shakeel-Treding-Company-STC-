import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../utils/color';
import { useCart } from '../../Context/CartContext';
import QuantityModal from '../../components/QuantityModal';

const { width } = Dimensions.get('window');

const ProductDetailsScreen = ({ route, navigation }) => {
  const { productData, stockId, editMode, initialQuantity, oldItemId } =
    route.params;
  const { addToCart, cartCount, removeFromCart } = useCart();

  const [quantityModalVisible, setQuantityModalVisible] = useState(false);

  const basicInfo = productData.data_basic || {};
  const locations = productData.data || [];
  const showroomData = productData.data_show || [];
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Auto-open modal if in edit mode
  useEffect(() => {
    if (editMode && initialQuantity) {
      setQuantityModalVisible(true);
    }
  }, [editMode, initialQuantity]);

  // Set cart button in header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTintColor: colors.primary, // Back button color
      headerTitleStyle: {
        color: colors.text,
        fontWeight: '600',
      },
      headerTitleAlign: 'center',
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <TouchableOpacity
            style={styles.cartIconContainer}
            onPress={() => navigation.navigate('CartScreen')}
          >
            <Ionicons name="cart-outline" size={24} color={colors.primary} />

            {/* Cart Badge - ALWAYS SHOW COUNT (even 0) */}
            <View
              style={[
                styles.cartBadge,
                cartCount === 0 && styles.cartBadgeEmpty,
              ]}
            >
              <Text style={styles.cartBadgeText}>
                {cartCount > 9 ? '9+' : cartCount}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => setQuantityModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color={colors.text} />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, cartCount]);

  const getFormattedDateTime = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedTime = `${hours}:${minutes} ${ampm}`;

    return `${formattedDate} ${formattedTime}`;
  };

  useEffect(() => {
    setCurrentDateTime(getFormattedDateTime());

    const interval = setInterval(() => {
      setCurrentDateTime(getFormattedDateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleAddToCart = quantityInfo => {
    // If editing, remove the old item first
    if (editMode && oldItemId) {
      removeFromCart(oldItemId);
    }

    addToCart(
      {
        stockId,
        basicInfo,
        productData,
      },
      quantityInfo,
    );

    // If editing, navigate back to cart
    if (editMode) {
      navigation.navigate('CartScreen');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1st Section: Product Title with Date & Time */}
        <View style={styles.titleSection}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {basicInfo.description || 'Product Name'}
          </Text>
          <Text style={styles.stockId}>Stock ID: {stockId}</Text>
          {/* Current Date and Time Display */}
          <View style={styles.dateTimeContainer}>
            <Ionicons
              name="time-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.dateTimeText}>{currentDateTime}</Text>
          </View>
        </View>

        {/* 2nd Section: Stock Locations */}
        {locations.length > 0 && (
          <View style={styles.locationsSection}>
            <Text style={styles.sectionTitle}>
              Stock Locations ({locations.length})
            </Text>

            <View style={styles.locationsGrid}>
              {locations.map((location, index) => (
                <LocationCard key={index} location={location} index={index} />
              ))}
            </View>
          </View>
        )}

        {/* 3rd Section: Showroom Display */}
        {showroomData.length > 0 && (
          <View style={styles.showroomSection}>
            <Text style={styles.sectionTitle}>
              Showroom Display ({showroomData.length})
            </Text>

            <View style={styles.showroomGrid}>
              {showroomData.map((showroom, index) => (
                <ShowroomCard key={index} showroom={showroom} index={index} />
              ))}
            </View>
          </View>
        )}

        {/* 4th Section: Product Information */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Product Information</Text>
          <View style={styles.detailsGrid}>
            <DetailBox label="Pieces" value={basicInfo.Pcs} />
            <DetailBox label="SQ Price" value={`${basicInfo.sq_price}`} />
            <DetailBox label="Packing" value={basicInfo.packing} />
          </View>
        </View>

        {/* 5th Section: Product Image (Dynamic from API) */}
        <View style={styles.imageSection}>
          {productData.url ? (
            <Image
              source={{ uri: productData.url }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.productImage,
                {
                  justifyContent: 'center',
                  alignItems: 'center',
                },
              ]}
            >
              <Ionicons
                name="image-outline"
                size={40}
                color={colors.textSecondary}
              />
              <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
                Image Not Uploaded
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Quantity Modal */}
      <QuantityModal
        visible={quantityModalVisible}
        onClose={() => setQuantityModalVisible(false)}
        onSubmit={handleAddToCart}
        productName={basicInfo.description || 'Product'}
        stockId={stockId}
        uom={basicInfo.units}
        price={basicInfo.sq_price}
        initialValues={editMode ? initialQuantity : null}
      />
    </View>
  );
};

// DetailBox Component
const DetailBox = ({ label, value }) => (
  <View style={styles.detailBox}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue} numberOfLines={1}>
      {value || 'N/A'}
    </Text>
  </View>
);

// Format Number Helper
const formatNumber = number => {
  if (number === null || number === undefined) return '0';
  return Number(number).toString().replace(/\.0+$/, '');
};

// LocationCard Component
const LocationCard = ({ location, index }) => (
  <View style={styles.locationCard}>
    <View style={styles.locationHeader}>
      <Text style={styles.locationName} numberOfLines={2}>
        {location.location_name}
      </Text>
    </View>

    <View style={styles.stockContainer}>
      <StockInfo
        type="available"
        boxes={location.a_boxes}
        pcs={location.a_pcs}
      />
      <StockInfo
        type="reserved"
        boxes={location.r_boxes}
        pcs={location.r_pcs}
      />
      <StockInfo
        type="physical"
        boxes={location.p_boxes}
        pcs={location.p_pcs}
      />
    </View>
  </View>
);

// StockInfo Component
const StockInfo = ({ type, boxes, pcs }) => {
  const getConfig = type => {
    switch (type) {
      case 'available':
        return {
          icon: 'checkmark-circle',
          color: colors.success,
          label: 'Available',
        };
      case 'reserved':
        return { icon: 'time', color: colors.primaryLight, label: 'Reserved' };
      case 'physical':
        return { icon: 'cube', color: colors.primary, label: 'Physical' };
      default:
        return {
          icon: 'help-circle',
          color: colors.textSecondary,
          label: 'Unknown',
        };
    }
  };

  const config = getConfig(type);

  return (
    <View style={styles.stockInfo}>
      <View style={styles.stockHeader}>
        <Ionicons name={config.icon} size={12} color={config.color} />
        <Text style={[styles.stockLabel, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
      <View style={styles.stockValues}>
        <Text style={styles.stockText}>
          B: {Number(formatNumber(boxes)).toFixed(0)}
        </Text>
        <Text style={styles.stockText}>
          P: {Number(formatNumber(pcs)).toFixed(0)}
        </Text>
      </View>
    </View>
  );
};

// ShowroomCard Component
const ShowroomCard = ({ showroom, index }) => (
  <View style={styles.showroomCard}>
    <View style={styles.showroomHeader}>
      <Ionicons name="business" size={16} color={colors.primary} />
      <Text style={styles.showroomTitle}>Showroom {showroom.showroom_id}</Text>
    </View>

    <View style={styles.showroomDetails}>
      <Text style={styles.showroomText}>Display: {showroom.display_id}</Text>
      <Text style={styles.showroomText}>
        Boxes: {formatNumber(showroom.boxes)}
      </Text>
      <Text style={styles.showroomText}>
        Pieces: {formatNumber(showroom.Pcs)}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Header Styles - IMPROVED WITH BADGE
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 16,
  },
  cartIconContainer: {
    position: 'relative',
    padding: 6,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 0,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.danger,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  cartBadgeEmpty: {
    backgroundColor: colors.textSecondary,
    opacity: 0.7,
  },
  cartBadgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  addToCartButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 110,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 0,
  },
  addToCartText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // Image Section - Last section
  imageSection: {
    width: '100%',
    height: 200,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 0,
  },
  // Title Section - 1st section
  titleSection: {
    padding: 20,
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
    borderWidth: 0,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 30,
  },
  stockId: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  // Date Time Container
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateTimeText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  // Details Section - 4th section
  detailsSection: {
    paddingInline: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    marginLeft: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailBox: {
    width: (width - 48) / 3,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  locationsSection: {
    paddingInline: 16,
    marginTop: 16,
  },
  locationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  locationCard: {
    width: (width - 48) / 2,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 0,
  },
  locationHeader: {
    marginBottom: 12,
  },
  locationName: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
  stockContainer: {
    gap: 8,
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(213, 155, 67, 0.1)',
    padding: 6,
    borderRadius: 6,
    borderWidth: 0,
  },
  stockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stockLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  stockValues: {
    alignItems: 'flex-end',
  },
  stockText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  showroomSection: {
    paddingInline: 16,
  },
  showroomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  showroomCard: {
    width: (width - 48) / 2,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 0,
  },
  showroomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  showroomTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  showroomDetails: {
    gap: 4,
  },
  showroomText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default ProductDetailsScreen;
