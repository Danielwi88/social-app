import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getMe } from "../../../api/me";
import { Button } from "@/components/ui/button";

export default function Settings() {
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
