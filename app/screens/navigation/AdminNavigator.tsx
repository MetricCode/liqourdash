import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

// Import Admin Screens
import AdminHome from "../admin/Home";
import AdminOrders from "../admin/Orders";
import AdminProducts from "../admin/Products";
import AdminProfile from "../admin/Profile";
import CategoriesManagement from "../admin/CategoriesManagement";
import AdminSales from "../admin/Sales";
import AdminDeliveries from "../admin/Deliveries";
import AssignDelivery from "../admin/DeliveryFiles/AssignDelivery";
import FindDeliveryPersonel from "../admin/DeliveryFiles/FindDeliveryPersonel";
import ConfirmDeliveryPersonel from "../admin/DeliveryFiles/ConfirmDeliveryPersonel";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const assignDeliveriesStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Orders"
    >
      <Tab.Screen name="Orders" component={AdminOrders} />
      <Stack.Screen name="AssignDeliveries" component={AssignDelivery} />
      <Stack.Screen
        name="FindDeliveryPersonel"
        component={FindDeliveryPersonel}
      />
      <Stack.Screen
        name="ConfirmDeliveryPersonel"
        component={ConfirmDeliveryPersonel}
      />
    </Stack.Navigator>
  );
};

const AdminNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName:
            | "home"
            | "home-outline"
            | "list"
            | "list-outline"
            | "cube"
            | "cube-outline"
            | "person"
            | "person-outline"
            | "pricetag"
            | "pricetag-outline"
            | "stats-chart"
            | "stats-chart-outline"
            | "car"
            | "car-outline" = "home-outline";

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Orders") {
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "Products") {
            iconName = focused ? "cube" : "cube-outline";
          } else if (route.name === "Categories") {
            iconName = focused ? "pricetag" : "pricetag-outline";
          } else if (route.name === "Sales") {
            iconName = focused ? "stats-chart" : "stats-chart-outline";
          } else if (route.name === "Deliveries") {
            iconName = focused ? "car" : "car-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4a6da7",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminHome} />
      <Tab.Screen name="Orders" component={assignDeliveriesStack} />
      <Tab.Screen name="Products" component={AdminProducts} />
      <Tab.Screen name="Categories" component={CategoriesManagement} />
      <Tab.Screen name="Sales" component={AdminSales} />
      <Tab.Screen name="Profile" component={AdminProfile} />
    </Tab.Navigator>
  );
};

export default AdminNavigator;
