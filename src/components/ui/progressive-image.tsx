import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ProgressiveImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  fallbackLabel?: string;
};

/**
 * ProgressiveImage renders a lazy-loaded image with a lightweight skeleton
 * to avoid layout shifts and flicker while the asset decodes.
 */
export function ProgressiveImage({
  src,
  alt,
  className,
  imgClassName,
  priority = false,
  fallbackLabel = "Image unavailable",
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  if (hasError || !src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden bg-black/40 text-xs font-medium text-white/60",
          className
        )}
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    <div className={cn("relative block overflow-hidden bg-neutral-900/50", className)}>
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className={cn(
          "h-full w-full object-cover transition-transform duration-500 ease-out",
          isLoaded ? "scale-100 opacity-100" : "scale-[1.02] opacity-0",
          imgClassName
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-neutral-900/60" aria-hidden="true" />
      )}
    </div>
  );
}

