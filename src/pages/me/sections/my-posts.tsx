import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { getMyPosts } from "../../../api/me";
import { Button } from "@/components/ui/button";
import { ProfileMediaGrid } from "@/components/profile/profile-media-grid";

type MyPostsProps = {
  authorId: string;
};

export default function MyPosts({ authorId }: MyPostsProps) {
  const q = useQuery({
    queryKey: ["me", "posts", authorId],
    queryFn: () => getMyPosts(authorId),
    enabled: Boolean(authorId),
  });
  if (q.isLoading) return <p className="text-white/70">Loading posts…</p>;
  if (q.isError) return <p className="text-rose-400">Failed to load posts.</p>;
  if (!q.data || q.data.length === 0)
    return (
      <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-16 text-center shadow-[0_0_40px_rgba(124,58,237,0.05)]">
        <h3 className="text-2xl font-semibold">Your story starts here</h3>
        <p className="mt-3 max-w-md text-sm text-white/60">
          Share your first post and let the world see your moments, passions, and memories. Make this space truly yours.
        </p>
        <Button
          asChild
          className="mt-8 h-11 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 text-sm font-semibold text-white shadow-lg transition hover:from-violet-400 hover:to-fuchsia-500"
        >
          <Link to="/posts/new">Upload My First Post</Link>
        </Button>
      </div>
    );

  return <ProfileMediaGrid posts={q.data} />;
}
