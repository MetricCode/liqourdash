import "react-native-get-random-values";
// App.tsx with DeliveryNavigator
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB, USER_ROLES } from "./FirebaseConfig";
import { ActivityIndicator, View, Text, Button } from "react-native";
import { Ionicons } from "@expo/vector-icons";

//location
import * as Location from "expo-location";

//zustand
import useStore from "./utils/useStore";

// Import screens
import Login from "./app/screens/Login";

// Customer screens
import CustomerHome from "./app/screens/customer/Home";
import CustomerProfile from "./app/screens/customer/Profile";
import Categories from "./app/screens/customer/Categories";
import Cart from "./app/screens/customer/Cart";
import Orders from "./app/screens/customer/Orders";
import Checkout from "./app/screens/customer/Checkout";
import OrderDetails from "./app/screens/customer/OrderDetails";

// Import the standalone navigators
import AdminNavigator from "./app/screens/navigation/AdminNavigator";
import DeliveryNavigator from "./app/screens/navigation/DeliveryNavigator";

// Add the import for the SearchScreen
import SearchScreen from "./app/screens/customer/Search";

import { User } from "firebase/auth";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const CustomerStack = createNativeStackNavigator();

// Customer Stack Navigator (for nested navigation)
const CustomerStackNavigator = () => {
  return (
    <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
      <CustomerStack.Screen
        name="CustomerTabs"
        component={CustomerTabNavigator}
      />
      <CustomerStack.Screen name="Checkout" component={Checkout} />
      <CustomerStack.Screen name="OrderDetails" component={OrderDetails} />
      <CustomerStack.Screen name="Search" component={SearchScreen} />
    </CustomerStack.Navigator>
  );
};

// Customer Tab Navigator
const CustomerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "CustomerHome") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "CustomerProfile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Categories") {
            iconName = focused ? "grid" : "grid-outline";
          } else if (route.name === "Cart") {
            iconName = focused ? "cart" : "cart-outline";
          } else if (route.name === "Orders") {
            iconName = focused ? "receipt" : "receipt-outline";
          }

          return (
            <Ionicons
              name={
                (iconName || "home-outline") as keyof typeof Ionicons.glyphMap
              }
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: "#4a6da7",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="CustomerHome"
        component={CustomerHome}
        options={{
          headerShown: false,
          title: "Home",
        }}
      />
      <Tab.Screen
        name="Categories"
        component={Categories}
        options={{
          headerShown: false,
          title: "Categories",
        }}
      />
      <Tab.Screen
        name="Cart"
        component={Cart}
        options={{
          headerShown: false,
          title: "Cart",
        }}
      />
      <Tab.Screen
        name="Orders"
        component={Orders}
        options={{
          headerShown: false,
          title: "Orders",
        }}
      />
      <Tab.Screen
        name="CustomerProfile"
        component={CustomerProfile}
        options={{
          headerShown: false,
          title: "Profile",
        }}
      />
    </Tab.Navigator>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  //location
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const setMyStoredLocation = useStore((state) => state.setMyStoredLocation);
  const setLocationToDeliverFrom = useStore((state) => state.setLocationToDeliverFrom);
  useEffect(() => {
    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setMyStoredLocation(location);
      setLocationToDeliverFrom(location);
    }
    getCurrentLocation();
  }, []);

  let text = "Waiting...";
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }

  // In App.tsx
  useEffect(() => {
    console.log("Setting up auth state listener");

    const unsubscribe = onAuthStateChanged(
      FIREBASE_AUTH,
      async (currentUser) => {
        console.log("Auth state changed, current user:", currentUser?.email);

        if (currentUser) {
          try {
            const userDoc = await getDoc(
              doc(FIREBASE_DB, "users", currentUser.uid)
            );
            const userData = userDoc.data();

            console.log("Firestore user data:", userData);

            // Update both states TOGETHER
            setUser(currentUser);
            setUserRole(userData?.role || "customer");
          } catch (error) {
            console.error("Error fetching user role:", error);
            setUser(currentUser); // Still set user even if role fetch fails
            setUserRole("customer");
          }
        } else {
          // Clear both states TOGETHER
          setUser(null);
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4a6da7" />
      </View>
    );
  }

  // Handle network error state
  if (networkError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 18, marginBottom: 20, textAlign: "center" }}>
          Unable to connect to the server. Please check your internet
          connection.
        </Text>
        <Button
          title="Try Again"
          onPress={() => {
            setLoading(true);
            // Retry logic - simply setting loading will trigger the useEffect again
            setTimeout(() => setLoading(false), 1000);
          }}
        />
      </View>
    );
  }

  console.log(
    "Rendering navigation with user:",
    user ? "logged in" : "logged out"
  );
  console.log("User role:", userRole);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // User is not signed in
          <Stack.Screen name="Login" component={Login} />
        ) : userRole === USER_ROLES.ADMIN ? (
          // Admin routes - use the standalone AdminNavigator
          <Stack.Screen name="AdminTabs" component={AdminNavigator} />
        ) : userRole === USER_ROLES.DELIVERY ? (
          // Delivery routes - use the standalone DeliveryNavigator
          <Stack.Screen name="DeliveryTabs" component={DeliveryNavigator} />
        ) : (
          // Default to customer - Using the Stack Navigator that contains tabs + checkout
          <Stack.Screen
            name="CustomerMain"
            component={CustomerStackNavigator}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
