import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Bookmark, Send, Home, Plus, UserRound } from "lucide-react";
import { toast } from "sonner";

import { getMe } from "../../api/me";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import MyPosts from "@/pages/me/sections/my-posts";
import MySaved from "@/pages/me/sections/my-saved";
import { ProfileHeader } from "@/components/profile/profile-header";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Me() {
  const location = useLocation();
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ["me"], queryFn: getMe });

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
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pb-28 pt-6 md:px-0">
      <ProfileHeader
        displayName={me.displayName}
        username={me.username}
        bio={me.bio}
        avatarUrl={me.avatarUrl}
        stats={[
          { label: "Post", value: me.posts },
          { label: "Followers", value: me.followers },
          { label: "Following", value: me.following },
          { label: "Likes", value: me.likes },
        ]}
        primaryAction={
          <Button
            asChild
            className="h-11 rounded-full border border-white/15 bg-white/[0.08] px-6 text-sm font-semibold text-white shadow hover:bg-white/[0.14]"
          >
            <Link to="/me/edit">Edit Profile</Link>
          </Button>
        }
        secondaryAction={
          <Button
            type="button"
            onClick={shareProfile}
            className="h-11 w-11 rounded-full border border-white/15 bg-white/[0.06] p-0 text-white shadow hover:bg-white/[0.12]"
            aria-label="Share profile"
          >
            <Send className="size-4" />
          </Button>
        }
      />

      <Tabs defaultValue="gallery" className="w-full">
        <TabsList className="flex w-full items-center justify-start gap-6 rounded-none border-b border-white/10 bg-transparent p-0">
          <TabsTrigger
            value="gallery"
            className="relative flex h-12 flex-none items-center gap-2 rounded-none border-none bg-transparent px-1 text-sm font-medium text-white/60 transition data-[state=active]:text-white data-[state=active]:after:absolute data-[state=active]:after:-bottom-[1px] data-[state=active]:after:left-0 data-[state=active]:after:h-[2px] data-[state=active]:after:w-full data-[state=active]:after:bg-white"
          >
            <LayoutGrid className="size-4" />
            Gallery
          </TabsTrigger>
          <TabsTrigger
            value="saved"
            className="relative flex h-12 flex-none items-center gap-2 rounded-none border-none bg-transparent px-1 text-sm font-medium text-white/60 transition data-[state=active]:text-white data-[state=active]:after:absolute data-[state=active]:after:-bottom-[1px] data-[state=active]:after:left-0 data-[state=active]:after:h-[2px] data-[state=active]:after:w-full data-[state=active]:after:bg-white"
          >
            <Bookmark className="size-4" />
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

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center">
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
