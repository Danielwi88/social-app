import { api } from "@/lib/axios";
export const followUser = async (username: string): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.post(`/follow/${username}`);
  return data;
};

export const unfollowUser = async (username: string): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.delete(`/follow/${username}`);
  return data;
};