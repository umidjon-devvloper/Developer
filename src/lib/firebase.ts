import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDY4ALhRxhzFK6hPTUa-ItmP2El6X3unnE",
  authDomain: "devhub-web.firebaseapp.com",
  projectId: "devhub-web",
  storageBucket: "devhub-web.firebasestorage.app",
  messagingSenderId: "845759812868",
  appId: "1:845759812868:web:e52b0e818f138e250aac51",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const firestore = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  client_id:
    "845759812868-8kkcci0fg5bnlhqfvjebhk6h4lgt516h.apps.googleusercontent.com",
});
