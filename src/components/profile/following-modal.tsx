import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { getUserFollowing, getMyFollowing } from '../../api/users';
import { Button } from '../ui/button';
import { FollowButton } from '../users/follow-button';
import { AvatarWithFallback } from '../ui/avatar-with-fallback';
import type { PublicUser } from '../../types/user';
import type { MeResponse } from '../../api/me';

type FollowingModalProps = {
  username: string;
  isOpen: boolean;
  onClose: () => void;
  isMe?: boolean;
};

export function FollowingModal({
  username,
  isOpen,
  onClose,
  isMe = false,
}: FollowingModalProps) {
  const qc = useQueryClient();
  const me = qc.getQueryData<MeResponse>(['me']);

  const {
    data: following,
    isLoading,
    isError,
  } = useQuery({
    queryKey: isMe ? ['my-following'] : ['following', username],
    queryFn: () => (isMe ? getMyFollowing() : getUserFollowing(username)),
    enabled: isOpen && (isMe || !!username),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm '>
      <div className='flex flex-col items-end'>
        <div className='flex items-center justify-between mb-0'>
          <Button
            onClick={onClose}
            className='h-8 w-8  p-0 text-neutral-25 bg-transparent rounded-full'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
        <div className='rounded-2xl bg-neutral-950 p-5 max-w-[548px] lg:w-[548px] lg:h-[530px] overflow-y-auto'>
          <h2 className='text-xl font-semibold text-white mb-5'>Following</h2>
          <div className='max-h-[530px] w-full '>
            {isLoading ? (
              <p className='text-white/70 text-center py-8'>
                Loading following...
              </p>
            ) : isError ? (
              <p className='text-rose-400 text-center py-8'>
                Failed to load following
              </p>
            ) : !following || following.length === 0 ? (
              <p className='text-white/60 text-center py-8'>
                Not following anyone yet
              </p>
            ) : (
              <div className='space-y-3'>
                {following.map((user: PublicUser) => (
                  <div
                    key={user.id}
                    className='flex items-center justify-between'
                  >
                    <div className='flex items-center space-y-2 gap-3'>
                      <AvatarWithFallback
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className='h-10 w-10 rounded-full border border-white/15 bg-white/5 object-cover'
                      />
                      <div>
                        <p className='text-sm font-medium text-white'>
                          {user.displayName}
                        </p>
                        <p className='text-xs text-white/60'>
                          @{user.username}
                        </p>
                      </div>
                    </div>
                    <FollowButton
                      username={user.username}
                      queryKeyProfile={['profile', user.username] as const}
                      isFollowing={user.isFollowing}
                      followersCount={0}
                      disabled={user.isMe || user.username === me?.username}
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
