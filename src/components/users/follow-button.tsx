import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { follow, unfollow } from '@/api/users';
import type { SearchUsersResult } from '@/api/users';
import type { PublicUser } from '@/types/user';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectFollowStatus,
  setFollowStatus,
} from '@/features/users/followStatusSlice';

type FollowButtonProps = {
  username: string;
  queryKeyProfile?: readonly unknown[];
  isFollowing?: boolean;
  followersCount?: number;
  compact?: boolean;
  className?: string;
  disabled?: boolean;
};

type FollowResponse = Awaited<ReturnType<typeof follow>>;

type FollowMutationVariables = {
  action: 'follow' | 'unfollow';
  previous?: boolean;
};

type FollowMutationContext = {
  prevProfile?: unknown;
  previous: boolean;
  action: FollowMutationVariables['action'];
};

export function FollowButton({
  username,
  queryKeyProfile,
  isFollowing,
  followersCount,
  compact = false,
  className,
  disabled = false,
}: FollowButtonProps) {
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  const storedStatus = useAppSelector((state) =>
    selectFollowStatus(state, username)
  );
  const feedRefreshTimeoutRef = useRef<number | null>(null);

  const scheduleFeedRefresh = () => {
    const invalidateFeed = () => {
      qc.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === 'feed',
      });
    };

    if (typeof window === 'undefined') {
      invalidateFeed();
      return;
    }

    if (feedRefreshTimeoutRef.current !== null) {
      window.clearTimeout(feedRefreshTimeoutRef.current);
    }

    feedRefreshTimeoutRef.current = window.setTimeout(() => {
      invalidateFeed();
      feedRefreshTimeoutRef.current = null;
    }, 800);
  };

  const resolvedIsFollowing =
    typeof storedStatus === 'boolean'
      ? storedStatus
      : typeof isFollowing === 'boolean'
      ? isFollowing
      : false;

  useEffect(() => {
    if (typeof storedStatus === 'boolean') return;
    if (typeof isFollowing === 'boolean') {
      dispatch(setFollowStatus({ username, isFollowing }));
    }
  }, [dispatch, isFollowing, storedStatus, username]);

  useEffect(
    () => () => {
      if (typeof window === 'undefined') return;
      if (feedRefreshTimeoutRef.current !== null) {
        window.clearTimeout(feedRefreshTimeoutRef.current);
      }
    },
    []
  );

  const mutation = useMutation<
    FollowResponse,
    unknown,
    FollowMutationVariables,
    FollowMutationContext
  >({
    mutationFn: async ({ action }: FollowMutationVariables) =>
      action === 'unfollow' ? unfollow(username) : follow(username),
    onMutate: async (variables) => {
      // 1. Cancel ongoing queries to prevent race conditions
      const action =
        variables?.action ?? (resolvedIsFollowing ? 'unfollow' : 'follow');
      const previous = variables?.previous ?? resolvedIsFollowing;
      const next = action === 'follow';

      if (queryKeyProfile) {
        await qc.cancelQueries({ queryKey: queryKeyProfile });
      }

      const delta = action === 'unfollow' ? -1 : 1;
      // 2. Update Redux state immediately
      dispatch(setFollowStatus({ username, isFollowing: next }));

      const prevProfile = queryKeyProfile
        ? qc.getQueryData(queryKeyProfile)
        : undefined;

      if (prevProfile && !Array.isArray(prevProfile)) {
        const profile = prevProfile as PublicUser;
        qc.setQueryData<PublicUser>(queryKeyProfile!, {
          ...profile,
          isFollowing: next,
          followers: Math.max(0, (profile.followers ?? 0) + delta),
        });
      }

      const patchList = (prefix: string) => {
        const queries = qc.getQueryCache().findAll({
          predicate: (query) =>
            Array.isArray(query.queryKey) && query.queryKey[0] === prefix,
        });

        queries.forEach((query) => {
          const data = qc.getQueryData(query.queryKey);
          if (!data) return;

          if (Array.isArray(data)) {
            qc.setQueryData<PublicUser[]>(
              query.queryKey,
              data.map((user) =>
                user.username === username
                  ? {
                      ...user,
                      isFollowing: next,
                      followers: Math.max(0, (user.followers ?? 0) + delta),
                    }
                  : user
              )
            );
            return;
          }
          // - Search results update
          const maybeSearch = data as SearchUsersResult;
          if (Array.isArray(maybeSearch.users)) {
            qc.setQueryData<SearchUsersResult>(query.queryKey, {
              ...maybeSearch,
              users: maybeSearch.users.map((user) =>
                user.username === username
                  ? {
                      ...user,
                      isFollowing: next,
                      followers: Math.max(0, (user.followers ?? 0) + delta),
                    }
                  : user
              ),
            });
          }
        });
      };

      patchList('followers');
      patchList('following');
      patchList('search-users');
      patchList('my-followers');
      patchList('my-following');
      // 4. Return rollback data for error handling
      return { prevProfile, previous, action } satisfies FollowMutationContext;
    },
    onError: (_error, variables, context) => {
      const previous = // Rollback all optimistic updates
        context?.previous ?? variables?.previous ?? resolvedIsFollowing;
      if (typeof previous === 'boolean') {
        dispatch(setFollowStatus({ username, isFollowing: previous }));
      }
      if (queryKeyProfile && context?.prevProfile) {
        qc.setQueryData(queryKeyProfile, context.prevProfile);
      }
      toast.error('Couldn’t update follow status', {
        description: 'Please try again in a moment.',
      });
    },
    onSuccess: (data, variables, context) => {
      const action =
        variables?.action ??
        context?.action ??
        (resolvedIsFollowing ? 'unfollow' : 'follow');
      const fallback = action === 'follow';
      const nowFollowing =
        typeof data?.following === 'boolean' ? data.following : fallback;
      // Confirm final state and show success message
      dispatch(setFollowStatus({ username, isFollowing: nowFollowing }));
      toast.success(nowFollowing ? 'Followed' : 'Unfollowed', {
        description: nowFollowing
          ? `You’re now following @${username}.`
          : `You’ve unfollowed @${username}.`,
      });
      scheduleFeedRefresh(); // Refresh feed after delay
    },
    onSettled: () => {
      if (queryKeyProfile) {
        qc.invalidateQueries({ queryKey: queryKeyProfile });
      }
    },
  });

  const label = resolvedIsFollowing ? 'Following' : 'Follow';
  const ariaLabel =
    typeof followersCount === 'number'
      ? `${label} ${username}. ${followersCount} followers`
      : `${label} ${username}`;

  const buttonClasses = cn(
    'flex items-center justify-center gap-2 rounded-full font-semibold text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 disabled:cursor-not-allowed disabled:opacity-60',
    compact
      ? 'h-9 border border-white/20 bg-white/[0.08] px-4 text-xs hover:bg-white/[0.16]'
      : resolvedIsFollowing
      ? 'h-11 border border-white/15 bg-white/[0.05] px-7 text-white hover:bg-white/[0.12]'
      : 'h-11 bg-primary-300 px-8 text-white shadow-[0_10px_40px_rgba(86,19,163,0.35)] hover:bg-primary-300/90',
    className
  );

  const showIcon = !compact;
  const Icon = resolvedIsFollowing
    ? () => <img src='/check-circle.png' alt='' className='h-5 w-5' />
    : Plus;

  return (
    <button
      type='button'
      onClick={() => {
        if (disabled) return;
        const previous = resolvedIsFollowing;
        const action = previous ? 'unfollow' : 'follow';
        mutation.mutate({ action, previous });
      }}
      className={buttonClasses}
      disabled={disabled || mutation.isPending}
      aria-pressed={resolvedIsFollowing}
      aria-label={ariaLabel}
    >
      {mutation.isPending ? (
        <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' />
      ) : (
        showIcon && <Icon className='h-4 w-4' aria-hidden='true' />
      )}
      <span>{label}</span>
      {mutation.isPending && (
        <span className='sr-only'>Updating follow status…</span>
      )}
    </button>
  );
}
