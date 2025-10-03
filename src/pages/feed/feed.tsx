import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getFeed } from "../../api/posts";
import { PostCard } from "../../components/posts/PostCard";
import { MobileFloatingNav } from "@/components/navigation/mobile-floating-nav";

const PAGE_SIZE = 20;

export default function Feed() {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery({
    queryKey: ["feed", PAGE_SIZE] as const,
    queryFn: ({ pageParam }) => getFeed(pageParam as string | undefined, PAGE_SIZE),
    initialPageParam: "1",
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isLoading, isError } = query;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading)
    return (
      <>
        <p className="text-white/70">Loading timeline…</p>
        <MobileFloatingNav />
      </>
    );
  if (isError)
    return (
      <>
        <p className="text-rose-400">Failed to load feed.</p>
        <MobileFloatingNav />
      </>
    );

  const items = data?.pages.flatMap((page) => page.items ?? []) ?? [];

  if (items.length === 0)
    return (
      <>
        <p className="text-white/70">Your feed is empty. Follow users to see posts.</p>
        <MobileFloatingNav />
      </>
    );

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        {items.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        <div ref={sentinelRef} className="h-8" />
        {isFetchingNextPage && <p className="text-center text-white/60">Loading more…</p>}
      </div>
      <MobileFloatingNav />
    </>
  );
}
