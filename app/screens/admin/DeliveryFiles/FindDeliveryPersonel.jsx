import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ActivityIndicator,
  Alert
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";

// Firebase
import { FIREBASE_DB } from "../../../../FirebaseConfig";
import { doc, getDoc } from "firebase/firestore";

// Import components
import DeliveryPersonelLayout from "./DeliveryPersonelLayout";
import MapsSearchBar from "../../shared/MapsSearchBar";

// Import icons
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";

// Zustand
import useStore from "../../../../utils/useStore";

const FindDeliveryPersonel = () => {
  const [loading, setLoading] = useState(false);
  const [fetchingStoreLocation, setFetchingStoreLocation] = useState(false);

  // Navigation
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get data from store
  const orderSelected = useStore((state) => state.orderSelected);
  const storeLocation = useStore((state) => state.storeLocation);
  const setStoreLocation = useStore((state) => state.setStoreLocation);
  const locationToDeliverFrom = useStore((state) => state.locationToDeliverFrom);
  const setLocationToDeliverFrom = useStore((state) => state.setLocationToDeliverFrom);
  
  const customerAddress = orderSelected?.customerInfo?.address || "Customer location";
  
  // Get pickup location (either custom location or store location)
  const pickupLocation = locationToDeliverFrom?.address || storeLocation?.address || "Default Store Location";
  
  // Fetch store location if not already available
  useEffect(() => {
    const fetchStoreLocation = async () => {
      if (storeLocation || fetchingStoreLocation) return;
      
      try {
        setFetchingStoreLocation(true);
        setLoading(true);
        
        // Get from storeSettings collection with document ID "location"
        const settingsRef = doc(FIREBASE_DB, "storeSettings", "location");
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists() && setStoreLocation) {
          const data = settingsSnap.data();
          setStoreLocation({
            address: data.address,
            position: data.position
          });
          
          // Also set as location to deliver from if none set
          if (!locationToDeliverFrom) {
            setLocationToDeliverFrom({
              address: data.address,
              position: data.position
            });
          }
        } else {
          console.log("No store location found in storeSettings");
        }
      } catch (error) {
        console.error("Error fetching store location:", error);
      } finally {
        setFetchingStoreLocation(false);
        setLoading(false);
      }
    };

    fetchStoreLocation();
  }, []);

  const handleFindDeliveryPersonnel = () => {
    // Validate if we have all required information
    if (!orderSelected) {
      Alert.alert("Error", "No order selected. Please go back and select an order.");
      return;
    }
    
    if (!locationToDeliverFrom) {
      Alert.alert("Error", "Please set a pickup location first.");
      return;
    }
    
    navigation.navigate("ConfirmDeliveryPersonel");
  };
 
  return (
    <DeliveryPersonelLayout
      title="Find Delivery Personnel"
      snapPoints={["40%", "85%"]}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
          <Text style={styles.loadingText}>Loading locations...</Text>
        </View>
      ) : (
        <>
          <View style={styles.infoContainer}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle-outline" size={24} color="#4a6da7" />
              <Text style={styles.infoHeaderText}>Order Assignment</Text>
            </View>
            <Text style={styles.infoDescription}>
              Confirm pickup and delivery locations before searching for available delivery personnel.
            </Text>
          </View>

          <View style={styles.locationSection}>
            <Text style={styles.sectionTitle}>Pickup Location</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationIconContainer}>
                <MaterialCommunityIcons name="store-marker" size={24} color="#4a6da7" />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationAddressLabel}>From</Text>
                <Text style={styles.locationAddress}>{pickupLocation}</Text>
              </View>
            </View>
            
            <MapsSearchBar
              stylesPasses={styles.textInput}
              placeholderText="Change pickup location"
              onSelectFunction={(data, details) => {
                setLocationToDeliverFrom({
                  address: data.description,
                  position: details.geometry.location,
                });
                console.log("Updated pickup location:", {
                  address: data.description,
                  position: details.geometry.location,
                });
              }}
              inputContainerStyle={styles.inputContainerStyle}
              Icon={MaterialCommunityIcons}
              iconName="crosshairs-gps"
            />
          </View>

          <View style={styles.locationSection}>
            <Text style={styles.sectionTitle}>Delivery Location</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationIconContainer}>
                <FontAwesome6 name="location-dot" size={24} color="#4a6da7" />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationAddressLabel}>To</Text>
                <Text style={styles.locationAddress}>{customerAddress}</Text>
              </View>
            </View>
            
            {/* This is read-only since customer address is fixed */}
            <View style={styles.readOnlyInput}>
              <Ionicons name="person-outline" size={18} color="#666" style={{ marginRight: 10 }} />
              <Text style={styles.readOnlyText}>Customer address (cannot be changed)</Text>
            </View>
          </View>

          <View style={styles.footerContainer}>
            {storeLocation && (
              <TouchableOpacity
                style={styles.useCurrentLocationBtn}
                onPress={() => {
                  // Set store location as pickup
                  setLocationToDeliverFrom(storeLocation);
                  Alert.alert("Location Updated", "Using store location as pickup point");
                }}
              >
                <Ionicons name="location" size={18} color="#4a6da7" />
                <Text style={styles.useCurrentLocationText}>Use Store Location</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.findDeliveryPersonelButton}
              onPress={handleFindDeliveryPersonnel}
            >
              <Text style={styles.findButtonText}>Find Available Drivers</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </DeliveryPersonelLayout>
  );
};

export default FindDeliveryPersonel;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  infoContainer: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4a6da7",
    marginLeft: 10,
  },
  infoDescription: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  locationSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  locationCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationAddressLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    marginBottom: 0,
  },
  inputContainerStyle: {
    backgroundColor: "#F9FAFB",
    padding: 2,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    gap: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  readOnlyInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  readOnlyText: {
    color: "#6B7280",
    fontSize: 14,
  },
  footerContainer: {
    marginTop: 10,
  },
  useCurrentLocationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    paddingVertical: 10,
  },
  useCurrentLocationText: {
    color: "#4a6da7",
    fontWeight: "500",
    marginLeft: 8,
  },
  findDeliveryPersonelButton: {
    backgroundColor: "#4a6da7",
    padding: 16,
    alignItems: "center",
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  findButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});