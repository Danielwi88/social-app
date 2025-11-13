import { api } from "../lib/axios";
import { compressImageFile } from "../lib/image";
import type { Post, UserMini } from "../types/post";
import { getFeed } from "./posts";

type MeProfileRaw = {
  id?: number | string;
  username?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
};

type MeStatsRaw = {
  posts?: number;
  followers?: number;
  following?: number;
  likes?: number;
};

type MeResponseRaw = {
  profile?: MeProfileRaw;
  stats?: MeStatsRaw;
};

export type MeResponse = {
  id: string;
  username: string;
  displayName: string;
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  followers: number;
  following: number;
  posts: number;
  likes: number;
};

function mapMeResponse(payload: MeResponseRaw): MeResponse {
  const profile = payload.profile ?? {};
  const stats = payload.stats ?? {};

  const username = profile.username?.trim() ?? "";
  const displayName = profile.name?.trim() || username;

  return {
    id: profile.id !== undefined && profile.id !== null ? String(profile.id) : "",
    username,
    displayName,
    name: profile.name ?? undefined,
    email: profile.email ?? undefined,
    phone: profile.phone ?? undefined,
    bio: profile.bio ?? undefined,
    avatarUrl: profile.avatarUrl ?? undefined,
    followers: stats.followers ?? 0,
    following: stats.following ?? 0,
    posts: stats.posts ?? 0,
    likes: stats.likes ?? 0,
  };
}

export async function getMe() {
  const { data } = await api.get("/me");
  return mapMeResponse(data as MeResponseRaw);
}

export type UpdateMePayload = {
  name?: string;
  username?: string;
  phone?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  avatar?: File | null;
};

export async function updateMe(payload: UpdateMePayload) {
  const formData = new FormData();

  if (payload.name !== undefined) formData.append("name", payload.name);
  if (payload.username !== undefined) formData.append("username", payload.username);
  if (payload.phone !== undefined) formData.append("phone", payload.phone);
  if (payload.bio !== undefined) formData.append("bio", payload.bio ?? "");
  if (payload.avatarUrl !== undefined) formData.append("avatarUrl", payload.avatarUrl ?? "");
  if (payload.avatar instanceof File) {
    const optimizedAvatar = await compressImageFile(payload.avatar, {
      maxSizeMB: 0.6,
      maxWidthOrHeight: 640,
    });
    formData.append("avatar", optimizedAvatar);
  }

  const { data } = await api.patch("/me", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return mapMeResponse(data as MeResponseRaw);
}

export async function getMyPosts(authorId: string, limit = 20) {
  if (!authorId) return [];

  const page = await getFeed("1", limit);
  return page.items.filter((post) => String(post.author?.id ?? "") === authorId);
}

type SavedEnvelopeRaw = {
  items?: unknown[];
  posts?: unknown[];
  data?: {
    items?: unknown[];
    posts?: unknown[];
  } | null;
};

type SavedPostRaw = {
  id?: number | string | null;
  postId?: number | string | null;
  imageUrl?: string | null;
  mediaUrl?: string | null;
  caption?: string | null;
  body?: string | null;
  createdAt?: string | null;
  likeCount?: number | null;
  likes?: number | null;
  commentCount?: number | null;
  comments?: number | null;
  liked?: boolean | null;
  likedByMe?: boolean | null;
  saved?: boolean | null;
  author?: SavedAuthorRaw | null;
  user?: SavedAuthorRaw | null;
};

type SavedAuthorRaw = {
  id?: number | string | null;
  username?: string | null;
  name?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  avatar?: string | null;
};

function mapSavedAuthor(raw?: SavedAuthorRaw | null): UserMini {
  const id = raw?.id !== undefined && raw?.id !== null ? String(raw.id) : "";
  const username = raw?.username?.trim() || "";
  return {
    id,
    username,
    displayName: raw?.displayName ?? raw?.name ?? raw?.username ?? null,
    name: raw?.name ?? null,
    avatarUrl: raw?.avatarUrl ?? raw?.avatar ?? null,
  };
}

function mapSavedPost(entry: unknown): Post | null {
  if (!entry || typeof entry !== "object") return null;
  const rawCandidate = (entry as { post?: SavedPostRaw | null }).post ?? (entry as SavedPostRaw);
  if (!rawCandidate || typeof rawCandidate !== "object") return null;

  const raw = rawCandidate as SavedPostRaw;
  const idCandidate = raw.id ?? raw.postId;
  if (idCandidate === undefined || idCandidate === null) return null;

  const authorRaw = raw.author ?? raw.user ?? null;
  const author = mapSavedAuthor(authorRaw ?? undefined);

  return {
    id: String(idCandidate),
    imageUrl: raw.imageUrl ?? raw.mediaUrl ?? "",
    caption: raw.caption ?? raw.body ?? "",
    createdAt: raw.createdAt ?? new Date().toISOString(),
    author,
    likeCount: raw.likeCount ?? raw.likes ?? 0,
    commentCount: raw.commentCount ?? raw.comments ?? 0,
    saved: true,
    liked: raw.liked ?? raw.likedByMe ?? undefined,
  };
}

export async function getMySaved(limit = 20) {
  const { data } = await api.get("/me/saved", { params: { page: 1, limit } });
  const envelope = (data ?? {}) as SavedEnvelopeRaw;
  const candidateArrays: unknown[][] = [
    Array.isArray(envelope.items) ? envelope.items : [],
    Array.isArray(envelope.posts) ? envelope.posts : [],
    Array.isArray(envelope.data?.items) ? envelope.data?.items ?? [] : [],
    Array.isArray(envelope.data?.posts) ? envelope.data?.posts ?? [] : [],
  ];

  const posts = candidateArrays
    .flat()
    .map((item) => mapSavedPost(item))
    .filter((post): post is Post => Boolean(post));

  const deduped = new Map(posts.map((post) => [post.id, post] as const));
  return Array.from(deduped.values());
}

export async function getMyLikes() {
  const { data } = await api.get("/me/likes");
  return data as Post[];
}
