import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api.js";

const AppContext = createContext(undefined);

/** Provides the current user and initial session-loading state to descendants. */
export function AppContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  //auth action
  /** Loads the current session, treating request failures as a signed-out state. */
  const checkSession = async () => {
    try {
      const { data } = await api.get("/api/auth/me");
      setUser(data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <AppContext.Provider value={{ user, loadingUser }}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Returns the current application context.
 *
 * @throws {Error} If called outside an AppContextProvider.
 */
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
}

export default AppContext;
