import { useInfiniteQuery, useMutation, useQueryClient } from "@/hooks/react-query";
import { useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";
import { getPostLikes, type LikesResponse } from "@/api/likes";
import { followUser, unfollowUser } from "@/api/follow";
import { getPublicUser, getUserFollowers } from "@/api/users";
import { AVATAR_FALLBACK_SRC, handleAvatarError } from "@/lib/avatar";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store";
import { selectAuth } from "@/features/auth/authSlice";
import {
  selectFollowStatusMap,
  setFollowStatus,
  setFollowStatuses,
} from "@/features/users/followStatusSlice";

interface LikesModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function LikesModal({ postId, isOpen, onClose }: LikesModalProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const fetchedRef = useRef(new Set<string>());
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user: authUser } = useAppSelector(selectAuth);
  const authUserId = authUser ? String(authUser.id) : null;
  const authUsernameKey = authUser?.username?.trim().toLowerCase() ?? null;
  const followStatusMap = useAppSelector(selectFollowStatusMap);

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ["post-likes", postId],
    queryFn: ({ pageParam = 1 }) => getPostLikes(postId, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last) => 
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    enabled: isOpen,
  });

  useEffect(() => {
    if (!isOpen) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      fetchedRef.current.clear();
    }
  }, [isOpen]);

  const followMutation = useMutation({
    mutationFn: ({ username, isFollowing }: { username: string; isFollowing: boolean }) =>
      isFollowing ? unfollowUser(username) : followUser(username),
    onMutate: async ({ username, isFollowing }) => {
      dispatch(setFollowStatus({ username, isFollowing: !isFollowing }));
    },
    onSuccess: (_, { username, isFollowing }) => {
      queryClient.setQueryData(["post-likes", postId], (old: { pages: LikesResponse[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            users: page.users.map((user) => 
              user.username === username 
                ? { ...user, isFollowing: !isFollowing }
                : user
            )
          }))
        };
      });
      dispatch(setFollowStatus({ username, isFollowing: !isFollowing }));
      toast.success(isFollowing ? "Unfollowed successfully" : "Following successfully");
    },
    onError: (_err, { username, isFollowing }) => {
      dispatch(setFollowStatus({ username, isFollowing }));
      toast.error("Failed to update follow status");
    },
  });

  const users = useMemo(() => data?.pages.flatMap((page) => page.users) ?? [], [data]);

  useEffect(() => {
    if (!isOpen || users.length === 0) return;
    const updates: Array<{ username: string; isFollowing: boolean }> = [];
    users.forEach((user) => {
      if (typeof user.isFollowing !== "boolean") return;
      const key = user.username.trim().toLowerCase();
      const entry = followStatusMap[key];
      if (entry) return;
      updates.push({ username: user.username, isFollowing: user.isFollowing });
    });
    if (updates.length) {
      dispatch(setFollowStatuses(updates));
    }
  }, [users, followStatusMap, dispatch, isOpen]);

  useEffect(() => {
    if (!isOpen || users.length === 0 || !authUserId) return;

    const pending: string[] = [];

    users.forEach((user) => {
      const key = user.username.trim().toLowerCase();
      const entry = followStatusMap[key];
      const alreadyKnown = entry !== undefined;
      const provided = typeof user.isFollowing === "boolean";
      if (alreadyKnown || provided || fetchedRef.current.has(key)) return;

      fetchedRef.current.add(key);
      pending.push(user.username);
    });

    if (!pending.length) return;

    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled(
        pending.map(async (username) => {
          try {
            const profile = await getPublicUser(username);
            if (typeof profile.isFollowing === "boolean") {
              return { username, isFollowing: profile.isFollowing };
            }

            const followers = await getUserFollowers(username);
            const matches = followers.some((follower) => {
              if (!follower) return false;
              const followerId = follower.id ? String(follower.id) : "";
              if (followerId && followerId === authUserId) return true;
              const followerUsername = follower.username?.trim().toLowerCase() ?? "";
              return authUsernameKey !== null && followerUsername === authUsernameKey;
            });

            return { username, isFollowing: matches };
          } catch {
            return null;
          }
          return null;
        })
      );

      if (cancelled) return;

      const updates = results.reduce<Array<{ username: string; isFollowing: boolean }>>(
        (acc, result) => {
          if (result.status === "fulfilled" && result.value) {
            acc.push(result.value);
          }
          return acc;
        },
        []
      );

      if (updates.length) {
        dispatch(setFollowStatuses(updates));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [users, authUserId, authUsernameKey, followStatusMap, dispatch, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-end ">

      <button
            onClick={onClose}
            className="hover:scale-105"
          >
            <X className="h-6 w-6 text-neutral-25 cursor-pointer mr-4 hover:font-bold hover:text-primary-200 transition-colors" />
          </button>
      <div className="relative w-full max-w-[548px] mx-4 bg-neutral-950 rounded-2xl border border-white/10 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Likes</h2>
          
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {users.length === 0 ? (
            <p className="text-center text-white/60 py-8">No likes yet</p>
          ) : (
            <div className="p-4 space-y-3">
              {users.map((user) => {
                const userId = String(user.id);
                const isSelf = authUserId !== null && authUserId === userId;
                const key = user.username.trim().toLowerCase();
                const storedEntry = followStatusMap[key];
                const resolvedFollowing = storedEntry?.isFollowing ?? (typeof user.isFollowing === "boolean" ? user.isFollowing : false);
                const commonDisabled = isSelf || followMutation.isPending;

                return (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl || AVATAR_FALLBACK_SRC}
                        alt={user.displayName}
                        className="h-10 w-10 rounded-full object-cover"
                        onError={handleAvatarError}
                      />
                      <div>
                        <p className="font-medium text-white">{user.displayName}</p>
                        <p className="text-sm text-white/60">@{user.username}</p>
                      </div>
                    </div>

                    {resolvedFollowing ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (isSelf) return;
                          followMutation.mutate({ username: user.username, isFollowing: true });
                        }}
                        disabled={commonDisabled}
                        aria-disabled={commonDisabled}
                        className="px-4 py-1.5 text-sm border border-white/20 rounded-full text-white/70 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSelf ? "You" : "Following"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (isSelf) return;
                          followMutation.mutate({ username: user.username, isFollowing: false });
                        }}
                        disabled={commonDisabled}
                        aria-disabled={commonDisabled}
                        className="px-4 py-1.5 text-sm bg-violet-600 rounded-full text-white hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSelf ? "You" : "Follow"}
                      </button>
                    )}
                  </div>
                );
              })}
              <div ref={sentinelRef} className="h-4" />
              {isFetchingNextPage && (
                <p className="text-center text-white/60 py-4">Loading more...</p>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
