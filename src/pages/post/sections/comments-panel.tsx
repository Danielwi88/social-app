import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { addComment, deleteComment, getComments } from "../../../api/posts";
import type { Comment, CommentsPage } from "../../../types/post";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

export default function CommentsPanel({ postId }: { postId: string }) {
  const qc = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const queryKey = ["comments", postId] as const;

  const list = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => getComments(postId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = list;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const composer = useForm<{ body: string }>({ defaultValues: { body: "" } });

  type CommentsData = InfiniteData<CommentsPage>;

  const addM = useMutation<Comment, unknown, { body: string }, { prev: CommentsData | undefined }>({
    mutationFn: ({ body }) => addComment(postId, body),
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<CommentsData>(queryKey);
      const optimistic: Comment = {
        id: `temp-${Date.now()}`,
        postId,
        body: variables.body,
        author: { id: "me", username: "me", displayName: "You" },
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData<CommentsData>(queryKey, (current) => {
        if (!current) {
          return {
            pages: [{ items: [optimistic], nextCursor: undefined }],
            pageParams: [undefined],
          };
        }

        const [firstPage, ...restPages] = current.pages;
        const updatedFirst: CommentsPage = firstPage
          ? { ...firstPage, items: [optimistic, ...firstPage.items] }
          : { items: [optimistic], nextCursor: undefined };

        return {
          ...current,
          pages: [updatedFirst, ...restPages],
        };
      });
      composer.reset();
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const delM = useMutation<{ ok: true }, unknown, string, { prev: CommentsData | undefined }>({
    mutationFn: (id) => deleteComment(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<CommentsData>(queryKey);
      qc.setQueryData<CommentsData>(queryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          pages: current.pages.map((pg) => ({
            ...pg,
            items: pg.items.filter((c) => c.id !== id),
          })),
        };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <section className="space-y-3">
      <h3 className="font-semibold">Comments</h3>
      <form
        onSubmit={composer.handleSubmit((v) => addM.mutate(v))}
        className="flex gap-2"
      >
        <input
          {...composer.register("body", { required: true })}
          placeholder="Add a comment…"
          className="flex-1 rounded-md bg-zinc-800 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-violet-500"
        />
        <button className="rounded-md bg-violet-600 px-3 py-2 disabled:opacity-50" disabled={addM.isPending}>
          Post
        </button>
      </form>

      {items.length === 0 && <p className="text-white/60">No comments yet.</p>}

      <ul className="space-y-3">
        {items.map((c) => (
          <li key={c.id} className="flex gap-3">
            <img src="/avatar-fallback.png" className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <div className="text-sm"><span className="font-medium">{c.author.displayName}</span> <span className="text-white/60">@{c.author.username}</span></div>
              <div className="text-white/90 text-sm">{c.body}</div>
              <button onClick={() => delM.mutate(c.id)} className="text-xs text-white/50 hover:text-white">Delete</button>
            </div>
          </li>
        ))}
      </ul>

      <div ref={sentinelRef} className="h-8" />
      {list.isFetchingNextPage && <p className="text-center text-white/60">Loading more…</p>}
    </section>
  );
}
