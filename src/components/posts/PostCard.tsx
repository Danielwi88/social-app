import { Link } from "react-router-dom";
import type { Post } from "../../types/post";
import { LikeButton } from "@/components/posts/like-button";
import { SaveButton } from "@/components/posts/save-button";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden">
      <header className="flex items-center gap-3 p-3">
        <img src={post.author.avatarUrl || "/avatar-fallback.png"} alt={post.author.displayName} className="h-9 w-9 rounded-full object-cover" />
        <div className="leading-tight">
          <Link to={`/posts/${post.id}`} className="font-medium">{post.author.displayName}</Link>
          <div className="text-xs text-white/60">{dayjs(post.createdAt).fromNow()}</div>
        </div>
      </header>

      <Link to={`/posts/${post.id}`}>
        <img src={post.imageUrl} alt={post.caption?.slice(0, 60) || "post"} className="w-full aspect-square object-cover" />
      </Link>

      <div className="p-3 space-y-3">
        <div className="flex items-center gap-3">
          <LikeButton post={post} />
          <SaveButton post={post} />
          <Link to={`/posts/${post.id}`} className="text-sm text-white/70 hover:text-white">💬 {post.commentCount}</Link>
        </div>
        {post.caption && <p className="text-sm text-white/90">{post.caption}</p>}
      </div>
    </article>
  );
}