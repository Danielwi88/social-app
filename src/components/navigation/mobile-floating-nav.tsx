import { Plus } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { cn } from '@/lib/utils';

type MobileFloatingNavProps = {
  onlyMobile?: boolean;
};

export function MobileFloatingNav({
  onlyMobile = false,
}: MobileFloatingNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-6 sm:bottom-8 z-40 flex items-center justify-center',
        onlyMobile && 'md:hidden'
      )}
    >
      <nav className='pointer-events-auto flex w-full max-w-md items-center justify-between gap-8 rounded-full border border-neutral-900 bg-neutral-950/[0.8] px-6 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md h-16 sm:h-20 sm:w-[360px]'>

      
        <Link
          to='/feed'
          className='flex min-w-[64px] flex-col items-center gap-1 text-xs sm:text-md font-regular hover:font-bold hover:scale-105'
        >
          <span
            className={`flex items-center  justify-center rounded-full border ${
              isActive('/feed')
                ? ' bg-transparent border-none text-white'
                : 'border-transparent bg-transparent text-primary-300 '
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M20.04 6.81969L14.28 2.78969C12.71 1.68969 10.3 1.74969 8.79 2.91969L3.78 6.82969C2.78 7.60969 1.99 9.20969 1.99 10.4697V17.3697C1.99 19.9197 4.06 21.9997 6.61 21.9997H17.39C19.94 21.9997 22.01 19.9297 22.01 17.3797V10.5997C22.01 9.24969 21.14 7.58969 20.04 6.81969ZM12.75 17.9997C12.75 18.4097 12.41 18.7497 12 18.7497C11.59 18.7497 11.25 18.4097 11.25 17.9997V14.9997C11.25 14.5897 11.59 14.2497 12 14.2497C12.41 14.2497 12.75 14.5897 12.75 14.9997V17.9997Z"
                fill={isActive('/feed') ? '#7F51F9' : '#FDFDFD'}
              />
            </svg>
          </span>
          <span className={isActive('/feed') ? 'text-primary-300' : 'text-neutral-25'}>
            Home
          </span>
        </Link>

        <button
          type='button'
          onClick={() => navigate('/posts/new')}
          className=' cursor-pointer flex flex-col items-center gap-1 text-xs font-medium text-white'
        >
          <span className='flex size-12 items-center justify-center rounded-full bg-primary-300 hover:scale-105 hover:-translate-y-0.5 hover:bg-gradient-custom text-white shadow-[0_12px_35px_rgba(168,85,247,0.45)]'>
            <Plus className='size-6 hover:font-bold' />
          </span>
          
        </button>

        <Link
          to='/me'
          className='flex min-w-[64px] cursor-pointer flex-col items-center gap-1 text-xs sm:text-md hover:font-bold hover:scale-105'
        >
          <span
            className={`flex items-center justify-center rounded-full border ${
              isActive('/me')
                ? 'border-none bg-transparent text-primary-300'
                : 'border-transparent bg-transparent text-white/70'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 2C9.38 2 7.25 4.13 7.25 6.75C7.25 9.32 9.26 11.4 11.88 11.49C11.96 11.48 12.04 11.48 12.1 11.49C12.12 11.49 12.13 11.49 12.15 11.49C12.16 11.49 12.16 11.49 12.17 11.49C14.73 11.4 16.74 9.32 16.75 6.75C16.75 4.13 14.62 2 12 2Z"
                fill={isActive('/me') ? '#7F51F9' : '#FDFDFD'}
              />
              <path
                d="M17.08 14.1509C14.29 12.2909 9.73999 12.2909 6.92999 14.1509C5.65999 15.0009 4.95999 16.1509 4.95999 17.3809C4.95999 18.6109 5.65999 19.7509 6.91999 20.5909C8.31999 21.5309 10.16 22.0009 12 22.0009C13.84 22.0009 15.68 21.5309 17.08 20.5909C18.34 19.7409 19.04 18.6009 19.04 17.3609C19.03 16.1309 18.34 14.9909 17.08 14.1509Z"
                fill={isActive('/me') ? '#7F51F9' : '#FDFDFD'}
              />
            </svg>
          </span>
          <span
            className={isActive('/me') ? 'text-primary-300' : 'text-neutral-25'}
          >
            Profile
          </span>
        </Link>


      </nav>
    </div>
  );
}
