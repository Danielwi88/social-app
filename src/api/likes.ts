import { api } from "@/lib/axios";

export interface LikeUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isFollowing?: boolean;
}

export interface LikesResponse {
  users: LikeUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getPostLikes = async (postId: string, page = 1, limit = 20): Promise<LikesResponse> => {
  const { data } = await api.get(`/posts/${postId}/likes`, {
    params: { page, limit }
  });
  return data;
};