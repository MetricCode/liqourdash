import React from "react";
import { View, Text } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import useStore from "../../../utils/useStore";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const MapsSearchBar = ({
  stylesPasses,
  inputContainerStyle,
  placeholderText,
  onSelectFunction,
  Icon,
  iconName,
}) => {
  const currentLocation = useStore((state) => state.myStoredLocation);

  const predefinedPlaces = [
    {
      description: "My Current location",
      geometry: {
        location: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        },
      },
      // isCurrentLocation: true, // custom flag
    },
  ];

  return (
    <View>
      <GooglePlacesAutocomplete
        fetchDetails={true}
        debounce={200}
        enablePoweredByContainer={false}
        nearbyPlacesAPI="GoogleReverseGeocoding"
        minLength={2}
        timeout={10000}
        keyboardShouldPersistTaps="handled"
        listViewDisplayed="auto"
        keepResultsAfterBlur={false}
        currentLocation={false}
        currentLocationLabel="Current location"
        enableHighAccuracyLocation={true}
        filterReverseGeocodingByTypes={[]}
        predefinedPlaces={predefinedPlaces}
        predefinedPlacesAlwaysVisible={true}
        renderRow={(rowData) => {
          return (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {rowData.description === "My Current location" && (
                <MaterialCommunityIcons
                  name="crosshairs-gps"
                  size={24}
                  color="black"
                  style={{ marginRight: 10 }}
                />
              )}
              <Text style={{ color: "black" }}>{rowData.description}</Text>
            </View>
          );
        }}
        styles={{
          row: {
            backgroundColor: "#f5f5f5",
          },
          description: {
            color: "black",
          },
          listView: {
            zIndex: 1000,
            position: "relative",
            top: 0,
            borderRadius: 5,
          },
          separator: {
            backgroundColor: "white",
          },
          textInput: stylesPasses,
          textInputContainer: inputContainerStyle,
        }}
        query={{
          key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
          language: "en",
          types: "geocode",
          location: `${currentLocation.latitude},${currentLocation.longitude}`,
          radius: 30000,
        }}
        onPress={(data, details = null) => {
          onSelectFunction(data, details);
        }}
        GooglePlacesSearchQuery={{
          rankby: "distance",
        }}
        textInputProps={{
          placeholderTextColor: "gray",
          placeholder: placeholderText || "Enter your delivery address",
        }}
        renderLeftButton={() => (
          <>{Icon ? <Icon name={iconName} size={24} color="black" /> : <></>}</>
        )}
      />
    </View>
  );
};
export default MapsSearchBar;
