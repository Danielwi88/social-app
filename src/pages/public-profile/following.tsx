import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@/hooks/react-query';
import { getFollowing, getPublicUser } from '../../api/users';
import { UserCard } from '../../components/users/user-card';

export default function PublicFollowing() {
  const { username = '' } = useParams();

  const profile = useQuery({
    queryKey: ['profile', username],
    queryFn: () => getPublicUser(username),
    enabled: !!username,
  });

  const q = useQuery({
    queryKey: ['following', username],
    queryFn: () => getFollowing(username),
    enabled: !!username,
  });

  if (profile.isLoading || q.isLoading)
    return <p className='text-white/70'>Loading…</p>;
  if (profile.isError || !profile.data)
    return <p className='text-rose-400'>User not found.</p>;
  if (q.isError)
    return <p className='text-rose-400'>Failed to load following.</p>;

  const u = profile.data;
  const list = q.data ?? [];

  return (
    <div className='max-w-3xl mx-auto space-y-4'>
      <header className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-semibold'>Following</h1>
          <div className='text-white/70'>
            for{' '}
            <Link to={`/profile/${u.username}`} className='underline'>
              @{u.username}
            </Link>
          </div>
        </div>
      </header>

      {list.length === 0 ? (
        <p className='text-white/60'>Not following anyone yet.</p>
      ) : (
        <div className='space-y-3'>
          {list.map((x) => (
            <UserCard key={x.id} u={x} profileKey={['profile', x.username]} />
          ))}
        </div>
      )}
    </div>
  );
}
