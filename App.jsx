import React from 'react';
import { Provider } from 'react-redux';
import Toast from 'react-native-toast-message';
import { Store } from './src/store/store';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { Routes } from './src/routes/Routes';
import { CartProvider } from './src/Context/CartContext';
import { colors } from './src/utils/color';

const App = () => {
  return (
    <Provider store={Store}>
      <CartProvider>
        <StatusBar
          backgroundColor={colors.background}
          barStyle="light-content"
        />
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <NavigationContainer>
            <Routes />
          </NavigationContainer>
        </SafeAreaView>
        <Toast />
      </CartProvider>
    </Provider>
  );
};

export default App;
