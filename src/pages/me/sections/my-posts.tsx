import { useQuery } from "@tanstack/react-query";
import { getMyPosts } from "../../../api/me";
import { PostCard } from "../../../components/posts/PostCard";

export default function MyPosts() {
  const q = useQuery({ queryKey: ["me", "posts"], queryFn: getMyPosts });
  if (q.isLoading) return <p className="text-white/70">Loading posts…</p>;
  if (q.isError) return <p className="text-rose-400">Failed to load posts.</p>;
  if (q.data?.length === 0) return <p className="text-white/60">No posts yet.</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {q.data?.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}