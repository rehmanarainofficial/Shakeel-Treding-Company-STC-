import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  BackHandler,
  Modal,
  TextInput,
  Keyboard,
  Platform,
  Vibration,
  AppState,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import { colors } from '../utils/color';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { API_URL } from '@env';

const ScannerScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('Initializing scanner...');
  const [isScanning, setIsScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});
  const [appState, setAppState] = useState(AppState.currentState);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [stockList, setStockList] = useState([]);
  const [filteredStockList, setFilteredStockList] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');

  const device = useCameraDevice('back');
  const navigation = useNavigation();
  const cameraRef = useRef(null);
  const textInputRef = useRef(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        if (hasPermission) {
          setIsCameraActive(true);
        }
      } else if (nextAppState.match(/inactive|background/)) {
        setIsCameraActive(false);
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [appState, hasPermission]);

  const playBeepSound = useCallback(() => {
    try {
      const vibrationPattern = Platform.OS === 'ios' ? 100 : 200;
      Vibration.vibrate(vibrationPattern);
    } catch (error) {
      console.log('Vibration not available, continuing silently');
    }
  }, []);

  const showCustomAlertModal = useCallback((title, message, onConfirm) => {
    setAlertConfig({
      title,
      message,
      onConfirm: () => {
        setShowCustomAlert(false);
        if (typeof onConfirm === 'function') {
          onConfirm();
        }
      },
    });
    setShowCustomAlert(true);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (hasPermission === true) {
        setIsCameraActive(true);
        setIsScanning(true);
      }

      return () => {
        setIsCameraActive(false);
        setIsScanning(false);
      };
    }, [hasPermission]),
  );

  useEffect(() => {
    if (showManualInput && textInputRef.current) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 300);
    }
  }, [showManualInput]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (loading || searchLoading) return true;
        if (showManualInput) {
          setShowManualInput(false);
          setManualInput('');
          return true;
        }
        if (showCustomAlert) {
          setShowCustomAlert(false);
          return true;
        }
        return false;
      },
    );
    return () => backHandler.remove();
  }, [loading, showManualInput, searchLoading, showCustomAlert]);

  useEffect(() => {
    if (hasInitialized) return;

    const initializeCamera = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));

        setCameraStatus('Requesting camera permission...');
        const permission = await Camera.requestCameraPermission();

        if (permission === 'granted') {
          setHasPermission(true);
          setCameraStatus('Align QR code within frame');
          setIsCameraActive(true);
        } else {
          setHasPermission(false);
          setCameraStatus('Camera permission required');
          showCustomAlertModal(
            'Camera Access Required',
            'Please enable camera permission to scan QR codes',
          );
        }
      } catch (error) {
        console.error('Camera initialization error:', error);
        setHasPermission(false);
        setCameraStatus('Camera initialization failed');
        showCustomAlertModal(
          'Camera Error',
          'Failed to initialize camera. Please restart the app.',
        );
      } finally {
        setHasInitialized(true);
      }
    };

    const timer = setTimeout(() => {
      initializeCamera();
    }, 1000);

    return () => clearTimeout(timer);
  }, [hasInitialized, showCustomAlertModal]);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const response = await fetch(`${API_URL}stock_master.php`);
        const result = await response.json();
        if (result.status === 'true' && Array.isArray(result.data)) {
          setStockList(result.data);
          setFilteredStockList(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch stock data:', error);
      }
    };

    fetchStockData();
  }, []);

  useEffect(() => {
    if (dropdownSearch.trim() === '') {
      setFilteredStockList(stockList);
    } else {
      const filtered = stockList.filter(item =>
        item.description.toLowerCase().includes(dropdownSearch.toLowerCase()),
      );
      setFilteredStockList(filtered);
    }
  }, [dropdownSearch, stockList]);

  const toggleFlash = useCallback(() => {
    setIsFlashOn(!isFlashOn);
  }, [isFlashOn]);

  const fetchProductData = useCallback(
    async (stockId, source = 'scan') => {
      try {
        if (source === 'manual') {
          setSearchLoading(true);
          Keyboard.dismiss();
        } else {
          setLoading(true);
        }
        setIsScanning(false);

        const formData = new FormData();
        if (source === 'manual_name') {
          formData.append('name', stockId); // Use stockId param as name for this source
        } else {
          formData.append('stock_id', stockId);
        }

        const response = await fetch(`${API_URL}stc_locations.php`, {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' },
        });

        const responseText = await response.text();

        if (!responseText || responseText.trim() === '') {
          throw new Error('Empty response from server');
        }

        let jsonString = responseText;
        if (responseText.includes('/') && responseText.includes('{')) {
          const jsonStartIndex = responseText.indexOf('{');
          jsonString = responseText.substring(jsonStartIndex);
        }

        let data;
        try {
          data = JSON.parse(jsonString);
        } catch (parseError) {
          try {
            const lastBraceIndex = jsonString.lastIndexOf('}');
            if (lastBraceIndex !== -1) {
              const fixedJsonString = jsonString.substring(
                0,
                lastBraceIndex + 1,
              );
              data = JSON.parse(fixedJsonString);
            } else {
              throw new Error('No valid JSON object found');
            }
          } catch {
            throw new Error('Invalid JSON response from server');
          }
        }

        if (data && (data.status === 'true' || data.status_basic === 'true')) {
          setTimeout(() => {
            setShowManualInput(false);
            setManualInput('');
            navigation.navigate('ProductDetails', {
              productData: data,
              stockId: stockId,
            });
          }, 1000);
        } else {
          showCustomAlertModal(
            'Product Not Found',
            `No product found with ${
              source === 'manual_name' ? 'Name' : 'Stock ID'
            }: "${stockId}"`,
            () => {
              setIsScanning(true);
              if (source === 'manual') {
                setTimeout(() => textInputRef.current?.focus(), 500);
              }
            },
          );
        }
      } catch (error) {
        showCustomAlertModal(
          'Request Failed',
          error.message ||
            'Failed to fetch product data. Please check your connection and try again.',
          () => {
            setIsScanning(true);
            if (source === 'manual') {
              setTimeout(() => textInputRef.current?.focus(), 500);
            }
          },
        );
      } finally {
        setLoading(false);
        setSearchLoading(false);
      }
    },
    [navigation, showCustomAlertModal],
  );

  const extractStockId = useCallback(scannedData => {
    if (!scannedData) return null;
    return String(scannedData).trim();
  }, []);

  const handleManualInputChange = useCallback(text => {
    setManualInput(text);
  }, []);

  const handleManualSubmit = useCallback(() => {
    const trimmedInput = manualInput.trim();
    if (trimmedInput.length > 0) {
      fetchProductData(trimmedInput, 'manual');
    } else {
      showCustomAlertModal(
        'Invalid Input',
        'Please enter a stock ID to search.',
      );
    }
  }, [manualInput, fetchProductData, showCustomAlertModal]);

  const handleNameSubmit = useCallback(() => {
    if (nameInput.trim().length >= 3) {
      fetchProductData(nameInput.trim(), 'manual_name');
    } else {
      showCustomAlertModal(
        'Invalid Input',
        'Please enter at least 3 characters to search by name.',
      );
    }
  }, [nameInput, fetchProductData, showCustomAlertModal]);

  const handleStockSelect = item => {
    setIsDropdownOpen(false);
    setShowManualInput(false);
    setManualInput('');
    setDropdownSearch('');
    fetchProductData(item.stock_id, 'manual');
  };

  const renderDropdownItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => handleStockSelect(item)}
    >
      <Text style={styles.dropdownItemText}>{item.description}</Text>
      <Text style={styles.dropdownItemSubText}>ID: {item.stock_id}</Text>
    </TouchableOpacity>
  );

  const codeScanner = useCodeScanner({
    codeTypes: [
      'qr',
      'code-128',
      'code-39',
      'code-93',
      'ean-13',
      'ean-8',
      'upc-a',
      'upc-e',
    ],
    onCodeScanned: useCallback(
      codes => {
        if (codes[0]?.value && isScanning && !loading && hasPermission) {
          const scannedValue = codes[0].value;

          playBeepSound();

          setIsScanning(false);

          const stockId = extractStockId(scannedValue);
          if (stockId) {
            fetchProductData(stockId, 'scan');
          } else {
            showCustomAlertModal(
              'Invalid Code',
              'Scanned barcode or QR code is empty.',
              () => setTimeout(() => setIsScanning(true), 1500),
            );
          }
        }
      },
      [
        isScanning,
        loading,
        hasPermission,
        playBeepSound,
        extractStockId,
        fetchProductData,
        showCustomAlertModal,
      ],
    ),
  });

  const closeManualInput = useCallback(() => {
    setShowManualInput(false);
    setManualInput('');
    setNameInput('');
    Keyboard.dismiss();
  }, []);

  const CustomAlertModal = useCallback(
    () => (
      <Modal
        visible={showCustomAlert}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCustomAlert(false)}
      >
        <View style={styles.alertModalContainer}>
          <View style={styles.alertModalContent}>
            <Ionicons
              name="warning"
              size={48}
              color={colors.primary}
              style={styles.alertIcon}
            />
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => {
                setShowCustomAlert(false);
                if (typeof alertConfig.onConfirm === 'function') {
                  alertConfig.onConfirm();
                }
              }}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    ),
    [showCustomAlert, alertConfig],
  );

  const retryCameraPermission = useCallback(async () => {
    try {
      setCameraStatus('Requesting camera permission...');
      const permission = await Camera.requestCameraPermission();

      if (permission === 'granted') {
        setHasPermission(true);
        setCameraStatus('Align QR code within frame');
        setIsCameraActive(true);
      } else {
        showCustomAlertModal(
          'Camera Access Required',
          'Please enable camera permission to scan QR codes',
        );
      }
    } catch (error) {
      showCustomAlertModal(
        'Permission Error',
        'Failed to request camera permission. Please check app settings.',
      );
    }
  }, [showCustomAlertModal]);

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{cameraStatus}</Text>
      </View>
    );
  }

  if (!device || hasPermission === false) {
    return (
      <View style={styles.center}>
        <Ionicons
          name={hasPermission === false ? 'camera-off' : 'qr-code-outline'}
          size={80}
          color={colors.primary}
        />
        <Text style={styles.loadingText}>
          {!device ? 'Camera not available on this device' : cameraStatus}
        </Text>

        {hasPermission === false && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={retryCameraPermission}
          >
            <Ionicons name="refresh" size={20} color={colors.text} />
            <Text style={styles.retryButtonText}>Retry Camera Permission</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => setShowManualInput(true)}
        >
          <Ionicons name="keypad" size={22} color={colors.primary} />
          <Text style={styles.manualButtonText}>Enter Stock ID Manually</Text>
        </TouchableOpacity>

        <CustomAlertModal />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="scan" size={26} color={colors.primary} />
          <Text style={styles.title}>QR Scanner</Text>
        </View>
      </View>

      {/* Scanner Status */}
      <Text style={styles.statusText}>
        {loading ? 'Fetching product details...' : cameraStatus}
      </Text>

      {/* Camera Container */}
      <View style={styles.cameraContainer}>
        {isCameraActive && hasPermission && device && (
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isCameraActive && !loading && !showManualInput}
            codeScanner={codeScanner}
            zoom={0}
            audio={false}
            torch={isFlashOn ? 'on' : 'off'}
          />
        )}

        {/* Scanner Frame with Gradient Border */}
        <View style={styles.scannerFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Scanning Animation Line */}
          {isScanning && !loading && <View style={styles.scanLine} />}
        </View>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingOverlayText}>Processing QR Code...</Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionText}>
          Position the QR code within the frame to scan automatically
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowManualInput(true)}
          disabled={loading}
        >
          <Ionicons name="keypad" size={22} color={colors.primary} />
          <Text style={styles.actionButtonText}>Manual Input</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isFlashOn && styles.flashActive]}
          onPress={toggleFlash}
          disabled={loading || !isCameraActive}
        >
          <Ionicons
            name={isFlashOn ? 'flashlight' : 'flashlight-outline'}
            size={22}
            color={isFlashOn ? colors.text : colors.primary}
          />
          <Text
            style={[
              styles.actionButtonText,
              isFlashOn && styles.flashActiveText,
            ]}
          >
            {isFlashOn ? 'Flash On' : 'Flash'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Manual Input Modal */}
      <Modal
        visible={showManualInput}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={closeManualInput}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeManualInput}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Search by Stock ID</Text>

            {/* Stock ID Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="barcode-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                ref={textInputRef}
                style={styles.searchInput}
                placeholder="Enter stock ID..."
                placeholderTextColor={colors.textSecondary}
                value={manualInput}
                onChangeText={handleManualInputChange}
                autoFocus={true}
                returnKeyType="search"
                onSubmitEditing={handleManualSubmit}
              />
              {manualInput.length > 0 && (
                <TouchableOpacity onPress={() => setManualInput('')}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Button for Stock ID */}
            <TouchableOpacity
              style={[
                styles.searchButton,
                (!manualInput.trim() || searchLoading) &&
                  styles.searchButtonDisabled,
              ]}
              onPress={handleManualSubmit}
              disabled={!manualInput.trim() || searchLoading}
            >
              {searchLoading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Ionicons name="search" size={18} color={colors.text} />
                  <Text style={styles.searchButtonText}>Search ID</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.divider} />

            <Text style={styles.modalSubtitle}>Search by Product Name</Text>

            {/* Dropdown Selector */}
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() => setIsDropdownOpen(true)}
            >
              <Text style={styles.dropdownSelectorText}>Select Product</Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Dropdown Modal */}
            <Modal
              visible={isDropdownOpen}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setIsDropdownOpen(false)}
            >
              <View style={styles.dropdownModalContainer}>
                <View style={styles.dropdownModalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Product</Text>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setIsDropdownOpen(false)}
                    >
                      <Ionicons
                        name="close"
                        size={24}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.searchContainer}>
                    <Ionicons
                      name="search"
                      size={20}
                      color={colors.textSecondary}
                      style={styles.searchIcon}
                    />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search product..."
                      placeholderTextColor={colors.textSecondary}
                      value={dropdownSearch}
                      onChangeText={setDropdownSearch}
                    />
                    {dropdownSearch.length > 0 && (
                      <TouchableOpacity onPress={() => setDropdownSearch('')}>
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  <FlatList
                    data={filteredStockList}
                    renderItem={renderDropdownItem}
                    keyExtractor={item => item.stock_id}
                    style={styles.list}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                  />
                </View>
              </View>
            </Modal>
          </View>
        </View>
      </Modal>

      <CustomAlertModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '700',
    marginLeft: 12,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  cameraContainer: {
    width: 280,
    height: 280,
    overflow: 'hidden',
    borderRadius: 20,
    position: 'relative',
    marginBottom: 30,
    backgroundColor: '#000', // Fallback background
  },
  scannerFrame: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
  },
  corner: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: colors.primary,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  loadingOverlayText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
  instructionsContainer: {
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  instructionText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  flashActive: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  flashActiveText: {
    color: colors.text,
  },
  // Manual Input Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    padding: 0,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 50,
    gap: 8,
    marginBottom: 16,
  },
  searchButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
  searchButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 20,
    width: '100%',
  },
  // Custom Alert Modal
  alertModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertModalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  alertIcon: {
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  alertButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 120,
  },
  alertButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    gap: 8,
    marginBottom: 20,
  },
  retryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    gap: 8,
  },
  manualButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dropdownSelectorText: {
    fontSize: 16,
    color: colors.text,
  },
  dropdownModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingTop: 50,
  },
  dropdownModalContent: {
    flex: 1,
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  dropdownItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  dropdownItemSubText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  list: {
    marginTop: 10,
  },
});

export default ScannerScreen;
