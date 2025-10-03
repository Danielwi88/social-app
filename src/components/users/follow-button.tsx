import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { follow, unfollow } from "@/api/users";
import type { SearchUsersResult } from "@/api/users";
import type { PublicUser } from "@/types/user";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { selectFollowStatus, setFollowStatus } from "@/features/users/followStatusSlice";

type FollowButtonProps = {
  username: string;
  queryKeyProfile?: readonly unknown[];
  isFollowing?: boolean;
  followersCount?: number;
  compact?: boolean;
  className?: string;
  disabled?: boolean;
};

export function FollowButton({
  username,
  queryKeyProfile,
  isFollowing,
  followersCount,
  compact = false,
  className,
  disabled = false,
}: FollowButtonProps) {
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  const storedStatus = useAppSelector((state) => selectFollowStatus(state, username));

  const resolvedIsFollowing =
    typeof storedStatus === "boolean"
      ? storedStatus
      : typeof isFollowing === "boolean"
        ? isFollowing
        : false;

  useEffect(() => {
    if (typeof storedStatus === "boolean") return;
    if (typeof isFollowing === "boolean") {
      dispatch(setFollowStatus({ username, isFollowing }));
    }
  }, [dispatch, isFollowing, storedStatus, username]);

  const mutation = useMutation({
    mutationFn: async () => (resolvedIsFollowing ? unfollow(username) : follow(username)),
    onMutate: async () => {
      if (queryKeyProfile) {
        await qc.cancelQueries({ queryKey: queryKeyProfile });
      }

      const previous = resolvedIsFollowing;
      const delta = previous ? -1 : 1;

      dispatch(setFollowStatus({ username, isFollowing: !previous }));

      const prevProfile = queryKeyProfile ? qc.getQueryData(queryKeyProfile) : undefined;

      if (prevProfile && !Array.isArray(prevProfile)) {
        const profile = prevProfile as PublicUser;
        qc.setQueryData<PublicUser>(queryKeyProfile!, {
          ...profile,
          isFollowing: !previous,
          followers: Math.max(0, (profile.followers ?? 0) + delta),
        });
      }

      const patchList = (prefix: string) => {
        const queries = qc.getQueryCache().findAll({
          predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === prefix,
        });

        queries.forEach((query) => {
          const data = qc.getQueryData(query.queryKey);
          if (!data) return;

          if (Array.isArray(data)) {
            qc.setQueryData<PublicUser[]>(
              query.queryKey,
              data.map((user) =>
                user.username === username
                  ? {
                      ...user,
                      isFollowing: !previous,
                      followers: Math.max(0, (user.followers ?? 0) + delta),
                    }
                  : user
              )
            );
            return;
          }

          const maybeSearch = data as SearchUsersResult;
          if (Array.isArray(maybeSearch.users)) {
            qc.setQueryData<SearchUsersResult>(query.queryKey, {
              ...maybeSearch,
              users: maybeSearch.users.map((user) =>
                user.username === username
                  ? {
                      ...user,
                      isFollowing: !previous,
                      followers: Math.max(0, (user.followers ?? 0) + delta),
                    }
                  : user
              ),
            });
          }
        });
      };

      patchList("followers");
      patchList("following");
      patchList("search-users");
      patchList("my-followers");
      patchList("my-following");

      return { prevProfile, previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        dispatch(setFollowStatus({ username, isFollowing: context.previous }));
      }
      if (queryKeyProfile && context?.prevProfile) {
        qc.setQueryData(queryKeyProfile, context.prevProfile);
      }
      toast.error("Couldn’t update follow status", {
        description: "Please try again in a moment.",
      });
    },
    onSuccess: (_data, _variables, context) => {
      const previous = context?.previous ?? resolvedIsFollowing;
      const nowFollowing = !previous;
      dispatch(setFollowStatus({ username, isFollowing: nowFollowing }));
      toast.success(nowFollowing ? "Unfollowed" : "Followed", {
        description: nowFollowing
          ? `You’ve unfollowed @${username}.`
          : `You’re now following @${username}.`,
      });
    },
    onSettled: () => {
      if (queryKeyProfile) {
        qc.invalidateQueries({ queryKey: queryKeyProfile });
      }
    },
  });

  const label = resolvedIsFollowing ? "Following" : "Follow";
  const ariaLabel = typeof followersCount === "number"
    ? `${label} ${username}. ${followersCount} followers`
    : `${label} ${username}`;

  const buttonClasses = cn(
    "flex items-center justify-center gap-2 rounded-full font-semibold text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 disabled:cursor-not-allowed disabled:opacity-60",
    compact
      ? "h-9 border border-white/20 bg-white/[0.08] px-4 text-xs hover:bg-white/[0.16]"
      : resolvedIsFollowing
        ? "h-11 border border-white/15 bg-white/[0.05] px-7 text-white hover:bg-white/[0.12]"
        : "h-11 bg-violet-600 px-8 text-white hover:bg-violet-500",
    className
  );

  const showIcon = !compact;
  const Icon = resolvedIsFollowing ? Check : Plus;

  return (
    <button
      type="button"
      onClick={() => {
        if (disabled) return;
        mutation.mutate();
      }}
      className={buttonClasses}
      disabled={disabled || mutation.isPending}
      aria-pressed={resolvedIsFollowing}
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
