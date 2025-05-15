import { create } from "zustand";

const useStore = create((set) => ({
  //manager data
  ordersStored: [],
  setOrdersStored: (newOrders) => set({ ordersStored: [...newOrders] }),
  orderSelected: null,
  setOrderSelected: (newOrder) => set({ orderSelected: newOrder }),
  locationToDeliverFrom: null,
  setLocationToDeliverFrom: (newLocation) =>
    set({ locationToDeliverFrom: newLocation }),

  //customer data
  myStoredLocation: null,
  userAddress: null,
  customerOrders: [],
  setCustomerOrders: (newOrders) => set({ customerOrders: [newOrders] }),

  setMyStoredLocation: (newLocation) =>
    set({ myStoredLocation: newLocation.coords }),
}));

export default useStore;
