import { useQuery } from "@tanstack/react-query";
import { Bookmark, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { MobileFloatingNav } from "@/components/navigation/mobile-floating-nav";
import { FollowersModal } from "@/components/profile/followers-modal";
import { FollowingModal } from "@/components/profile/following-modal";
import { ProfileHeader } from "@/components/profile/profile-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MyPosts from "@/pages/me/sections/my-posts";
import MySaved from "@/pages/me/sections/my-saved";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getMe } from "../../api/me";

export default function Me() {
  const location = useLocation();
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ["me"], queryFn: getMe });
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);

  const hasToastedRef = useRef(false);

  useEffect(() => {
    const state = (location.state ?? null) as { profileUpdated?: boolean } | null;
    if (state?.profileUpdated && !hasToastedRef.current) {
      hasToastedRef.current = true;
      toast.success("Profile updated", {
        description: "Your profile looks great.",
      });
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  if (q.isLoading) return <p className="text-white/70">Loading profile…</p>;
  if (q.isError || !q.data) return <p className="text-rose-400">Failed to load profile.</p>;

  const me = q.data;

  const handleStatClick = (statLabel: string) => {
    if (statLabel === "Followers") {
      setFollowersModalOpen(true);
    } else if (statLabel === "Following") {
      setFollowingModalOpen(true);
    }
  };

  const shareProfile = async () => {
    const shareUrl = `${window.location.origin}/profile/${me.username}`;
    const title = `${me.displayName} on Sociality`;

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

  return (
    <div className="mx-auto flex max-w-[812px] flex-col gap-8 px-4 pb-28 pt-6 md:px-0">
      <ProfileHeader
        displayName={me.displayName}
        username={me.username}
        bio={me.bio}
        avatarUrl={me.avatarUrl}
        onStatClick={handleStatClick}
        stats={[
          { label: "Post", value: me.posts },
          { label: "Followers", value: me.followers },
          { label: "Following", value: me.following },
          { label: "Likes", value: me.likes },
        ]}
        primaryAction={
          <Button
            asChild
            className="h-10 sm:h-12 rounded-full border border-neutral-900 bg-black px-6 text-sm sm:text-md font-semibold text-white shadow hover:bg-white/[0.14]"
          >
            <Link to="/me/edit">Edit Profile</Link>
          </Button>
        }
        secondaryAction={
          <Button
            type="button"
            onClick={shareProfile}
            className="h-10 w-10 sm:w-12 sm:h-12 rounded-full border border-neutral-900 bg-black p-0 text-white shadow hover:bg-white/[0.12]"
            aria-label="Share profile"
          >
            <Send className="size-5 sm:size-6" />
          </Button>
        }
      />

      <Tabs defaultValue="gallery" className="w-full">
        <TabsList className="flex w-full items-center justify-start gap-6 rounded-none border-b border-white/10 bg-transparent p-0">
          <TabsTrigger
            value="gallery"
            className="relative flex h-12 flex-none items-center gap-2 rounded-none border-none bg-transparent px-1 text-sm font-medium text-white/60 transition data-[state=active]:text-white data-[state=active]:after:absolute data-[state=active]:after:-bottom-[1px] data-[state=active]:after:left-0 data-[state=active]:after:h-[2px] data-[state=active]:after:w-full data-[state=active]:after:bg-white"
          >
            
            <img src="/grid-3.svg" alt="grid" width='20' height='20' className="sm:size-6" />
            Gallery
          </TabsTrigger>
          <TabsTrigger
            value="saved"
            className="relative flex h-12 flex-none items-center gap-2 rounded-none border-none bg-transparent px-1 text-sm font-medium text-white/60 transition data-[state=active]:text-white data-[state=active]:after:absolute data-[state=active]:after:-bottom-[1px] data-[state=active]:after:left-0 data-[state=active]:after:h-[2px] data-[state=active]:after:w-full data-[state=active]:after:bg-white"
          >
            <Bookmark className="size-5 sm:size-6" />
            Saved
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="mt-8">
          <MyPosts authorId={me.id} />
        </TabsContent>
        <TabsContent value="saved" className="mt-8">
          <MySaved />
        </TabsContent>
      </Tabs>

      <MobileFloatingNav />

      <FollowersModal
        username={me.username}
        isOpen={followersModalOpen}
        onClose={() => setFollowersModalOpen(false)}
        isMe={true}
      />
      <FollowingModal
        username={me.username}
        isOpen={followingModalOpen}
        onClose={() => setFollowingModalOpen(false)}
        isMe={true}
      />
    </div>
  );
}
