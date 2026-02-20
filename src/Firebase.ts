import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyCzvqQEh53RcdvLzzrKbs44ngCETFmBEFc",
  authDomain: "attendtrak.firebaseapp.com",
  projectId: "attendtrak",
  storageBucket: "attendtrak.firebasestorage.app",
  messagingSenderId: "766540733227",
  appId: "1:766540733227:web:667ecd5fb8f052840b036e",
  measurementId: "G-80MV1C22QP"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
