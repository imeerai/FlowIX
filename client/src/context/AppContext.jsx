import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../api/api.js";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";

const AppContext = createContext(undefined);

/** Provides authentication, project, editor, and chat state and actions to descendants. */
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
  const requestControllerRef = React.useRef(null);

  const cancelRequest = useCallback(() => {
    requestControllerRef.current?.abort();
  }, []);

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
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      setUser(data.user);
      toast.success("Welcome back!");
      navigate("/");
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
        error.userMessage ||
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
      const errorMessage =
        error?.response?.data?.error ||
        error.userMessage ||
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
      toast.error(error.userMessage || "Failed to load projects list");
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
      if (!silent) {
        toast.error(error.userMessage || "Failed to load project details");
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

    if (isOngoing) {
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
      cancelRequest();
      const controller = new AbortController();
      requestControllerRef.current = controller;
      setGeneratingProject(true);
      try {
        const { data } = await api.post(
          "/api/projects",
          { prompt },
          {
            signal: controller.signal,
          },
        );
        toast.success("AI agent is planning the project structure...");
        navigate(`/builder/${data._id}`);
      } catch (error) {
        if (error.code === "ERR_CANCELED") return;
        toast.error(
          error?.response?.data?.error ||
            error.userMessage ||
            "Failed to generate project",
        );
      } finally {
        if (requestControllerRef.current === controller) {
          requestControllerRef.current = null;
        }
        setGeneratingProject(false);
      }
    },
    [cancelRequest, navigate, user],
  );

  const handleDelete = useCallback(
    async (id) => {
      if (!user) return;
      try {
        await api.delete(`/api/projects/${id}`);
        setProjects((prev) => prev.filter((project) => project._id !== id));
        toast.success("Project deleted successfully");
      } catch (error) {
        toast.error(error.userMessage || "Failed to delete project");
      }
    },
    [user],
  );

  const handleChat = useCallback(
    async (prompt) => {
      if (!activeProject || !user) return;
      cancelRequest();
      const controller = new AbortController();
      requestControllerRef.current = controller;
      setChatLoading(true);
      setActiveProject((current) =>
        current && current._id === activeProject._id
          ? { ...current, status: "revising" }
          : current,
      );
      try {
        const { data } = await api.post(
          `/api/projects/${activeProject._id}/chat`,
          {
            prompt,
          },
          { signal: controller.signal },
        );
        setActiveProject(data);
        if (data.errors && data.errors.length > 0) {
          toast.error(`${data.errors.length} revision patch(es) failed`);
        } else {
          toast.success(`Updated to version ${data.version} `);
        }
      } catch (error) {
        if (error.code === "ERR_CANCELED") return;
        toast.error(
          error?.response?.data?.error ||
            error.userMessage ||
            "Revision request failed",
        );
      } finally {
        if (requestControllerRef.current === controller) {
          requestControllerRef.current = null;
        }
        setChatLoading(false);
      }
    },
    [cancelRequest, user, activeProject],
  );

  const debouncedSave = React.useMemo(
    () =>
      debounce(async (files, id) => {
        try {
          await api.put(`/api/projects/${id}/files`, { files });
        } catch (e) {
          toast.error(e.userMessage || "Failed to save code modifications.");
        }
      }, 1000),
    [],
  );

  useEffect(() => {
    return () => {
      debouncedSave.flush();
    };
  }, [debouncedSave]);

  /** Schedules the supplied file map for the active project after the save debounce. */
  const updateProjectFiles = useCallback(
    async (files) => {
      if (!activeProject || !user) return;
      debouncedSave(files, activeProject._id);
    },
    [activeProject, user, debouncedSave],
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
        cancelRequest,
        handleDelete,
        activeFile,
        setActiveFile,
        showCode,
        setShowCode,
        logout,
        updateProjectFiles,
        handleChat,
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
