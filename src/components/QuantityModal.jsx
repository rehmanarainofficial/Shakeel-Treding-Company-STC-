import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/color';
import Toast from 'react-native-toast-message';

const QuantityModal = ({
  visible,
  onClose,
  onSubmit,
  productName,
  stockId,
  uom = '',
  price = 0,
  initialValues = null,
}) => {
  const [boxes, setBoxes] = useState('');
  const [pieces, setPieces] = useState('');
  const [priceValue, setPriceValue] = useState('');
  const [discount, setDiscount] = useState('');

  const isPcsUom =
    uom.toLowerCase().includes('pcs') || uom.toLowerCase().includes('piece');

  useEffect(() => {
    if (initialValues) {
      setBoxes(initialValues.boxes ? initialValues.boxes.toString() : '');
      setPieces(initialValues.pieces ? initialValues.pieces.toString() : '');
      setPriceValue(initialValues.price ? initialValues.price.toString() : '');
      setDiscount(
        initialValues.discount ? initialValues.discount.toString() : '',
      );
    } else if (price && price > 0) {
      setPriceValue(price.toString());
    }
  }, [price, visible, initialValues]);

  const handleSubmit = () => {
    if (isPcsUom) {
      if (!pieces) {
        Toast.show({
          type: 'error',
          text1: 'Input Required',
          text2: 'Please enter number of pieces',
        });
        return;
      }
    } else {
      if (!boxes && !pieces) {
        Toast.show({
          type: 'error',
          text1: 'Input Error',
          text2: 'Please enter either boxes or pieces',
        });
        return;
      }
    }

    if (!priceValue) {
      Toast.show({
        type: 'error',
        text1: 'Price Required',
        text2: 'Please enter price',
      });
      return;
    }

    const priceNum = parseFloat(priceValue) || 0;
    const discountNum = parseFloat(discount) || 0;

    if (discountNum > priceNum) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Discount',
        text2: 'Discount cannot be greater than price',
      });
      return;
    }

    const quantityInfo = {
      boxes: parseInt(boxes) || 0,
      pieces: parseInt(pieces) || 0,
      price: priceNum,
      discount: discountNum,
      uom: uom,
    };

    onSubmit(quantityInfo);
    resetForm();
  };

  const resetForm = () => {
    setBoxes('');
    setPieces('');
    setPriceValue('');
    setDiscount('');
    onClose();
  };

  const calculateTotalPieces = () => {
    const boxPieces = (parseInt(boxes) || 0) * 1;
    const extraPieces = parseInt(pieces) || 0;
    return boxPieces + extraPieces;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add to Cart</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            <View style={styles.productInfo}>
              <Text style={styles.productLabel}>Product:</Text>
              <Text style={styles.productName} numberOfLines={2}>
                {productName}
              </Text>
              <View style={styles.uomInfoRow}>
                <Text style={styles.stockId}>Stock ID: {stockId}</Text>
                <View style={styles.uomBadge}>
                  <Ionicons name="cube-outline" size={14} color={colors.text} />
                  <Text style={styles.uomBadgeText}>{uom.toUpperCase()}</Text>
                </View>
              </View>
            </View>

            {isPcsUom && (
              <View style={styles.infoMessage}>
                <Ionicons
                  name="information-circle"
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.infoMessageText}>
                  This product is measured in PCS. Boxes field is disabled.
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Boxes
                {isPcsUom && (
                  <Text style={styles.disabledNote}>
                    {' '}
                    (Not applicable for PCS)
                  </Text>
                )}
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, isPcsUom && styles.disabledInput]}
                  value={boxes}
                  onChangeText={isPcsUom ? null : setBoxes}
                  keyboardType="numeric"
                  placeholder={
                    isPcsUom
                      ? 'Not applicable for PCS'
                      : 'Enter number of boxes'
                  }
                  placeholderTextColor={colors.textSecondary}
                  editable={!isPcsUom}
                />
                <Text
                  style={[styles.inputSuffix, isPcsUom && styles.disabledText]}
                >
                  boxes
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pieces</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={pieces}
                  onChangeText={setPieces}
                  keyboardType="numeric"
                  placeholder="Enter number of pieces"
                  placeholderTextColor={colors.textSecondary}
                />
                <Text style={styles.inputSuffix}>pcs</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencyPrefix}>Rs.</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }, styles.disabledInput]}
                  value={priceValue}
                  onChangeText={null}
                  keyboardType="numeric"
                  placeholder="Price"
                  placeholderTextColor={colors.textSecondary}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Discount</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="numeric"
                  placeholder="Enter discount amount"
                  placeholderTextColor={colors.textSecondary}
                />
                <Text style={styles.inputSuffix}>Rs.</Text>
              </View>
              <Text style={styles.noteText}>
                Note: Discount should be less than price
              </Text>
            </View>

            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>Unit of Measurement:</Text>
                <Text style={styles.summaryValue}>{uom.toUpperCase()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>Total Pieces:</Text>
                <Text style={styles.summaryValue}>
                  {calculateTotalPieces()} pcs
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>Price:</Text>
                <Text style={styles.summaryValue}>
                  Rs. {parseFloat(priceValue || 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>Discount:</Text>
                <Text style={styles.summaryValue}>
                  Rs. {parseFloat(discount || 0).toLocaleString()}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Ionicons name="cart" size={20} color={colors.background} />
              <Text style={styles.submitButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  productInfo: {
    marginBottom: 24,
    paddingBottom: 16,
  },
  productLabel: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  uomInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockId: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  uomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  uomBadgeText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  infoMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(213, 155, 67, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  infoMessageText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  disabledNote: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 14,
  },
  disabledInput: {
    color: colors.textSecondary,
  },
  disabledText: {
    color: colors.textSecondary,
  },
  inputSuffix: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    fontWeight: '500',
  },
  currencyPrefix: {
    fontSize: 16,
    color: colors.text,
    marginRight: 8,
    fontWeight: '500',
  },
  noteText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  summary: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    marginTop: 10,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  submitButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});

export default QuantityModal;
