import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type FollowStatusEntry = {
  isFollowing: boolean;
  updatedAt: number;
};
//Cache follow relationships with timestamps
export type FollowStatusState = {
  map: Record<string, FollowStatusEntry>;
};

const initialState: FollowStatusState = {
  map: {},
};
// Normalize usernames and track follow status with timestamps
const normalizeKey = (username: string) => username.trim().toLowerCase();

const followStatusSlice = createSlice({
  name: "followStatus",
  initialState,
  reducers: {
    setFollowStatus: (
      state,
      action: PayloadAction<{ username: string; isFollowing: boolean }>
    ) => {
      const key = normalizeKey(action.payload.username);
      state.map[key] = {
        isFollowing: action.payload.isFollowing,
        updatedAt: Date.now(),
      };
    },
    setFollowStatuses: (
      state,
      action: PayloadAction<Array<{ username: string; isFollowing: boolean }>>
    ) => {
      const now = Date.now();
      action.payload.forEach(({ username, isFollowing }) => {
        const key = normalizeKey(username);
        state.map[key] = { isFollowing, updatedAt: now };
      });
    },
    clearFollowStatus(state, action: PayloadAction<string>) {
      const key = normalizeKey(action.payload);
      delete state.map[key];
    },
  },
});

export const { setFollowStatus, setFollowStatuses, clearFollowStatus } = followStatusSlice.actions;

export const selectFollowStatusMap = (state: { followStatus: FollowStatusState }) =>
  state.followStatus.map;

export const selectFollowStatus = (state: { followStatus: FollowStatusState }, username: string) =>
  state.followStatus.map[normalizeKey(username)]?.isFollowing;

export default followStatusSlice.reducer;
