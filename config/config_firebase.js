import firebase from "firebase";

const firebaseConfig = {
  apiKey: "AIzaSyCyjXy2ScLYJqzubO9ijREkSja6MpTGiYA",
  authDomain: "duantotnghiep-73075.firebaseapp.com",
  projectId: "duantotnghiep-73075",
  storageBucket: "duantotnghiep-73075.appspot.com",
  messagingSenderId: "736010385681",
  appId: "1:736010385681:web:0639dd6aaae470a6b074b0",
  measurementId: "G-5XF1DC9T9G",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
export { db };
