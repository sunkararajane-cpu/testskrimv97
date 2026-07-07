import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, QueryConstraint } from "firebase/firestore";
import { db } from "./config";

// Generic, safe data access wrappers with try/catch logic
// for all Firebase Firestore operations

export const safeGetDocs = async (collectionName: string, ...queryConstraints: QueryConstraint[]) => {
  try {
    if (!db) throw new Error("Firestore not initialized");
    const q = query(collection(db, collectionName), ...queryConstraints);
    const querySnapshot = await getDocs(q);
    return { data: querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })), error: null };
  } catch (error: any) {
    console.error(`Error fetching docs from ${collectionName}:`, error);
    return { data: null, error: error.message };
  }
};

export const safeGetDoc = async (collectionName: string, documentId: string) => {
  try {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    }
    return { data: null, error: "Document not found" };
  } catch (error: any) {
    console.error(`Error fetching doc ${documentId} from ${collectionName}:`, error);
    return { data: null, error: error.message };
  }
};

export const safeAddDoc = async (collectionName: string, data: any) => {
  try {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = await addDoc(collection(db, collectionName), data);
    return { data: docRef.id, error: null };
  } catch (error: any) {
    console.error(`Error adding doc to ${collectionName}:`, error);
    return { data: null, error: error.message };
  }
};

export const safeUpdateDoc = async (collectionName: string, documentId: string, data: any) => {
  try {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, data);
    return { success: true, error: null };
  } catch (error: any) {
    console.error(`Error updating doc ${documentId} in ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
};

export const safeDeleteDoc = async (collectionName: string, documentId: string) => {
  try {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
    return { success: true, error: null };
  } catch (error: any) {
    console.error(`Error deleting doc ${documentId} from ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
};
