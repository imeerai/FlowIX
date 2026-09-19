import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
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

  //states
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [activeProject, setActiveProject] = useState(null);
  const [LoadingActiveProject, setLoadingActiveProject] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [generatingProject, setGeneratingProject] = useState(false);
  const [activeFile, setActiveFile] = useState("App.js");
  const [showCode, setShowCode] = useState(false);

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

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
      setUser(null);
      setProjects([]);
      setActiveProject(null);
      toast.success("Logged out successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed");
    }
  };

  //project actions
  const loadProjects = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get("/api/projects");
      setProjects(data);
    } catch (error) {
      console.error("failed to list the project", error);
      toast.error("Failed to load projects list");
    } finally {
      setLoadingProjects(false);
    }
  }, [user]);
  // load project
  const loadProject = async (id, silent = false) => {
    if (!user) return;
    if (!silent) setLoadingActiveProject(true);
    try {
      const { data } = await api.get(`/api/projects/${id}`);
      setActiveProject(data);

      //defaults file selection
      const files = Object.keys(data.files);
      if (files.length > 0) {
        setActiveFile((prev) => {
          if (files.includes(prev)) return prev;
          if (files.includes("App.js")) return "App.js";
          return files[0];
        });
      }
    } catch (error) {
      console.error("failed to load project", error);
      if (!silent) {
        toast.error("Failed to load project details");
        navigate("/");
      }
    } finally {
      if (!silent) setLoadingActiveProject(false);
    }
  };

  //automatically poll active project status f generated or pending
  useEffect(() => {
    if (!activeProject?._id || !user) return;
    const isOngoing =
      activeProject.status === "pending" ||
      activeProject.status === "generating" ||
      activeProject.status === "revising";

    if (!isOngoing) {
      setChatLoading(true);
      const interval = setInterval(() => {
        loadProject(activeProject._id, true);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setChatLoading(false);
    }
  }, [activeProject?._id, activeProject?.status, loadProject, user]);

  const handleGenerate = useCallback(
    async (prompt) => {
      if (!user) return;
      setGeneratingProject(true);
      try {
        const { data } = await api.post("/api/projects", { prompt });
        toast.success("AI agent is planning structure......");
        navigate(`/builder/${data._id}`);
      } catch (error) {
        console.error("failed to generate project", error);
        toast.error(
          error?.response?.data?.error || "Failed to generate project",
        );
      } finally {
        setGeneratingProject(false);
      }
    },
    [navigate, user],
  );

  const handleDelete = useCallback(
    async (id) => {
      if (!user) return;
      try {
        await api.delete(`/api/projects/${id}`);
        setProjects((prev) => prev.filter((project) => project._id !== id));
        toast.success("Project deleted successfully");
      } catch (error) {
        console.error("failed to delete project", error);
        toast.error("Failed to delete project");
      }
    },
    [user],
  );

  return (
    <AppContext.Provider
      value={{
        user,
        loadingUser,
        login,
        register,
        logout,
        projects,
        loadingProjects,
        loadProjects,
        activeProject,
        loadProject,
        LoadingActiveProject,
        chatLoading,
        generatingProject,
        handleGenerate,
        handleDelete,
        activeFile,
        setActiveFile,
        showCode,
        setShowCode,
        logout,
      }}
    >
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
