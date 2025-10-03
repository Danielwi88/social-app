import { LikeButton } from '@/components/posts/like-button';
import { LikesModal } from '@/components/posts/LikesModal';
import { SaveButton } from '@/components/posts/save-button';
import { AVATAR_FALLBACK_SRC, handleAvatarError } from '@/lib/avatar';
import { getUserDisplayName } from '@/lib/user';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import type { Post } from '../../types/post';
dayjs.extend(relativeTime);

export function PostCard({ post }: { post: Post }) {
  const location = useLocation();
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const authorName = getUserDisplayName(post.author);
  const profileHref = post.author?.username
    ? `/profile/${post.author.username}`
    : '/me';
  const handleShare = async () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      toast.error('Sharing isn’t available right now');
      return;
    }

    const shareUrl = `${window.location.origin}/posts/${post.id}`;
    const shareTitle =
      post.caption || `Check out ${authorName}'s post on Sociality`;

    if (navigator.share) {
      try {
        await navigator.share({ url: shareUrl, title: shareTitle });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Post link copied to clipboard');
        return;
      }
    } catch {
      toast.error('Couldn’t copy the post link');
      return;
    }

    toast.error('Sharing isn’t supported in this browser yet');
  };

  return (
    <article className='rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden'>
      <header className='flex items-center gap-3 p-3'>
        <Link
          to={profileHref}
          className='inline-flex'
          aria-label={`View ${authorName}'s profile`}
        >
          <img
            src={post.author?.avatarUrl || AVATAR_FALLBACK_SRC}
            alt={authorName}
            className='h-9 w-9 rounded-full object-cover transition hover:opacity-90'
            onError={handleAvatarError}
          />
        </Link>
        <div className='leading-tight'>
          <Link
            to={profileHref}
            className='font-medium text-white transition hover:text-white/80'
          >
            {authorName}
          </Link>
          <div className='text-xs text-white/60'>
            {dayjs(post.createdAt).fromNow()}
          </div>
        </div>
      </header>

      <button onClick={() => setShowLikesModal(true)} className='w-full'>
        <img
          src={post.imageUrl}
          alt={post.caption?.slice(0, 60) || 'post'}
          className='w-full aspect-square object-cover'
        />
      </button>

      <div className='p-3 space-y-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <LikeButton post={post} variant='compact' />
            <Link
              to={`/posts/${post.id}`}
              state={{ from: location.pathname, focusComments: true }}
              className='flex items-center gap-1.5 text-sm font-medium text-white/80 transition hover:text-white'
              aria-label='View comments'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
              >
                <path
                  d='M8.5 19H8C4 19 2 18 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 17 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z'
                  stroke='#FDFDFD'
                  stroke-width='1.5'
                  stroke-miterlimit='10'
                  stroke-linecap='round'
                  stroke-linejoin='round'
                />
                <path
                  d='M15.9965 11H16.0054'
                  stroke='#FDFDFD'
                  stroke-width='2'
                  stroke-linecap='round'
                  stroke-linejoin='round'
                />
                <path
                  d='M11.9955 11H12.0045'
                  stroke='#FDFDFD'
                  stroke-width='2'
                  stroke-linecap='round'
                  stroke-linejoin='round'
                />
                <path
                  d='M7.99451 11H8.00349'
                  stroke='#FDFDFD'
                  stroke-width='2'
                  stroke-linecap='round'
                  stroke-linejoin='round'
                />
              </svg>
              <span>{post.commentCount}</span>
            </Link>
            <button
              type='button'
              onClick={handleShare}
              className='flex items-center gap-1.5 text-sm font-medium text-white/80 transition hover:text-white'
              aria-label='Share post'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
              >
                <path
                  d='M7.40018 6.32015L15.8902 3.49015C19.7002 2.22015 21.7702 4.30015 20.5102 8.11015L17.6802 16.6002C15.7802 22.3102 12.6602 22.3102 10.7602 16.6002L9.92018 14.0802L7.40018 13.2402C1.69018 11.3402 1.69018 8.23015 7.40018 6.32015Z'
                  stroke='#FDFDFD'
                  stroke-width='1.5'
                  stroke-linecap='round'
                  stroke-linejoin='round'
                />
                <path
                  d='M10.1099 13.6501L13.6899 10.0601'
                  stroke='#FDFDFD'
                  stroke-width='1.5'
                  stroke-linecap='round'
                  stroke-linejoin='round'
                />
              </svg>

              <span>8</span>
            </button>
          </div>
          <SaveButton post={post} />
        </div>

        <div>
          <span className='font-medium text-white'>{authorName}</span>
          {post.caption && (
            <div className='mt-2'>
              <p
                className={cn(
                  'text-sm text-white/90 whitespace-pre-wrap',
                  !isCaptionExpanded && 'line-clamp-2'
                )}
              >
                {post.caption}
              </p>
              {post.caption.length > 160 && (
                <button
                  type='button'
                  onClick={() => setIsCaptionExpanded((prev) => !prev)}
                  className='mt-2 text-sm font-medium text-blue-400 transition hover:text-blue-300'
                >
                  {isCaptionExpanded ? 'Show Less' : 'Show More'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <LikesModal
        postId={post.id}
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
      />
    </article>
  );
}
