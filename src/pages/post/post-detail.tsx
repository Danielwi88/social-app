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
import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { deletePost, getPost } from '../../api/posts';
import { LikeButton } from '../../components/posts/like-button';
import { SaveButton } from '../../components/posts/save-button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { LogoGlyph } from '@/shared/logo';

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
  const getSmallScreenMatch = () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(max-width: 767px)').matches;
  };
  const initialSmallScreen = getSmallScreenMatch();
  const [isSmallScreen, setIsSmallScreen] = useState(initialSmallScreen);
  const [isMobileCommentsOpen, setIsMobileCommentsOpen] = useState(() =>
    initialSmallScreen || Boolean(locationState?.focusComments)
  );
  const [shouldFocusComposer, setShouldFocusComposer] = useState(
    Boolean(locationState?.focusComments)
  );
  const [isCommentsEmpty, setIsCommentsEmpty] = useState(false);
  const hasInitialisedSheet = useRef(initialSmallScreen);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = (event: MediaQueryListEvent) => {
      setIsSmallScreen(event.matches);
      if (event.matches) {
        setIsMobileCommentsOpen(true);
        hasInitialisedSheet.current = true;
      } else {
        setIsMobileCommentsOpen(false);
        hasInitialisedSheet.current = false;
      }
    };

    setIsSmallScreen(mediaQuery.matches);
    if (mediaQuery.matches && !hasInitialisedSheet.current) {
      setIsMobileCommentsOpen(true);
      hasInitialisedSheet.current = true;
    }

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!locationState?.focusComments) return;
    setShouldFocusComposer(true);
    if (isSmallScreen) {
      setIsMobileCommentsOpen(true);
    }
  }, [locationState, isSmallScreen]);

  const focusComposerField = () => {
    const input = document.getElementById('comment-body');
    if (!(input instanceof HTMLElement)) return;
    (input as HTMLInputElement | HTMLTextAreaElement).focus();
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  useEffect(() => {
    if (!shouldFocusComposer) return;
    if (!isSmallScreen) {
      focusComposerField();
    }
    const timeout = window.setTimeout(() => setShouldFocusComposer(false), 400);
    return () => window.clearTimeout(timeout);
  }, [shouldFocusComposer, isSmallScreen]);

  // Fetch post data using React Query
  const q = useQuery({ queryKey: ['post', id], queryFn: () => getPost(id) });

  // Delete post mutation with cache invalidation
  const delMutation = useMutation({
    mutationFn: () => deletePost(id),
    onSuccess: () => {
      toast.success('Post deleted', {
        description: 'Your post has been removed.',
      });
      // Invalidate related queries to refresh UI
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

  // Hydrate post with cached feed data for real-time like/save states
  const feedSnapshot = qc.getQueryData<InfiniteData<FeedPage>>(['feed']);
  let hydratedPost = post;
  if (feedSnapshot) {
    for (const page of feedSnapshot.pages ?? []) {
      const match = page.items.find((item) => item.id === post.id);
      if (match) {
        // Use cached interaction states from feed
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
    setShouldFocusComposer(true);
    if (isSmallScreen) {
      setIsMobileCommentsOpen(true);
      return;
    }
    focusComposerField();
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

  const handleMobileSheetChange = (open: boolean) => {
    setIsMobileCommentsOpen(open);
    if (!open) {
      navigate('/feed', { replace: true });
    }
  };

  const handleCommentsEmptyChange = (empty: boolean) => {
    setIsCommentsEmpty(empty);
  };

  return (
    <div className='fixed inset-0 z-50 flex flex-col overflow-y-auto bg-black/70 sm:items-center sm:justify-center sm:overflow-y-visible sm:px-6 sm:py-6'>
      {isSmallScreen && (
        <header className='relative z-[60] flex items-center justify-between border-b border-white/5 bg-black/85 px-4 py-3 text-white backdrop-blur sm:hidden'>
          <div className='flex items-center gap-2'>
            <LogoGlyph className='h-7 w-7 text-white' />
            <span className='text-lg font-semibold'>Sociality</span>
          </div>
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={() => navigate('/users/search')}
              className='flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10'
              aria-label='Search users'
            >
              <Search className='h-5 w-5' />
            </button>
            <img
              src={user?.avatarUrl || AVATAR_FALLBACK_SRC}
              alt={user?.displayName ?? user?.username ?? 'Profile'}
              onError={handleAvatarError}
              className='h-10 w-10 rounded-full border border-white/10 object-cover'
            />
          </div>
        </header>
      )}
      <button
        type='button'
        onClick={handleClose}
        aria-label='Close'
        className='absolute right-4 top-4 z-[70] hidden h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white/80 transition hover:text-white md:flex'
      >
        <X className='size-5 cursor-pointer' />
      </button>
      <div className='relative flex w-full flex-1 flex-col overflow-hidden bg-black shadow-2xl shadow-black/60 backdrop-blur-md sm:h-auto sm:max-h-[90vh] sm:max-w-[1200px] md:grid md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]'>

        <div className='relative px-4 sm:px-0  w-full aspect-square bg-neutral-950 md:h-full max-h-[360px] xs:max-h-[350px] xm:max-h-[380px] md:max-h-[410px] lg:max-h-[600px] xl:max-h-[720px] md:max-w-[720px] md:aspect-auto'>
          <img
            src={hydratedPost.imageUrl}
            alt={hydratedPost.caption ?? 'Post'}
            className='h-full w-full object-cover rounded-md md:rounded-0'
          />
          <button
            type='button'
            onClick={handleClose}
            aria-label='Close post'
            className='absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black/80 md:hidden hover:font-bold hover:translate-y-0.5'
          >
            <X className='size-5' />
          </button>
        </div>

        <div className='hidden rounded-t-[32px] border-t border-white/10 bg-black/90 px-4 pb-6  md:flex md:max-h-[90vh] md:max-w-[480px] md:flex-col md:rounded-none md:border-t-0 md:bg-black md:px-5 md:pb-6 '>
          <header className='flex items-start justify-between gap-4 sm:mr-12'>
            <div className='flex items-center gap-3'>
              <img
                src={hydratedPost.author?.avatarUrl || AVATAR_FALLBACK_SRC}
                alt={authorName}
                className='h-10 w-10 rounded-full object-cover'
                onError={handleAvatarError}
              />
              <div className='leading-tight'>
                <div className='font-bold text-sm leading-[28px] text-neutral-25'>{authorName}</div>
                {/* <p className='text-xs text-white/60'>
                  @{hydratedPost.author?.username}
                </p> */}
                <p className='text-xs text-neutral-400 leading-[16px] pt-[2px]'>{postedRelative}</p>
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

          <div className='mt-6 flex flex-1 flex-col overflow-hidden border-t border-neutral-900 sm:mt-4'>
            <CommentsPanel
              postId={hydratedPost.id}
              autoFocusComposer={shouldFocusComposer}
              actionsSlot={actionsSlot}
            />
          </div>
        </div>
      </div>

      <div className='px-4 pb-4 pt-5 md:hidden'>
        {actionsSlot}
      </div>

      {isSmallScreen && (
        <Sheet open={isMobileCommentsOpen} onOpenChange={handleMobileSheetChange}>
          <SheetContent
            side='bottom'
            className={cn(
              'max-h-[80vh] border-none bg-black px-0 pb-4 pt-4 md:hidden',
              isCommentsEmpty ? 'h-[40vh]' : 'h-[70vh]'
            )}
          >
            <div className='flex h-full min-h-0 flex-col px-4 overflow-hidden'>
              <CommentsPanel
                postId={hydratedPost.id}
                autoFocusComposer={shouldFocusComposer}
                actionsSlot={actionsSlot}
                onEmptyStateChange={handleCommentsEmptyChange}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

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
            <AlertDialogCancel  className="text-foreground" disabled={delMutation.isPending}>
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
