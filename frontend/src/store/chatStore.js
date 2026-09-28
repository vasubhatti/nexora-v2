import { create } from "zustand";
import api from "../api/axios.js";

const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  loading: false,
  sending: false,

  // Fetch all conversations
  fetchConversations: async () => {
    try {
      const { data } = await api.get("/chat/conversations");
      set({ conversations: data.data });
    } catch {}
  },

  // Load a conversation with messages
  loadConversation: async (id) => {
    set({ loading: true, messages: [] });
    try {
      const { data } = await api.get(`/chat/conversations/${id}`);
      set({
        activeConversation: data.data.conversation,
        messages: data.data.messages,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  // Create new conversation
  createConversation: async () => {
    try {
      const { data } = await api.post("/chat/conversations");
      const conv = data.data;
      set((s) => ({
        conversations: [conv, ...s.conversations],
        activeConversation: conv,
        messages: [],
      }));
      return conv;
    } catch {}
  },

  // Send message
  sendMessage: async (payload) => {
  set({ sending: true });
  try {
    const { data } = await api.post("/chat/message", payload, {
      headers: payload instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : {},
    });

    const { userMessage, assistantMessage } = data.data;

    set((s) => ({
      messages: [
        ...s.messages.filter((m) => !String(m._id).startsWith("temp-") && !String(m._id).startsWith("img-placeholder-")),
        userMessage,
        assistantMessage,
      ],
      sending: false,
    }));

    // Update conversation in sidebar list
    set((s) => {
      const conv = s.conversations.find(c => c._id === s.activeConversation?._id);
      const isFirstMessage = !conv?.messageCount || conv.messageCount === 0;

      return {
        conversations: s.conversations.map((c) =>
          c._id === s.activeConversation?._id
            ? {
                ...c,
                // Update title from first message
                title: isFirstMessage
                  ? (userMessage.content?.slice(0, 50) || c.title)
                  : c.title,
                lastMessage: assistantMessage.content?.substring(0, 100),
                messageCount: (c.messageCount || 0) + 2,
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
        // Also update activeConversation title
        activeConversation: s.activeConversation?._id
          ? {
              ...s.activeConversation,
              title: isFirstMessage
                ? (userMessage.content?.slice(0, 50) || s.activeConversation.title)
                : s.activeConversation.title,
            }
          : s.activeConversation,
      };
    });

    return data.data;
  } catch (err) {
    set({ sending: false });
    throw err;
  }
},
  // Add optimistic user message
  addOptimisticMessage: (message) => {
    set((s) => ({ messages: [...s.messages, message] }));
  },

  // Remove last message (on error)
  removeLastMessage: () => {
    set((s) => ({ messages: s.messages.slice(0, -1) }));
  },

  // Delete conversation
  deleteConversation: async (id) => {
    try {
      await api.delete(`/chat/conversations/${id}`);
      set((s) => {
        const conversations = s.conversations.filter((c) => c._id !== id);
        const activeConversation =
          s.activeConversation?._id === id ? null : s.activeConversation;
        const messages = activeConversation ? s.messages : [];
        return { conversations, activeConversation, messages };
      });
    } catch {}
  },

  // Rename conversation
  renameConversation: async (id, title) => {
    try {
      await api.patch(`/chat/conversations/${id}/rename`, { title });
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c._id === id ? { ...c, title } : c
        ),
        activeConversation:
          s.activeConversation?._id === id
            ? { ...s.activeConversation, title }
            : s.activeConversation,
      }));
    } catch {}
  },

  setActiveConversation: (conv) => set({ activeConversation: conv }),
  clearChat: () => set({ activeConversation: null, messages: [] }),
}));

export default useChatStore;