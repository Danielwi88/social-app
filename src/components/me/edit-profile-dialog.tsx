import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { updateMe, type MeResponse } from "../../api/me";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Schema = z.object({
  displayName: z.string().min(1, "Required"),
  bio: z.string().max(240, "Max 240 chars").optional().or(z.literal("")),
  avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});
type FormValues = z.infer<typeof Schema>;

type Props = {
  me: MeResponse;
  /** Optional custom trigger; if not provided, a default “Edit Profile” button is shown */
  trigger?: React.ReactNode;
  /** Optional className for the default trigger button */
  triggerClassName?: string;
};

export function EditProfileDialog({ me, trigger, triggerClassName }: Props) {
  const [open, setOpen] = React.useState(false);
  const qc = useQueryClient();

  const { register, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      displayName: me.displayName ?? "",
      bio: me.bio ?? "",
      avatarUrl: me.avatarUrl ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        displayName: me.displayName ?? "",
        bio: me.bio ?? "",
        avatarUrl: me.avatarUrl ?? "",
      });
    }
  }, [open, me, reset]);

  const mutate = useMutation({
    mutationFn: (v: FormValues) => updateMe(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      setOpen(false);
    },
  });

  const DefaultTrigger = (
    <Button variant="default" className={triggerClassName}>
      Edit Profile
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? DefaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your basic profile information.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={handleSubmit((v) => mutate.mutate(v))}
        >
          <div className="space-y-1.5">
            <label className="text-sm">Display Name</label>
            <Input placeholder="Your name" {...register("displayName")} />
            {formState.errors.displayName && (
              <p className="text-xs text-rose-400">
                {formState.errors.displayName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm">Bio</label>
            {/* Using native textarea; shadcn Textarea is optional */}
            <textarea
              rows={4}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 ring-1 ring-white/10 outline-none focus:ring-violet-500"
              placeholder="Short bio (max 240 chars)"
              {...register("bio")}
            />
            {formState.errors.bio && (
              <p className="text-xs text-rose-400">
                {formState.errors.bio.message as string}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm">Avatar URL</label>
            <Input placeholder="https://..." {...register("avatarUrl")} />
            {formState.errors.avatarUrl && (
              <p className="text-xs text-rose-400">
                {formState.errors.avatarUrl.message}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutate.isPending}>
              {mutate.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>

          {mutate.isError && (
            <p className="text-xs text-rose-400">
              Failed to save. Please try again.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}