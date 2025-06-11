import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD7enuEBFMzkG1Nz1do7vx313WM06gUz3U",
  authDomain: "aitooldirectory-2872a.firebaseapp.com",
  projectId: "aitooldirectory-2872a",
  storageBucket: "aitooldirectory-2872a.firebasestorage.app",
  messagingSenderId: "680195179378",
  appId: "1:680195179378:web:2956361a868b093efd53eb",
  measurementId: "G-H3NNHEZVD2"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { app };