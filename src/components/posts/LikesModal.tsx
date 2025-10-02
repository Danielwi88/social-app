import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { getPostLikes, type LikesResponse } from "@/api/likes";
import { followUser, unfollowUser } from "@/api/follow";
import { AVATAR_FALLBACK_SRC, handleAvatarError } from "@/lib/avatar";
import { toast } from "sonner";

interface LikesModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function LikesModal({ postId, isOpen, onClose }: LikesModalProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ["post-likes", postId],
    queryFn: ({ pageParam = 1 }) => getPostLikes(postId, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last) => 
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    enabled: isOpen,
  });

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const followMutation = useMutation({
    mutationFn: ({ username, isFollowing }: { username: string; isFollowing: boolean }) => 
      isFollowing ? unfollowUser(username) : followUser(username),
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
      toast.success(isFollowing ? "Unfollowed successfully" : "Following successfully");
    },
    onError: () => {
      toast.error("Failed to update follow status");
    }
  });

  if (!isOpen) return null;

  const users = data?.pages.flatMap(page => page.users) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-zinc-900 rounded-2xl border border-white/10 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Likes</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5 text-white/70" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {users.length === 0 ? (
            <p className="text-center text-white/60 py-8">No likes yet</p>
          ) : (
            <div className="p-4 space-y-3">
              {users.map((user) => (
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
                  
                  {user.isFollowing ? (
                    <button 
                      onClick={() => followMutation.mutate({ username: user.username, isFollowing: true })}
                      disabled={followMutation.isPending}
                      className="px-4 py-1.5 text-sm border border-white/20 rounded-full text-white/70 hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      Following
                    </button>
                  ) : (
                    <button 
                      onClick={() => followMutation.mutate({ username: user.username, isFollowing: false })}
                      disabled={followMutation.isPending}
                      className="px-4 py-1.5 text-sm bg-violet-600 rounded-full text-white hover:bg-violet-700 transition-colors disabled:opacity-50"
                    >
                      Follow
                    </button>
                  )}
                </div>
              ))}
              <div ref={sentinelRef} className="h-4" />
              {isFetchingNextPage && (
                <p className="text-center text-white/60 py-4">Loading more...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}