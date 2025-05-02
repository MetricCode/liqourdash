// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0Z4-RCet7aYIh5EDe6AFcGs7JrjNYpsk",
  authDomain: "liqourdash.firebaseapp.com",
  projectId: "liqourdash",
  storageBucket: "liqourdash.firebasestorage.app",
  messagingSenderId: "763434796357",
  appId: "1:763434796357:web:05ae06d992720f2b636a2c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIREBASE_DB = getFirestore(FIREBASE_APP);

// User role constants
export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  DELIVERY: 'delivery'
};