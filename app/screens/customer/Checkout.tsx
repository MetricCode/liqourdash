// app/screens/customer/Checkout.tsx - Fixed user profile creation
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FIREBASE_DB, FIREBASE_AUTH } from "../../../FirebaseConfig";
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  useNavigation,
  useRoute,
  CommonActions,
} from "@react-navigation/native";

type UserProfile = {
  name: string;
  address: string;
  phone: string;
  email: string;
  position: object;
};

import { StackNavigationProp } from "@react-navigation/stack";
import MapsSearchBar from "../shared/MapsSearchBar";
import { getDistanceFromLatLonInKm } from "../../../utils/MapUtilFunctions";

type PaymentMethod = "cash" | "mpesa";

const getCategoryIcon = (
  categoryId: string
): {
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
} => {
  const categoryLower = categoryId.toLowerCase();

  const iconMapping: Record<
    string,
    { iconName: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }
  > = {
    wine: { iconName: "wine", color: "#C62828", bgColor: "#FFEBEE" },
    beer: { iconName: "beer", color: "#F57C00", bgColor: "#FFF3E0" },
    spirits: { iconName: "flask", color: "#303F9F", bgColor: "#E8EAF6" },
    whiskey: { iconName: "cafe", color: "#5D4037", bgColor: "#EFEBE9" },
    gin: { iconName: "flower", color: "#7B1FA2", bgColor: "#F3E5F5" },
    rum: { iconName: "flask", color: "#E65100", bgColor: "#FFF3E0" },
    tequila: { iconName: "leaf", color: "#2E7D32", bgColor: "#E8F5E9" },
    vodka: { iconName: "water", color: "#0277BD", bgColor: "#E1F5FE" },
  };

  // Return the mapping or a default if the category isn't found
  return (
    iconMapping[categoryLower] || {
      iconName: "grid",
      color: "#455A64",
      bgColor: "#ECEFF1",
    }
  );
};

