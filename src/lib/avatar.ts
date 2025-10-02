import type { SyntheticEvent } from "react";

export const AVATAR_FALLBACK_SRC = "/avatarfall.svg";

export function handleAvatarError(event: SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === "true") return;
  img.dataset.fallbackApplied = "true";
  img.src = AVATAR_FALLBACK_SRC;
}
