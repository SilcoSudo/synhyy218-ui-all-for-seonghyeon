import { db } from "../config/firebase.js";
import {
  collection, getDocs, limit, query, where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Read-only foundation. Not connected to the existing local caption screen yet.
// Firestore must have an appropriate 'captions' collection and deployed read rules.
export async function loadApprovedCaptions(language = "en") {
  if (!db) throw new Error("Firebase chưa được cấu hình.");
  const q = query(
    collection(db, "captions"),
    where("language", "==", language),
    where("status", "==", "approved"),
    limit(20)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
