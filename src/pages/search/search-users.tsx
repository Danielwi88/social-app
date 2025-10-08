import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { UserCard } from '../../components/users/user-card';
import { useSearchUsers } from '../../hooks/react-query';

export default function SearchUsers() {
  const [sp, setSp] = useSearchParams();
  const initial = sp.get('q') ?? '';
  const [q, setQ] = useState(initial);
  const debounced = useDebounce(q, 350);

  // reflect debounced value into URL (?q=)
  useEffect(() => {
    setSp(
      (prev) => {
        const prevString = prev.toString();
        const next = new URLSearchParams(prev);
        if (debounced) next.set('q', debounced);
        else next.delete('q');
        return next.toString() === prevString ? prev : next; // Only update if actually changed (prevent infinite loops)
      },
      { replace: true }
    );
  }, [debounced, setSp]);

  const enabled = debounced.trim().length >= 2; // Minimum 2 characters

  const res = useSearchUsers(debounced, { enabled });

  return (
    <div className='max-w-3xl rounded-xl mx-auto space-y-6'>
      <header>
        <h1 className='text-xl font-semibold'>Search Users</h1>
        <p className='text-white/60 text-sm'>Type at least 2 characters.</p>
        <div className='mt-3'>
          <div className='flex items-center gap-2'>
            <div className='flex-1 relative'>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder='Search by name or username'
                className='w-full rounded-xl bg-zinc-900 px-4 py-3 ring-1 ring-white/10 outline-none focus:ring-violet-500'
                autoFocus
              />
              {q && (
                <button
                  className='absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white'
                  onClick={() => setQ('')}
                  aria-label='Clear'
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {!enabled ? (
        <p className='text-white/60'>Start typing to search…</p>
      ) : res.isLoading ? (
        <div className='space-y-2'>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : res.isError ? (
        <p className='text-rose-400'>Failed to search users.</p>
      ) : (res.data?.users.length ?? 0) === 0 ? (
        <div className='rounded-xl border border-white/10 bg-zinc-900 p-6 text-center text-white/70'>
          No results found. Try a different keyword.
        </div>
      ) : (
        <div className='space-y-3'>
          {res.data!.users.map((u) => (
            <UserCard key={u.id} u={u} profileKey={['profile', u.username]} />
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className='flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-zinc-900 p-3'>
      <div className='flex items-center gap-3 w-full'>
        <div className='h-10 w-10 rounded-full bg-white/10' />
        <div className='flex-1'>
          <div className='h-3 w-40 bg-white/10 rounded mb-2' />
          <div className='h-3 w-24 bg-white/10 rounded' />
        </div>
      </div>
      <div className='h-8 w-24 bg-white/10 rounded-full' />
    </div>
  );
}
