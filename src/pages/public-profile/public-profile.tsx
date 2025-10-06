import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import { HeartIcon } from "@/components/ui/heart-icon";
import { SendIcon } from "@/components/ui/send-icon";

import { MobileFloatingNav } from "@/components/navigation/mobile-floating-nav";
import { FollowersModal } from "@/components/profile/followers-modal";
import { FollowingModal } from "@/components/profile/following-modal";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileMediaGrid } from "@/components/profile/profile-media-grid";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPublicUser, getUserLikes, getUserPosts } from "../../api/users";
import { FollowButton } from "../../components/users/follow-button";

export default function PublicProfile() {
  const { username = "" } = useParams();
  
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [activeTab, setActiveTab] = useState("gallery");

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
    <div className="sm:mx-auto flex max-w-5xl flex-col gap-8 mx-4 pb-28 pt-0 sm:pt-6 md:px-0">
      

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
        onStatClick={(label) => {
          if (label === "Followers") setShowFollowersModal(true);
          if (label === "Following") setShowFollowingModal(true);
        }}
        primaryAction={
          isSelf ? undefined : (
            <FollowButton
              username={u.username}
              queryKeyProfile={["profile", u.username] as const}
              isFollowing={u.isFollowing}
              followersCount={u.followers}
              className="w-full md:w-auto text-md cursor-pointer bg-black sm:h-12"
            />
          )
        }
        secondaryAction={
          <Button
            type="button"
            onClick={shareProfile}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-neutral-900 bg-black p-0 text-white hover:bg-white/[0.12]"
            aria-label="Share profile"
          >
            <SendIcon className="size-6" />
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full items-center justify-start gap-8 rounded-none border-b border-white/10 bg-transparent px-1">
          <TabsTrigger
            value="gallery"
            className="relative flex h-12 flex-none items-center gap-2 rounded-none border-none bg-transparent px-2 text-sm font-medium text-white/60 transition data-[state=active]:text-white data-[state=active]:after:absolute data-[state=active]:after:-bottom-[1px] data-[state=active]:after:left-0 data-[state=active]:after:h-[2px] data-[state=active]:after:w-full data-[state=active]:after:bg-white"
          >
            <img src="/grid-3.svg" alt="grid" width='20' height='20' className="sm:size-6" />
            Gallery
          </TabsTrigger>
          <TabsTrigger
            value="liked"
            className="relative flex h-12 flex-none items-center gap-2 rounded-none border-none bg-transparent px-2 text-sm font-medium text-white/60 transition data-[state=active]:text-white data-[state=active]:after:absolute data-[state=active]:after:-bottom-[1px] data-[state=active]:after:left-0 data-[state=active]:after:h-[2px] data-[state=active]:after:w-full data-[state=active]:after:bg-white"
          >
            <HeartIcon className="size-5" isActive={activeTab === "liked"} />
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

      <MobileFloatingNav />

      <FollowersModal
        username={u.username}
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
      />

      <FollowingModal
        username={u.username}
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
      />
    </div>
  );
}
