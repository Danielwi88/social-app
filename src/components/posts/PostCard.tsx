import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Post } from "../../types/post";
import { LikeButton } from "@/components/posts/like-button";
import { SaveButton } from "@/components/posts/save-button";
import { LikesModal } from "@/components/posts/LikesModal";
import { AVATAR_FALLBACK_SRC, handleAvatarError } from "@/lib/avatar";
import { getUserDisplayName } from "@/lib/user";
import { MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export function PostCard({ post }: { post: Post }) {
  const location = useLocation();
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const authorName = getUserDisplayName(post.author);
  const profileHref = post.author?.username ? `/profile/${post.author.username}` : "/me";
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

  return (
    <article className="rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden">
      <header className="flex items-center gap-3 p-3">
        <Link to={profileHref} className="inline-flex" aria-label={`View ${authorName}'s profile`}>
          <img
            src={post.author?.avatarUrl || AVATAR_FALLBACK_SRC}
            alt={authorName}
            className="h-9 w-9 rounded-full object-cover transition hover:opacity-90"
            onError={handleAvatarError}
          />
        </Link>
        <div className="leading-tight">
          <Link to={profileHref} className="font-medium text-white transition hover:text-white/80">
            {authorName}
          </Link>
          <div className="text-xs text-white/60">{dayjs(post.createdAt).fromNow()}</div>
        </div>
      </header>

      <button onClick={() => setShowLikesModal(true)} className="w-full">
        <img src={post.imageUrl} alt={post.caption?.slice(0, 60) || "post"} className="w-full aspect-square object-cover" />
      </button>

      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LikeButton post={post} variant="compact" />
            <Link
              to={`/posts/${post.id}`}
              state={{ from: location.pathname, focusComments: true }}
              className="flex items-center gap-1.5 text-sm font-medium text-white/80 transition hover:text-white"
              aria-label="View comments"
            >
              <MessageCircle className="h-5 w-5" />
              <span>{post.commentCount}</span>
            </Link>
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm font-medium text-white/80 transition hover:text-white"
              aria-label="Share post"
            >
              <Share2 className="h-5 w-5" />
              <span>Share</span>
            </button>
          </div>
          <SaveButton post={post} />
        </div>

        <div>
          <span className="font-medium text-white">{authorName}</span>
          {post.caption && (
            <div className="mt-2">
              <p
                className={cn(
                  "text-sm text-white/90 whitespace-pre-wrap",
                  !isCaptionExpanded && "line-clamp-2"
                )}
              >
                {post.caption}
              </p>
              {post.caption.length > 160 && (
                <button
                  type="button"
                  onClick={() => setIsCaptionExpanded((prev) => !prev)}
                  className="mt-2 text-sm font-medium text-blue-400 transition hover:text-blue-300"
                >
                  {isCaptionExpanded ? "Show Less" : "Show More"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      <LikesModal 
        postId={post.id} 
        isOpen={showLikesModal} 
        onClose={() => setShowLikesModal(false)} 
      />
    </article>
  );
}
