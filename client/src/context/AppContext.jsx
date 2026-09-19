import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api.js";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AppContext = createContext(undefined);

/** Provides the current user and initial session-loading state to descendants. */
export function AppContextProvider({ children }) {
  const navigate = useNavigate();

  // auth state
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  //auth action
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
  }, [checkSession]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      setUser(data.user);
      toast.success("Welcome back!");
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error?.response?.data?.error ||
        "Invalid email or password. Please try again.";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (name, email, password) => {
    try {
      const { data } = await api.post("/api/auth/register", {
        name,
        email,
        password,
      });
      setUser(data.user);
      toast.success("Account created successfully!");
      navigate("/");
    } catch (error) {
      console.error("Register failed:", error);
      const errorMessage =
        error?.response?.data?.error ||
        "Registration failed. Please try again.";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return (
    <AppContext.Provider value={{ user, loadingUser, login, register }}>
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
