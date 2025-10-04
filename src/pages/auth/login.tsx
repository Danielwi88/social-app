import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login } from "../../api/auth";
import { useAppDispatch } from "../../store";
import { clearAuth, setCredentials, setUser } from "../../features/auth/authSlice";
import { getMe } from "../../api/me";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LogoGlyph } from "@/shared/logo";
import { cn } from "@/lib/utils";
import { AuthBackdrop } from "./components/auth-backdrop";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({
  usernameOrEmail: z.string().min(1, "Required"),
  password: z.string().min(6, "Min 6 chars"),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const dispatch = useAppDispatch();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const returnTo = sp.get("returnTo") || "/feed";
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { usernameOrEmail: "", password: "" },
  });

  const mutate = useMutation({
    mutationFn: ({ usernameOrEmail, password }: FormValues) =>
      login({ email: usernameOrEmail, password }),
    onSuccess: async (res) => {
      dispatch(setCredentials({ token: res.token, user: null }));
      try {
        const me = await getMe();
        dispatch(
          setUser({
            id: me.id,
            username: me.username,
            displayName: me.displayName,
            avatarUrl: me.avatarUrl,
          })
        );
        const displayLabel = me.displayName?.trim() || me.username?.trim() || "your account";
        const description = me.displayName
          ? `Signed in as ${displayLabel}`
          : `Signed in as @${displayLabel}`;
        toast.success("Welcome back!", { description });
        nav(returnTo, { replace: true });
      } catch {
        dispatch(clearAuth());
        toast.error("Login failed", { description: "Could not load account data." });
      }
    },
    onError: () => {
      toast.error("Login failed", { description: "Invalid email/username or password." });
    },
  });

  const renderError = (field: keyof FormValues) =>
    formState.errors[field] && (
      <p className="text-sm text-rose-400">{formState.errors[field]?.message}</p>
    );

  const inputBase =
    "h-12 rounded-2xl border bg-white/[0.06] text-md text-white placeholder:text-white/40 focus:ring-2";
  const inputOk = "border-white/10 focus:border-violet-500 focus:ring-violet-500/70 ";
  const inputError = "border-rose-500 focus:border-rose-500 focus:ring-rose-500/50";

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-black px-4 py-16 sm:px-6">
      <AuthBackdrop variant="login" />

      <div className="relative w-full max-w-md rounded-[32px] border border-white/10 bg-black/40 p-8 text-white shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="flex gap-[11px] items-center">

          <LogoGlyph className="h-[30px] w-[30px]  text-white" />
          <h1 className="text-display-xs font-bold">Sociality</h1>
          </div>

          <h1 className="text-xl font-bold mt-4 sm:mt-6">Welcome Back!</h1>
          
        </div>

        <form
          className="mt-4 space-y-5"
          onSubmit={handleSubmit((v) => mutate.mutate(v))}
          noValidate
        >
          <div className="space-y-2">
            <label className="text-sm font-bold leading-[28px] tracking-wide text-white">
              Email
            </label>
            <Input
              {...register("usernameOrEmail")}
              placeholder="you@example.com"
              aria-invalid={!!formState.errors.usernameOrEmail}
              className={cn("!text-md",
                inputBase, 
                formState.errors.usernameOrEmail ? inputError : inputOk
              )}
            />
            {renderError("usernameOrEmail")}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold leading-[28px] tracking-wide text-white">
              Password
            </label>
            <div className="relative flex items-center ">
              <Input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="••••••••"
                aria-invalid={!!formState.errors.password}
                className={cn("!text-md",
                  inputBase,
                  formState.errors.password ? inputError : inputOk,
                  "pr-12"
                )}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500/60 transition hover:font-bold"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {renderError("password")}
          </div>

          <Button
            type="submit"
            disabled={mutate.isPending}
            className="mt-3 text-md font-bold h-12 w-full rounded-full bg-primary-300 hover:bg-gradient-to-r from-[#5613A3] to-[#522BC8] shadow-[0_10px_40px_rgba(86,19,163,0.35)] cursor-pointer hover:scale-105 hover:-translate-y-0.5 !text-white"
          >
            {mutate.isPending ? "Signing in…" : "Login"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm font-semibold text-white/60">
          Don’t have an account?{" "}
          <Link to="/register" className="font-bold text-primary-200 text-sm hover:text-violet-300 hover:scale-105 hover:font-extrabold ">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
