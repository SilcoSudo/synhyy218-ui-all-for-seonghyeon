import { auth } from "../config/firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const googleProvider = new GoogleAuthProvider();

export function observeAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle() {
  if (!auth) throw new Error("Firebase chưa được cấu hình.");
  return signInWithPopup(auth, googleProvider);
}

export async function signOutUser() {
  if (!auth) throw new Error("Firebase chưa được cấu hình.");
  return signOut(auth);
}
