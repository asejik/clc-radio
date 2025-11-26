import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDXfCxf3hmgz1wboIG6OeR2Y7f5AiYOZuM",
  authDomain: "church-radio-6e659.firebaseapp.com",
  projectId: "church-radio-6e659",
  storageBucket: "church-radio-6e659.firebasestorage.app",
  messagingSenderId: "966435492302",
  appId: "1:966435492302:web:53d1712402b067d03a5b9f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);