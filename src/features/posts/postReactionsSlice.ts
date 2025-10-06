import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
//Optimistic updates for likes/saves before server confirmation
export type PostReaction = {
  liked: boolean;
  likeCount: number;
};
// Store post reactions by post ID for instant UI feedback
type PostReactionsState = {
  entities: Record<string, PostReaction>;
};

const initialState: PostReactionsState = {
  entities: {},
};

const postReactionsSlice = createSlice({
  name: "postReactions",
  initialState,
  reducers: {
    setReaction: (state, action: PayloadAction<{ id: string; reaction: PostReaction }>) => {
      state.entities[action.payload.id] = action.payload.reaction;
    },
    clearReaction: (state, action: PayloadAction<string>) => {
      delete state.entities[action.payload];
    },
  },
});

export const { setReaction, clearReaction } = postReactionsSlice.actions;

export const selectPostReaction = (state: RootState, postId: string) =>
  state.postReactions.entities[postId];

export default postReactionsSlice.reducer;
