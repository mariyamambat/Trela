import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../services/firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub; // cleanup on unmount
  }, []);

  const logout = () => signOut(auth);

  return <AuthContext.Provider value={{ user, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
