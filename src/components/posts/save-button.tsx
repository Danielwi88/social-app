import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { toast } from "sonner";
import type { FeedPage, Post } from "../../types/post";
import { savePost, unsavePost } from "../../api/posts";
import { getMySaved } from "../../api/me";

type FeedData = InfiniteData<FeedPage>;

export function SaveButton({ post }: { post: Post }) {
  const qc = useQueryClient();
  const keyFeed = ["feed"] as const;
  const keyPost = ["post", post.id] as const;
  const keySaved = ["me", "saved"] as const;

  const savedQuery = useQuery({ queryKey: keySaved, queryFn: () => getMySaved(), staleTime: 60_000 });
  const savedLookup = savedQuery.data?.some((item) => item.id === post.id);

  const mutate = useMutation<{ saved?: boolean }, unknown, boolean, { prevFeed: FeedData | undefined; prevPost: Post | undefined; prevSavedList: Post[] | undefined; nextSaved: boolean }>({
    mutationFn: async (currentlySaved) => (currentlySaved ? unsavePost(post.id) : savePost(post.id)),
    onMutate: async (currentlySaved) => {
      await Promise.all([qc.cancelQueries({ queryKey: keyFeed }), qc.cancelQueries({ queryKey: keyPost })]);
      const prevFeed = qc.getQueryData<FeedData>(keyFeed);
      const prevPost = qc.getQueryData<Post | undefined>(keyPost);
      const prevSavedList = qc.getQueryData<Post[] | undefined>(keySaved);

      const nextSaved = !currentlySaved;
      const apply = (p: Post) => ({ ...p, saved: nextSaved });

      qc.setQueryData<FeedData>(keyFeed, (data) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((pg) => ({
            ...pg,
            items: pg.items.map((it: Post) => (it.id === post.id ? apply(it) : it)),
          })),
        };
      });

      qc.setQueryData<Post | undefined>(keyPost, (it) => (it && it.id === post.id ? apply(it) : it));

      if (prevSavedList) {
        const updated = nextSaved
          ? [...prevSavedList.filter((item) => item.id !== post.id), apply(post)]
          : prevSavedList.filter((item) => item.id !== post.id);
        qc.setQueryData<Post[]>(keySaved, updated);
      }

      return { prevFeed, prevPost, prevSavedList, nextSaved };
    },
    onSuccess: (data, previouslySaved, ctx) => {
      const resolvedSaved = data?.saved ?? ctx?.nextSaved ?? !previouslySaved;

      if (resolvedSaved !== ctx?.nextSaved) {
        const apply = (p: Post) => ({ ...p, saved: resolvedSaved });
        qc.setQueryData<FeedData>(keyFeed, (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: prev.pages.map((pg) => ({
              ...pg,
              items: pg.items.map((it: Post) => (it.id === post.id ? apply(it) : it)),
            })),
          };
        });
        qc.setQueryData<Post | undefined>(keyPost, (it) => (it && it.id === post.id ? apply(it) : it));
      }

      if (ctx?.prevSavedList) {
        const apply = (p: Post) => ({ ...p, saved: resolvedSaved });
        const nextSavedList = resolvedSaved
          ? [...ctx.prevSavedList.filter((item) => item.id !== post.id), apply(post)]
          : ctx.prevSavedList.filter((item) => item.id !== post.id);
        qc.setQueryData<Post[]>(keySaved, nextSavedList);
      }

      toast.success(resolvedSaved ? "Post saved to bookmarks" : "Post removed from saved");
    },
    onError: (_e, previouslySaved, ctx) => {
      if (ctx?.prevFeed) qc.setQueryData(keyFeed, ctx.prevFeed);
      if (ctx?.prevPost) qc.setQueryData(keyPost, ctx.prevPost);
      if (ctx?.prevSavedList) qc.setQueryData(keySaved, ctx.prevSavedList);
      toast.error(previouslySaved ? "Couldn’t unsave post" : "Couldn’t save post");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keyFeed });
      qc.invalidateQueries({ queryKey: keyPost });
      qc.invalidateQueries({ queryKey: keySaved });
    },
  });

  const isSaved = (savedLookup ?? post.saved) ?? false;

  return (
    <button
      type="button"
      onClick={() => mutate.mutate(isSaved)}
      disabled={mutate.isPending}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-60 ${
        isSaved ? "bg-violet-500/10 hover:bg-violet-500/15" : "bg-white/5 hover:bg-white/10"
      }`}
      aria-pressed={isSaved}
      aria-label={isSaved ? "Unsave post" : "Save post"}
    >
      <img
        src={isSaved ? "/Savedbold.png" : "/Save.png"}
        alt=""
        className={`h-5 w-5 object-contain transition ${isSaved ? "scale-105" : "opacity-90"}`}
        aria-hidden="true"
      />
      <span className="sr-only">{isSaved ? "Unsave" : "Save"}</span>
    </button>
  );
}
