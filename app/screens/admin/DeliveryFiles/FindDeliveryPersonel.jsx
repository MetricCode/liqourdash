import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState, useEffect } from "react";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";

//import components
import DeliveryPersonelLayout from "./DeliveryPersonelLayout";
import MapsSearchBar from "../../shared/MapsSearchBar";

//import icons
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

//zustand
import useStore from "../../../../utils/useStore";

const FindDeliveryPersonel = () => {
  //navigation
  //navigation
  const navigation = useNavigation();
  const route = useRoute();
  let locationToDeliverFrom = route.params.address;
  let locationToDeliverTo = useStore(
    (state) => state.orderSelected.customerInfo.address
  );
  //   const setMyStoredLocation = useStore((state) => state.setMyStoredLocation);
  // let locationToDeliverFrom = useStore((state) => state.orderSelected.customerInfo.address);
  const setMyStoredLocation = useStore((state) => state.setMyStoredLocation);
 
  return (
    <DeliveryPersonelLayout
      title="Find Delivery Personel"
      snapPoints={["40", "85%"]}
    >
      <View style={{ marginVertical: 10 }}>
        <Text style={{ fontSize: 18, marginBottom: 3 }}>From</Text>
        <MapsSearchBar
          stylesPasses={styles.textInput}
          placeholderText={locationToDeliverFrom}
          onSelectFunction={(data, details) => {
            console.log("data", data);
            setMyStoredLocation({ data });
          }}
          inputContainerStyle={styles.inputContainerStyle}
          Icon={MaterialCommunityIcons}
          iconName="crosshairs-gps"
        />
      </View>
      <View style={{ marginVertical: 10 }}>
        <Text style={{ fontSize: 18, marginBottom: 3 }}>To</Text>
        <MapsSearchBar
          stylesPasses={styles.textInput}
          placeholderText={locationToDeliverTo}
          onSelectFunction={(data, details) => {
            console.log("data", data);
            setMyStoredLocation({ data });
          }}
          inputContainerStyle={styles.inputContainerStyle}
          Icon={FontAwesome6}
          iconName="map"
        />
      </View>

      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <TouchableOpacity
          style={styles.findDeliveryPersonelButton}
          onPress={() => {
            // navigation.navigate("ConfirmDeliveryPersonel", {
            //   locationToDeliverFrom,
            // });
            navigation.navigate("ConfirmDeliveryPersonel");
          }}
        >
          <Text style={{ color: "white" }}>Find Now</Text>
        </TouchableOpacity>
      </View>
    </DeliveryPersonelLayout>
  );
};

export default FindDeliveryPersonel;

const styles = StyleSheet.create({
  textInput: {
    // boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
    borderRadius: 10,
    marginBottom: 0,
    backgroundColor: "#f5f5f5",
  },
  inputContainerStyle: {
    backgroundColor: "#f5f5f5",
    padding: 2,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    gap: 5,
    marginBottom: 10,
  },
  findDeliveryPersonelButton: {
    backgroundColor: "#4a6da7",
    padding: 15,
    paddingHorizontal: 150,
    alignItems: "center",
    borderRadius: 30,
    boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
  },
});
