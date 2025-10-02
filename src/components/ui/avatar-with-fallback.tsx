import { useState, useEffect } from "react";

type AvatarWithFallbackProps = {
  src?: string | null;
  alt: string;
  className?: string;
};

export function AvatarWithFallback({ src, alt, className = "" }: AvatarWithFallbackProps) {
  const [isLoading, setIsLoading] = useState(!!src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const timer = setTimeout(() => {
      setIsLoading(false);
      setHasError(true);
    }, 1200);

    const img = new Image();
    img.onload = () => {
      clearTimeout(timer);
      setIsLoading(false);
      setHasError(false);
    };
    img.onerror = () => {
      clearTimeout(timer);
      setIsLoading(false);
      setHasError(true);
    };
    img.src = src;

    return () => clearTimeout(timer);
  }, [src]);

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-white/10 rounded-full ${className}`} />
    );
  }

  return (
    <img
      src={hasError || !src ? "/avatarfall.svg" : src}
      alt={alt}
      className={className}
    />
  );
}