import { useQuery } from "@tanstack/react-query";
import { getMySaved } from "../../../api/me";
import { PostCard } from "../../../components/posts/PostCard";

export default function MySaved() {
  const q = useQuery({ queryKey: ["me", "saved"], queryFn: getMySaved });
  if (q.isLoading) return <p className="text-white/70">Loading saved posts…</p>;
  if (q.isError) return <p className="text-rose-400">Failed to load saved posts.</p>;
  if (q.data?.length === 0) return <p className="text-white/60">You haven’t saved any posts yet.</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {q.data?.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}