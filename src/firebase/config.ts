
import type { FirebaseOptions } from "firebase/app";

export const firebaseConfig: FirebaseOptions = {
  projectId: "studio-924125191-39ba7",
  appId: "1:772108246299:web:530b6a1ed551c38eff47be",
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // Use the correct public env var
  authDomain: "studio-924125191-39ba7.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "772108246299",
  storageBucket: "studio-924125191-39ba7.appspot.com"
};
