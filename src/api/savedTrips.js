import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";

const savedTripsCollection = (uid) => collection(db, "users", uid, "trips");

/** Firestore rejects undefined anywhere in a document; API payloads often include undefined. */
const stripUndefinedDeep = (value) => {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map(stripUndefinedDeep).filter((item) => item !== undefined);
  }
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    const next = stripUndefinedDeep(v);
    if (next !== undefined) out[k] = next;
  }
  return out;
};

export const saveTrip = async (uid, payload) => {
  if (!uid) throw new Error("User id is required to save trip.");
  const cleaned = stripUndefinedDeep(payload);
  await addDoc(savedTripsCollection(uid), {
    ...cleaned,
    createdAt: serverTimestamp(),
  });
};

export const getSavedTrips = async (uid) => {
  if (!uid) return [];
  try {
    const q = query(savedTripsCollection(uid), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("getSavedTrips failed:", error);
    return [];
  }
};
