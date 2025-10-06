import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import postReactionsReducer from "./features/posts/postReactionsSlice";
import followStatusReducer from "./features/users/followStatusSlice";
import { type TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

export const store = configureStore({
  reducer: {
    auth: authReducer, //user auth state
    postReactions: postReactionsReducer, //like/save optimistic updates
    followStatus: followStatusReducer,//follow realtionships cache
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
