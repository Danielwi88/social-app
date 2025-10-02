import { Link } from "react-router-dom";
import type { Post } from "@/types/post";
import { cn } from "@/lib/utils";

type ProfileMediaGridProps = {
  posts: Post[];
  className?: string;
};

export function ProfileMediaGrid({ posts, className }: ProfileMediaGridProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-2.5 sm:gap-3 md:gap-4", className)}>
      {posts.map((post) => (
        <Link
          to={`/posts/${post.id}`}
          key={post.id}
          className="group relative block overflow-hidden rounded-3xl bg-black/20"
        >
          <div className="aspect-square">
            <img
              src={post.imageUrl}
              alt={post.caption ? post.caption.slice(0, 80) : "Post image"}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </Link>
      ))}
    </div>
  );
}
