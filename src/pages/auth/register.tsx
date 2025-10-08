import { type ReactNode, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@/hooks/react-query';
import { isAxiosError } from 'axios';
import { register as registerApi } from '../../api/auth';
import { useAppDispatch } from '../../store';
import {
  clearAuth,
  setCredentials,
  setUser,
} from '../../features/auth/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getMe } from '../../api/me';
import { LogoGlyph } from '@/shared/logo';
import { cn } from '@/lib/utils';
import { AuthBackdrop } from './components/auth-backdrop';

const schema = z
  .object({
    name: z.string().min(1, 'Required'),
    username: z.string().min(3, 'Min 3 chars'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(6, 'Min 6 chars'),
    password: z.string().min(6, 'Min 6 chars'),
    confirmPassword: z.string().min(6, 'Min 6 chars'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const dispatch = useAppDispatch();
  const nav = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const mutate = useMutation({
    mutationFn: (values: FormValues) => {
      const { confirmPassword, ...payload } = values;
      void confirmPassword;
      return registerApi(payload);
    },
    onSuccess: async (res) => {
      dispatch(setCredentials({ token: res.token, user: null }));
      try {
        const me = await getMe();
        dispatch(
          setUser({
            id: me.id,
            username: me.username,
            displayName: me.displayName,
            avatarUrl: me.avatarUrl,
          })
        );
        toast.success('Account created', {
          description: `Welcome, ${me.displayName}!`,
        });
        nav('/feed', { replace: true });
      } catch {
        dispatch(clearAuth());
        toast.error('Registration failed', {
          description: 'Could not load account data.',
        });
      }
    },
    onError: (error) => {
      const defaultDescription = 'Make sure email and username are unique.';
      if (isAxiosError(error)) {
        const responseMessage =
          (Array.isArray(error.response?.data?.data) &&
            error.response?.data?.data[0]?.msg) ||
          error.response?.data?.message;

        toast.error('Registration failed', {
          description: responseMessage ?? defaultDescription,
        });
        return;
      }

      toast.error('Registration failed', {
        description: defaultDescription,
      });
    },
  });

  const inputBase =
    'h-12 rounded-2xl border bg-white/[0.06] text-sm text-white placeholder:text-white/40 focus:ring-2';
  const inputOk =
    'border-white/10 focus:border-violet-500 focus:ring-violet-500/70';
  const inputError =
    'border-rose-500 focus:border-rose-500 focus:ring-rose-500/50';

  return (
    <div className='relative flex min-h-dvh items-center justify-center overflow-hidden bg-black px-4 py-16 sm:px-6'>
      <AuthBackdrop variant='register' />

      <div className='relative w-full max-w-[523px] rounded-[32px] border border-white/10 bg-black/40 p-8 text-white shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10'>
        <div className='flex flex-col items-center text-center'>

          <div className="flex gap-[11px] items-center">

          <LogoGlyph className="h-[30px] w-[30px]  text-white" />
          <h1 className="text-display-xs font-bold">Sociality</h1>
          </div>

          <h1 className="text-xl font-bold mt-4 sm:mt-6">Register</h1>
          

          
        </div>

        <form
          className='mt-4 sm:mt-6 space-y-5'
          onSubmit={handleSubmit((v) => mutate.mutate(v))}
          noValidate
        >
          <FormField
            label='Name'
            error={formState.errors.name?.message}
            input={
              <Input
                {...register('name')}
                placeholder='John Doe'
                autoComplete='name'
                aria-invalid={!!formState.errors.name}
                className={cn("text-sm",
                  inputBase,
                  formState.errors.name ? inputError : inputOk
                )}
              />
            }
          />

          <FormField
            label='Username'
            error={formState.errors.username?.message}
            input={
              <Input
                {...register('username')}
                placeholder='johndoe'
                autoComplete='username'
                aria-invalid={!!formState.errors.username}
                className={cn(
                  inputBase,
                  formState.errors.username ? inputError : inputOk
                )}
              />
            }
          />

          <FormField
            label='Email'
            error={formState.errors.email?.message}
            input={
              <Input
                type='email'
                {...register('email')}
                placeholder='you@example.com'
                autoComplete='email'
                aria-invalid={!!formState.errors.email}
                className={cn(
                  inputBase,
                  formState.errors.email ? inputError : inputOk
                )}
              />
            }
          />

          <FormField
            label='Number Phone'
            error={formState.errors.phone?.message}
            input={
              <Input
                {...register('phone')}
                placeholder='0812345678'
                autoComplete='tel'
                aria-invalid={!!formState.errors.phone}
                className={cn(
                  inputBase,
                  formState.errors.phone ? inputError : inputOk
                )}
              />
            }
          />

          <FormField
            label='Password'
            error={formState.errors.password?.message}
            input={
              <Input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder='••••••••'
                autoComplete='new-password'
                aria-invalid={!!formState.errors.password}
                className={cn(
                  inputBase,
                  formState.errors.password ? inputError : inputOk,
                  'pr-12'
                )}
              />
            }
            trailing={
              <button
                type='button'
                className='absolute right-3 top-1/2 -translate-y-1/2 text-white/60 transition hover:text-white'
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
              </button>
            }
          />

          <FormField
            label='Confirm Password'
            error={formState.errors.confirmPassword?.message}
            input={
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder='Confirm your password'
                autoComplete='new-password'
                aria-invalid={!!formState.errors.confirmPassword}
                className={cn(
                  inputBase,
                  formState.errors.confirmPassword ? inputError : inputOk,
                  'pr-12'
                )}
              />
            }
            trailing={
              <button
                type='button'
                className='absolute right-3 top-1/2 -translate-y-1/2 text-white/60 transition hover:text-white'
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword ? 'Hide password' : 'Show password'
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
              </button>
            }
          />

          <Button
            type='submit'
            disabled={mutate.isPending}
            className='h-12 w-full rounded-full bg-gradient-to-r from-[#5613A3] to-[#522BC8] text-md font-bold shadow-[0_10px_40px_rgba(86,19,163,0.35)] hover:from-[#6a1fd8] hover:to-[#5b3be0] !text-white'
          >
            {mutate.isPending ? 'Creating…' : 'Submit'}
          </Button>
        </form>

        <p className='mt-4 text-center text-sm font-semibold text-neutral-25 '>
          Already have an account?{' '}
          <Link
            to='/login'
            className='font-bold text-primary-200 hover:text-violet-300 hover:scale-105 hover:font-extrabold text-sm'
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

type FormFieldProps = {
  label: string;
  error?: string;
  input: ReactNode;
  trailing?: ReactNode;
};

function FormField({ label, error, input, trailing }: FormFieldProps) {
  return (
    <div className='space-y-2'>
      <label className='text-sm font-bold tracking-wide text-neutral-25'>
        {label}
      </label>
      <div className='relative flex items-center text-sm mt-[2px]'>
        {input}
        {trailing}
      </div>
      {error && <p className='text-sm text-accent-red'>{error}</p>}
    </div>
  );
}
