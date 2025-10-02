import { api } from "../lib/axios";
import type { Post } from "../types/post";
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
  if (payload.avatar instanceof File) formData.append("avatar", payload.avatar);

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

export async function getMySaved() {
  const { data } = await api.get("/me/saved");
  return data as Post[];
}

export async function getMyLikes() {
  const { data } = await api.get("/me/likes");
  return data as Post[];
}
