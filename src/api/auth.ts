import { api } from "../lib/axios";

export type LoginReq = { email: string; password: string };
export type LoginRes = { token: string };

export type RegisterReq = {
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
};
export type RegisterRes = { token: string };

export async function login(req: LoginReq) {
  const { data } = await api.post<LoginRes>("/auth/login", req);
  return data; // Returns { token: string }
}

export async function register(req: RegisterReq) {
  const { data } = await api.post<RegisterRes>("/auth/register", req);
  return data;
}
