import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";

const DeliveryPersonelLayout = ({ children }) => {
  //navigation
  const navigation = useNavigation();
  return (
    <GestureHandlerRootView>
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => {
            navigation.navigate("Deliveries");
          }}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

export default DeliveryPersonelLayout;

const styles = StyleSheet.create({});
