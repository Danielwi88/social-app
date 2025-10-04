import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { selectAuth } from '@/features/auth/authSlice';
import { AVATAR_FALLBACK_SRC, handleAvatarError } from '@/lib/avatar';
import { getUserDisplayName } from '@/lib/user';
import CommentsPanel from '@/pages/post/sections/comments-panel';
import { useAppSelector } from '@/store';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { deletePost, getPost } from '../../api/posts';
import { LikeButton } from '../../components/posts/like-button';
import { SaveButton } from '../../components/posts/save-button';

import type { FeedPage } from '@/types/post';
dayjs.extend(relativeTime);

export default function PostDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState =
    (location.state as { from?: string; focusComments?: boolean } | null) ??
    null;
  const qc = useQueryClient();
  const { user } = useAppSelector(selectAuth);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const q = useQuery({ queryKey: ['post', id], queryFn: () => getPost(id) });

  const delMutation = useMutation({
    mutationFn: () => deletePost(id),
    onSuccess: () => {
      toast.success('Post deleted', {
        description: 'Your post has been removed.',
      });
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['me', 'posts'] });
      navigate('/me', { replace: true });
    },
    onError: () => {
      toast.error('Delete failed', {
        description: 'Could not delete this post. Please try again.',
      });
    },
  });

  if (q.isLoading) return <p className='text-white/70'>Loading…</p>;
  if (q.isError || !q.data)
    return <p className='text-rose-400'>Post not found.</p>;

  const post = q.data;

  const feedSnapshot = qc.getQueryData<InfiniteData<FeedPage>>(['feed']);
  let hydratedPost = post;
  if (feedSnapshot) {
    for (const page of feedSnapshot.pages ?? []) {
      const match = page.items.find((item) => item.id === post.id);
      if (match) {
        hydratedPost = {
          ...post,
          liked: match.liked,
          likeCount: match.likeCount,
        };
        break;
      }
    }
  }
  const authorName = getUserDisplayName(hydratedPost.author);
  const postedRelative = dayjs(hydratedPost.createdAt).fromNow();
  const isOwner =
    user?.id &&
    hydratedPost.author?.id &&
    String(user.id) === String(hydratedPost.author.id);

  const handleDelete = () => setConfirmOpen(true);

  const handleShare = async () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      toast.error('Sharing isn’t available right now');
      return;
    }

    const shareUrl = `${window.location.origin}/posts/${hydratedPost.id}`;
    const shareTitle =
      hydratedPost.caption || `Check out ${authorName}'s post on Sociality`;

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

  const handleCommentFocus = () => {
    const input = document.getElementById('comment-body');
    if (!(input instanceof HTMLElement)) return;
    (input as HTMLInputElement | HTMLTextAreaElement).focus();
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleClose = () => {
    if (locationState?.from) {
      navigate(locationState.from, { replace: true });
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/feed', { replace: true });
    }
  };

  const actionsSlot = (
    <div className='flex flex-wrap items-center justify-between gap-4'>
      <div className='flex items-center gap-6'>
        <LikeButton post={hydratedPost} />
        <button
          type='button'
          onClick={handleCommentFocus}
          className='flex items-center gap-1.5 text-sm font-semibold text-white/80 transition hover:text-white'
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
          <span>{hydratedPost.commentCount}</span>
        </button>
        <button
          type='button'
          onClick={handleShare}
          className='flex items-center gap-1.5 text-sm font-semibold text-white/80 transition hover:text-white'
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
      <div className='flex items-center gap-3 text-sm text-white/80'>
        <SaveButton post={hydratedPost} />
      </div>
    </div>
  );

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-3 py-6 sm:px-6 '>
      <div className='relative grid w-full max-w-[1200px] lg:h-[768px] overflow-hidden rounded-[32px] border border-white/10 bg-[#090914]/95 shadow-2xl shadow-black/60 backdrop-blur-md sm:max-h-[90vh] sm:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]'>
        <button
          type='button'
          onClick={handleClose}
          aria-label='Close'
          className='absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/80 transition hover:text-white'
        >
          <X className='h-4 w-4' />
        </button>

        <div className='relative min-h-[280px] bg-black/60 sm:min-h-0'>
          <img
            src={hydratedPost.imageUrl}
            alt={hydratedPost.caption ?? 'Post'}
            className='h-full w-full object-cover'
          />
        </div>

        <div className='flex max-h-[90vh] flex-col bg-[#0f0f19]/90 p-5 sm:p-6'>
          <header className='flex items-start justify-between sm:mr-12 gap-4'>
            <div className='flex items-center gap-3'>
              <img
                src={hydratedPost.author?.avatarUrl || AVATAR_FALLBACK_SRC}
                alt={authorName}
                className='h-11 w-11 rounded-full object-cover'
                onError={handleAvatarError}
              />
              <div className='leading-tight'>
                <div className='font-semibold text-white'>{authorName}</div>
                <p className='text-xs text-white/60'>
                  @{hydratedPost.author?.username}
                </p>
                <p className='text-xs text-white/40'>{postedRelative}</p>
              </div>
            </div>
            {isOwner && (
              <Button
                variant='ghost'
                className='h-9 rounded-full border border-white/15 bg-white/[0.06] px-4 text-xs font-semibold text-white hover:bg-white/[0.12]'
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}
          </header>

          {hydratedPost.caption && (
            <p className='mt-4 line-clamp-5 text-sm leading-relaxed text-white/90 sm:text-base'>
              {hydratedPost.caption}
            </p>
          )}

          <div className='mt-6 flex flex-1 flex-col overflow-hidden'>
            <CommentsPanel
              postId={hydratedPost.id}
              autoFocusComposer={Boolean(locationState?.focusComments)}
              actionsSlot={actionsSlot}
            />
          </div>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className='bg-[#0b0b11] text-white'>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription className='text-white/60'>
              This action cannot be undone. Your post will be removed from
              Sociality.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={delMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => delMutation.mutate()}
              disabled={delMutation.isPending}
              className='bg-rose-500 text-white hover:bg-rose-400'
            >
              {delMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
