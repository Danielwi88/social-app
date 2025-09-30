import { useQuery } from "@tanstack/react-query";
import { getMe } from "../../../api/me";
import { EditProfileDialog } from "../../../components/me/edit-profile-dialog";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const q = useQuery({ queryKey: ["me"], queryFn: getMe });
  if (q.isLoading) return <p className="text-white/70">Loading…</p>;
  if (q.isError || !q.data) return <p className="text-rose-400">Failed to load profile.</p>;

  return (
    <div className="space-y-4 max-w-md">
      <p className="text-white/80">
        Manage your basic profile info. Use the dialog to update your display name, bio, and avatar URL.
      </p>
      <EditProfileDialog me={q.data} trigger={<Button>Edit Profile</Button>} />
    </div>
  );
}