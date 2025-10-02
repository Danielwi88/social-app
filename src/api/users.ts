import { api } from "../lib/axios";
import type { Post, UserMini } from "../types/post";
import type { PublicUser } from "../types/user";

type PublicUserRaw = {
  id?: number | string;
  name?: string | null;
  username?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  counts?: {
    post?: number;
    followers?: number;
    following?: number;
    likes?: number;
  };
  isFollowing?: boolean | null;
  isMe?: boolean | null;
};

type SearchUsersRaw = {
  users?: Array<{
    id?: number | string;
    username?: string | null;
    name?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
    isFollowedByMe?: boolean | null;
  }>;
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

export type SearchUsersResult = {
  users: PublicUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/** Public data */
export async function getPublicUser(username: string): Promise<PublicUser> {
  const { data } = await api.get(`/users/${username}`);
  const payload = data as PublicUserRaw;

  const id = payload.id !== undefined && payload.id !== null ? String(payload.id) : "";
  const normalizedUsername = payload.username?.trim() || username;
  const name = payload.name?.trim() ?? null;
  const counts = payload.counts ?? {};

  return {
    id,
    username: normalizedUsername,
    name,
    displayName: name || normalizedUsername,
    bio: payload.bio ?? null,
    avatarUrl: payload.avatarUrl ?? null,
    email: payload.email ?? null,
    phone: payload.phone ?? null,
    posts: counts.post ?? 0,
    followers: counts.followers ?? 0,
    following: counts.following ?? 0,
    likes: counts.likes ?? 0,
    isFollowing: payload.isFollowing ?? undefined,
    isMe: payload.isMe ?? undefined,
  } satisfies PublicUser;
}
type UserPostsEnvelopeRaw = {
  posts?: FeedPostRaw[];
  items?: FeedPostRaw[];
  data?: {
    posts?: FeedPostRaw[];
    items?: FeedPostRaw[];
  };
};

type FeedPostRaw = {
  id?: number | string;
  imageUrl?: string | null;
  caption?: string | null;
  createdAt?: string | null;
  author?: {
    id?: number | string;
    username?: string | null;
    name?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
  likeCount?: number | null;
  commentCount?: number | null;
  saved?: boolean | null;
  liked?: boolean | null;
  likedByMe?: boolean | null;
};

const normalizePostList = (payload: UserPostsEnvelopeRaw | undefined): FeedPostRaw[] => {
  if (!payload) return [];
  if (Array.isArray(payload.posts)) return payload.posts;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data?.posts)) return payload.data?.posts ?? [];
  if (Array.isArray(payload.data?.items)) return payload.data?.items ?? [];
  return [];
};

const toPost = (item: FeedPostRaw): Post => {
  const authorRaw = item.author ?? {};
  const author: UserMini = {
    id: authorRaw?.id !== undefined && authorRaw?.id !== null ? String(authorRaw.id) : "",
    username: authorRaw?.username?.trim() || "",
    displayName: authorRaw?.displayName ?? authorRaw?.name ?? authorRaw?.username ?? null,
    name: authorRaw?.name ?? null,
    avatarUrl: authorRaw?.avatarUrl ?? null,
  };

  return {
    id: item.id !== undefined && item.id !== null ? String(item.id) : "",
    imageUrl: item.imageUrl ?? "",
    caption: item.caption ?? "",
    createdAt: item.createdAt ?? new Date().toISOString(),
    author,
    likeCount: item.likeCount ?? 0,
    commentCount: item.commentCount ?? 0,
    saved: item.saved ?? undefined,
    liked: item.liked ?? item.likedByMe ?? undefined,
  };
};

export async function getUserPosts(username: string) {
  const { data } = await api.get(`/users/${username}/posts`);
  const payload = data as UserPostsEnvelopeRaw;
  return normalizePostList(payload).map(toPost);
}
export async function getUserLikes(username: string) {
  const { data } = await api.get(`/users/${username}/likes`);
  const payload = data as UserPostsEnvelopeRaw;
  return normalizePostList(payload).map(toPost);
}
export async function searchUsers(q: string, page = 1, limit = 20): Promise<SearchUsersResult> {
  const { data } = await api.get(`/users/search`, { params: { q, page, limit } });
  const payload = data as SearchUsersRaw;

  const rawUsers = Array.isArray(payload.users) ? payload.users : [];

  const users: PublicUser[] = rawUsers.map((user) => {
    const id = user?.id !== undefined && user?.id !== null ? String(user.id) : "";
    const username = user?.username?.trim() ?? "";
    const displayName =
      user?.displayName?.trim() || user?.name?.trim() || username;

    return {
      id,
      username,
      displayName,
      name: user?.name ?? null,
      avatarUrl: user?.avatarUrl ?? undefined,
      posts: 0,
      followers: 0,
      following: 0,
      likes: 0,
      isFollowing: user?.isFollowedByMe ?? undefined,
    } satisfies PublicUser;
  });

  const pagination = payload.pagination ?? {};

  return {
    users,
    pagination: {
      page: pagination.page ?? page,
      limit: pagination.limit ?? limit,
      total: pagination.total ?? users.length,
      totalPages: pagination.totalPages ?? 1,
    },
  };
}

/** Follow graph */
type FollowResponse = {
  following?: boolean;
};

export async function follow(username: string) {
  const { data } = await api.post<FollowResponse>(`/follow/${username}`);
  return data;
}
export async function unfollow(username: string) {
  const { data } = await api.delete<FollowResponse>(`/follow/${username}`);
  return data;
}

/** Followers/Following (public & mine) */
export async function getFollowers(username: string) {
  const { data } = await api.get(`/users/${username}/followers`);
  return data as PublicUser[];
}

export async function getUserFollowers(username: string) {
  try {
    const response = await api.get(`/users/${username}/followers?page=1&limit=20`);
    const users = response.data?.users || [];
    if (!Array.isArray(users)) return [];
    return users.map((user: { id: number; username: string; name: string; avatarUrl: string; isFollowedByMe: boolean }) => ({
      id: String(user.id),
      username: user.username,
      displayName: user.name || user.username,
      name: user.name,
      avatarUrl: user.avatarUrl?.includes('cdn.site.com') ? null : user.avatarUrl,
      posts: 0,
      followers: 0,
      following: 0,
      likes: 0,
      isFollowing: user.isFollowedByMe
    }));
  } catch {
    return [];
  }
}

export async function getUserFollowing(username: string) {
  try {
    const response = await api.get(`/users/${username}/following?page=1&limit=20`);
    const users = response.data?.users || [];
    if (!Array.isArray(users)) return [];
    return users.map((user: { id: number; username: string; name: string; avatarUrl: string; isFollowedByMe: boolean }) => ({
      id: String(user.id),
      username: user.username,
      displayName: user.name || user.username,
      name: user.name,
      avatarUrl: user.avatarUrl?.includes('cdn.site.com') ? null : user.avatarUrl,
      posts: 0,
      followers: 0,
      following: 0,
      likes: 0,
      isFollowing: user.isFollowedByMe
    }));
  } catch {
    return [];
  }
}
export async function getFollowing(username: string) {
  const { data } = await api.get(`/users/${username}/following`);
  return data as PublicUser[];
}
export async function getMyFollowers() {
  try {
    const response = await api.get(`/me/followers?page=1&limit=20`);
    console.log('Full API response:', response.data);
    const users = response.data?.users || [];
    console.log('Extracted users:', users);
    if (!Array.isArray(users)) {
      console.log('Users is not an array:', typeof users);
      return [];
    }
    const mapped = users.map((user: { id: number; username: string; name: string; avatarUrl: string; isFollowedByMe: boolean }) => ({
      id: String(user.id),
      username: user.username,
      displayName: user.name || user.username,
      name: user.name,
      avatarUrl: user.avatarUrl?.includes('cdn.site.com') ? null : user.avatarUrl,
      posts: 0,
      followers: 0,
      following: 0,
      likes: 0,
      isFollowing: user.isFollowedByMe
    }));
    console.log('Mapped users:', mapped);
    return mapped;
  } catch (error) {
    console.log('API error:', error);
    return [];
  }
}
export async function getMyFollowing() {
  try {
    const response = await api.get(`/me/following?page=1&limit=20`);
    const users = response.data?.users || [];
    if (!Array.isArray(users)) return [];
    return users.map((user: { id: number; username: string; name: string; avatarUrl: string; isFollowedByMe: boolean }) => ({
      id: String(user.id),
      username: user.username,
      displayName: user.name || user.username,
      name: user.name,
      avatarUrl: user.avatarUrl?.includes('cdn.site.com') ? null : user.avatarUrl,
      posts: 0,
      followers: 0,
      following: 0,
      likes: 0,
      isFollowing: user.isFollowedByMe
    }));
  } catch {
    return [];
  }
}
