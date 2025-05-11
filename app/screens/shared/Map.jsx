import { StyleSheet, Text, View, Image } from "react-native";
import React, { useEffect, useState } from "react";

//import components
import MapView, { Marker, Circle } from "react-native-maps";
import MapViewStyle from "../../../utils/MapViewStyle.json";

//zustand
import useStore from "../../../utils/useStore";
import MapsSearchBar from "./MapsSearchBar";

const Map = () => {
  const location = useStore((state) => state.myStoredLocation);

  return (
    location.latitude && (
      <View>
        <MapView
          style={styles.map}
          customMapStyle={MapViewStyle}
          region={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.0422,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
          >
            {/* <Image
              source={require("../../../utils/images/deliveryDriverPng.png")}
              style={{ width: 40, height: 40 }}
            /> */}
          </Marker>
        </MapView>
      </View>
    )
  );
};

export default Map;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});
