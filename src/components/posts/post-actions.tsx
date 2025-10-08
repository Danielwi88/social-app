import { LikeButton } from '@/components/posts/like-button';
import { SaveButton } from '@/components/posts/save-button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Post } from '@/types/post';

interface PostActionsProps {
  post: Post;
  onComment: () => void;
  onShare: () => void;
  variant?: 'desktop' | 'mobile';
}

export function PostActions({ post, onComment, onShare, variant = 'desktop' }: PostActionsProps) {
  const isMobile = variant === 'mobile';

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between',
        isMobile ? 'gap-3' : 'gap-4'
      )}
    >
      <div className={cn('flex items-center', isMobile ? 'gap-x-3 sm:gap-x-4' : 'gap-6')}>
        <LikeButton post={post} variant={isMobile ? 'compact' : 'default'} />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              onClick={onComment}
              className={cn(
                'flex items-center gap-[6px] text-sm sm:text-md font-semibold transition',
                isMobile ? 'text-neutral-25 hover:text-white' : 'text-white/80 hover:text-white'
              )}
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
                  strokeWidth='1.5'
                  strokeMiterlimit='10'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M15.9965 11H16.0054'
                  stroke='#FDFDFD'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M11.9955 11H12.0045'
                  stroke='#FDFDFD'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M7.99451 11H8.00349'
                  stroke='#FDFDFD'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
              <span>{post.commentCount}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side='top'>give your comments here!</TooltipContent>
        </Tooltip>
        <button
          type='button'
          onClick={onShare}
          className={cn(
            'flex items-center gap-[6px] text-sm sm:text-md font-semibold transition cursor-pointer',
            isMobile ? 'text-neutral-25 hover:text-white' : 'text-white/80 hover:text-white'
          )}
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
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
            <path
              d='M10.1099 13.6501L13.6899 10.0601'
              stroke='#FDFDFD'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
          <span>Share</span>
        </button>
      </div>
      <div className={cn('flex items-center gap-3 text-sm', isMobile ? 'text-neutral-25' : 'text-white/80')}>
        <SaveButton post={post} />
      </div>
    </div>
  );
}
