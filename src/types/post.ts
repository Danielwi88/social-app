export type UserMini = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
};

export type Post = {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
  author: UserMini;
  likeCount: number;
  commentCount: number;
  saved?: boolean; // whether current user saved
  liked?: boolean; // whether current user liked
};

export type FeedPage = {
  items: Post[];
  nextCursor?: string | null;
};

export type Comment = {
  id: string;
  postId: string;
  body: string;
  author: UserMini;
  createdAt: string;
};

export type CommentsPage = {
  items: Comment[];
  nextCursor?: string | null;
};
