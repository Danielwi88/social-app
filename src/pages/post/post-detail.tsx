import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPost } from "../../api/posts";
import { LikeButton } from "../../components/posts/like-button";
import { SaveButton } from "../../components/posts/save-button";
import CommentsPanel from "@/pages/post/sections/comments-panel";

export default function PostDetail() {
  const { id = "" } = useParams();
  const q = useQuery({ queryKey: ["post", id], queryFn: () => getPost(id) });

  if (q.isLoading) return <p className="text-white/70">Loading…</p>;
  if (q.isError || !q.data) return <p className="text-rose-400">Post not found.</p>;
  const post = q.data;

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
      <div>
        <img src={post.imageUrl} alt={post.caption} className="w-full rounded-xl object-cover" />
      </div>
      <div className="space-y-4">
        <header className="flex items-center gap-3">
          <img src={post.author.avatarUrl || "/avatar-fallback.png"} className="h-10 w-10 rounded-full" />
          <div className="font-medium">{post.author.displayName}</div>
        </header>
        <p className="text-white/90">{post.caption}</p>
        <div className="flex items-center gap-4">
          <LikeButton post={post} />
          <SaveButton post={post} />
          <span className="text-sm text-white/70">💬 {post.commentCount}</span>
        </div>
        <CommentsPanel postId={post.id} />
      </div>
    </div>
  );
}