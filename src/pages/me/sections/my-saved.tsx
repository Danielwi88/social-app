import { useQuery } from "@tanstack/react-query";

import type { Post } from "@/types/post";
import { getMySaved } from "../../../api/me";
import { ProfileMediaGrid } from "@/components/profile/profile-media-grid";

export default function MySaved() {
  const {
    data: savedPosts = [],
    isLoading,
    isError,
  } = useQuery<Post[]>({
    queryKey: ["me", "saved"],
    queryFn: () => getMySaved(),
  });

  if (isLoading) return <p className="text-white/70">Loading saved posts…</p>;
  if (isError) return <p className="text-rose-400">Failed to load saved posts.</p>;
  if (savedPosts.length === 0)
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-16 text-center shadow-[0_0_40px_rgba(124,58,237,0.05)]">
        <h3 className="text-2xl font-semibold">Save posts you love</h3>
        <p className="mt-3 text-sm text-white/60">
          Tap the bookmark icon on any post to keep it here for easy access later.
        </p>
      </div>
    );

  return <ProfileMediaGrid posts={savedPosts} />;
}
