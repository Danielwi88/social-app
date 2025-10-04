import { useState, type SVGProps } from "react";
import { cn } from "@/lib/utils";
import { likePost, unlikePost } from "../../api/posts";
import type { Post } from "../../types/post";
import { Toggle } from "../ui/toggle";
import { useAppDispatch, useAppSelector } from "@/store";
import { clearReaction, selectPostReaction, setReaction } from "@/features/posts/postReactionsSlice";
import { toast } from "sonner";

type LikeButtonVariant = "default" | "compact";

interface LikeButtonProps {
  post: Post;
  variant?: LikeButtonVariant;
}

export function LikeButton({ post, variant = "default" }: LikeButtonProps) {
  const dispatch = useAppDispatch();
  const reaction = useAppSelector((state) => selectPostReaction(state, post.id));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const liked = reaction?.liked ?? post.liked ?? false;
  const likeCount = reaction?.likeCount ?? post.likeCount ?? 0;

  const isCompact = variant === "compact";
  const toggleClass = cn(
    "flex items-center rounded-full transition-colors select-none text-neutral-25 !bg-transparent hover:!bg-transparent hover:!text-white data-[state=on]:!text-[#B41759] cursor-pointer hover:scale-105 hover:font-bold hover:translate-x-0.5 gap-x-[6px] font-bold",
    isCompact ? " text-sm" : "text-md",
  );
  const iconSize = isCompact ? 24 : 24;

  const applyReaction = (nextLiked: boolean, nextCount: number) => {
    dispatch(
      setReaction({
        id: post.id,
        reaction: {
          liked: nextLiked,
          likeCount: Math.max(0, nextCount),
        },
      }),
    );
  };

  const revertReaction = (prevLiked: boolean, prevCount: number, hadOverride: boolean) => {
    if (hadOverride) {
      applyReaction(prevLiked, prevCount);
    } else {
      dispatch(clearReaction(post.id));
    }
  };

  const handleToggle = async () => {
    if (isSubmitting) return;

    const previousLiked = liked;
    const previousCount = likeCount;
    const hadOverride = Boolean(reaction);

    const nextLiked = !previousLiked;
    const nextCount = Math.max(0, previousCount + (nextLiked ? 1 : -1));

    applyReaction(nextLiked, nextCount);
    setIsSubmitting(true);

    try {
      const response = nextLiked ? await likePost(post.id) : await unlikePost(post.id);
      const serverLiked = typeof response?.liked === "boolean" ? response.liked : nextLiked;
      const serverCount =
        typeof response?.likeCount === "number" ? response.likeCount : nextCount;

      applyReaction(serverLiked, serverCount);
      toast.success(serverLiked ? "Liked" : "Unliked", {
        description: serverLiked ? "You liked this post." : "You removed your like.",
      });
    } catch {
      revertReaction(previousLiked, previousCount, hadOverride);
      toast.error("Unable to update like", {
        description: "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Toggle
      pressed={liked}
      onClick={handleToggle}
      aria-label={liked ? "Unlike" : "Like"}
      disabled={isSubmitting}
      type="button"
      className={toggleClass}
    >
      <HeartIcon aria-hidden liked={liked} size={iconSize} />
      <span>{likeCount}</span>
    </Toggle>
  );
}

type HeartIconProps = SVGProps<SVGSVGElement> & {
  liked?: boolean;
  size?: number;
};

function HeartIcon({ liked = false, size = 24, className, style, ...props }: HeartIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("shrink-0", className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <path
        d="M12.62 20.8096C12.28 20.9296 11.72 20.9296 11.38 20.8096C8.48 19.8196 2 15.6896 2 8.68961C2 5.59961 4.49 3.09961 7.56 3.09961C9.38 3.09961 10.99 3.97961 12 5.33961C13.01 3.97961 14.63 3.09961 16.44 3.09961C19.51 3.09961 22 5.59961 22 8.68961C22 15.6896 15.52 19.8196 12.62 20.8096Z"
        fill={liked ? "#B41759" : "none"}
        stroke={liked ? "#B41759" : "#FDFDFD"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
