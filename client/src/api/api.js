import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "",
  withCredentials: true,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      error.userMessage =
        "The request timed out. Check your connection and try again.";
    } else if (!error.response) {
      error.userMessage =
        "Unable to reach the server. Check your internet connection.";
    } else if (error.response.status >= 500) {
      error.userMessage =
        "The server could not complete that request. Please try again.";
    }
    return Promise.reject(error);
  },
);

export default api;
