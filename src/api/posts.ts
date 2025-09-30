import { api } from "../lib/axios";
import type { Post, Comment, FeedPage, CommentsPage } from "../types/post";

export async function getFeed(cursor?: string, limit = 12) {
  const { data } = await api.get("/feed", { params: { cursor, limit } });
  return data as FeedPage;
}

export async function getPost(id: string) {
  const { data } = await api.get(`/posts/${id}`);
  return data as Post;
}

export async function likePost(id: string) {
  const { data } = await api.post(`/posts/${id}/like`);
  return data as { ok: true };
}

export async function unlikePost(id: string) {
  const { data } = await api.delete(`/posts/${id}/like`);
  return data as { ok: true };
}

export async function savePost(id: string) {
  const { data } = await api.post(`/posts/${id}/save`);
  return data as { ok: true };
}

export async function unsavePost(id: string) {
  const { data } = await api.delete(`/posts/${id}/save`);
  return data as { ok: true };
}

export async function getComments(postId: string, cursor?: string, limit = 10) {
  const { data } = await api.get(`/posts/${postId}/comments`, { params: { cursor, limit } });
  return data as CommentsPage;
}

export async function addComment(postId: string, body: string) {
  const { data } = await api.post(`/posts/${postId}/comments`, { body });
  return data as Comment;
}

export async function deleteComment(id: string) {
  const { data } = await api.delete(`/comments/${id}`);
  return data as { ok: true };
}
