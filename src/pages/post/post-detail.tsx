import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deletePost, getPost } from "../../api/posts";
import { LikeButton } from "../../components/posts/like-button";
import { SaveButton } from "../../components/posts/save-button";
import CommentsPanel from "@/pages/post/sections/comments-panel";
import { AVATAR_FALLBACK_SRC, handleAvatarError } from "@/lib/avatar";
import { getUserDisplayName } from "@/lib/user";
import { Button } from "@/components/ui/button";
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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/store";
import { selectAuth } from "@/features/auth/authSlice";
import { MessageCircle, Share2, X } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function PostDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as { from?: string; focusComments?: boolean } | null) ?? null;
  const qc = useQueryClient();
  const { user } = useAppSelector(selectAuth);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const q = useQuery({ queryKey: ["post", id], queryFn: () => getPost(id) });

  const delMutation = useMutation({
    mutationFn: () => deletePost(id),
    onSuccess: () => {
      toast.success("Post deleted", { description: "Your post has been removed." });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["me", "posts"] });
      navigate("/me", { replace: true });
    },
    onError: () => {
      toast.error("Delete failed", {
        description: "Could not delete this post. Please try again.",
      });
    },
  });

  if (q.isLoading) return <p className="text-white/70">Loading…</p>;
  if (q.isError || !q.data) return <p className="text-rose-400">Post not found.</p>;

  const post = q.data;
  const authorName = getUserDisplayName(post.author);
  const postedRelative = dayjs(post.createdAt).fromNow();
  const isOwner = user?.id && post.author?.id && String(user.id) === String(post.author.id);

  const handleDelete = () => setConfirmOpen(true);

  const handleShare = async () => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      toast.error("Sharing isn’t available right now");
      return;
    }

    const shareUrl = `${window.location.origin}/posts/${post.id}`;
    const shareTitle = post.caption || `Check out ${authorName}'s post on Sociality`;

    if (navigator.share) {
      try {
        await navigator.share({ url: shareUrl, title: shareTitle });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Post link copied to clipboard");
        return;
      }
    } catch {
      toast.error("Couldn’t copy the post link");
      return;
    }

    toast.error("Sharing isn’t supported in this browser yet");
  };

  const handleCommentFocus = () => {
    const input = document.getElementById("comment-body");
    if (!(input instanceof HTMLElement)) return;
    (input as HTMLInputElement | HTMLTextAreaElement).focus();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleClose = () => {
    if (locationState?.from) {
      navigate(locationState.from, { replace: true });
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/feed", { replace: true });
    }
  };

  const actionsSlot = (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        <LikeButton post={post} />
        <button
          type="button"
          onClick={handleCommentFocus}
          className="flex items-center gap-1.5 text-sm font-semibold text-white/80 transition hover:text-white"
        >
          <MessageCircle className="h-5 w-5" />
          <span>{post.commentCount}</span>
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 text-sm font-semibold text-white/80 transition hover:text-white"
        >
          <Share2 className="h-5 w-5" />
          <span>Share</span>
        </button>
      </div>
      <div className="flex items-center gap-3 text-sm text-white/80">
        <SaveButton post={post} />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-3 py-6 sm:px-6 ">
      <div className="relative grid w-full max-w-[1200px] lg:h-[768px] overflow-hidden rounded-[32px] border border-white/10 bg-[#090914]/95 shadow-2xl shadow-black/60 backdrop-blur-md sm:max-h-[90vh] sm:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/80 transition hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative min-h-[280px] bg-black/60 sm:min-h-0">
          <img src={post.imageUrl} alt={post.caption ?? "Post"} className="h-full w-full object-cover" />
        </div>

        <div className="flex max-h-[90vh] flex-col bg-[#0f0f19]/90 p-5 sm:p-6">
          <header className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={post.author?.avatarUrl || AVATAR_FALLBACK_SRC}
                alt={authorName}
                className="h-11 w-11 rounded-full object-cover"
                onError={handleAvatarError}
              />
              <div className="leading-tight">
                <div className="font-semibold text-white">{authorName}</div>
                <p className="text-xs text-white/60">@{post.author?.username}</p>
                <p className="text-xs text-white/40">{postedRelative}</p>
              </div>
            </div>
            {isOwner && (
              <Button
                variant="ghost"
                className="h-9 rounded-full border border-white/15 bg-white/[0.06] px-4 text-xs font-semibold text-white hover:bg-white/[0.12]"
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}
          </header>

          {post.caption && (
            <p className="mt-4 line-clamp-5 text-sm leading-relaxed text-white/90 sm:text-base">{post.caption}</p>
          )}

          <div className="mt-6 flex flex-1 flex-col overflow-hidden">
            <CommentsPanel
              postId={post.id}
              autoFocusComposer={Boolean(locationState?.focusComments)}
              actionsSlot={actionsSlot}
            />
          </div>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-[#0b0b11] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This action cannot be undone. Your post will be removed from Sociality.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={delMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => delMutation.mutate()}
              disabled={delMutation.isPending}
              className="bg-rose-500 text-white hover:bg-rose-400"
            >
              {delMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
