import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import DeliveryPersonelLayout from "./DeliveryPersonelLayout";
import DriverCard from "./DriverCard";

//temp data
import drivers from "../../../../utils/mockDeliveryRiderData.json";

//util  function
import { sortDeliveryPersonsByDistance } from "../../../../utils/MapUtilFunctions";

//zustand
import useStore from "../../../../utils/useStore";
import { SafeAreaView } from "react-native-safe-area-context";

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

  const [selected, setSelected] = useState(null);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <DeliveryPersonelLayout
        title="Confirm Delivery Personel"
        snapPoints={["30%", "40%", "65%", "85%"]}
      >
        <FlatList
          data={orderedSortedDeliveryPersonel}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DriverCard
              selected={selected}
              item={item}
              setSelected={() => {
               setSelected(item.id);
              }}
            />
          )}
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
    </SafeAreaView>
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
