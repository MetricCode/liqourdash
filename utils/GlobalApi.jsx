// import axios from "axios";
// import { useStore } from "zustand";
// const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// const locationStored = useStore((state) => state.myStoredLocation);
// console.log("Location stored in Zustand:", locationStored);

// const location = "37.7749,-122.4194"; // Example: San Francisco
// const radius = 1500; // in meters
// const type = "restaurant"; // e.g., restaurant, cafe, etc.

// const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/output?json?location=${locationStored}&radius=${radius}&key=${API_KEY}`;

// const NewNearbyPlace = axios
//   .get(url)
//   .then((response) => {
//     console.log("Places found:", response.data.results);
//   })
//   .catch((error) => {
//     console.error(
//       "Error fetching nearby places:",
//       error.response ? error.response.data : error.message
//     );
//   });

// export default NewNearbyPlace;
