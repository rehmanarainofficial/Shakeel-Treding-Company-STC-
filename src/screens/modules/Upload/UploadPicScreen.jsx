import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../../utils/color';
import CustomHeader from '../../../components/CustomHeader';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import { API_URL } from '@env';

const UploadPicScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageSelecting, setImageSelecting] = useState(false);
  const [imageValidationError, setImageValidationError] = useState('');

  // Fetch products from API with caching
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      // Load cached data instantly
      const cachedData = await AsyncStorage.getItem('products_cache');
      if (cachedData) {
        setProducts(JSON.parse(cachedData));
      }

      const response = await fetch(`${API_URL}stock_master.php`);
      const result = await response.json();

      if (result.status === 'true' && result.data) {
        setProducts(result.data);
        await AsyncStorage.setItem(
          'products_cache',
          JSON.stringify(result.data),
        );
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch products',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Network request failed',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter products based on search query
  const filteredProducts = React.useMemo(() => {
    if (!searchQuery.trim()) return products;

    return products.filter(
      product =>
        product.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        product.stock_id?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [products, searchQuery]);

  // Handle card click to navigate to ProductDetailsScreen
  const handleCardPress = async product => {
    try {
      const formData = new FormData();
      formData.append('stock_id', product.stock_id);

      const response = await fetch(`${API_URL}stc_locations.php`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();

      if (data && (data.status === 'true' || data.status_basic === 'true')) {
        navigation.navigate('ProductDetails', {
          productData: data,
          stockId: product.stock_id,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch product details',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Network request failed',
      });
    }
  };

  const handleUploadPress = product => {
    setSelectedProduct(product);
    setUploadModalVisible(true);
    setSelectedImage(null);
    setImageValidationError('');
  };

  const handleImageSelect = () => {
    setImageSelecting(true);
    setImageValidationError('');

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, response => {
      setImageSelecting(false);

      if (response.didCancel) {
        return;
      } else if (response.error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to select image',
        });
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];

        // File size validation (1MB = 1048576 bytes)
        if (asset.fileSize > 1048576) {
          setImageValidationError('Image size must be less than 1MB');
          return;
        }

        // File type validation
        const fileType = asset.type?.toLowerCase();
        const fileName = asset.fileName?.toLowerCase();

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        const allowedExtensions = ['.jpg', '.jpeg', '.png'];

        const isTypeValid = fileType && allowedTypes.includes(fileType);
        const isExtensionValid =
          fileName &&
          allowedExtensions.some(ext => fileName.toLowerCase().endsWith(ext));

        if (!isTypeValid && !isExtensionValid) {
          setImageValidationError('Only JPG and PNG images are allowed');
          return;
        }

        setSelectedImage(asset);
        setImageValidationError('');
      }
    });
  };

  const handleUpload = async () => {
    if (!selectedImage || !selectedProduct) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select an image first',
      });
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      const originalFileName = selectedImage.fileName || 'image.jpg';
      const fileExtension = originalFileName.split('.').pop();
      const newFileName = `${selectedProduct.stock_id}.${fileExtension}`;

      const file = {
        uri: selectedImage.uri,
        type: selectedImage.type || 'image/jpeg',
        name: newFileName,
      };

      formData.append('stock_id', selectedProduct.stock_id);
      formData.append('filename', file);

      const response = await fetch(`${API_URL}dattachment_post.php`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      if (response.ok && result.status) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Image uploaded successfully',
        });

        // Update local state to reflect the uploaded image
        setProducts(prevProducts =>
          prevProducts.map(product =>
            product.stock_id === selectedProduct.stock_id
              ? { ...product, url: 'Yes' } // Update URL status to 'Yes'
              : product,
          ),
        );

        // Update cache
        const updatedProducts = products.map(product =>
          product.stock_id === selectedProduct.stock_id
            ? { ...product, url: 'Yes' }
            : product,
        );
        await AsyncStorage.setItem(
          'products_cache',
          JSON.stringify(updatedProducts),
        );

        setUploadModalVisible(false);
        setSelectedImage(null);
        setSelectedProduct(null);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error.message || 'Failed to upload image',
      });
    } finally {
      setUploading(false);
    }
  };

  const formatNumber = number => {
    if (number === null || number === undefined) return '0';
    return Number(number).toString().replace(/\.0+$/, '');
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Upload Pictures"
        onBackPress={() => navigation.goBack()}
      />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by product name..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Products Grid */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsText}>
              {filteredProducts.length} products found
            </Text>

            <View style={styles.productsGrid}>
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.stock_id || index}
                  product={product}
                  onCardPress={handleCardPress}
                  onUploadPress={handleUploadPress}
                  formatNumber={formatNumber}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !uploading && setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Image</Text>
              <TouchableOpacity
                onPress={() => setUploadModalVisible(false)}
                style={styles.closeButton}
                disabled={uploading}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedProduct && (
              <View style={styles.modalProductInfo}>
                <Text style={styles.productName}>
                  {selectedProduct.description}
                </Text>
                <Text style={styles.stockId}>{selectedProduct.stock_id}</Text>
              </View>
            )}

            {/* Image Section with Loader and Validation Message */}
            <View style={styles.imageSection}>
              {imageSelecting ? (
                <View style={styles.loadingImageContainer}>
                  <Ionicons
                    name="cloud-download-outline"
                    size={40}
                    color={colors.primary}
                  />
                  <Text style={styles.loadingImageText}>Loading image...</Text>
                </View>
              ) : imageValidationError ? (
                <View style={styles.validationErrorContainer}>
                  <Ionicons
                    name="warning-outline"
                    size={40}
                    color={colors.error}
                  />
                  <Text style={styles.validationErrorText}>
                    {imageValidationError}
                  </Text>
                </View>
              ) : selectedImage ? (
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons
                    name="image-outline"
                    size={50}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.placeholderText}>No image selected</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.button, styles.selectButton]}
                onPress={handleImageSelect}
                disabled={uploading || imageSelecting}
              >
                <Ionicons name="images-outline" size={20} color={colors.text} />
                <Text style={styles.buttonText}>
                  {imageSelecting ? 'Selecting...' : 'Select from Gallery'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.uploadButton,
                  (!selectedImage || uploading || imageSelecting) &&
                    styles.disabledButton,
                ]}
                onPress={handleUpload}
                disabled={!selectedImage || uploading || imageSelecting}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.buttonText}>
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
};

