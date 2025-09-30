import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPublicUser, getUserLikes, getUserPosts } from "../../api/users";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowButton } from "../../components/users/follow-button";
import { PostCard } from "../../components/posts/PostCard";

export default function PublicProfile() {
  const { username = "" } = useParams();

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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={u.avatarUrl || "/avatar-fallback.png"}
            className="h-20 w-20 rounded-full object-cover"
          />
          <div>
            <h1 className="text-2xl font-semibold">{u.displayName}</h1>
            <div className="text-white/70">@{u.username}</div>
            {u.bio && <p className="text-white/80 mt-2 max-w-xl">{u.bio}</p>}
            <div className="flex gap-6 text-sm mt-3">
              <span><strong>{u.posts}</strong> Posts</span>
              <Link to={`/users/${u.username}/followers`} className="hover:underline">
                <strong>{u.followers}</strong> Followers
              </Link>
              <Link to={`/users/${u.username}/following`} className="hover:underline">
                <strong>{u.following}</strong> Following
              </Link>
              {typeof u.likes === "number" && <span><strong>{u.likes}</strong> Likes</span>}
            </div>
          </div>
        </div>
        <FollowButton
          username={u.username}
          queryKeyProfile={["profile", u.username]}
          isFollowing={u.isFollowing}
          followersCount={u.followers}
        />
      </header>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full max-w-[320px] grid-cols-2">
          <TabsTrigger value="posts">📸 Posts</TabsTrigger>
          <TabsTrigger value="likes">❤️ Likes</TabsTrigger>
        </TabsList>

        {/* Posts grid */}
        <TabsContent value="posts" className="mt-4">
          {posts.isLoading ? (
            <p className="text-white/70">Loading posts…</p>
          ) : posts.isError ? (
            <p className="text-rose-400">Failed to load posts.</p>
          ) : posts.data?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.data.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          ) : (
            <p className="text-white/60">No posts yet.</p>
          )}
        </TabsContent>

        {/* Likes grid */}
        <TabsContent value="likes" className="mt-4">
          {likes.isLoading ? (
            <p className="text-white/70">Loading liked posts…</p>
          ) : likes.isError ? (
            <p className="text-rose-400">Failed to load liked posts.</p>
          ) : likes.data?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {likes.data.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          ) : (
            <p className="text-white/60">No public likes to show.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}