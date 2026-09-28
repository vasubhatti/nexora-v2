import { create } from "zustand";
import api from "../api/axios.js";

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("user")) || null,
  isAuthenticated: !!localStorage.getItem("accessToken"),
  loading: false,
  error: null,

  register: async (name, email, password) => {
  set({ loading: true, error: null });
  try {
    const { data } = await api.post("/auth/register", { name, email, password });
    set({ loading: false });
    // Return requiresOTP flag — component handles OTP step
    return { success: true, requiresOTP: data.requiresOTP, email };
  } catch (err) {
    const message = err.response?.data?.message || "Registration failed";
    set({ error: message, loading: false });
    return { success: false, message };
  }
},

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  logout: async () => {
    try { await api.post("/auth/logout"); } catch (err) { console.error("Logout failed:", err); }
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;