import { getMe, updateMe, type MeResponse, type UpdateMePayload } from "@/api/me";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { selectAuth, setUser } from "@/features/auth/authSlice";
import { AVATAR_FALLBACK_SRC, handleAvatarError } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@/hooks/react-query";
import { isAxiosError } from "axios";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Required").max(80, "Max 80 chars"),
  username: z.string().min(3, "Min 3 chars").max(32, "Max 32 chars"),
  phone: z
    .string()
    .min(6, "Min 6 chars")
    .max(20, "Max 20 chars")
    .regex(/^[0-9+\-()\s]+$/, "Invalid phone number"),
  bio: z
    .string()
    .max(240, "Max 240 chars")
    .optional()
    .or(z.literal("")),
  avatarUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function EditProfile() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user: authUser } = useAppSelector(selectAuth);
  const qc = useQueryClient();

  const { data: me, isLoading, isError } = useQuery({ queryKey: ["me"], queryFn: getMe });

  const {
    register,
    handleSubmit,
    formState,
    reset,
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      username: "",
      phone: "",
      bio: "",
      avatarUrl: "",
    },
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!me) return;
    reset({
      name: me.name ?? me.displayName ?? "",
      username: me.username ?? "",
      phone: me.phone ?? "",
      bio: me.bio ?? "",
      avatarUrl: me.avatarUrl ?? "",
    });
    if (!avatarFile) {
      setAvatarPreview(me.avatarUrl ?? null);
    }
  }, [me, reset, avatarFile]);

  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const avatarUrlValue = watch("avatarUrl");

  useEffect(() => {
    if (avatarFile) return;
    if (!me) return;
    const trimmed = avatarUrlValue?.trim();
    if (trimmed) {
      setAvatarPreview(trimmed);
      setImageError(null);
    } else {
      setAvatarPreview(me.avatarUrl ?? null);
    }
  }, [avatarFile, avatarUrlValue, me]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const trimmedAvatarUrl = values.avatarUrl?.trim() ?? "";
      const payload: UpdateMePayload = {
        name: values.name.trim(),
        username: values.username.trim(),
        phone: values.phone.trim(),
        bio: values.bio?.trim() ? values.bio.trim() : null,
        avatarUrl:
          avatarFile || !trimmedAvatarUrl ? undefined : trimmedAvatarUrl,
        avatar: avatarFile,
      };
      return updateMe(payload);
    },
    onSuccess: async (updated) => {
      qc.setQueryData<MeResponse | undefined>(["me"], (prev) => {
        const fallbackUsername = prev?.username ?? authUser?.username ?? "";
        const fallbackDisplayName =
          prev?.displayName ?? authUser?.displayName ?? fallbackUsername;
        const fallbackAvatar = prev?.avatarUrl ?? authUser?.avatarUrl;

        return {
          ...(prev ?? ({} as MeResponse)),
          ...updated,
          username: updated.username ?? fallbackUsername,
          displayName: updated.displayName ?? fallbackDisplayName,
          avatarUrl: updated.avatarUrl ?? fallbackAvatar,
        };
      });

      const prevUsername = authUser?.username ?? "";
      const prevDisplayName = authUser?.displayName ?? prevUsername;
      const prevAvatar = authUser?.avatarUrl ?? undefined;

      const nextUsername = updated.username ?? prevUsername;
      const nextDisplayName = updated.displayName ?? prevDisplayName;
      const nextAvatar = updated.avatarUrl ?? prevAvatar;

      const shouldRefreshNavbar =
        nextUsername !== prevUsername ||
        nextAvatar !== prevAvatar;

      if (shouldRefreshNavbar) {
        const pendingUser = {
          id: updated.id,
          username: nextUsername,
          displayName: nextDisplayName,
          avatarUrl: nextAvatar,
        } as const;

        if (typeof window === "undefined") {
          dispatch(setUser(pendingUser));
        } else {
          window.dispatchEvent(new CustomEvent("navbar-refresh-start", { detail: pendingUser }));

          window.setTimeout(() => {
            getMe()
              .then((fresh) => {
                dispatch(
                  setUser({
                    id: fresh.id,
                    username: fresh.username,
                    displayName: fresh.displayName,
                    avatarUrl: fresh.avatarUrl,
                  })
                );
                window.dispatchEvent(new CustomEvent("navbar-refresh-end", { detail: { status: "success" } }));
              })
              .catch(() => {
                dispatch(setUser(pendingUser));
                window.dispatchEvent(new CustomEvent("navbar-refresh-end", { detail: { status: "fallback" } }));
              });
          }, 4000);
        }
      }

      setAvatarFile(null);
      setAvatarPreview(nextAvatar ?? null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setValue("avatarUrl", updated.avatarUrl ?? "", { shouldDirty: false });

      await Promise.all([
        qc.invalidateQueries({ queryKey: ["me"], exact: false }),
        qc.invalidateQueries({ queryKey: ["feed"], exact: false }),
      ]);

      navigate("/me", { replace: true, state: { profileUpdated: true } });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const message =
          (Array.isArray(error.response?.data?.data) &&
            error.response?.data?.data[0]?.msg) ||
          error.response?.data?.message ||
          "Failed to update profile.";
        toast.error("Couldn’t save changes", { description: message });
      } else {
        toast.error("Couldn’t save changes", { description: "Something went wrong." });
      }
    },
  });

  const bioValue = watch("bio") ?? "";

  if (isLoading) {
    return <p className="px-4 pt-6 text-white/70">Loading profile…</p>;
  }

  if (isError || !me) {
    return <p className="px-4 pt-6 text-rose-400">Failed to load profile.</p>;
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      setAvatarFile(null);
      setImageError(null);
      return;
    }
    if (!selected.type.startsWith("image/")) {
      setImageError("Please select an image file (PNG, JPG, JPEG).");
      setAvatarFile(null);
      event.target.value = "";
      return;
    }
    setImageError(null);
    setAvatarFile(selected);
    setValue("avatarUrl", "", { shouldDirty: true, shouldValidate: false });
  };



  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values);
  });

  const inputBase =
    "h-12 w-full rounded-2xl border bg-white/[0.06] px-4 text-sm text-white placeholder:text-white/40 transition focus:outline-none focus:ring-2 focus:ring-violet-500/60";
  const errorInput = "border-rose-500 focus:ring-rose-500/60";
  const okInput = "border-white/15";

  return (
    <div className="mx-4 sm:mx-auto flex min-h-dvh max-w-[800px] flex-col gap-6 px-0 sm:pb-24 sm:pt-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-md sm:text-display-xs font-bold text-neutral-25 transition hover:text-white"
      >
        <ArrowLeft className="size-6 sm:size-8 text-neutral-25" />
        Edit Profile
      </button>

      <div className="flex w-full flex-col sm:gap-8  px-0 bg-black sm:p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur md:flex-row md:items-start md:gap-12 md:p-10">
        <div className="flex w-full flex-col items-center gap-4 border-b border-white/10 pb-2 sm:pb-10 text-center md:w-auto md:border-b-0  md:border-white/10 md:pb-0  md:text-left">
          <div className="relative">
            <img
              src={avatarPreview || AVATAR_FALLBACK_SRC}
              alt={me.displayName}
              className="h-20 w-20 rounded-full  object-cover shadow-[0_12px_45px_rgba(0,0,0,0.45)] md:h-[131px] md:w-[131px]"
              onError={handleAvatarError}
            />
          </div>
          <div className="flex flex-col items-center gap-3 md:items-start">
            
            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <Button
                type="button"
                variant="secondary"
                className="rounded-full bg-black border border-neutral-900 sm:h-12 px-4 py-2 text-sm sm:text-md font-bold text-neutral-25 hover:bg-white/[0.16]"
                onClick={() => fileInputRef.current?.click()}
              >
                Change Photo
              </Button>
              
            </div>
            {imageError && <p className="text-xs text-rose-400">{imageError}</p>}
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <form
          className="mt-2 sm:mt-10 w-full flex-1 min-w-0 space-y-6 md:mt-0"
          onSubmit={onSubmit}
          noValidate
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-smfont-bold tracking-wide text-neutral-25">Name</label>
              <Input
                placeholder="Your name"
                {...register("name")}
                aria-invalid={!!formState.errors.name}
                className={cn(inputBase, formState.errors.name ? errorInput : okInput)}
              />
              {formState.errors.name && (
                <p className="text-xs text-rose-400">{formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold tracking-wide text-neutral-25">Username</label>
              <Input
                placeholder="username"
                {...register("username")}
                aria-invalid={!!formState.errors.username}
                className={cn(inputBase, formState.errors.username ? errorInput : okInput)}
              />
              {formState.errors.username && (
                <p className="text-xs text-rose-400">{formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold tracking-wide text-neutral-25">Email</label>
              <Input
                value={me.email ?? ""}
                readOnly
                disabled
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white/60"
              />
              
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold tracking-wide text-neutral-25"> Phone Number</label>
              <Input
                placeholder="0812345678"
                {...register("phone")}
                aria-invalid={!!formState.errors.phone}
                className={cn(inputBase, formState.errors.phone ? errorInput : okInput)}
              />
              {formState.errors.phone && (
                <p className="text-xs text-rose-400">{formState.errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold tracking-wide text-neutral-25">Avatar URL (optional)</label>
              <Input
                placeholder="https://cdn.example.com/avatar.jpg"
                {...register("avatarUrl")}
                aria-invalid={!!formState.errors.avatarUrl}
                className={cn(inputBase, formState.errors.avatarUrl ? errorInput : okInput)}
              />
             
              {formState.errors.avatarUrl && (
                <p className="text-xs text-rose-400">{formState.errors.avatarUrl.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-white/60">
              <label className="text-sm font-bold tracking-wide text-neutral-25">Bio</label>
              <span>
                {bioValue.length}
                /240
              </span>
            </div>
            <textarea
              rows={6}
              {...register("bio")}
              aria-invalid={!!formState.errors.bio}
              placeholder="Share a short description about yourself"
              className={cn(
                "w-full rounded-3xl border px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500 focus:shadow-[0_0_0_2px_rgba(139,92,246,0.25)]",
                formState.errors.bio ? "border-rose-500 bg-white/[0.04]" : "border-white/10 bg-white/[0.04]"
              )}
            />
            {formState.errors.bio && (
              <p className="text-xs text-rose-400">{formState.errors.bio.message}</p>
            )}
          </div>

          

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            
            <Button
              type="submit"
              className="h-10 sm:h-12 w-full rounded-full bg-primary-300   px-8 text-sm sm:text-md font-bold text-white shadow-[0_12px_35px_rgba(168,85,247,0.35)] transition  hover:bg-violet-500 hover:scale-105 hover:-translate-y-0.5"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
