import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null); // Firestore data (role, etc)
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Demo Login function
  const enableDemoMode = (role) => {
    setIsDemoMode(true);
    const user = { uid: 'demo-user-123', email: `${role}@demo.com` };
    const data = { role: role, name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}` };
    setCurrentUser(user);
    setUserData(data);
    localStorage.setItem('customUserSession', JSON.stringify({ user, data }));
    setLoading(false);
  };

  // Custom Driver Login function
  const loginAsDriver = async (name, password) => {
    try {
      const q = query(collection(db, 'drivers'), where('name', '==', name));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const driverDoc = querySnapshot.docs[0];
        const driverData = driverDoc.data();

        if (String(driverData.password) !== String(password)) {
          return { success: false, error: 'Invalid password' };
        }
        
        // Check if already logged in
        if (driverData.isLoggedIn) {
          return { success: false, error: 'Driver is already logged in on another device.' };
        }
        
        // Update driver doc to logged in
        await updateDoc(doc(db, 'drivers', driverDoc.id), {
          isLoggedIn: true,
          lastLoginTime: serverTimestamp()
        });
        
        // Emulate a logged-in session
        setIsDemoMode(true);
        const user = { uid: driverDoc.id, email: `${name.replace(/\s+/g, '').toLowerCase()}@smartbus.local` };
        const data = { ...driverData, role: 'driver', uid: driverDoc.id };
        setCurrentUser(user);
        setUserData(data);
        localStorage.setItem('customUserSession', JSON.stringify({ user, data }));
        setLoading(false);
        return { success: true };
      } else {
        return { success: false, error: 'Driver not found' };
      }
    } catch (error) {
      console.error("Error logging in driver:", error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Custom Student Login function
  const loginAsStudent = async (rollNumber, password) => {
    try {
      const q = query(collection(db, 'students'), where('rollNumber', '==', rollNumber));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        const studentData = studentDoc.data();
        
        if (String(studentData.password) !== String(password)) {
          return { success: false, error: 'Invalid password' };
        }

        // Emulate a logged-in session
        setIsDemoMode(true);
        const user = { uid: studentDoc.id, email: `${rollNumber.toLowerCase()}@smartbus.local` };
        const data = { ...studentData, role: 'student', uid: studentDoc.id };
        setCurrentUser(user);
        setUserData(data);
        localStorage.setItem('customUserSession', JSON.stringify({ user, data }));
        setLoading(false);
        return { success: true };
      } else {
        return { success: false, error: 'Roll number not found' };
      }
    } catch (error) {
      console.error("Error logging in student:", error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Logout function
  const disableDemoMode = async () => {
    const storedSession = localStorage.getItem('customUserSession');
    if (storedSession) {
      try {
        const { data } = JSON.parse(storedSession);
        if (data.role === 'driver' && data.uid) {
          await updateDoc(doc(db, 'drivers', data.uid), {
            isLoggedIn: false
          });
        }
      } catch (e) {
        console.error("Failed to update driver logout status", e);
      }
    }

    setIsDemoMode(false);
    setCurrentUser(null);
    setUserData(null);
    localStorage.removeItem('customUserSession');
    auth.signOut();
  };

  useEffect(() => {
    // Restore custom session if it exists
    const storedSession = localStorage.getItem('customUserSession');
    if (storedSession) {
      try {
        const { user, data } = JSON.parse(storedSession);
        setCurrentUser(user);
        setUserData(data);
        setIsDemoMode(true);
        setLoading(false);

        if (data.role === 'driver' || data.role === 'student') {
          const collectionName = data.role === 'driver' ? 'drivers' : 'students';
          const docRef = doc(db, collectionName, data.uid);
          
          const unsubscribeCustom = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              const latestData = docSnap.data();
              if (String(latestData.password) !== String(data.password)) {
                 disableDemoMode();
                 alert("Your credentials have been updated by the administrator. Please log in again.");
              }
            } else {
               disableDemoMode();
               alert("Your account was removed by the administrator.");
            }
          });
          return () => unsubscribeCustom();
        }
        return;
      } catch (e) {
        console.error("Failed to parse stored custom session", e);
        setLoading(false);
      }
    }

    if (isDemoMode) return; // Skip Firebase auth if in demo mode
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user document from Firestore to get their role
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data());
          } else {
            console.error("No user document found in Firestore!");
            setUserData(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    enableDemoMode,
    disableDemoMode,
    loginAsDriver,
    loginAsStudent,
    isDemoMode
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
