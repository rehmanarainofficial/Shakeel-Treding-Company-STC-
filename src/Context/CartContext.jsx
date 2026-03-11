import React, { createContext, useState, useContext } from 'react';
import { useSelector } from 'react-redux';
import { API_URL } from '@env';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [updateId, setUpdateId] = useState('0');
  const { id } = useSelector(state => state.Data.currentData);
  console.log(id);
  

  const addToCart = (productData, quantityInfo) => {
    const cartItem = {
      id: Date.now().toString(),
      productId: productData.stockId || productData.id,
      productName: productData.basicInfo?.description || 'Product',
      stockId: productData.stockId,
      basicInfo: productData.basicInfo,
      uom: quantityInfo.uom || productData.basicInfo?.units || '',
      ...quantityInfo,
      productData: productData,
      addedAt: new Date().toISOString(),
    };

    setCartItems(prev => [...prev, cartItem]);
  };

  const removeFromCart = id => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
    setCustomerInfo(null);
    setUpdateId('0');
  };

  const updateCustomerInfo = info => {
    setCustomerInfo(info);
  };

  const loadCartFromOrder = (items, headerData = null) => {
    const newCartItems = items.map(item => {
      const box = parseFloat(item.box) || 0;
      const pec = parseFloat(item.pec) || 0;
      const quantity = parseFloat(item.quantity) || 0;

      let api_box = 0;
      let api_pec = 1;

      if (pec > 0) {
        api_box = (quantity - box) / pec;
      } else if (quantity > 0 && box > 0) {
        api_box = 0;
      }

      const productData = {
        stockId: item.stk_code,
        data_basic: {
          description: item.description,
          sq_price: item.sqprice || item.unit_price,
          units: 'Box',
          packing: '1',
          boxes: api_box.toString(),
          Pcs: api_pec.toString(),
        },
      };

      return {
        id: item.id || Date.now().toString() + Math.random(),
        productId: item.stk_code,
        productName: item.description,
        stockId: item.stk_code,
        basicInfo: productData.data_basic,
        uom: item.pec ? 'Pcs' : 'Box',
        boxes: item.box || '0',
        pieces: item.pec || item.quantity || '0',
        price: item.unit_price || '0',
        discount: item.discount_percent || '0',
        sqprice: item.sqprice || item.unit_price || '0',
        sqm: item.sqm || '0',
        productData: productData,
        addedAt: new Date().toISOString(),
      };
    });

    setCartItems(newCartItems);

    if (headerData) {
      setCustomerInfo({
        name: headerData.name,
        contactNo: headerData.contact_no,
        documentType: headerData.type === '32' ? 'Quotation' : 'Order',
      });
      setUpdateId(headerData.order_no || '0');
    } else {
      setUpdateId('0');
    }
  };

  const submitOrder = async orderData => {
    try {
      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }
      const sales_order_details = cartItems.map(item => {
        const box = parseFloat(item.boxes) || 0;
        const pec = parseFloat(item.pieces) || 0;
        const pc_packing = parseFloat(item.basicInfo?.packing) || 1;

        const api_box = parseFloat(item.basicInfo?.boxes);
        const api_pec = parseFloat(item.basicInfo?.Pcs);
        const quantity = (api_box / api_pec) * pec + box;
        const amount6 = parseFloat(item.price) || 0;
        const unit_price = amount6 * pc_packing;
        const text1 = parseFloat(item.discount) || 0;

        const new_discount = quantity * text1;
        const gross = amount6 * quantity;

        let discount_percent = 0;
        if (gross > 0) {
          discount_percent = (new_discount / gross) * 100;
          if (discount_percent > 100) discount_percent = 100;
        }

        return {
          stock_id: item.stockId || '',
          description: item.productName || '',
          box: box,
          pec: pec,
          amount6: amount6,
          quantity: quantity,
          unit_price: unit_price,
          text1: text1,
          discount_percent: discount_percent.toFixed(2) / 100,
        };
      });
      let total = 0;
      sales_order_details.forEach(i => {
        total +=
          parseFloat(i.quantity) *
          parseFloat(i.unit_price) *
          (1 - parseFloat(i.discount_percent));
      });
      const trans_type = orderData.document_type === 'Quotation' ? 32 : 30;

      const formattedTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      const formData = new FormData();

      formData.append('party_name', orderData.customer_name || '');
      formData.append('function_date', new Date().toISOString().split('T')[0]);
      formData.append('contact_no', orderData.contact_number || '');
      formData.append('venue', orderData.venue || '');
      formData.append('total', total.toFixed(2));

      formData.append('so_advance', orderData.so_advance || '0');
      formData.append('user_id', id.toString());
      formData.append(
        'sales_order_details',
        JSON.stringify(sales_order_details),
      );

      formData.append('bank_id', '');

      formData.append('update_id', updateId);
      formData.append('comments', '');
      formData.append('discount1', '0');

      formData.append('f_time', formattedTime);
      formData.append('order_type', '1');
      formData.append('trans_type', trans_type.toString());
      const response = await fetch(`${API_URL}post_event_quotation.php`, {
        method: 'POST',
        body: formData,
      });
      console.log(formData);

      const result = await response.json();

      if (result.status === true) {
        clearCart();
        return {
          success: true,
          orderId: result.order_no || result.order_id || `ORD-${Date.now()}`,
          apiResponse: result,
          message: result.message || 'Order submitted successfully',
        };
      } else {
        throw new Error(result.message || 'Order submission failed');
      }
    } catch (e) {
      console.error('Order submission error:', e);
      throw e;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        customerInfo,
        addToCart,
        removeFromCart,
        clearCart,
        updateCustomerInfo,
        updateCustomerInfo,
        submitOrder,
        loadCartFromOrder,
        cartCount: cartItems.length,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
