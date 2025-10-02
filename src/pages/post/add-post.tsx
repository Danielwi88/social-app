import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { createPost } from "@/api/posts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store";
import { selectAuth } from "@/features/auth/authSlice";
import { AVATAR_FALLBACK_SRC, handleAvatarError } from "@/lib/avatar";
import { Input } from "@/components/ui/input";

export default function AddPost() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { user } = useAppSelector(selectAuth);

  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ image?: string; caption?: string }>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: (post) => {
      toast.success("Post shared", {
        description: "Your new moment is live.",
      });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["me", "posts"] });
      navigate(`/posts/${post.id}`);
    },
    onError: () => {
      toast.error("Failed to share", {
        description: "Something went wrong. Please try again.",
      });
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (!selected.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "Please select an image file." }));
      setFile(null);
      setPreviewUrl(null);
      event.target.value = "";
      return;
    }
    setErrors((prev) => ({ ...prev, image: undefined }));
    setFile(selected);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: { image?: string; caption?: string } = {};

    if (!file) {
      nextErrors.image = "Please upload an image.";
    }

    if (caption.trim().length > 2200) {
      nextErrors.caption = "Caption must be under 2200 characters.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    if (!file) return;

    mutation.mutate({
      image: file,
      caption: caption.trim() || undefined,
    });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 pb-16 pt-6 md:px-0">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Add Post
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60">{user?.displayName ?? user?.username}</span>
          <img
            src={user?.avatarUrl || AVATAR_FALLBACK_SRC}
            alt={user?.displayName ?? user?.username ?? "User avatar"}
            className="size-10 rounded-full object-cover"
            onError={handleAvatarError}
          />
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_0_60px_rgba(124,58,237,0.08)] md:p-10"
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-white" htmlFor="post-image">
              Upload image
            </label>
            <label
              htmlFor="post-image"
              className={cn(
                "relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/15 bg-black/40 px-6 py-10 text-center transition hover:border-violet-500/70 hover:bg-black/60",
                errors.image && "border-rose-500/60"
              )}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full rounded-2xl object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-white/70">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white">
                    <UploadCloud className="size-6" />
                  </span>
                  <p className="text-sm font-semibold text-white">Drop your photo here</p>
                  <p className="text-xs text-white/50">PNG, JPG, or JPEG up to 5MB</p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-2 rounded-full px-6 py-2 text-sm"
                    onClick={(event) => {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }}
                  >
                    Browse files
                  </Button>
                </div>
              )}
              <Input
                id="post-image"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </label>
            {previewUrl && (
              <div className="flex items-center justify-between text-xs text-white/50">
                <span className="truncate pr-2" title={file?.name}>{file?.name}</span>
                <button
                  type="button"
                  className="flex items-center gap-1 text-rose-300 transition hover:text-rose-200"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <Trash2 className="size-3" /> Remove
                </button>
              </div>
            )}
            {errors.image && <p className="text-xs text-rose-400">{errors.image}</p>}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-white" htmlFor="caption">
              Caption
            </label>
            <textarea
              id="caption"
              value={caption}
              onChange={(event) => {
                if (errors.caption) setErrors((prev) => ({ ...prev, caption: undefined }));
                setCaption(event.target.value);
              }}
              rows={5}
              placeholder="Create your caption"
              className={cn(
                "w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40",
                errors.caption && "border-rose-500/60 focus:border-rose-400 focus:ring-rose-500/30"
              )}
              maxLength={2200}
            />
            <div className="flex items-center justify-between text-xs text-white/40">
              {errors.caption ? <span className="text-rose-400">{errors.caption}</span> : <span />}
              <span>{caption.length}/2200</span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-sm font-semibold text-white shadow-lg transition hover:from-violet-400 hover:to-fuchsia-500"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Sharing…
              </span>
            ) : (
              "Share"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
