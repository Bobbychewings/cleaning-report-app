import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'staff'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoading(true);
        setCurrentUser(user);
        await checkAndCreateUserDoc(user);
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const checkAndCreateUserDoc = async (user) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserRole(userSnap.data().role);
      } else {
        // Check if this is the first user overall. If so, make them master admin
        const usersQuery = await getDocs(collection(db, 'users'));
        const isFirstUser = usersQuery.empty;

        const role = isFirstUser ? 'admin' : 'staff';

        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
          role: role,
          createdAt: serverTimestamp()
        });
        setUserRole(role);
      }
    } catch (error) {
      console.error("Error checking/creating user doc:", error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const loginWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const registerWithEmail = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const signOut = () => {
    return firebaseSignOut(auth);
  };

  const value = {
    currentUser,
    userRole,
    isAdmin: userRole === 'admin',
    isStaff: userRole === 'staff',
    signInWithGoogle,
    loginWithEmail,
    registerWithEmail,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
