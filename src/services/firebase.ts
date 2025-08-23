
'use server';

import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import type { StoredUserDetails, GenerationHistoryItem } from '@/lib/types';

const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const getFirebaseApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  return initializeApp(firebaseConfig);
};

const db = getFirestore(getFirebaseApp());

export const saveUser = async (user: StoredUserDetails) => {
  try {
    await setDoc(doc(db, 'users', user.email), user, { merge: true });
  } catch (error) {
    console.error("Error saving user to Firestore: ", error);
    throw new Error("Could not save user data.");
  }
};

export const saveGeneration = async (generation: Omit<GenerationHistoryItem, 'id' | 'timestamp'>) => {
    try {
        const docRef = await addDoc(collection(db, 'generations'), {
            ...generation,
            timestamp: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error saving generation to Firestore: ", error);
        throw new Error("Could not save generation history.");
    }
};

export const getGenerations = async (userEmail: string): Promise<GenerationHistoryItem[]> => {
    try {
        const q = query(
            collection(db, 'generations'), 
            where('userEmail', '==', userEmail),
            orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const generations: GenerationHistoryItem[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            generations.push({
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate().toISOString(),
            } as GenerationHistoryItem);
        });
        return generations;
    } catch (error) {
        console.error("Error fetching generations from Firestore: ", error);
        throw new Error("Could not fetch generation history.");
    }
};
