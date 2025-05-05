// app/navigation/CustomerNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import Home from '../customer/Home';
import Categories from '../customer/Categories';
import Cart from '../customer/Cart';
import Orders from '../customer/Orders'; // Import the new Orders screen
import Checkout from '../customer/Checkout';
import SearchScreen from '../customer/Search'; // Import the SearchScreen component
import OrderDetails from '../customer/OrderDetails';

const Stack = createStackNavigator();

const CustomerNavigator = () => {
  return (
    <Stack.Navigator 
      initialRouteName="Home"
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Categories" component={Categories} />
      <Stack.Screen name="Cart" component={Cart} />
      <Stack.Screen name="Orders" component={Orders} />
      <Stack.Screen name="Checkout" component={Checkout} />
      <Stack.Screen name="OrderDetails" component={OrderDetails} />
      <Stack.Screen name="Search" component={SearchScreen} />
    </Stack.Navigator>
  );
};

export default CustomerNavigator;