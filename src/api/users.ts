import { api } from "../lib/axios";
import type { Post } from "../types/post";
import type { PublicUser } from "../types/user";

/** Public data */
export async function getPublicUser(username: string) {
  const { data } = await api.get(`/users/${username}`);
  return data as PublicUser;
}
export async function getUserPosts(username: string) {
  const { data } = await api.get(`/users/${username}/posts`);
  return data as Post[];
}
export async function getUserLikes(username: string) {
  const { data } = await api.get(`/users/${username}/likes`);
  return data as Post[];
}
export async function searchUsers(q: string) {
  const { data } = await api.get(`/users/search`, { params: { q } });
  return data as PublicUser[];
}

/** Follow graph */
export async function follow(username: string) {
  const { data } = await api.post(`/follow/${username}`);
  return data as { ok: true };
}
export async function unfollow(username: string) {
  const { data } = await api.delete(`/follow/${username}`);
  return data as { ok: true };
}

/** Followers/Following (public & mine) */
export async function getFollowers(username: string) {
  const { data } = await api.get(`/users/${username}/followers`);
  return data as PublicUser[];
}
export async function getFollowing(username: string) {
  const { data } = await api.get(`/users/${username}/following`);
  return data as PublicUser[];
}
export async function getMyFollowers() {
  const { data } = await api.get(`/me/followers`);
  return data as PublicUser[];
}
export async function getMyFollowing() {
  const { data } = await api.get(`/me/following`);
  return data as PublicUser[];
}