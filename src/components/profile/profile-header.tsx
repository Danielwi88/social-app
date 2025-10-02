import type { ReactNode } from "react";

import { AVATAR_FALLBACK_SRC, handleAvatarError } from "@/lib/avatar";
import { cn } from "@/lib/utils";

function formatStat(value: number | undefined) {
  if (typeof value !== "number") return "0";
  return new Intl.NumberFormat().format(value);
}

type ProfileStat = { label: string; value?: number };

type ProfileHeaderProps = {
  displayName: string;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  stats: ProfileStat[];
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
  onStatClick?: (statLabel: string) => void;
};

export function ProfileHeader({
  displayName,
  username,
  bio,
  avatarUrl,
  stats,
  primaryAction,
  secondaryAction,
  className,
  onStatClick,
}: ProfileHeaderProps) {
  const hasActions = Boolean(primaryAction || secondaryAction);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[28px] border border-white/12 bg-[#12121d]/90 px-5 pb-8 pt-7 md:px-9",
        className
      )}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4 md:gap-6">
          <span className="relative flex size-[76px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/8 md:size-[92px]">
            <img
              src={avatarUrl || AVATAR_FALLBACK_SRC}
              alt={displayName}
              onError={handleAvatarError}
              className="h-full w-full object-cover"
            />
          </span>

          <div className="space-y-3">
            <div>
              <h1 className="text-[22px] font-semibold text-white md:text-[32px] md:leading-tight">
                {displayName}
              </h1>
              <p className="text-sm text-white/60 md:text-base">@{username}</p>
            </div>

            {bio && (
              <p className="max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
                {bio}
              </p>
            )}
          </div>
        </div>

        {hasActions && (
          <div className="flex w-full items-center gap-3 self-stretch md:w-auto md:self-center md:justify-end">
            {primaryAction}
            {secondaryAction}
          </div>
        )}
      </div>

      <div className="mt-7 flex flex-col gap-4">
        <div className="h-px w-full bg-white/10" />
        <div className="grid grid-cols-2 gap-y-5 gap-x-6 text-center text-white sm:grid-cols-4 sm:text-left">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col items-center sm:items-start",
                index > 0 && "sm:border-l sm:border-white/10 sm:pl-6",
                onStatClick && (stat.label === "Followers" || stat.label === "Following") && "cursor-pointer hover:opacity-80"
              )}
              onClick={() => onStatClick && (stat.label === "Followers" || stat.label === "Following") && onStatClick(stat.label)}
            >
              <span className="text-[22px] font-semibold md:text-[30px]">
                {formatStat(stat.value)}
              </span>
              <span className="text-[11px] uppercase tracking-[0.14em] text-white/55 md:text-xs">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