// Updated Product Card Component with URL status and clickable
const ProductCard = ({ product, onCardPress, onUploadPress, formatNumber }) => (
  <TouchableOpacity
    style={styles.productCard}
    onPress={() => onCardPress(product)}
    activeOpacity={0.7}
  >
    {/* Card Header */}
    <View style={styles.cardHeader}>
      <View style={styles.cardProductInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.description || 'No Description'}
        </Text>
        <Text style={styles.stockId}>{product.stock_id}</Text>
      </View>
      <TouchableOpacity
        style={styles.uploadIcon}
        onPress={e => {
          e.stopPropagation(); // Prevent card press when clicking upload icon
          onUploadPress(product);
        }}
      >
        <Ionicons name="camera" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>

    {/* Separator */}
    <View style={styles.separator} />

    {/* Product Details Grid */}
    <View style={styles.detailsGrid}>
      <View style={styles.detailRow}>
        <DetailItem label="Pieces" value={formatNumber(product.Pcs)} />
        <DetailItem label="Boxes" value={formatNumber(product.boxes)} />
        <DetailItem
          label="SQ Price"
          value={`${formatNumber(product.sq_price)}`}
        />
      </View>
      <View style={styles.detailRow}>
        <DetailItem label="Packing" value={formatNumber(product.packing)} />
        <DetailItem label="Units" value={product.units} />
        <View style={styles.emptyItem} />
      </View>
    </View>

    {/* Upload Status with URL Indicator */}
    <View style={styles.uploadStatus}>
      <View style={styles.statusLeft}>
        <Ionicons
          name={product.url === 'Yes' ? 'checkmark-circle' : 'time-outline'}
          size={14}
          color={product.url === 'Yes' ? colors.success : colors.textSecondary}
        />
        <Text
          style={[
            styles.statusText,
            product.url === 'Yes' && styles.uploadedText,
          ]}
        >
          {product.url === 'Yes' ? 'Image Uploaded' : 'Awaiting upload'}
        </Text>
      </View>
      {product.url === 'Yes' && (
        <View style={styles.urlBadge}>
          <Text style={styles.urlBadgeText}>URL: Yes</Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

// Detail Item Component
const DetailItem = ({ label, value }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Search Section
  searchSection: {
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    marginLeft: 12,
    marginRight: 8,
  },
  // Loading Container
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  resultsText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    marginLeft: 4,
  },
  // Products Grid
  productsGrid: {
    gap: 16,
  },
  // Product Card
  productCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardProductInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  stockId: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  uploadIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(213, 155, 67, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Separator
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  // Details Grid
  detailsGrid: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  emptyItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  // Upload Status
  uploadStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  uploadedText: {
    color: colors.success,
    fontWeight: '600',
  },
  urlBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urlBadgeText: {
    fontSize: 10,
    color: colors.text,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 0,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalProductInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  // Image Section
  imageSection: {
    padding: 20,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  // New styles for image loading and validation
  loadingImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  loadingImageText: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 8,
    fontWeight: '600',
  },
  validationErrorContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: 'rgba(255,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.error,
    borderStyle: 'dashed',
    padding: 16,
  },
  validationErrorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  // Action Buttons
  actionButtons: {
    padding: 20,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  selectButton: {
    backgroundColor: colors.primary,
  },
  uploadButton: {
    backgroundColor: colors.success,
  },
  disabledButton: {
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});

export default UploadPicScreen;
