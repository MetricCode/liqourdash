import { create } from "zustand";

const useStore = create((set) => ({
  myStoredLocation: null,
  setMyStoredLocation: (newLocation) => set({ myStoredLocation: newLocation.coords }),
}));

export default useStore;
