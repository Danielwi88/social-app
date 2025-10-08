import { useQuery } from '@/hooks/react-query';
import { getMyFollowers } from '../../api/users';
import { UserCard } from '../../components/users/user-card';

export default function MyFollowers() {
  const q = useQuery({
    queryKey: ['me', 'followers'],
    queryFn: getMyFollowers,
  });

  if (q.isLoading) return <p className='text-white/70'>Loading…</p>;
  if (q.isError)
    return <p className='text-rose-400'>Failed to load your followers.</p>;
  const list = q.data ?? [];

  return (
    <div className='max-w-3xl mx-auto space-y-4'>
      <h1 className='text-xl font-semibold'>My Followers</h1>
      {list.length === 0 ? (
        <p className='text-white/60'>No one follows you yet.</p>
      ) : (
        <div className='space-y-3'>
          {list.map((u) => (
            <UserCard key={u.id} u={u} profileKey={['profile', u.username]} />
          ))}
        </div>
      )}
    </div>
  );
}
