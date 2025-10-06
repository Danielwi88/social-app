import { createSlice, type Draft, type PayloadAction } from "@reduxjs/toolkit";
import { clearToken, setToken as persistToken } from "../../lib/storage";

const normalizeAvatar = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export type AuthUser = { id: string; username: string; displayName: string; avatarUrl?: string };
export type AuthState = { token: string | null; user: AuthUser | null; avatarVersion: number };

const initialState: AuthState = {
  token: localStorage.getItem("sociality.token"),
  user: null,
  avatarVersion: 0,
};
// Increment avatarVersion when avatar changes (for cache busting)
const applyUserUpdate = (state: Draft<AuthState>, incoming: AuthUser | null) => {
  const prevUser = state.user;

  if (!incoming) {
    state.user = null;
    return;
  }

  const trimmedUsername = incoming.username.trim();
  const trimmedDisplayName = incoming.displayName.trim();
  const nextUsername = trimmedUsername || prevUser?.username || "";
  const nextDisplayName = trimmedDisplayName || prevUser?.displayName || nextUsername;
  const prevAvatar = normalizeAvatar(prevUser?.avatarUrl);
  const nextAvatar = normalizeAvatar(incoming.avatarUrl) ?? prevAvatar;

  if (
    prevUser &&
    prevUser.id === incoming.id &&
    prevUser.username === nextUsername &&
    prevUser.displayName === nextDisplayName &&
    prevAvatar === nextAvatar
  ) {
    return;
  }

  if (prevAvatar !== nextAvatar) {
    state.avatarVersion += 1;
  }

  state.user = {
    id: incoming.id,
    username: nextUsername,
    displayName: nextDisplayName,
    avatarUrl: nextAvatar,
  };
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user?: AuthUser | null }>) {
      state.token = action.payload.token;
      persistToken(action.payload.token);
      if (Object.prototype.hasOwnProperty.call(action.payload, "user")) {
        applyUserUpdate(state, action.payload.user ?? null);
      }
    },
    setUser(state, action: PayloadAction<AuthUser | null>) {
      applyUserUpdate(state, action.payload);
    },
    clearAuth(state) {
      state.token = null;
      state.user = null;
      state.avatarVersion = 0;
      clearToken();
    },
  },
});
//setUser: Update user profile information, clearAuth: Logout, clear all auth data
export const { setCredentials, setUser, clearAuth } = slice.actions;//Store token + user data, persist to localStorage
export const selectAuth = (s: { auth: AuthState }) => s.auth;
export default slice.reducer;
