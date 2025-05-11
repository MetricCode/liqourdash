import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";

//zustand
import useStore from "../../../utils/useStore";

//import components
import MapsSearchBar from "../shared/MapsSearchBar";
import Map from "../shared/Map";

//import icons
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import AntDesign from "@expo/vector-icons/AntDesign";

const AssignDelivery = () => {
  //navigation
  const navigation = useNavigation();
  const route = useRoute();
  const item = route.params.deliveryItem;

  //get orders stored from zustand
  const ordersStored = useStore((state) => state.ordersStored);
  console.log("the orders stored", ordersStored[0]);

  //order details
  const destinationLatitude = ordersStored[0]?.customerInfo?.position?.lat;
  const destinationLongitude = ordersStored[0]?.customerInfo?.position?.lng;
  const destinationAdress = ordersStored[0]?.customerInfo?.address;
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
  const addedAt = ordersStored[0]?.createdAt;
  const { formattedDate, ago } = formatTimestamp(addedAt);
  const deliveryFee = ordersStored[0]?.deliveryFee;
  const orderNumber = ordersStored[0]?.orderNumber;
  const total = ordersStored[0]?.total;

  console.log("ordersStored", ordersStored[0]);

  //details set on this page
  const [locationToDeliverFrom, setLocationToDeliverFrom] = useState({});
  useEffect(() => {
    if (locationToDeliverFrom?.address) {
      console.log("the chosen location is: ", locationToDeliverFrom);
      navigation.navigate("FindDeliveryPersonel", { locationToDeliverFrom });
    }
  }, [locationToDeliverFrom]);
  const [
    locationToDeliverFromDescription,
    setLocationToDeliverFromDescription,
  ] = useState("");

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
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
        setUserProfile={setLocationToDeliverFrom}
        userProfile={{}}
        placeholderText="Enter location to deliver from"
        setDeliveryAddress={setLocationToDeliverFromDescription}
      />
      <View style={styles.currentLocationContainer}>
        <Text style={styles.currentLocationText}>Your current location</Text>
        <View style={styles.mapViewContainer}>
          <Map />
        </View>
      </View>
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
                <Text>{item.customer}</Text>
              </View>
              <View style={styles.descriptionTextContainer}>
                <Ionicons name="location-outline" size={24} color="black" />
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
              <Text style={styles.secondRowText}>{orderNumber}</Text>
            </View>
            <View style={styles.secondRowDetails}>
              <Text style={styles.secondRowText}>Delivery Fee</Text>
              <Text style={styles.secondRowText}>ksh {deliveryFee}</Text>
            </View>

            <View style={styles.secondRowDetails}>
              <Text style={styles.secondRowText}>Total</Text>
              <Text style={styles.secondRowText}>{total}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default AssignDelivery;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
