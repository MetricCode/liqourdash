// App.tsx (modified version)
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIRESTORE_DB, USER_ROLES } from './FirebaseConfig';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import Login from './app/screens/Login';

// Customer screens
import CustomerHome from './app/screens/customer/Home';
import CustomerProfile from './app/screens/customer/Profile';
import Categories from './app/screens/customer/Categories';
import Cart from './app/screens/customer/Cart';

// Admin screens
import AdminHome from './app/screens/admin/Home';
import AdminProfile from './app/screens/admin/Profile';
import AdminOrders from './app/screens/admin/Orders';
import AdminDeliveries from './app/screens/admin/Deliveries';

// Delivery screens
import DeliveryHome from './app/screens/delivery/Home';
import DeliveryOrders from './app/screens/delivery/Orders';
import DeliveryProfile from './app/screens/delivery/Profile';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Customer Tab Navigator
const CustomerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'CustomerHome') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'CustomerProfile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Categories') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4a6da7',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="CustomerHome" 
        component={CustomerHome} 
        options={{ 
          headerShown: false,
          title: 'Home'
        }} 
      />
      <Tab.Screen 
        name="Categories" 
        component={Categories} 
        options={{ 
          headerShown: false,
          title: 'Categories'
        }} 
      />
      <Tab.Screen 
        name="Cart" 
        component={Cart} 
        options={{ 
          headerShown: false,
          title: 'Cart'
        }} 
      />
      <Tab.Screen 
        name="CustomerProfile" 
        component={CustomerProfile} 
        options={{ 
          headerShown: false,
          title: 'Profile'
        }} 
      />
    </Tab.Navigator>
  );
};

// Admin Tab Navigator
const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'AdminHome') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'AdminProfile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'AdminOrders') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'AdminDeliveries') {
            iconName = focused ? 'car' : 'car-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4a6da7',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="AdminHome" 
        component={AdminHome} 
        options={{ 
          headerShown: false,
          title: 'Home'
        }} 
      />
      <Tab.Screen 
        name="AdminOrders" 
        component={AdminOrders} 
        options={{ 
          headerShown: false,
          title: 'Orders'
        }} 
      />
      <Tab.Screen 
        name="AdminDeliveries" 
        component={AdminDeliveries} 
        options={{ 
          headerShown: false,
          title: 'Deliveries'
        }} 
      />
      <Tab.Screen 
        name="AdminProfile" 
        component={AdminProfile} 
        options={{ 
          headerShown: false,
          title: 'Profile'
        }} 
      />
    </Tab.Navigator>
  );
};

// Delivery Tab Navigator
const DeliveryTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'DeliveryHome') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'DeliveryProfile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'DeliveryOrders') {
            iconName = focused ? 'list' : 'list-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4a6da7',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="DeliveryHome" 
        component={DeliveryHome} 
        options={{ 
          headerShown: false,
          title: 'Home'
        }} 
      />
      <Tab.Screen 
        name="DeliveryOrders" 
        component={DeliveryOrders} 
        options={{ 
          headerShown: false,
          title: 'Orders'
        }} 
      />
      <Tab.Screen 
        name="DeliveryProfile" 
        component={DeliveryProfile} 
        options={{ 
          headerShown: false,
          title: 'Profile'
        }} 
      />
    </Tab.Navigator>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Get user role from Firestore
          const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);
          } else {
            // Default to customer if no role is found
            setUserRole(USER_ROLES.CUSTOMER);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          // Default to customer on error
          setUserRole(USER_ROLES.CUSTOMER);
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4a6da7" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // User is signed in, determine which navigator to show based on role
          <>
            {userRole === USER_ROLES.CUSTOMER && (
              <Stack.Screen name="CustomerTabs" component={CustomerTabNavigator} />
            )}
            {userRole === USER_ROLES.ADMIN && (
              <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
            )}
            {userRole === USER_ROLES.DELIVERY && (
              <Stack.Screen name="DeliveryTabs" component={DeliveryTabNavigator} />
            )}
          </>
        ) : (
          // User is not signed in
          <Stack.Screen name="Login" component={Login} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}