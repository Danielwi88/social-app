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

type FollowUserRaw = {
  id?: number | string | null;
  username?: string | null;
  name?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  profilePicture?: string | null;
  imageUrl?: string | null;
  counts?: {
    post?: number | null;
    posts?: number | null;
    followers?: number | null;
    following?: number | null;
    likes?: number | null;
  } | null;
  posts?: number | null;
  followers?: number | null;
  following?: number | null;
  likes?: number | null;
  isFollowedByMe?: boolean | null;
  isFollowing?: boolean | null;
  isMe?: boolean | null;
};

type FollowUsersEnvelopeRaw = {
  users?: FollowUserRaw[];
  items?: FollowUserRaw[];
  followers?: FollowUserRaw[];
  following?: FollowUserRaw[];
  data?: {
    users?: FollowUserRaw[];
    items?: FollowUserRaw[];
    followers?: FollowUserRaw[];
    following?: FollowUserRaw[];
  } | null;
};

const sanitizeAvatar = (url?: string | null) => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^https?:\/\//i, "").replace(/^\/+/, "")}`;
};

const toNumberOrZero = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const extractFollowUsers = (envelope: FollowUsersEnvelopeRaw | undefined): FollowUserRaw[] => {
  if (!envelope) return [];
  const sources: Array<FollowUserRaw[] | undefined> = [
    envelope.users,
    envelope.items,
    envelope.followers,
    envelope.following,
    envelope.data?.users,
    envelope.data?.items,
    envelope.data?.followers,
    envelope.data?.following,
  ];

  for (const source of sources) {
    if (Array.isArray(source) && source.length > 0) return source;
  }

  return [];
};

const mapFollowUsers = (
  payload: unknown,
  options: { defaultIsFollowing?: boolean } = {}
): PublicUser[] => {
  const envelope = (payload ?? undefined) as FollowUsersEnvelopeRaw | undefined;
  const list = extractFollowUsers(envelope);

  return list.map((user) => {
    const id = user?.id !== undefined && user?.id !== null ? String(user.id) : "";
    const username = user?.username?.trim() ?? "";
    const displayName = user?.displayName?.trim() || user?.name?.trim() || username;

    const counts = user?.counts ?? null;
    const posts = toNumberOrZero(
      user?.posts ?? counts?.post ?? counts?.posts
    );
    const followers = toNumberOrZero(
      user?.followers ?? counts?.followers
    );
    const following = toNumberOrZero(
      user?.following ?? counts?.following
    );
    const likes = toNumberOrZero(user?.likes ?? counts?.likes);

    const resolvedFollowing =
      user?.isFollowing ?? user?.isFollowedByMe ?? options.defaultIsFollowing;

    return {
      id,
      username,
      displayName,
      name: user?.name ?? null,
      avatarUrl:
        sanitizeAvatar(user?.avatarUrl ?? user?.profilePicture ?? user?.imageUrl) ?? null,
      posts,
      followers,
      following,
      likes,
      isFollowing:
        typeof resolvedFollowing === "boolean" ? resolvedFollowing : undefined,
      isMe: typeof user?.isMe === "boolean" ? user.isMe : undefined,
    } satisfies PublicUser;
  });
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
    const { data } = await api.get(`/users/${username}/followers`, {
      params: { page: 1, limit: 20 },
    });
    return mapFollowUsers(data);
  } catch {
    return [];
  }
}

export async function getUserFollowing(username: string) {
  try {
    const { data } = await api.get(`/users/${username}/following`, {
      params: { page: 1, limit: 20 },
    });
    return mapFollowUsers(data);
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
    const { data } = await api.get(`/me/followers`, {
      params: { page: 1, limit: 20 },
    });
    return mapFollowUsers(data, { defaultIsFollowing: false });
  } catch {
    return [];
  }
}
export async function getMyFollowing() {
  try {
    const { data } = await api.get(`/me/following`, {
      params: { page: 1, limit: 20 },
    });
    return mapFollowUsers(data, { defaultIsFollowing: true });
  } catch {
    return [];
  }
}
