import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { clearToken, setToken as persistToken } from "../../lib/storage";

export type AuthUser = { id: string; username: string; displayName: string; avatarUrl?: string };
export type AuthState = { token: string | null; user: AuthUser | null };

const initialState: AuthState = {
  token: localStorage.getItem("sociality.token"),
  user: null,
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user?: AuthUser | null }>) {
      state.token = action.payload.token;
      persistToken(action.payload.token);
      if (Object.prototype.hasOwnProperty.call(action.payload, "user")) {
        state.user = action.payload.user ?? null;
      }
    },
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
    },
    clearAuth(state) {
      state.token = null;
      state.user = null;
      clearToken();
    },
  },
});

export const { setCredentials, setUser, clearAuth } = slice.actions;
export const selectAuth = (s: { auth: AuthState }) => s.auth;
export default slice.reducer;
