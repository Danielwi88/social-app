export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-white/20 ${className}`}
    />
  );
}