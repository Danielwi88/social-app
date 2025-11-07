import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AVATAR_FALLBACK_SRC } from "@/lib/avatar";

type AvatarWithFallbackProps = {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
};

export function AvatarWithFallback({ src, alt, className, imgClassName }: AvatarWithFallbackProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const resolvedSrc = !hasError && src ? src : AVATAR_FALLBACK_SRC;

  return (
    <span className={cn("relative inline-flex overflow-hidden rounded-full bg-white/10", className)}>
      <img
        src={resolvedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300",
          imgClassName,
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
      {!isLoaded && <span className="absolute inset-0 animate-pulse bg-white/15" aria-hidden="true" />}
    </span>
  );
}
