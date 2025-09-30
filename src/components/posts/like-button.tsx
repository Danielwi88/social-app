import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import type { FeedPage, Post } from "../../types/post";
import { likePost, unlikePost } from "../../api/posts";

type FeedData = InfiniteData<FeedPage>;

export function LikeButton({ post }: { post: Post }) {
  const qc = useQueryClient();
  const keyFeed = ["feed"] as const;
  const keyPost = ["post", post.id] as const;

  const mutate = useMutation<{ ok: true }, unknown, void, { prevFeed: FeedData | undefined; prevPost: Post | undefined }>({
    mutationFn: async () => (post.liked ? unlikePost(post.id) : likePost(post.id)),
    onMutate: async () => {
      await Promise.all([qc.cancelQueries({ queryKey: keyFeed }), qc.cancelQueries({ queryKey: keyPost })]);
      const prevFeed = qc.getQueryData<FeedData>(keyFeed);
      const prevPost = qc.getQueryData<Post | undefined>(keyPost);

      const toggle = (p: Post) => ({
        ...p,
        liked: !p.liked,
        likeCount: p.likeCount + (p.liked ? -1 : 1),
      });

      qc.setQueryData<FeedData>(keyFeed, (data) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((pg) => ({
            ...pg,
            items: pg.items.map((it: Post) => (it.id === post.id ? toggle(it) : it)),
          })),
        };
      });

      qc.setQueryData<Post | undefined>(keyPost, (it) => (it && it.id === post.id ? toggle(it) : it));

      return { prevFeed, prevPost };
    },
    onError: (_e, _v, ctx) => {
      if (!ctx) return;
      if (ctx.prevFeed) qc.setQueryData(keyFeed, ctx.prevFeed);
      if (ctx.prevPost) qc.setQueryData(keyPost, ctx.prevPost);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keyFeed });
      qc.invalidateQueries({ queryKey: keyPost });
    },
  });

  return (
    <button
      onClick={() => mutate.mutate()}
      className={`text-sm select-none ${post.liked ? "text-pink-400" : "text-white/80"}`}
      aria-pressed={post.liked}
    >
      ❤ {post.likeCount}
    </button>
  );
}
