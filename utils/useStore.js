import { create } from "zustand";

const useStore = create((set) => ({
  //manager data
  ordersStored: [],
  setOrdersStored: (newOrders) => set({ ordersStored: [...newOrders] }),
  //customer data
  myStoredLocation: null,
  userAddress: null,
  userLongitude: null,
  userLatitude: null,
  destinationAddress: null,
  destinationLongitude: null,
  destinationLatitude: null,
  setDestinationLocation: (newLocation) =>
    set({
      destinationLatitude: newLocation.coords.latitude,
      destinationLongitude: newLocation.coords.longitude,
    }),
  setMyStoredLocation: (newLocation) =>
    set({ myStoredLocation: newLocation.coords }),
}));



export default useStore;
