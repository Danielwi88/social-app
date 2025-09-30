import { useMutation, useQueryClient } from "@tanstack/react-query";
import { follow, unfollow } from "../../api/users";
import type { PublicUser } from "../../types/user";

type Props = {
  username: string;
  queryKeyProfile: readonly unknown[]; // typically ["profile", username]
  isFollowing?: boolean;
  followersCount?: number;
  compact?: boolean;
};

export function FollowButton({
  username,
  queryKeyProfile,
  isFollowing,
  followersCount,
  compact,
}: Props) {
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: async () =>
      (isFollowing ? unfollow(username) : follow(username)),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: queryKeyProfile });
      const prev = qc.getQueryData<PublicUser>(queryKeyProfile);

      if (prev) {
        const delta = isFollowing ? -1 : 1;
        qc.setQueryData<PublicUser>(queryKeyProfile, {
          ...prev,
          isFollowing: !isFollowing,
          followers: Math.max(0, (prev.followers ?? 0) + delta),
        });
      }
      // also try to update any user lists currently in cache
      const patchList = (keyPrefix: string) => {
        const keys = qc
          .getQueryCache()
          .findAll({ queryKey: [keyPrefix] })
          .map((q) => q.queryKey);
        keys.forEach((key) => {
          const arr = qc.getQueryData<PublicUser[]>(key);
          if (!arr) return;
          qc.setQueryData(
            key,
            arr.map((u) =>
              u.username === username
                ? {
                    ...u,
                    isFollowing: !isFollowing,
                    followers: Math.max(0, (u.followers ?? 0) + (isFollowing ? -1 : 1)),
                  }
                : u
            )
          );
        });
      };
      patchList("followers");
      patchList("following");
      patchList("search-users");

      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeyProfile, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeyProfile });
    },
  });

  const label = isFollowing ? (compact ? "Following" : "Unfollow") : "Follow";
  const ariaLabel = typeof followersCount === "number"
    ? `${label} ${username}. ${followersCount} followers`
    : `${label} ${username}`;
  return (
    <button
      onClick={() => m.mutate()}
      className={`rounded-full px-3 py-1 text-sm ${
        isFollowing ? "bg-zinc-800 text-white" : "bg-violet-600 hover:bg-violet-500 text-white"
      } disabled:opacity-60`}
      disabled={m.isPending}
      aria-pressed={!!isFollowing}
      aria-label={ariaLabel}
    >
      {m.isPending ? "…" : label}
    </button>
  );
}
