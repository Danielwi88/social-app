export type PublicUser = {
  id: string;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  followers: number;
  following: number;
  posts: number;
  likes?: number;
  isFollowing?: boolean; // whether current viewer follows them
};
