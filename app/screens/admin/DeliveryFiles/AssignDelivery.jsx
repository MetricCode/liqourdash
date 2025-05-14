import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  FlatList,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";

//zustand
import useStore from "../../../../utils/useStore";

//import components
import MapsSearchBar from "../../shared/MapsSearchBar";
import Map from "../../shared/Map";

//import icons
import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";

const AssignDelivery = () => {
  //navigation
  const navigation = useNavigation();
  const route = useRoute();
  const item = useStore((state) => state.orderSelected);
  // const orderSelected = useStore((state) => state.orderSelected);
  const orderSelected = useStore((state) => state.ordersStored[0]);
  console.log("order selected", orderSelected);

  //get orders stored from zustand
  const ordersStored = useStore((state) => state.ordersStored);

  //order details
  const destinationLatitude = orderSelected?.customerInfo?.position?.lat;
  const destinationLongitude = orderSelected?.customerInfo?.position?.lng;
  const destinationAdress = orderSelected?.customerInfo?.address;
  const formatTimestamp = ({ seconds, nanoseconds }) => {
    const date = new Date(seconds * 1000 + nanoseconds / 1e6);
    // e.g. "12 August 2024"
    const options = { day: "numeric", month: "long", year: "numeric" };
    const formattedDate = date.toLocaleDateString("en-US", options);

    // calculate how many days ago
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const ago = diffDays <= 1 ? `${diffDays} day ago` : `${diffDays} days ago`;

    return { formattedDate, ago };
  };
  const addedAt = orderSelected?.createdAt;
  const { formattedDate, ago } = formatTimestamp(addedAt);

  console.log("ordersStored", ordersStored[0]);

  //details set on this page
  const setLocationToDeliverFrom = useStore(
    (state) => state.setLocationToDeliverFrom
  );

  return (
    <>
      {!destinationLatitude && item ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ marginBottom: 10 }}>
            Waiting for delivery location...
          </Text>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <FlatList
          data={[1]}
          style={styles.container}
          keyboardShouldPersistTaps="handled"
          renderItem={() => (
            <>
              <View style={styles.headerContainer}>
                <Text style={styles.title}>Assign Delivery Person</Text>
                <TouchableOpacity
                  style={styles.iconContainer}
                  onPress={() => {
                    navigation.navigate("Deliveries");
                  }}
                >
                  <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
              </View>

              <MapsSearchBar
                stylesPasses={styles.locationInput}
                placeholderText="Enter location to deliver from"
                onSelectFunction={(data, details) => {
                  setLocationToDeliverFrom({
                    address: data.description,
                    position: details.geometry.location,
                  });
                  console.log("set", {
                    address: data.description,
                    position: details.geometry.location,
                  });
                  navigation.navigate("FindDeliveryPersonel", {
                    address: data.description,
                    position: details.geometry.location,
                  });
                }}
              />
              <View style={styles.currentLocationContainer}>
                <Text style={styles.currentLocationText}>
                  Your current location
                </Text>
                <View style={styles.mapViewContainer}>
                  <Map />
                </View>
              </View>
            </>
          )}
          ListFooterComponent={() => (
            <>
              <View style={styles.orderDetailsContainer}>
                <Text style={styles.currentLocationText}>Order Details</Text>
                <View style={styles.orderDetailsCard}>
                  <View style={styles.firstRow}>
                    <Image
                      source={{
                        uri: `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=400&center=lonlat:${destinationLongitude},${destinationLatitude}&zoom=14&apiKey=${process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY}`,
                      }}
                      style={styles.tinyMap}
                    />
                    <View style={styles.descriptionContainer}>
                      <View style={styles.descriptionTextContainer}>
                        <AntDesign name="user" size={24} color="black" />
                        <Text>{orderSelected?.customerInfo?.name}</Text>
                      </View>
                      <View style={styles.descriptionTextContainer}>
                        <Ionicons
                          name="location-outline"
                          size={24}
                          color="black"
                        />
                        <Text>{destinationAdress}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.secondRow}>
                    <View style={styles.secondRowDetails}>
                      <Text style={styles.secondRowText}>Order Date</Text>
                      <Text style={styles.secondRowText}>
                        {formattedDate}, {ago}
                      </Text>
                    </View>
                    <View style={styles.secondRowDetails}>
                      <Text style={styles.secondRowText}>Order Number</Text>
                      <Text style={styles.secondRowText}>{orderSelected?.orderNumber}</Text>
                    </View>
                    <View style={styles.secondRowDetails}>
                      <Text style={styles.secondRowText}>Delivery Fee</Text>
                      <Text style={styles.secondRowText}>
                        ksh {orderSelected?.deliveryFee}
                      </Text>
                    </View>

                    <View style={styles.secondRowDetails}>
                      <Text style={styles.secondRowText}>Total</Text>
                      <Text style={styles.secondRowText}>{orderSelected?.total}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}
        />
      )}
    </>
  );
};

export default AssignDelivery;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 50,
    backgroundColor: "#FBF9FD",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 50,
    width: 40,
    height: 40,
  },

  locationInput: {
    boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
    borderRadius: 10,
    marginTop: 20,
  },
  currentLocationContainer: {
    marginTop: 30,
  },
  currentLocationText: {
    fontSize: 20,
  },
  mapViewContainer: {
    width: "100%",
    height: 300,
    marginTop: 20,
    backgroundColor: "#ffffff",
    boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
  },
  orderDetailsContainer: {
    marginTop: 20,
  },
  orderDetailsCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
    borderRadius: 10,
    marginTop: 20,
    padding: 10,
  },
  firstRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  tinyMap: {
    width: 80,
    height: 90,
    borderRadius: 10,
  },
  descriptionContainer: {
    gap: 10,
  },
  descriptionTextContainer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  secondRow: {
    marginTop: 20,
    backgroundColor: "#FBF9FD",
    width: "100%",
    borderRadius: 10,
    padding: 10,
    gap: 15,
    paddingBottom: 30,
  },
  secondRowDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  secondRowText: {
    color: "#7F7E81",
    fontSize: 16,
  },
});
