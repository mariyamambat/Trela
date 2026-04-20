import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const tripsCol = (userId) => collection(db, "users", userId, "trips");

export const getTrips = async (userId) => {
  const q = query(tripsCol(userId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getTrip = async (userId, tripId) => {
  const snap = await getDoc(doc(db, "users", userId, "trips", tripId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

export const addTrip = (userId, data) =>
  addDoc(tripsCol(userId), { ...data, createdAt: serverTimestamp() });

export const updateTrip = (userId, tripId, data) =>
  updateDoc(doc(db, "users", userId, "trips", tripId), data);

export const deleteTrip = (userId, tripId) =>
  deleteDoc(doc(db, "users", userId, "trips", tripId));

// Itinerary
export const getItinerary = async (userId, tripId) => {
  const col = collection(db, "users", userId, "trips", tripId, "itinerary");
  const snap = await getDocs(query(col, orderBy("date")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addDay = (userId, tripId, data) =>
  addDoc(collection(db, "users", userId, "trips", tripId, "itinerary"), data);

export const updateDay = (userId, tripId, dayId, data) =>
  updateDoc(doc(db, "users", userId, "trips", tripId, "itinerary", dayId), data);

export const deleteDay = (userId, tripId, dayId) =>
  deleteDoc(doc(db, "users", userId, "trips", tripId, "itinerary", dayId));

// Expenses
export const getExpenses = async (userId, tripId) => {
  const col = collection(db, "users", userId, "trips", tripId, "expenses");
  const snap = await getDocs(query(col, orderBy("date", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addExpense = (userId, tripId, data) =>
  addDoc(collection(db, "users", userId, "trips", tripId, "expenses"), {
    ...data,
    createdAt: serverTimestamp(),
  });

export const deleteExpense = (userId, tripId, expenseId) =>
  deleteDoc(doc(db, "users", userId, "trips", tripId, "expenses", expenseId));

// Documents
export const getDocs_ = async (userId, tripId) => {
  const col = collection(db, "users", userId, "trips", tripId, "documents");
  const snap = await getDocs(col);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addDocument = (userId, tripId, data) =>
  addDoc(collection(db, "users", userId, "trips", tripId, "documents"), data);

export const updateDocument = (userId, tripId, docId, data) =>
  updateDoc(doc(db, "users", userId, "trips", tripId, "documents", docId), data);
