import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { addComment, deleteComment, getComments } from "../../../api/posts";
import type { Comment, CommentsPage } from "../../../types/post";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { AVATAR_FALLBACK_SRC, handleAvatarError } from "@/lib/avatar";
import { getUserDisplayName } from "@/lib/user";
import { Smile, Trash2 } from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { MeResponse } from "@/api/me";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

dayjs.extend(relativeTime);

const EMOJIS = [
  "😀",
  "😁",
  "😂",
  "🤣",
  "😊",
  "😍",
  "😘",
  "😜",
  "🤩",
  "🤗",
  "🤔",
  "🤨",
  "😎",
  "🥳",
  "😭",
  "😡",
  "😴",
  "😇",
  "👍",
  "👏",
  "🙌",
  "✨",
  "🔥",
  "❤️",
];

type CommentsPanelProps = {
  postId: string;
  autoFocusComposer?: boolean;
  actionsSlot?: ReactNode;
};

export default function CommentsPanel({ postId, autoFocusComposer = false, actionsSlot }: CommentsPanelProps) {
  const qc = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const emojiPanelRef = useRef<HTMLDivElement | null>(null);
  const emojiTriggerRef = useRef<HTMLButtonElement | null>(null);
  const queryKey = ["comments", postId] as const;
  const me = qc.getQueryData<MeResponse>(["me"]);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);

  const list = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => getComments(postId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = list;
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
  const bodyValue = composer.watch("body");
  const bodyField = composer.register("body");

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
      setShowEmojiPicker(false);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
      toast.error("Couldn’t post comment", { description: "Please try again." });
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
      toast.error("Failed to delete comment", { description: "Please retry." });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  useEffect(() => {
    if (autoFocusComposer && composerRef.current) {
      composerRef.current.focus();
    }
  }, [autoFocusComposer]);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (emojiPanelRef.current?.contains(target)) return;
      if (emojiTriggerRef.current?.contains(target)) return;
      setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showEmojiPicker]);

  const handleEmojiInsert = (emoji: string) => {
    const current = composer.getValues("body") ?? "";
    const nextValue = `${current}${emoji}`;
    composer.setValue("body", nextValue, { shouldDirty: true });
    composerRef.current?.focus();
  };

  const handleSubmit = composer.handleSubmit((values) => {
    if (!values.body.trim()) return;
    addM.mutate(values);
  });

  const commentCountCopy = useMemo(() => {
    if (items.length === 1) return "1 Comment";
    return `${items.length} Comments`;
  }, [items.length]);

  const isDeleteDialogOpen = commentToDelete !== null;

  const handleConfirmDelete = () => {
    if (!commentToDelete) return;
    delM.mutate(commentToDelete.id);
    setCommentToDelete(null);
  };

  return (
    <>
      <section className="flex h-full flex-col overflow-hidden rounded-[24px] border border-white/10 bg-black/40 backdrop-blur">
        <header className="flex items-center justify-between border-b border-white/10 px-6 pb-3 pt-5">
          <div>
            <h3 className="text-base font-semibold text-white">Comments</h3>
            <p className="text-xs text-white/50">{commentCountCopy}</p>
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5" aria-live="polite">
            {items.length === 0 && !list.isFetching && (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/30 py-12 text-center">
                <p className="text-sm font-semibold text-white/80">No comments yet</p>
                <p className="text-xs text-white/50">Start the conversation</p>
              </div>
            )}

            <ul className="space-y-4">
              {items.map((c) => {
                if (!c?.author) return null;
                const displayName = getUserDisplayName(c.author);
                const username = c.author.username ?? "unknown";
                const relativeTimeLabel = dayjs(c.createdAt).fromNow();

                return (
                  <li key={c.id} className="flex gap-3 rounded-2xl border border-white/5 bg-black/30 p-3">
                    <img
                      src={c.author.avatarUrl || AVATAR_FALLBACK_SRC}
                      alt={displayName}
                      className="h-9 w-9 rounded-full border border-white/10 object-cover"
                      onError={handleAvatarError}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs text-white/60">
                        <div className="space-x-1">
                          <span className="font-semibold text-white">{displayName}</span>
                          <span>@{username}</span>
                          <span>•</span>
                          <span>{relativeTimeLabel}</span>
                        </div>
                        {(() => {
                          const isMine = me
                            ? c.author?.id === me.id || c.author?.username === me.username
                            : c.author?.id === "me";
                          if (!isMine) return null;
                          return (
                            <button
                              type="button"
                              onClick={() => setCommentToDelete(c)}
                              disabled={delM.isPending}
                              className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-white/50 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          );
                        })()}
                      </div>
                      <p className="whitespace-pre-line break-words text-sm leading-relaxed text-white/90">
                        {c.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div ref={sentinelRef} className="h-6" />
            {list.isFetchingNextPage && <p className="text-center text-xs text-white/60">Loading more…</p>}
          </div>

          {actionsSlot && (
            <div className="border-t border-white/10 bg-black/45 px-6 py-4">
              {actionsSlot}
            </div>
          )}

          <div className="border-t border-white/10 bg-black/55 px-5 py-5 shadow-inner shadow-black/40">
            <form onSubmit={handleSubmit} className="flex items-end gap-3">
              <div className="relative">
                <button
                  type="button"
                  ref={emojiTriggerRef}
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/70 transition hover:text-white"
                  aria-haspopup="dialog"
                  aria-expanded={showEmojiPicker}
                  aria-label={showEmojiPicker ? "Hide emoji picker" : "Show emoji picker"}
                >
                  <Smile className="h-5 w-5" />
                </button>

                {showEmojiPicker && (
                  <div
                    ref={emojiPanelRef}
                    className="absolute bottom-full left-0 mb-3 w-48 rounded-2xl border border-white/10 bg-black/90 p-3 shadow-lg shadow-black/50"
                  >
                    <div className="grid grid-cols-5 gap-2 text-xl">
                      {EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleEmojiInsert(emoji)}
                          className="rounded-lg bg-white/5 py-1 text-center transition hover:bg-white/15"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <label htmlFor="comment-body" className="sr-only">
                  Comment
                </label>
                <input
                  id="comment-body"
                  {...bodyField}
                  ref={(el) => {
                    bodyField.ref(el);
                    composerRef.current = el;
                  }}
                  placeholder="Add a comment"
                  className="w-full rounded-full border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                className="rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={addM.isPending || !bodyValue.trim()}
              >
                {addM.isPending ? "Posting…" : "Post"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => !open && setCommentToDelete(null)}>
        <AlertDialogContent className="bg-[#0b0b11] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This action can’t be undone. Your comment will be removed from the post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={delM.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={delM.isPending}
              className="bg-rose-500 hover:bg-rose-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
