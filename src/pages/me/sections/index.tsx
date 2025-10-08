import { useQuery } from "@/hooks/react-query";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ProfileMediaGrid } from "@/components/profile/profile-media-grid";
import { PostCard } from "@/components/posts/PostCard";
import { getMe, getMyLikes, getMyPosts, getMySaved } from "@/api/me";
import type { Post } from "@/types/post";

type MyPostsProps = {
  authorId: string;
};

export function MyPosts({ authorId }: MyPostsProps) {
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
        <h3 className="text-lg font-bold text-neutral-25 leading-[32px]">Your story starts here</h3>
        <p className="max-w-md text-md font-regular text-neutral-400 leading-[30px]">
          Share your first post and let the world see your moments, passions, and memories. Make this space truly yours.
        </p>
        <Button
          asChild
          className="mt-6 h-10 sm:h-12 rounded-full bg-primary-300 text-md font-bold text-white shadow-lg transition hover:bg-gradient-custom hover:-translata-y-0.5 hover:scale-105 px-[49px]"
        >
          <Link to="/posts/new">Upload My First Post</Link>
        </Button>
      </div>
    );

  return <ProfileMediaGrid posts={q.data} />;
}

export function MySaved() {
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

export function MyLikes() {
  const q = useQuery({ queryKey: ["me", "likes"], queryFn: getMyLikes });

  if (q.isLoading) return <p className="text-white/70">Loading liked posts…</p>;
  if (q.isError) return <p className="text-rose-400">Failed to load liked posts.</p>;
  if (q.data?.length === 0) return <p className="text-white/60">You haven’t liked any posts yet.</p>;

  return (
    <div className="grid grid-cols-2 gap-y-4 md:grid-cols-3">
      {q.data?.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}

export function Settings() {
  const q = useQuery({ queryKey: ["me"], queryFn: getMe });

  if (q.isLoading) return <p className="text-white/70">Loading…</p>;
  if (q.isError || !q.data) return <p className="text-rose-400">Failed to load profile.</p>;

  return (
    <div className="space-y-4 max-w-md">
      <p className="text-white/80">
        Manage your basic profile info. Head over to the edit profile screen to update your details.
      </p>
      <Button asChild>
        <Link to="/me/edit">Edit Profile</Link>
      </Button>
    </div>
  );
}
