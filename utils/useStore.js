import { create } from "zustand";

const useStore = create((set) => ({
  // Manager data
  ordersStored: [],
  setOrdersStored: (newOrders) => set({ ordersStored: [...newOrders] }),
  
  orderSelected: null,
  setOrderSelected: (newOrder) => set({ orderSelected: newOrder }),
  
  locationToDeliverFrom: null,
  setLocationToDeliverFrom: (newLocation) =>
    set({ locationToDeliverFrom: newLocation }),

  deliveryPersonsIds: [],
  setDeliveryPersonsIds: (newIds) => set({ deliveryPersonsIds: newIds }),
  
  deliveryPersons: [],
  setDeliveryPersons: (newPersons) => set({ deliveryPersons: newPersons }),
  
  deliveryFees: 150, // Default value in KSH
  setDeliveryFees: (newFees) => set({ deliveryFees: newFees }),
  
  // Customer data
  myStoredLocation: null,
  userAddress: null,
  customerOrders: [],
  setCustomerOrders: (newOrders) => set({ customerOrders: newOrders }),

  setMyStoredLocation: (newLocation) =>
    set({ myStoredLocation: newLocation.coords }),
    
  // New additions for store location and delivery assignment
  
  // Store location from storeSettings/location
  storeLocation: null,
  setStoreLocation: (location) => set({ storeLocation: location }),
  
  // Track assigned delivery personnel for order
  assignedDeliveryPersonnel: {},
  setAssignedDeliveryPersonnel: (orderId, personnel) => 
    set((state) => ({ 
      assignedDeliveryPersonnel: { 
        ...state.assignedDeliveryPersonnel, 
        [orderId]: personnel 
      } 
    })),
  
  // Clear assignment data after completion
  clearAssignmentData: () => set({
    locationToDeliverFrom: null,
    assignedDeliveryPersonnel: {}
  }),
}));

export default useStore;