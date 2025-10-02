export type PublicUser = {
  id: string;
  username: string;
  displayName: string;
  name?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  followers: number;
  following: number;
  posts: number;
  likes: number;
  isFollowing?: boolean;
  isMe?: boolean;
};
