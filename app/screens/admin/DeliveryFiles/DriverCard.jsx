import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";

//icons
import Entypo from "@expo/vector-icons/Entypo";
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

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 20,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginVertical: 10,
    },
    selected: {
      backgroundColor: "#4a6da7", // Example for bg-general-600
    },
    unselected: {
      backgroundColor: "#ffffff", // bg-white
    },
    profileImage: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#4a6da7", // Example for bg-general-200
    },
    contentContainer: {
      flex: 1,
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "center",
      marginHorizontal: 12,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      marginBottom: 4,
    },
    titleText: {
      fontSize: 18,
      fontWeight: "bold",
      color: selected === item.id ? "white" : "#4a6da7",
    },
    starContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 8,
    },

    starText: {
      fontSize: 14,
      marginLeft: 4,
      color: selected === item.id ? "white" : "#4B5563",
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      marginLeft: -2,
    },
    detailItem: {
      flexDirection: "row",
      alignItems: "center",
    },

    detailText: {
      fontSize: 14,
      marginLeft: 4,
      color: selected === item.id ? "white" : "#4B5563",
    },
    divider: {
      fontSize: 14,
      marginHorizontal: 4,
      color: "#4B5563", // Example color for text-general-800
    },
    carImage: {
      width: 56,
      height: 56,
    },
  });

  return (
    <TouchableOpacity
      onPress={setSelected}
      style={[
        styles.container,
        selected === item.id ? styles.selected : styles.unselected,
      ]}
    >
      <View
        // source={{ uri: item.driver.profile_image_url }}
        style={styles.profileImage}
      ></View>

      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>reg</Text>
          {/* <View style={styles.starContainer}>
            <Entypo
              name="star"
              size={24}
              color={selected === item.id ? "white" : "#4B5563"}
            />
            <Text style={styles.starText}>4</Text>
          </View> */}
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailText}>ksh {deliveryFees.toFixed(2)}</Text>
          </View>

          <Text style={styles.detailText}></Text>

          <Text style={styles.divider}>|</Text>

          <Text style={styles.detailText}>
            {item?.maxConcurrentOrders} max orders
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default DriverCard;
