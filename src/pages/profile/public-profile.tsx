import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Heart, Send, ArrowLeft, Home, Plus, UserRound } from "lucide-react";
import { toast } from "sonner";

import { getPublicUser, getUserLikes, getUserPosts } from "../../api/users";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowButton } from "../../components/users/follow-button";
import { ProfileHeader } from "@/components/profile/profile-header";
import { Button } from "@/components/ui/button";
import { ProfileMediaGrid } from "@/components/profile/profile-media-grid";

export default function PublicProfile() {
  const { username = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const profile = useQuery({
    queryKey: ["profile", username],
    queryFn: () => getPublicUser(username),
    enabled: !!username,
  });

  const posts = useQuery({
    queryKey: ["profile", username, "posts"],
    queryFn: () => getUserPosts(username),
    enabled: !!username,
  });

  const likes = useQuery({
    queryKey: ["profile", username, "likes"],
    queryFn: () => getUserLikes(username),
    enabled: !!username,
  });

  if (profile.isLoading) return <p className="text-white/70">Loading profile…</p>;
  if (profile.isError || !profile.data) return <p className="text-rose-400">Profile not found.</p>;

  const u = profile.data;

  const shareProfile = async () => {
    const shareUrl = `${window.location.origin}/profile/${u.username}`;
    const title = `${u.displayName} on Sociality`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
      } catch (error) {
        const cancelled = (error as DOMException)?.name === "AbortError";
        if (!cancelled) {
          toast.error("Couldn’t share profile", {
            description: "Please try copying the link instead.",
          });
        }
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Profile link copied", {
        description: "Share it with your friends and followers.",
      });
    } catch {
      toast.error("Copy failed", {
        description: "Please copy the URL from the address bar.",
      });
    }
  };

  const isSelf = u.isMe;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pb-28 pt-6 md:px-0">
      <div className="flex items-center justify-between md:hidden">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-white/80">{u.displayName}</span>
        <span className="size-10 overflow-hidden rounded-full border border-white/15 bg-white/5">
          <img src={u.avatarUrl || ""} alt={u.displayName} className="h-full w-full object-cover" />
        </span>
      </div>

      <ProfileHeader
        displayName={u.displayName}
        username={u.username}
        bio={u.bio}
        avatarUrl={u.avatarUrl}
        stats={[
          { label: "Post", value: u.posts },
          { label: "Followers", value: u.followers },
          { label: "Following", value: u.following },
          { label: "Likes", value: u.likes },
        ]}
        primaryAction={
          isSelf ? undefined : (
            <FollowButton
              username={u.username}
              queryKeyProfile={["profile", u.username] as const}
              isFollowing={u.isFollowing}
              followersCount={u.followers}
              className="w-full md:w-auto"
            />
          )
        }
        secondaryAction={
          <Button
            type="button"
            onClick={shareProfile}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] p-0 text-white hover:bg-white/[0.12]"
            aria-label="Share profile"
          >
            <Send className="size-4" />
          </Button>
        }
      />

      <Tabs defaultValue="gallery" className="w-full">
        <TabsList className="flex w-full items-center justify-start gap-8 rounded-none border-b border-white/10 bg-transparent px-1">
          <TabsTrigger
            value="gallery"
            className="relative flex h-12 flex-none items-center gap-2 rounded-none border-none bg-transparent px-2 text-sm font-medium text-white/60 transition data-[state=active]:text-white data-[state=active]:after:absolute data-[state=active]:after:-bottom-[1px] data-[state=active]:after:left-0 data-[state=active]:after:h-[2px] data-[state=active]:after:w-full data-[state=active]:after:bg-white"
          >
            <LayoutGrid className="size-4" />
            Gallery
          </TabsTrigger>
          <TabsTrigger
            value="liked"
            className="relative flex h-12 flex-none items-center gap-2 rounded-none border-none bg-transparent px-2 text-sm font-medium text-white/60 transition data-[state=active]:text-white data-[state=active]:after:absolute data-[state=active]:after:-bottom-[1px] data-[state=active]:after:left-0 data-[state=active]:after:h-[2px] data-[state=active]:after:w-full data-[state=active]:after:bg-white"
          >
            <Heart className="size-4" />
            Liked
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="mt-8">
          {posts.isLoading ? (
            <p className="text-white/70">Loading posts…</p>
          ) : posts.isError ? (
            <p className="text-rose-400">Failed to load posts.</p>
          ) : posts.data?.length ? (
            <ProfileMediaGrid posts={posts.data} />
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-16 text-center text-white/70">
              <p>This user hasn’t shared any posts yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="liked" className="mt-8">
          {likes.isLoading ? (
            <p className="text-white/70">Loading liked posts…</p>
          ) : likes.isError ? (
            <p className="text-rose-400">Failed to load liked posts.</p>
          ) : likes.data?.length ? (
            <ProfileMediaGrid posts={likes.data} />
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-16 text-center text-white/70">
              <p>No public likes to show yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center md:hidden">
        <nav className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-8 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md">
          <Link
            to="/feed"
            className="flex min-w-[64px] flex-col items-center gap-1 text-xs font-medium"
          >
            <span
              className={`flex size-12 items-center justify-center rounded-full border ${
                location.pathname.startsWith("/feed")
                  ? "border-white/40 bg-white/[0.14] text-white"
                  : "border-transparent bg-white/[0.08] text-white/70"
              }`}
            >
              <Home className="size-5" />
            </span>
            <span className={`${location.pathname.startsWith("/feed") ? "text-white" : "text-white/70"}`}>
              Home
            </span>
          </Link>

          <button
            type="button"
            onClick={() => navigate("/posts/new")}
            className="flex flex-col items-center gap-1 text-xs font-medium text-white"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_12px_35px_rgba(168,85,247,0.45)]">
              <Plus className="size-6" />
            </span>
            <span className="text-white">New Post</span>
          </button>

          <Link
            to="/me"
            className="flex min-w-[64px] flex-col items-center gap-1 text-xs font-medium"
          >
            <span
              className={`flex size-12 items-center justify-center rounded-full border ${
                location.pathname.startsWith("/me")
                  ? "border-white/40 bg-white/[0.14] text-white"
                  : "border-transparent bg-white/[0.08] text-white/70"
              }`}
            >
              <UserRound className="size-5" />
            </span>
            <span className={`${location.pathname.startsWith("/me") ? "text-white" : "text-white/70"}`}>
              Profile
            </span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
