import { create } from "zustand";

const useStore = create((set) => ({
  // Manager data - existing
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
  
  // Customer data - existing
  myStoredLocation: null,
  userAddress: null,
  customerOrders: [],
  setCustomerOrders: (newOrders) => set({ customerOrders: newOrders }),

  setMyStoredLocation: (newLocation) =>
    set({ myStoredLocation: newLocation.coords }),
    
  // New additions
  
  // Store location management
  storeLocation: null,
  setStoreLocation: (location) => set({ storeLocation: location }),
  
  // Selected delivery person for assignment
  selectedDeliveryPerson: null,
  setSelectedDeliveryPerson: (driver) => set({ selectedDeliveryPerson: driver }),
  
  // Order assignment tracking
  orderAssignments: {},
  addOrderAssignment: (orderId, assignmentData) => 
    set((state) => ({ 
      orderAssignments: { 
        ...state.orderAssignments, 
        [orderId]: assignmentData 
      } 
    })),
  
  // Update an existing assignment
  updateOrderAssignment: (orderId, updateData) =>
    set((state) => {
      if (!state.orderAssignments[orderId]) return state;
      
      return {
        orderAssignments: {
          ...state.orderAssignments,
          [orderId]: {
            ...state.orderAssignments[orderId],
            ...updateData
          }
        }
      };
    }),
  
  // Clear assignment data without affecting other store state
  clearDeliveryAssignmentData: () => set({
    locationToDeliverFrom: null,
    selectedDeliveryPerson: null
  }),
}));

export default useStore;