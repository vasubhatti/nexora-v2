import { create } from "zustand";
import api from "../api/axios.js";

const useCreditStore = create((set) => ({
  creditBalance: 0,
  creditsUsed: 0,
  creditsResetDate: null,
  subscription: "free",

  fetchBalance: async () => {
    try {
      const { data } = await api.get("/credits/balance");
      set({
        creditBalance: data.data.creditBalance,
        creditsUsed: data.data.creditsUsed,
        creditsResetDate: data.data.creditsResetDate,
        subscription: data.data.subscription,
      });
    } catch {}
  },

  deductLocal: (amount) =>
    set((s) => ({ creditBalance: Math.max(0, s.creditBalance - amount) })),
}));

export default useCreditStore;