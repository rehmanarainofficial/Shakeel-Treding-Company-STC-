import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useCart } from '../../Context/CartContext';
import { colors } from '../../utils/color';

const CartScreen = ({ navigation }) => {
  const { cartItems, removeFromCart, submitOrder, customerInfo } = useCart();
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [documentType, setDocumentType] = useState('Order');

  useEffect(() => {
    if (customerInfo) {
      setName(customerInfo.name || '');
      setContactNo(customerInfo.contactNo || '');
      setDocumentType(customerInfo.documentType || 'Order');
    }
  }, [customerInfo]);

  const calculateTotals = () => {
    let total = 0;

    cartItems.forEach(item => {
      const box = parseFloat(item.boxes) || 0;
      const pec = parseFloat(item.pieces) || 0;
      const unit_price = parseFloat(item.price) || 0;
      const pc_packing = parseFloat(item.basicInfo?.packing) || 1;
      const quantity = box * pc_packing + pec * pc_packing;
      total += quantity * unit_price;
    });

    return {
      totalBoxes: cartItems.reduce(
        (sum, item) => sum + (parseInt(item.boxes) || 0),
        0,
      ),
      totalPieces: cartItems.reduce(
        (sum, item) => sum + (parseInt(item.pieces) || 0),
        0,
      ),
      totalAmount: total,
    };
  };

  const handleProcessOrder = () => {
    if (cartItems.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Cart is Empty',
        text2: 'Please add items to cart before processing order',
        position: 'bottom',
      });
      return;
    }
    setCustomerModalVisible(true);
  };

  const handleSubmitCustomerInfo = async () => {
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Information Required',
        text2: 'Please enter customer name',
        position: 'bottom',
      });
      return;
    }

    if (!contactNo.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Information Required',
        text2: 'Please enter contact number',
        position: 'bottom',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      Toast.show({
        type: 'info',
        text1: 'Processing...',
        text2: 'Your order is being submitted',
        visibilityTime: 2000,
      });

      const orderData = {
        customer_name: name.trim(),
        contact_number: contactNo.trim(),
        document_type: documentType,
      };

      const result = await submitOrder(orderData);

      Toast.show({
        type: 'success',
        text1: `${documentType} Successful!`,
        text2: `Order ID: ${
          result.orderId
        }\nTotal: ${calculateTotals().totalAmount.toLocaleString()}`,
        position: 'bottom',
        visibilityTime: 4000,
      });

      setCustomerModalVisible(false);
      setName('');
      setContactNo('');
      navigation.navigate('MainTabs', { screen: 'Dashboard' });
    } catch (error) {
      console.error('Order submission error:', error);

      let errorMessage =
        error.message || 'Submission failed. Please try again.';

      if (errorMessage.includes('status') && errorMessage.includes('false')) {
        errorMessage =
          'Server rejected the request. Please check the data and try again.';
      }

      Toast.show({
        type: 'error',
        text1: `${documentType} Failed`,
        text2: errorMessage,
        position: 'bottom',
        visibilityTime: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveItem = (itemId, itemName) => {
    removeFromCart(itemId);
    Toast.show({
      type: 'success',
      text1: 'Item Removed',
      text2: `${itemName} has been removed from cart`,
      position: 'bottom',
    });
  };

  const totals = calculateTotals();

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color={colors.textSecondary} />
        <Text style={styles.emptyText}>Your Cart is Empty</Text>
        <Text style={styles.emptySubText}>
          Go to product details to add products
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <Text style={styles.headerSubtitle}>
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </Text>
        </View>

        <View style={styles.itemsContainer}>
          {cartItems.map((item, index) => {
            const box = parseFloat(item.boxes) || 0;
            const pec = parseFloat(item.pieces) || 0;
            const unit_price = parseFloat(item.price) || 0;
            const pc_packing = parseFloat(item.basicInfo?.packing) || 1;
            const sqr_m = box * pc_packing + pec * pc_packing;
            const itemTotal = sqr_m * unit_price;

            return (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemNumber}>
                    <Text style={styles.itemNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate('ProductDetails', {
                          productData: item.productData,
                          stockId: item.stockId,
                          editMode: true,
                          oldItemId: item.id,
                          initialQuantity: {
                            boxes: item.boxes,
                            pieces: item.pieces,
                            discount: item.discount,
                            price: item.price,
                          },
                        })
                      }
                      style={[styles.deleteButton, { marginRight: 8 }]}
                    >
                      <Ionicons
                        name="create-outline"
                        size={20}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        handleRemoveItem(item.id, item.productName)
                      }
                      style={styles.deleteButton}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={colors.danger}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.stockId}>Stock ID: {item.stockId}</Text>

                <View style={styles.itemDetails}>
                  <View style={styles.detailRow}>
                    <DetailItem
                      label="Boxes"
                      value={item.boxes}
                      suffix="boxes"
                    />
                    <DetailItem
                      label="Pieces"
                      value={item.pieces}
                      suffix="pcs"
                    />
                    <DetailItem
                      label="Price"
                      value={`${parseFloat(item.price || 0).toLocaleString()}`}
                    />
                  </View>
                  <View style={styles.detailRow}>
                    <DetailItem
                      label="Discount"
                      value={`${parseFloat(
                        item.discount || 0,
                      ).toLocaleString()}`}
                    />
                    <DetailItem
                      label="Packing"
                      value={item.basicInfo?.packing || '1'}
                    />
                    <DetailItem
                      label="Total"
                      value={`${itemTotal.toLocaleString()}`}
                    />
                  </View>
                </View>

                <Text style={styles.addedTime}>
                  Added: {new Date(item.addedAt).toLocaleString()}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Items:</Text>
            <Text style={styles.summaryValue}>{cartItems.length}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Boxes:</Text>
            <Text style={styles.summaryValue}>{totals.totalBoxes}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Pieces:</Text>
            <Text style={styles.summaryValue}>{totals.totalPieces}</Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>
              {totals.totalAmount.toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.processButton}
          onPress={handleProcessOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <>
              <Ionicons
                name="arrow-forward"
                size={24}
                color={colors.background}
              />
              <Text style={styles.processButtonText}>Process Order</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={customerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !isSubmitting && setCustomerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customerModal}>
            <Text style={styles.modalTitle}>Customer Information</Text>
            <Text style={styles.modalSubtitle}>
              Please enter your details to complete the order
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Customer Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter customer name"
                placeholderTextColor={colors.textSecondary}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Number *</Text>
              <TextInput
                style={styles.input}
                value={contactNo}
                onChangeText={setContactNo}
                keyboardType="phone-pad"
                placeholder="Enter contact number"
                placeholderTextColor={colors.textSecondary}
                editable={!isSubmitting}
                maxLength={15}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Document Type</Text>
              <View style={styles.radioContainer}>
                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => setDocumentType('Quotation')}
                  disabled={isSubmitting}
                >
                  <View style={styles.radioOuter}>
                    {documentType === 'Quotation' && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>Quotation</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => setDocumentType('Order')}
                  disabled={isSubmitting}
                >
                  <View style={styles.radioOuter}>
                    {documentType === 'Order' && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>Order</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.radioNote}>
                Selected: {documentType} (Value captured for later use)
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalCancelButton,
                  isSubmitting && styles.disabledButton,
                ]}
                onPress={() => {
                  setCustomerModalVisible(false);
                  Toast.show({
                    type: 'info',
                    text1: 'Order Cancelled',
                    text2: 'Order processing has been cancelled',
                    position: 'bottom',
                  });
                }}
                disabled={isSubmitting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  isSubmitting && styles.disabledButton,
                ]}
                onPress={handleSubmitCustomerInfo}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <ActivityIndicator color={colors.background} size="small" />
                    <Text style={[styles.modalSubmitText, { marginLeft: 8 }]}>
                      Processing...
                    </Text>
                  </>
                ) : (
                  <Text style={styles.modalSubmitText}>Submit Order</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const DetailItem = ({ label, value, suffix }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>
      {value} {suffix || ''}
    </Text>
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
  header: {
    padding: 20,
    backgroundColor: colors.card,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  itemsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  cartItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemNumber: {
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemNumberText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '700',
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  deleteButton: {
    padding: 4,
  },
  stockId: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 12,
  },
  itemDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  addedTime: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  summaryCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.text,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  processButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  processButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerModal: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  radioContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 24,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  radioNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalSubmitButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default CartScreen;
