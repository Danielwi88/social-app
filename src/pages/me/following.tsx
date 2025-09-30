import { useQuery } from "@tanstack/react-query";
import { getMyFollowing } from "../../api/users";
import { UserCard } from "../../components/users/user-card";

export default function MyFollowing() {
  const q = useQuery({ queryKey: ["me", "following"], queryFn: getMyFollowing });

  if (q.isLoading) return <p className="text-white/70">Loading…</p>;
  if (q.isError) return <p className="text-rose-400">Failed to load the people you follow.</p>;
  const list = q.data ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">People I Follow</h1>
      {list.length === 0 ? (
        <p className="text-white/60">You aren’t following anyone yet.</p>
      ) : (
        <div className="space-y-3">
          {list.map((u) => (
            <UserCard key={u.id} u={u} profileKey={["profile", u.username]} />
          ))}
        </div>
      )}
    </div>
  );
}