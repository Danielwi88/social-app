import type { UserMini } from "@/types/post";

export function getUserDisplayName(user?: Pick<UserMini, "username" | "displayName" | "name"> | null) {
  if (!user) return "Unknown";
  const display = typeof user.displayName === "string" ? user.displayName.trim() : "";
  const name = typeof user.name === "string" ? user.name.trim() : "";
  if (display) return display;
  if (name) return name;
  return user.username;
}
