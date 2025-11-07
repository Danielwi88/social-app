import { Button } from '@/components/ui/button';
import { AvatarWithFallback } from '@/components/ui/avatar-with-fallback';
import { ProgressiveImage } from '@/components/ui/progressive-image';
import type { Post } from '@/types/post';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface MobilePostCardProps {
  post: Post;
  authorName: string;
  postedRelative: string;
  profileHref: string;
  isOwner: boolean;
  onDelete: () => void;
  actions: ReactNode;
}

export function MobilePostCard({
  post,
  authorName,
  postedRelative,
  profileHref,
  isOwner,
  onDelete,
  actions,
}: MobilePostCardProps) {
  return (
    <article className='mx-auto max-w-[600px] overflow-hidden border-b border-neutral-900 pb-6'>
      <header className='flex items-center justify-between gap-3 py-0'>
        <div className='flex items-center gap-2 sm:gap-3'>
          <Link to={profileHref} className='inline-flex' aria-label={`View ${authorName}'s profile`}>
            <AvatarWithFallback
              src={post.author?.avatarUrl}
              alt={authorName}
              className='h-11 w-11 rounded-full transition hover:opacity-90'
            />
          </Link>
          <div className='leading-[28px]'>
            <Link
              to={profileHref}
              className='text-md font-bold text-white transition hover:text-white/80'
            >
              {authorName}
            </Link>
            <div className='text-md font-normal leading-[28px] text-neutral-400'>{postedRelative}</div>
          </div>
        </div>
        {isOwner && (
          <Button
            variant='ghost'
            className='h-9 rounded-full border border-white/15 bg-white/[0.06] px-4 text-xs font-semibold text-white hover:bg-white/[0.12]'
            onClick={onDelete}
          >
            Delete
          </Button>
        )}
      </header>

      <div className='w-full mt-2'>
        <ProgressiveImage
          src={post.imageUrl}
          alt={post.caption ?? 'Post'}
          className='aspect-square w-full rounded-md'
        />
      </div>

      <div className='space-y-4 py-[10px]'>
        {actions}
        {post.caption && (
          <p className='text-sm leading-[28px] text-neutral-25 flex flex-col'>
            <span className='font-bold text-neutral-25'>{authorName} </span>
            <span className='font-regular text-neutral-25'>{post.caption}</span>
          </p>
        )}
      </div>
    </article>
  );
}
