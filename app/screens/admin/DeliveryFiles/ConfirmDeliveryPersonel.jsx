import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from "react-native";
import React, { useEffect, useState } from "react";
import DeliveryPersonelLayout from "./DeliveryPersonelLayout";
import DriverCard from "./DriverCard";
import { useNavigation } from "@react-navigation/native";

// Firebase
import { FIREBASE_DB } from "../../../../FirebaseConfig";
import { doc, updateDoc, getDoc } from "firebase/firestore";

// Util function
import { sortDeliveryPersonsByDistance } from "../../../../utils/MapUtilFunctions";

// Zustand
import useStore from "../../../../utils/useStore";
import { SafeAreaView } from "react-native-safe-area-context";

const ConfirmDeliveryPersonel = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingStoreLocation, setFetchingStoreLocation] = useState(false);

  // Get data from store using your existing structure
  const deliveryPersons = useStore((state) => state.deliveryPersons);
  const locationToDeliverFrom = useStore((state) => state.locationToDeliverFrom);
  const orderSelected = useStore((state) => state.orderSelected);
  const storeLocation = useStore((state) => state.storeLocation);
  const setStoreLocation = useStore((state) => state.setStoreLocation);
  const deliveryFees = useStore((state) => state.deliveryFees || 150); // Use default if not set

  // Fetch store location if not already available
  useEffect(() => {
    const fetchStoreLocation = async () => {
      if (storeLocation || fetchingStoreLocation) return;
      
      try {
        setFetchingStoreLocation(true);
        // Get from storeSettings collection with document ID "location"
        const settingsRef = doc(FIREBASE_DB, "storeSettings", "location");
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists() && setStoreLocation) {
          const data = settingsSnap.data();
          setStoreLocation({
            address: data.address,
            position: data.position
          });
        }
      } catch (error) {
        console.error("Error fetching store location:", error);
      } finally {
        setFetchingStoreLocation(false);
      }
    };

    fetchStoreLocation();
  }, []);

  // Create location object for sorting
  const location = {
    latitude:
      locationToDeliverFrom?.coords?.latitude ||
      locationToDeliverFrom?.position?.lat ||
      storeLocation?.position?.lat ||
      0,
    longitude:
      locationToDeliverFrom?.coords?.longitude ||
      locationToDeliverFrom?.position?.lng ||
      storeLocation?.position?.lng ||
      0,
  };

  useEffect(() => {
    console.log("locationToDeliverFrom confirm", location);
  }, [locationToDeliverFrom]);

  // Sort delivery personnel by distance from the delivery starting point
  const orderedSortedDeliveryPersonel = sortDeliveryPersonsByDistance(
    deliveryPersons,
    location
  );

  const [selected, setSelected] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Handle driver selection
  const handleDriverSelection = (driver) => {
    setSelected(driver.id);
    setSelectedDriver(driver);
  };

  // Assign order to delivery personnel
  const assignOrderToDriver = async () => {
    if (!selected || !selectedDriver) {
      Alert.alert("Error", "Please select a delivery person first");
      return;
    }

    if (!orderSelected?.id) {
      Alert.alert("Error", "No order selected");
      return;
    }

    setIsLoading(true);

    try {
      const orderRef = doc(FIREBASE_DB, "orders", orderSelected.id);
      await updateDoc(orderRef, {
        status: "processing",
        deliveryPersonnelId: selectedDriver.id,
        assignedAt: new Date(),
        // Store additional assignment details
        deliveryAssignment: {
          driverId: selectedDriver.id,
          driverName: selectedDriver.name || "Delivery Driver",
          assignedAt: new Date(),
          pickupLocation: locationToDeliverFrom?.address || storeLocation?.address || "Store Location",
          deliveryLocation: orderSelected?.customerInfo?.address || "Customer Address"
        }
      });

      Alert.alert(
        "Success", 
        `Order has been assigned to ${selectedDriver.name || "the selected driver"}`,
        [
          { 
            text: "OK", 
            onPress: () => navigation.navigate("Deliveries") 
          }
        ]
      );
    } catch (error) {
      console.error("Error assigning order:", error);
      Alert.alert("Error", "Failed to assign order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <DeliveryPersonelLayout
        title="Confirm Delivery Personnel"
        snapPoints={["30%", "40%", "65%", "85%"]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a6da7" />
            <Text style={styles.loadingText}>Assigning order...</Text>
          </View>
        ) : (
          <FlatList
            data={orderedSortedDeliveryPersonel}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <DriverCard
                selected={selected}
                item={item}
                setSelected={() => handleDriverSelection(item)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No delivery personnel available</Text>
                <Text style={styles.emptySubtext}>Please try again later</Text>
              </View>
            }
            ListHeaderComponent={
              <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Select Delivery Personnel</Text>
                <Text style={styles.headerSubtitle}>
                  Assign order #{orderSelected?.orderNumber || (orderSelected?.id ? orderSelected.id.slice(-5).toUpperCase() : 'N/A')}
                </Text>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Pickup from:</Text>
                  <Text style={styles.locationText}>
                    {locationToDeliverFrom?.address || storeLocation?.address || "Default Store Location"}
                  </Text>
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Deliver to:</Text>
                  <Text style={styles.locationText}>
                    {orderSelected?.customerInfo?.address || "Customer Address"}
                  </Text>
                </View>
                <View style={styles.divider} />
              </View>
            }
            ListFooterComponent={() => (
              <View style={styles.footerContainer}>
                {selected ? (
                  <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>Assignment Summary</Text>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Driver:</Text>
                      <Text style={styles.summaryValue}>{selectedDriver?.name || "Selected Driver"}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Delivery Fee:</Text>
                      <Text style={styles.summaryValue}>KSH {deliveryFees?.toFixed(2)}</Text>
                    </View>
                  </View>
                ) : null}
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    !selected && styles.disabledButton
                  ]}
                  disabled={!selected}
                  onPress={assignOrderToDriver}
                >
                  <Text style={styles.confirmButtonText}>
                    Confirm Assignment
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </DeliveryPersonelLayout>
    </SafeAreaView>
  );
};

export default ConfirmDeliveryPersonel;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666"
  },
  headerContainer: {
    marginBottom: 15
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15
  },
  locationInfo: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10
  },
  locationLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4
  },
  locationText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500"
  },
  divider: {
    height: 1,
    backgroundColor: "#eeeeee",
    marginVertical: 10
  },
  emptyContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
    marginTop: 10
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
    textAlign: "center"
  },
  footerContainer: {
    marginTop: 20
  },
  summaryContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4a6da7",
    marginBottom: 10
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666"
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333"
  },
  confirmButton: {
    backgroundColor: "#4a6da7",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20
  },
  disabledButton: {
    backgroundColor: "#b0bec5",
    opacity: 0.7
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16
  }
});