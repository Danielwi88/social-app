import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { follow, unfollow } from "@/api/users";
import type { PublicUser } from "@/types/user";
import { cn } from "@/lib/utils";

type FollowButtonProps = {
  username: string;
  queryKeyProfile: readonly unknown[];
  isFollowing?: boolean;
  followersCount?: number;
  compact?: boolean;
  className?: string;
};

export function FollowButton({
  username,
  queryKeyProfile,
  isFollowing,
  followersCount,
  compact = false,
  className,
}: FollowButtonProps) {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => (isFollowing ? unfollow(username) : follow(username)),
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

      const patchList = (prefix: string) => {
        const queries = qc.getQueryCache().findAll({ queryKey: [prefix] });
        queries.forEach((query) => {
          const list = qc.getQueryData<PublicUser[]>(query.queryKey);
          if (!list) return;
          qc.setQueryData<PublicUser[]>(
            query.queryKey,
            list.map((user) =>
              user.username === username
                ? {
                    ...user,
                    isFollowing: !isFollowing,
                    followers: Math.max(0, (user.followers ?? 0) + (isFollowing ? -1 : 1)),
                  }
                : user
            )
          );
        });
      };

      patchList("followers");
      patchList("following");
      patchList("search-users");

      return { prev };
    },
    onError: (_error, _variables, context) => {
      if (context?.prev) qc.setQueryData(queryKeyProfile, context.prev);
      toast.error("Couldn’t update follow status", {
        description: "Please try again in a moment.",
      });
    },
    onSuccess: () => {
      toast.success(isFollowing ? "Unfollowed" : "Following", {
        description: isFollowing
          ? `You’ll stop seeing updates from @${username}.`
          : `You’ll start seeing updates from @${username}.`,
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeyProfile });
    },
  });

  const label = isFollowing ? "Following" : "Follow";
  const ariaLabel = typeof followersCount === "number"
    ? `${label} ${username}. ${followersCount} followers`
    : `${label} ${username}`;

  const buttonClasses = cn(
    "flex items-center justify-center gap-2 rounded-full font-semibold text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 disabled:cursor-not-allowed disabled:opacity-60",
    compact
      ? "h-9 border border-white/20 bg-white/[0.08] px-4 text-xs hover:bg-white/[0.16]"
      : isFollowing
        ? "h-11 border border-white/15 bg-white/[0.05] px-7 text-white hover:bg-white/[0.12]"
        : "h-11 bg-violet-600 px-8 text-white hover:bg-violet-500",
    className
  );

  const showIcon = !compact;
  const Icon = isFollowing ? Check : Plus;

  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      className={buttonClasses}
      disabled={mutation.isPending}
      aria-pressed={!!isFollowing}
      aria-label={ariaLabel}
    >
      {mutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        showIcon && <Icon className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{label}</span>
      {mutation.isPending && <span className="sr-only">Updating follow status…</span>}
    </button>
  );
}
