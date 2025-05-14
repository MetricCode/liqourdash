import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React, { useRef, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";

//import icons
import Ionicons from "@expo/vector-icons/Ionicons";

//import components
import Map from "../../shared/Map";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

const DeliveryPersonelLayout = ({ children, title, snapPoints }) => {
  //navigation
  const navigation = useNavigation();

  // memoize snapPoints
  const memoizedSnapPoints = useMemo(
    () => snapPoints || ["40%", "85%"],
    [snapPoints]
  );

  const bottomSheetRef = useRef(null);
  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        <View>
          <View style={styles.topSection}>
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => {
                navigation.navigate("AssignDeliveries");
              }}
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: "bold" }}>
              {title || "Go back"}
            </Text>
          </View>
          <Map />
        </View>
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={memoizedSnapPoints}
          index={0}
          keyboardBehavior="extend"
        >
          <BottomSheetView style={{ flex: 1, padding: 20 }}>
            {children}
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
};

export default DeliveryPersonelLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: "#FBF9FD",
  },
  iconContainer: {
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 50,
  },
  topSection: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    position: "absolute",
    zIndex: 3,
    top: 16,
    padding: 10,
  },
});
