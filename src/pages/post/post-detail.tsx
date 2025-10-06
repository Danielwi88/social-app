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
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { MobileFloatingNav } from '@/components/navigation/mobile-floating-nav';
import { PostActions } from '@/components/posts/post-actions';
import { MobilePostCard } from '@/pages/post/components/mobile-post-card';

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
  const [isMobileCommentsOpen, setIsMobileCommentsOpen] = useState(
    () => Boolean(locationState?.focusComments && initialSmallScreen)
  );
  const [shouldFocusComposer, setShouldFocusComposer] = useState(
    Boolean(locationState?.focusComments)
  );
  const [isCommentsEmpty, setIsCommentsEmpty] = useState(false);

  useEffect(() => {
    if (isSmallScreen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isSmallScreen]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = (event: MediaQueryListEvent) => {
      setIsSmallScreen(event.matches);
      if (!event.matches) {
        setIsMobileCommentsOpen(false);
      }
    };

    setIsSmallScreen(mediaQuery.matches);
    if (!mediaQuery.matches) {
      setIsMobileCommentsOpen(false);
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
  const profileHref = hydratedPost.author?.username
    ? `/profile/${hydratedPost.author.username}`
    : '/me';
  const isOwner = Boolean(
    user?.id &&
      hydratedPost.author?.id &&
      String(user.id) === String(hydratedPost.author.id)
  );

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

  const desktopActions = (
    <PostActions
      post={hydratedPost}
      onComment={handleCommentFocus}
      onShare={handleShare}
      variant='desktop'
    />
  );

  const mobileActions = (
    <PostActions
      post={hydratedPost}
      onComment={handleCommentFocus}
      onShare={handleShare}
      variant='mobile'
    />
  );

  const handleMobileSheetChange = (open: boolean) => {
    setIsMobileCommentsOpen(open);
    if (!open) {
      setShouldFocusComposer(false);
    }
  };

  const handleCommentsEmptyChange = (empty: boolean) => {
    setIsCommentsEmpty(empty);
  };

  const deleteDialog = (
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
          <AlertDialogCancel className='text-foreground' disabled={delMutation.isPending}>
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
  );

  if (isSmallScreen) {
    return (
      <>
        <div className='mx-auto w-full max-w-2xl px-4 pt-0 sm:pt-4 pb-28'>
          <MobilePostCard
            post={hydratedPost}
            authorName={authorName}
            postedRelative={postedRelative}
            profileHref={profileHref}
            isOwner={isOwner}
            onDelete={handleDelete}
            actions={mobileActions}
          />
        </div>

        <Sheet open={isMobileCommentsOpen} onOpenChange={handleMobileSheetChange}>
          <SheetContent
            side='bottom'
            className={cn(
              'max-h-[80vh] border-none bg-black px-0 pb-4 pt-4 md:hidden',
              isCommentsEmpty ? 'h-[40vh]' : 'h-[70vh]'
            )}
          >
            <div className='flex h-full min-h-0 flex-col overflow-hidden px-4'>
              <CommentsPanel
                postId={hydratedPost.id}
                autoFocusComposer={shouldFocusComposer}
                actionsSlot={mobileActions}
                onEmptyStateChange={handleCommentsEmptyChange}
              />
            </div>
          </SheetContent>
        </Sheet>

        {deleteDialog}
        <MobileFloatingNav />
      </>
    );
  }

  return (
    <div className='fixed inset-0 z-50 flex flex-col overflow-y-auto bg-black/70 sm:items-center sm:justify-center sm:overflow-y-visible sm:px-6 sm:py-6'>
      <div className='relative flex w-full flex-1 flex-col overflow-hidden bg-black shadow-2xl shadow-black/60 backdrop-blur-md sm:h-auto sm:max-h-[90vh] sm:max-w-[1200px] md:grid md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]'>
        <button
          type='button'
          onClick={handleClose}
          aria-label='Close'
          className='absolute right-0 top-0 z-[70] hidden h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white/80 transition hover:text-white md:flex'
        >
          <X className='size-5 cursor-pointer' />
        </button>

        <div className='relative w-full max-h-[360px] px-4 sm:px-0 md:aspect-auto md:h-full md:max-h-[410px] md:max-w-[720px] lg:max-h-[600px] xl:max-h-[720px]'>
          <img
            src={hydratedPost.imageUrl}
            alt={hydratedPost.caption ?? 'Post'}
            className='h-full w-full rounded-md object-cover md:rounded-0'
          />
          <button
            type='button'
            onClick={handleClose}
            aria-label='Close post'
            className='absolute bottom-4 right-4 hidden h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black/80 hover:font-bold hover:translate-y-0.5 md:flex'
          >
            <X className='size-5 cursor-pointer' />
          </button>
        </div>

        <div className='hidden rounded-t-[32px] border-t border-white/10 bg-black/90 px-4 pb-6 md:flex md:max-h-[90vh] md:max-w-[480px] md:flex-col md:rounded-none md:border-t-0 md:bg-black md:px-5 md:pb-6'>
          <header className='flex items-start justify-between gap-4 sm:mr-12'>
            <div className='flex items-center gap-3'>
              <img
                src={hydratedPost.author?.avatarUrl || AVATAR_FALLBACK_SRC}
                alt={authorName}
                className='h-10 w-10 rounded-full object-cover'
                onError={handleAvatarError}
              />
              <div className='leading-tight'>
                <div className='text-sm font-bold leading-[28px] text-neutral-25'>{authorName}</div>
                <p className='pt-[2px] text-xs leading-[16px] text-neutral-400'>{postedRelative}</p>
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
              actionsSlot={desktopActions}
            />
          </div>
        </div>
      </div>

      {deleteDialog}
    </div>
  );
}
