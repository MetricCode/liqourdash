import { StyleSheet, Text, View, Image } from "react-native";
import React, { useEffect, useState } from "react";
import MapViewDirections from "react-native-maps-directions";

//import components
import MapView, { Marker, Circle } from "react-native-maps";
import MapViewStyle from "../../../utils/MapViewStyle.json";

//zustand
import useStore from "../../../utils/useStore";
import MapsSearchBar from "./MapsSearchBar";
import { getDistanceFromLatLonInKm } from "../../../utils/MapUtilFunctions";

const Map = () => {
  //zustand
  const deliveryPersons = useStore((state) => state.deliveryPersons);
  console.log("deliveryPersons", deliveryPersons);

  const locationToDeliverFrom = useStore(
    (state) => state.locationToDeliverFrom
  );
  useEffect(() => {
    console.log("locationToDeliverFrom", locationToDeliverFrom);
  }, [locationToDeliverFrom]);
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

  const destinationLocation = useStore(
    (state) => state.orderSelected.customerInfo.position
  );
  console.log("destinationLocation", destinationLocation);

  let region = {};
  if (!location.latitude || !location.longitude) {
    region = {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  } else if (!destinationLocation?.lat || !destinationLocation?.lng) {
    region = {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  } else {
    const userLatitude = location.latitude;
    const userLongitude = location.longitude;
    const destinationLatitude = destinationLocation.lat;
    const destinationLongitude = destinationLocation.lng;

    const minLat = Math.min(userLatitude, destinationLatitude);
    const maxLat = Math.max(userLatitude, destinationLatitude);
    const minLng = Math.min(userLongitude, destinationLongitude);
    const maxLng = Math.max(userLongitude, destinationLongitude);

    const latitudeDelta = (maxLat - minLat) * 1.3;
    const longitudeDelta = (maxLng - minLng) * 1.3;
    const latitude = (userLatitude + destinationLatitude) / 2;
    const longitude = (userLongitude + destinationLongitude) / 2;

    region = {
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta,
    };
  }

  const setDeliveryFees = useStore((state) => state.setDeliveryFees);
  setDeliveryFees(
    getDistanceFromLatLonInKm(
      location.latitude,
      location.longitude,
      destinationLocation.lat,
      destinationLocation.lng
    ) * 100
  );

  return (
    location.latitude && (
      <View>
        <MapView
          style={styles.map}
          customMapStyle={MapViewStyle}
          region={region}
          showsUserLocation={true}
        >
          <Marker
            key="deliverFrom"
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
          />

          {destinationLocation?.lat && (
            <>
              <Marker
                key="deliverTO"
                coordinate={{
                  latitude: destinationLocation?.lat,
                  longitude: destinationLocation?.lng,
                }}
              />
              {deliveryPersons?.map((deliveryPerson, index) => (
                <>
                  <Marker
                    key={index}
                    coordinate={{
                      latitude: deliveryPerson?.position?.lat,
                      longitude: deliveryPerson?.position?.lng,
                    }}
                  >
                    <Image
                      source={require("../../../utils/images/Delivery.png")}
                      style={{ width: 40, height: 40 }}
                    />
                  </Marker>
                </>
              ))}
              <MapViewDirections
                origin={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                destination={{
                  latitude: destinationLocation?.lat,
                  longitude: destinationLocation?.lng,
                }}
                apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}
                strokeColor="red"
                strokeWidth={2}
                onError={(errorMessage) => {
                  console.log("Error: ", errorMessage);
                }}
              />
            </>
          )}
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
