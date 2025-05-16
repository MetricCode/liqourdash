import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import React, { useEffect } from "react";
import DeliveryPersonelLayout from "./DeliveryPersonelLayout";
import DriverCard from "./DriverCard";

//temp data
import drivers from "../../../../utils/mockDeliveryRiderData.json";

//util  function
import { sortDeliveryPersonsByDistance } from "../../../../utils/MapUtilFunctions";

//zustand
import useStore from "../../../../utils/useStore";

const ConfirmDeliveryPersonel = () => {
  //zustand
  const deliveryPersons = useStore((state) => state.deliveryPersons);
  console.log("deliveryPersons", deliveryPersons);

  const locationToDeliverFrom = useStore(
    (state) => state.locationToDeliverFrom
  );

  const location = {
    latitude:
      locationToDeliverFrom?.coords?.latitude ||
      locationToDeliverFrom?.position?.lat ||
      0,
    longitude:
      locationToDeliverFrom?.coords?.longitude ||
      locationToDeliverFrom?.position?.lng ||
      0,
  };
  useEffect(() => {
    console.log("locationToDeliverFrom confirm", location);
  }, [locationToDeliverFrom]);

  const orderedSortedDeliveryPersonel = sortDeliveryPersonsByDistance(
    deliveryPersons,
    location
  );

  return (
    <DeliveryPersonelLayout
      title="Confirm Delivery Personel"
      snapPoints={["30%", "40%", "65%", "85%"]}
    >
      <FlatList
        data={orderedSortedDeliveryPersonel}
        renderItem={({ item }) => <DriverCard selected={"1"} item={item} />}
        ListFooterComponent={() => (
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <TouchableOpacity
              style={styles.findDeliveryPersonelButton}
              onPress={() => {
                // navigation.navigate("ConfirmDeliveryPersonel", {
                //   locationToDeliverFrom,
                // });
                console.log("Selecteed");
              }}
            >
              <Text style={{ color: "white" }}>Confirm dispatch</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </DeliveryPersonelLayout>
  );
};

export default ConfirmDeliveryPersonel;

const styles = StyleSheet.create({
  findDeliveryPersonelButton: {
    backgroundColor: "#4a6da7",
    padding: 15,
    paddingHorizontal: 130,
    alignItems: "center",
    borderRadius: 30,
    boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
    marginTop: 20,
  },
});
