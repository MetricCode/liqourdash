import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";

// Icons
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import useStore from "../../../../utils/useStore";

const DriverCard = ({ item, selected, setSelected }) => {
  const deliveryFees = useStore((state) => state.deliveryFees);

  const formatTime = (minutes) => {
    const formattedMinutes = +(minutes?.toFixed(0) || 0);

    if (formattedMinutes < 60) {
      return `${formattedMinutes} min`;
    } else {
      const hours = Math.floor(formattedMinutes / 60);
      const remainingMinutes = formattedMinutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  // Driver availability status indicator
  const renderStatusIndicator = () => {
    // Calculate availability based on current orders and max orders
    const isAvailable = item?.currentOrders < item?.maxConcurrentOrders;
    const availabilityStatus = isAvailable ? "Available" : "Busy";
    const availabilityColor = isAvailable ? "#4CAF50" : "#FFA000";

    return (
      <View style={[
        styles.statusIndicator, 
        { backgroundColor: selected === item.id ? "white" : availabilityColor + "20" }
      ]}>
        <View style={[styles.statusDot, { backgroundColor: availabilityColor }]} />
        <Text style={[
          styles.statusText, 
          { color: selected === item.id ? "white" : availabilityColor }
        ]}>
          {availabilityStatus}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      onPress={setSelected}
      style={[
        styles.container,
        selected === item.id ? styles.selected : styles.unselected
      ]}
    >
      <View style={styles.driverInfoSection}>
        <View style={[
          styles.profileImageContainer,
          { backgroundColor: selected === item.id ? "white" : "#4a6da730" }
        ]}>
          {item.profileImageUrl ? (
            <Image
              source={{ uri: item.profileImageUrl }}
              style={styles.profileImage}
            />
          ) : (
            <Ionicons 
              name="person" 
              size={30} 
              color={selected === item.id ? "#4a6da7" : "white"} 
            />
          )}
        </View>

        <View style={styles.driverDetails}>
          <View style={styles.nameRow}>
            <Text style={[
              styles.driverName,
              { color: selected === item.id ? "white" : "#333" }
            ]}>
              {item.name || "Driver " + item.id.slice(-4)}
            </Text>
            {renderStatusIndicator()}
          </View>

          <View style={styles.ratingContainer}>
            <Entypo
              name="star"
              size={16}
              color={selected === item.id ? "white" : "#FFC107"}
            />
            <Text style={[
              styles.ratingText,
              { color: selected === item.id ? "white" : "#666" }
            ]}>
              {item.rating || "4.5"} ({item.totalRatings || "24"})
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="bike-fast"
                size={16}
                color={selected === item.id ? "white" : "#4a6da7"}
              />
              <Text style={[
                styles.statText,
                { color: selected === item.id ? "white" : "#666" }
              ]}>
                {item.totalDeliveries || "45"} deliveries
              </Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Ionicons
                name="time-outline"
                size={16}
                color={selected === item.id ? "white" : "#4a6da7"}
              />
              <Text style={[
                styles.statText,
                { color: selected === item.id ? "white" : "#666" }
              ]}>
                {formatTime(item.estimatedArrivalTime || 15)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[
        styles.deliveryFeeContainer,
        { backgroundColor: selected === item.id ? "white" : "#4a6da715" }
      ]}>
        <Text style={[
          styles.deliveryFeeLabel,
          { color: selected === item.id ? "#4a6da7" : "#666" }
        ]}>
          Delivery Fee
        </Text>
        <Text style={[
          styles.deliveryFeeAmount,
          { color: selected === item.id ? "#4a6da7" : "#333" }
        ]}>
          KSH {deliveryFees.toFixed(2)}
        </Text>
        <View style={styles.orderCapacity}>
          <MaterialCommunityIcons
            name="package-variant"
            size={14}
            color={selected === item.id ? "#4a6da7" : "#666"}
          />
          <Text style={[
            styles.orderCapacityText,
            { color: selected === item.id ? "#4a6da7" : "#666" }
          ]}>
            {item.currentOrders || "0"}/{item.maxConcurrentOrders || "3"} orders
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default DriverCard;

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginVertical: 8,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selected: {
    backgroundColor: "#4a6da7",
  },
  unselected: {
    backgroundColor: "#ffffff",
  },
  driverInfoSection: {
    flexDirection: "row",
    marginBottom: 12,
  },
  profileImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  driverDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    marginLeft: 5,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 10,
  },
  statText: {
    fontSize: 13,
    marginLeft: 5,
  },
  deliveryFeeContainer: {
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  deliveryFeeLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  deliveryFeeAmount: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  orderCapacity: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderCapacityText: {
    fontSize: 12,
    marginLeft: 5,
  },
});