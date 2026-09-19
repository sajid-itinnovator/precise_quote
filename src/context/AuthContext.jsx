/* eslint-disable react-refresh/only-export-components -- context modules export the useAuth hook alongside the provider by convention */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // { role, dataAccess, name, tenantId, tenantName }
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Platform-admin truth: the server-provisioned `superadmin` custom claim,
  // read from the fresh ID token. Claim-only — the client-writable profile
  // document is never consulted for authorization.
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!currentUser) { if (!cancelled) setIsSuperadmin(false); return; }
      try {
        const token = await currentUser.getIdTokenResult();
        if (!cancelled) setIsSuperadmin(token?.claims?.superadmin === true);
      } catch (err) {
        console.warn('Superadmin claim check failed:', err);
        if (!cancelled) setIsSuperadmin(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            // Auto-provision basic profile if missing (e.g. from Google sign-in)
            const newTenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const defaultTenantName = user.displayName ? `${user.displayName}'s Studio` : 'My Workspace';
            const initialData = {
              email: user.email,
              name: user.displayName || user.email?.split('@')[0] || 'User',
              tenantId: newTenantId,
              tenantName: defaultTenantName,
              role: 'admin',
              dataAccess: 'shared',
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, initialData);
            setUserProfile(initialData);
          }
        } catch (error) {
          console.error("Error fetching or initializing user profile:", error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      const newTenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const defaultTenantName = user.displayName ? `${user.displayName}'s Studio` : 'My Workspace';
      const initialData = {
        email: user.email,
        name: user.displayName || 'Designer',
        tenantId: newTenantId,
        tenantName: defaultTenantName,
        role: 'admin',
        dataAccess: 'shared',
        createdAt: new Date().toISOString()
      };
      await setDoc(userDocRef, initialData);
      setUserProfile(initialData);
    }
    return result;
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    userProfile,
    isPlatformAdmin: isSuperadmin,
    loading,
    login,
    loginWithGoogle,
    resetPassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
