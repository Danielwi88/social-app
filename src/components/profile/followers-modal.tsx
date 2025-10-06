import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { getUserFollowers, getMyFollowers } from '../../api/users';
import { Button } from '../ui/button';
import { FollowButton } from '../users/follow-button';
import { AvatarWithFallback } from '../ui/avatar-with-fallback';
import type { PublicUser } from '../../types/user';
import type { MeResponse } from '../../api/me';

type FollowersModalProps = {
  username: string;
  isOpen: boolean;
  onClose: () => void;
  isMe?: boolean;
};

export function FollowersModal({
  username,
  isOpen,
  onClose,
  isMe = false,
}: FollowersModalProps) {
  const qc = useQueryClient();
  const me = qc.getQueryData<MeResponse>(['me']);

  const {
    data: followers,
    isLoading,
    isError,
  } = useQuery({
    queryKey: isMe ? ['my-followers'] : ['followers', username],
    queryFn: () => (isMe ? getMyFollowers() : getUserFollowers(username)),
    enabled: isOpen && (isMe || !!username),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50  flex items-center justify-center bg-black/30 backdrop-blur-sm '>
      <div className='flex flex-col items-end '>
        <Button
          onClick={onClose}
          className='h-8 w-8  p-0 text-neutral-25 bg-transparent rounded-full'
        >
          <X className='h-6 w-6 text-neutral-25 cursor-pointer ' />
        </Button>

        <div className='w-full max-w-[548px] lg:w-[548px] lg:h-[530px]  rounded-2xl bg-neutral-950 p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-semibold text-white'>Followers</h2>
          </div>

          <div className='max-h-[530px] overflow-y-auto'>
            {isLoading ? (
              <p className='text-white/70 text-center py-8'>
                Loading followers...
              </p>
            ) : isError ? (
              <p className='text-rose-400 text-center py-8'>
                Failed to load followers
              </p>
            ) : !Array.isArray(followers) || followers.length === 0 ? (
              <p className='text-white/60 text-center py-8'>No followers yet</p>
            ) : (
              <div className='space-y-3'>
                {followers.map((follower: PublicUser) => (
                  <div
                    key={follower.id}
                    className='flex items-center space-y-2  justify-between'
                  >
                    <div className='flex  items-center gap-3 pr-20'>
                      <AvatarWithFallback
                        src={follower.avatarUrl}
                        alt={follower.displayName}
                        className='h-10 w-10 rounded-full border border-white/15 bg-white/5 object-cover'
                      />
                      <div>
                        <p className='text-sm font-medium text-white'>
                          {follower.displayName}
                        </p>
                        <p className='text-xs text-white/60'>
                          @{follower.username}
                        </p>
                      </div>
                    </div>
                    <FollowButton
                      username={follower.username}
                      queryKeyProfile={['profile', follower.username] as const}
                      isFollowing={follower.isFollowing}
                      followersCount={0}
                      disabled={
                        follower.isMe || follower.username === me?.username
                      }
                      className='h-8 px-3 text-xs'
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
