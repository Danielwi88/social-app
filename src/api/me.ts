import { api } from "../lib/axios";
import type { Post } from "../types/post";

export type MeResponse = {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  followers: number;
  following: number;
  posts: number;
  likes: number;
};

export async function getMe() {
  const { data } = await api.get("/me");
  return data as MeResponse;
}

export async function updateMe(payload: Partial<Pick<MeResponse, "displayName" | "bio" | "avatarUrl">>) {
  const { data } = await api.patch("/me", payload);
  return data as MeResponse;
}

export async function getMyPosts() {
  const { data } = await api.get("/me/posts");
  return data as Post[];
}

export async function getMySaved() {
  const { data } = await api.get("/me/saved");
  return data as Post[];
}

export async function getMyLikes() {
  const { data } = await api.get("/me/likes");
  return data as Post[];
}
