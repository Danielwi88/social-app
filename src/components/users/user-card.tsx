import { Link } from "react-router-dom";
import { AVATAR_FALLBACK_SRC, handleAvatarError } from "@/lib/avatar";
import type { PublicUser } from "../../types/user";
import { FollowButton } from "./follow-button";

export function UserCard({ u, profileKey }: { u: PublicUser; profileKey?: readonly unknown[] }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-zinc-900 p-3">
      <div className="flex items-center gap-3">
        <img
          src={u.avatarUrl || AVATAR_FALLBACK_SRC}
          alt={u.displayName}
          className="h-10 w-10 rounded-full object-cover"
          onError={handleAvatarError}
        />
        <div>
          <Link to={`/profile/${u.username}`} className="font-medium">
            {u.displayName}
          </Link>
          <div className="text-xs text-white/60">@{u.username}</div>
        </div>
      </div>
      <FollowButton
        username={u.username}
        queryKeyProfile={profileKey ?? (["profile", u.username] as const)}
        isFollowing={u.isFollowing}
        followersCount={u.followers}
        compact
      />
    </div>
  );
}
