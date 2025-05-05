import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import Delivery Screens
import DeliveryHome from '../delivery/Home';
import DeliveryOrders from '../delivery/Orders';
import DeliveryProfile from '../delivery/Profile';
import DeliveryRoutes from '../delivery/Routes';
import DeliveryHistory from '../delivery/History';

const Tab = createBottomTabNavigator();

const DeliveryNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: 
            | 'home' 
            | 'home-outline' 
            | 'list' 
            | 'list-outline' 
            | 'person' 
            | 'person-outline' 
            | 'map' 
            | 'map-outline' 
            | 'time' 
            | 'time-outline' = 'home-outline';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Routes') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4a6da7',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DeliveryHome} />
      <Tab.Screen name="Orders" component={DeliveryOrders} />
      <Tab.Screen name="Routes" component={DeliveryRoutes} />
      <Tab.Screen name="History" component={DeliveryHistory} />
      <Tab.Screen name="Profile" component={DeliveryProfile} />
    </Tab.Navigator>
  );
};

export default DeliveryNavigator;