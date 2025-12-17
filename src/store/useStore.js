import { create } from "zustand";
import api from "../lib/api";
import { generateKeys } from "../lib/encryption";

export const useStore = create((set) => ({
  user: null,
  posts: [],
  page: 1,
  hasMore: true,
  loading: false,
  isCheckingAuth: true,
  setUser: (user) => set({ user }),
  setPosts: (posts) => set({ posts }),
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed", err);
    }
    localStorage.removeItem("token");
    set({ user: null, posts: [], page: 1, hasMore: true });
    window.location.href = "/login";
  },
  loadPosts: async (page = 1, mood = "neutral", type = "foryou") => {
    set({ loading: true });
    try {
      const moodQuery = mood !== "neutral" ? `&mood=${mood}` : "";
      const typeQuery = `&type=${type}`;
      const res = await api.get(`/posts/feed?page=${page}${moodQuery}${typeQuery}`);
      const newPosts = res.data.posts || [];
      set((state) => ({
        posts: page === 1 ? newPosts : [...state.posts, ...newPosts],
        page,
        hasMore: res.data.hasMore,
        loading: false,
      }));
    } catch (err) {
      console.error("Failed to load posts:", err);
      set({ loading: false });
    }
  },
  likePost: async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/like`);
      set((state) => ({
        posts: state.posts.map((p) => (p._id === postId ? res.data : p)),
      }));
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  },
  toggleSave: async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/save`);
      set((state) => ({
        user: { ...state.user, savedPosts: res.data },
      }));
    } catch (err) {
      console.error("Failed to save post:", err);
    }
  },
  deletePost: async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      set((state) => ({
        posts: state.posts.filter((p) => p._id !== postId),
      }));
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  },
  updatePost: async (postId, updatedData) => {
    try {
      const res = await api.put(`/posts/${postId}`, updatedData);
      set((state) => ({
        posts: state.posts.map((p) => (p._id === postId ? res.data : p)),
      }));
    } catch (err) {
      console.error("Failed to update post:", err);
    }
  },
  repostPost: async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/repost`);
      const { post, isReposted } = res.data;

      set((state) => {
        // If it was a new repost, add it to the top of the feed
        if (isReposted) {
          return { posts: [post, ...state.posts] };
        }
        // If it was an undo (repost removed), remove it from feed
        // Note: This logic assumes the feed shows reposts as separate items
        // If you just want to update the repost count on the original post, logic differs.
        // For now, let's assume we just refresh the feed or handle it simply.
        return { posts: state.posts.filter(p => p._id !== postId) };
      });

      // Ideally, we should also update the original post's repost count in the feed if it's visible
      // But for now, let's stick to adding/removing the repost item itself.

    } catch (err) {
      console.error("Failed to repost:", err);
    }
  },
  addComment: async (postId, text, audio) => {
    try {
      const res = await api.post(`/posts/${postId}/comment`, { text, audio });
      set((state) => ({
        posts: state.posts.map((p) => (p._id === postId ? res.data : p)),
      }));
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  },
  replyToComment: async (postId, commentId, text) => {
    try {
      const res = await api.post(`/posts/${postId}/comment/${commentId}/reply`, {
        text,
      });
      set((state) => ({
        posts: state.posts.map((p) => (p._id === postId ? res.data : p)),
      }));
    } catch (err) {
      console.error("Failed to reply to comment:", err);
    }
  },
  followUser: async (userId) => {
    try {
      await api.put(`/users/${userId}/follow`);
      set((state) => ({
        user: {
          ...state.user,
          following: [...(state.user.following || []), userId],
        },
      }));
    } catch (err) {
      console.error("Failed to follow user:", err);
    }
  },
  unfollowUser: async (userId) => {
    try {
      await api.put(`/users/${userId}/unfollow`);
      set((state) => ({
        user: {
          ...state.user,
          following: state.user.following.filter((id) => id !== userId),
        },
      }));
    } catch (err) {
      console.error("Failed to unfollow user:", err);
    }
  },
  blockUser: async (userId) => {
    try {
      await api.put(`/users/${userId}/block`);
      set((state) => ({
        user: {
          ...state.user,
          blockedUsers: [...(state.user.blockedUsers || []), userId],
          following: state.user.following.filter((id) => id !== userId), // Auto unfollow
        },
        posts: state.posts.filter((p) => p.user._id !== userId), // Remove posts from feed
      }));
    } catch (err) {
      console.error("Failed to block user:", err);
    }
  },
  unblockUser: async (userId) => {
    try {
      await api.put(`/users/${userId}/unblock`);
      set((state) => ({
        user: {
          ...state.user,
          blockedUsers: state.user.blockedUsers.filter((id) => id !== userId),
        },
      }));
    } catch (err) {
      console.error("Failed to unblock user:", err);
    }
  },
  muteUser: async (userId) => {
    try {
      await api.put(`/users/${userId}/mute`);
      set((state) => ({
        user: {
          ...state.user,
          mutedUsers: [...(state.user.mutedUsers || []), userId],
        },
        posts: state.posts.filter((p) => p.user._id !== userId), // Remove posts from feed
      }));
    } catch (err) {
      console.error("Failed to mute user:", err);
    }
  },
  unmuteUser: async (userId) => {
    try {
      await api.put(`/users/${userId}/unmute`);
      set((state) => ({
        user: {
          ...state.user,
          mutedUsers: state.user.mutedUsers.filter((id) => id !== userId),
        },
      }));
    } catch (err) {
      console.error("Failed to unmute user:", err);
    }
  },
  checkAuth: async () => {
    set({ isCheckingAuth: true });
    // Check if checking a token is even necessary
    const token = localStorage.getItem("token");
    if (!token) {
      set({ user: null, isCheckingAuth: false });
      return;
    }

    try {
      // Race between api request and a 2-second timeout
      // This safeguards against server hanging or network issues keeping the app in "Loading" forever
      const authPromise = api.get("/auth/me");
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Auth timeout")), 30000)
      );

      const res = await Promise.race([authPromise, timeoutPromise]);
      let user = res.data;
      set({ user });
    } catch (err) {
      console.error("Auth check failed:", err);
      set({ user: null });
      localStorage.removeItem("token");
    } finally {
      set({ isCheckingAuth: false });
    }
  },
}));
