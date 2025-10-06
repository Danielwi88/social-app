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
        "overflow-hidden rounded-[20px] bg-black sm:px-5 pb-8 pt-0 sm:pt-2 md:px-0",
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4 md:gap-6">
          <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/8 ">
            <img
              src={avatarUrl || AVATAR_FALLBACK_SRC}
              alt={displayName}
              onError={handleAvatarError}
              className="h-full w-full object-cover"
            />
          </span>

          <div className="space-y-3">
            <div className="flex flex-col justify-between items-start">
              <h1 className="text-sm sm:text-md font-bold text-neutral-25 leading-[28px] sm:leading-[30px] ">
                {displayName}
              </h1>
              <p className="text-sm sm:text-md font-regular text-neutral-25 leading-[28px] sm:leading-[30px]  ">{username}</p>
            </div>

            
          </div>
        </div>
          

        {hasActions && (
          <div className="flex w-full items-center gap-3 self-stretch md:w-auto md:self-center md:justify-end">
            {primaryAction}
            {secondaryAction}
          </div>
        )}
        
      </div>

      {bio && (
              <p className="max-w-full mt-4 text-sm sm:text-md leading-relaxed line-clamp-2 overflow-scroll text-neutral-25 ">
                {bio}
              </p>
            )}

      <div className="mt-4 flex flex-col gap-4">
        
        <div className="grid  gap-y-5 gap-x-6 text-center text-white grid-cols-4 sm:text-left">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col items-center",
                index > 0 && "sm:border-l sm:border-white/10 sm:pl-6 text-neutral-25",
                onStatClick && (stat.label === "Followers" || stat.label === "Following") && "cursor-pointer hover:opacity-80"
              )}
              onClick={() => onStatClick && (stat.label === "Followers" || stat.label === "Following") && onStatClick(stat.label)}
            >
              <span className="text-lg font-bold md:text-xl text-neutral-25">
                {formatStat(stat.value)}
              </span>
              <span className="text-xs tracking-[0.14em] text-neutral-400 md:text-sm">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
          
      </div>
    </section>
  );
}
