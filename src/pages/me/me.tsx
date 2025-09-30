import { useQuery } from "@tanstack/react-query";
import { getMe } from "../../api/me";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MyPosts from "@/pages/me/sections/my-posts";
import MySaved from "@/pages/me/sections/my-saved";
import MyLikes from "@/pages/me/sections/my-likes";
import Settings from "@/pages/me/sections/settings";
import { EditProfileDialog } from "../../components/me/edit-profile-dialog";

export default function Me() {
  const q = useQuery({ queryKey: ["me"], queryFn: getMe });
  if (q.isLoading) return <p className="text-white/70">Loading profile…</p>;
  if (q.isError || !q.data) return <p className="text-rose-400">Failed to load profile.</p>;

  const me = q.data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex items-center gap-4">
        <img
          src={me.avatarUrl || "/avatar-fallback.png"}
          className="h-24 w-24 rounded-full object-cover"
        />
        <div>
          <h2 className="text-2xl font-semibold">{me.displayName}</h2>
          <p className="text-white/70">@{me.username}</p>
          <p className="mt-2 text-white/80 max-w-md">{me.bio || "No bio yet."}</p>
          <div className="flex gap-6 text-sm mt-3">
            <span><strong>{me.posts}</strong> Posts</span>
            <span><strong>{me.followers}</strong> Followers</span>
            <span><strong>{me.following}</strong> Following</span>
            <span><strong>{me.likes}</strong> Likes</span>
          </div>
        </div>

        <EditProfileDialog me={me} />
      </header>

      <Tabs defaultValue="posts" className="mt-8">
        <TabsList>
          <TabsTrigger value="posts">📸 Posts</TabsTrigger>
          <TabsTrigger value="saved">🔖 Saved</TabsTrigger>
          <TabsTrigger value="likes">❤️ Likes</TabsTrigger>
          <TabsTrigger value="settings">⚙️ Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="posts"><MyPosts /></TabsContent>
        <TabsContent value="saved"><MySaved /></TabsContent>
        <TabsContent value="likes"><MyLikes /></TabsContent>
        <TabsContent value="settings"><Settings /></TabsContent>
      </Tabs>
    </div>
  );
}