const Checkout = () => {
  type RootStackParamList = {
    CustomerHome: undefined;
    OrderDetails: { orderId: string };
    // Add other screens here
  };

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();

  // Get cart items and total from route params
  type RouteParams = {
    cartItems: Array<any>;
    subtotal: number;
  };

  const { cartItems, subtotal } = (route.params as RouteParams) || {
    cartItems: [],
    subtotal: 0,
  };

  // User profile
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "",
    address: "",
    phone: "",
    email: "",
    position: {},
  });

  // Form states
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  // Loading states
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(false);

  // Pricing
  const deliveryFee = getDistanceFromLatLonInKm(
    userProfile.position.lat,
    userProfile.position.lng,
    userProfile.position.lat,
    userProfile.position.lng
  );
  const total = subtotal + deliveryFee;

  // Load user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoadingProfile(true);
        const user = FIREBASE_AUTH.currentUser;

        if (!user) {
          setLoadingProfile(false);
          return;
        }

        const profileRef = doc(FIREBASE_DB, "userProfiles", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const profileData = profileSnap.data() as UserProfile;
          setUserProfile(profileData);

          // Pre-fill delivery address with user's address
          if (profileData.address) {
            setDeliveryAddress(profileData.address);
            console.log("Address from profile:", profileData);
          }
        } else {
          // If no profile exists, use what we have from user auth
          setUserProfile({
            name: user.displayName || "",
            email: user.email || "",
            phone: "",
            address: "",
            position: {},
          });
        }

        setLoadingProfile(false);
      } catch (error) {
        console.error("Error loading user profile:", error);
        setLoadingProfile(false);
        Alert.alert("Error", "Failed to load your profile. Please try again.");
      }
    };

    fetchUserProfile();
  }, []);

  const validateForm = () => {
    if (!userProfile.name.trim()) {
      Alert.alert("Missing Information", "Please provide your name");
      return false;
    }

    if (!deliveryAddress.trim()) {
      Alert.alert("Missing Information", "Please provide a delivery address");
      return false;
    }

    if (!userProfile.phone.trim()) {
      Alert.alert("Missing Information", "Please provide your phone number");
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    try {
      setProcessingOrder(true);
      const user = FIREBASE_AUTH.currentUser;

      if (!user) {
        Alert.alert("Error", "You must be logged in to place an order");
        setProcessingOrder(false);
        return;
      }

      if (cartItems.length === 0) {
        Alert.alert("Error", "Your cart is empty");
        setProcessingOrder(false);
        return;
      }

      // Create or update user profile
      const profileRef = doc(FIREBASE_DB, "userProfiles", user.uid);
      const profileSnap = await getDoc(profileRef);

      const profileData = {
        name: userProfile.name,
        address: deliveryAddress,
        phone: userProfile.phone,
        email: userProfile.email || user.email,
        updatedAt: serverTimestamp(),
      };

      if (profileSnap.exists()) {
        // Update existing profile
        await updateDoc(profileRef, profileData);
      } else {
        // Create new profile - use setDoc instead of updateDoc for a new document
        await setDoc(profileRef, {
          ...profileData,
          createdAt: serverTimestamp(),
        });
      }

      // Create new order
      const order = {
        userId: user.uid,
        items: cartItems,
        status: "pending",
        subtotal,
        deliveryFee,
        total,
        paymentMethod,
        deliveryNote: deliveryNote.trim(),
        createdAt: serverTimestamp(),
        customerInfo: {
          name: userProfile.name,
          address: deliveryAddress,
          phone: userProfile.phone,
          email: userProfile.email || user.email,
          position: userProfile.position,
        },
      };

      // Save the order
      const orderRef = await addDoc(collection(FIREBASE_DB, "orders"), order);

      // Clear cart
      await deleteDoc(doc(FIREBASE_DB, "carts", user.uid));

      setProcessingOrder(false);

      // Show success message
      Alert.alert(
        "Order Placed Successfully",
        `Your order #${orderRef.id
          .slice(-5)
          .toUpperCase()} has been placed and will be delivered soon.`,
        [
          {
            text: "View Order",
            onPress: () =>
              navigation.navigate("OrderDetails", { orderId: orderRef.id }),
          },
          {
            text: "Continue Shopping",
            onPress: () => {
              // Use CommonActions for more reliable navigation back to the home screen
              navigation.dispatch(
                CommonActions.navigate({
                  name: "CustomerTabs",
                })
              );
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error placing order:", error);
      setProcessingOrder(false);
      Alert.alert("Error", "Failed to place your order. Please try again.");
    }
  };

  if (loadingProfile) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4a6da7" />
        <Text style={styles.loadingText}>Preparing checkout...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={["1"]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={() => (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Information</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={userProfile.name}
                  onChangeText={(text) =>
                    setUserProfile({ ...userProfile, name: text })
                  }
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={userProfile.phone}
                  onChangeText={(text) =>
                    setUserProfile({ ...userProfile, phone: text })
                  }
                  placeholder="Enter your phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Delivery Address</Text>
                <MapsSearchBar
                  stylesPasses={[styles.input, styles.textArea]}
                  placeholderText={deliveryAddress}
                  onSelectFunction={(data, details) => {
                    setDeliveryAddress(data.description);
                    setUserProfile({
                      ...userProfile,
                      address: data.description,
                      position: details.geometry.location,
                    });
                  }}
                />
                {/* <TextInput
             style={[styles.input, styles.textArea]}
             value={deliveryAddress}
             onChangeText={setDeliveryAddress}
             placeholder="Enter your full delivery address"
             placeholderTextColor="#999"
             multiline
             numberOfLines={3}
           /> */}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Delivery Note (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={deliveryNote}
                  onChangeText={setDeliveryNote}
                  placeholder="Any special instructions for delivery"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Method</Text>

              <View style={styles.paymentOptions}>
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    paymentMethod === "cash" && styles.selectedPaymentOption,
                  ]}
                  onPress={() => setPaymentMethod("cash")}
                >
                  <Ionicons
                    name="cash-outline"
                    size={24}
                    color={paymentMethod === "cash" ? "#4a6da7" : "#666"}
                  />
                  <Text
                    style={[
                      styles.paymentOptionText,
                      paymentMethod === "cash" &&
                        styles.selectedPaymentOptionText,
                    ]}
                  >
                    Cash on Delivery
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    paymentMethod === "mpesa" && styles.selectedPaymentOption,
                  ]}
                  onPress={() => setPaymentMethod("mpesa")}
                >
                  <Ionicons
                    name="phone-portrait-outline"
                    size={24}
                    color={paymentMethod === "mpesa" ? "#4a6da7" : "#666"}
                  />
                  <Text
                    style={[
                      styles.paymentOptionText,
                      paymentMethod === "mpesa" &&
                        styles.selectedPaymentOptionText,
                    ]}
                  >
                    M-Pesa
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Summary</Text>

              <View style={styles.orderSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>
                    ${subtotal.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Fee</Text>
                  <Text style={styles.summaryValue}>
                    ${deliveryFee.toFixed(2)}
                  </Text>
                </View>

                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </>
        )}
      ></FlatList>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            processingOrder && styles.disabledButton,
          ]}
          onPress={handlePlaceOrder}
          disabled={processingOrder}
        >
          {processingOrder ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order</Text>
              <Text style={styles.placeOrderTotal}>${total.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  paymentOptions: {
    marginBottom: 10,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  selectedPaymentOption: {
    borderColor: "#4a6da7",
    backgroundColor: "#e3f2fd",
  },
  paymentOptionText: {
    fontSize: 16,
    color: "#666",
    marginLeft: 15,
  },
  selectedPaymentOptionText: {
    color: "#4a6da7",
    fontWeight: "600",
  },
  orderSummary: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#666",
  },
  summaryValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4a6da7",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  placeOrderButton: {
    backgroundColor: "#4a6da7",
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#4a6da7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "#9cb2d6",
  },
  placeOrderText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  placeOrderTotal: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Checkout;
