import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Trash2, UploadCloud } from 'lucide-react';
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { createPost } from '@/api/posts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function AddPost() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ image?: string; caption?: string }>(
    {}
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: (post) => {
      toast.success('Post shared', {
        description: 'Your new moment is live.',
      });
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['me', 'posts'] });
      navigate(`/posts/${post.id}`);
    },
    onError: () => {
      toast.error('Failed to share', {
        description: 'Something went wrong. Please try again.',
      });
    },
  });

  const handleFileSelection = (selected: File | null) => {
    if (!selected) {
      setFile(null);
      setPreviewUrl(null);
      return false;
    }

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(selected.type)) {
      setErrors((prev) => ({ ...prev, image: 'Please select a JPG or PNG file.' }));
      toast.error('Invalid file type', {
        description: 'Please select a JPG or PNG file.',
      });
      setFile(null);
      setPreviewUrl(null);
      return false;
    }

    setErrors((prev) => ({ ...prev, image: undefined }));
    setFile(selected);
    return true;
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    const accepted = handleFileSelection(selected);
    if (!accepted && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const droppedFile = event.dataTransfer.files?.[0] ?? null;
    const accepted = handleFileSelection(droppedFile);
    if (!accepted) {
      event.dataTransfer.clearData();
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && event.currentTarget.contains(nextTarget)) {
      return;
    }
    setIsDragOver(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: { image?: string; caption?: string } = {};

    if (!file) {
      nextErrors.image = 'Please upload an image.';
    }

    if (caption.trim().length === 0) {
      nextErrors.caption = 'Caption is required.';
    } else if (caption.trim().length > 1000) {
      nextErrors.caption = 'Caption must be under 1000 characters.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    if (!file) return;

    mutation.mutate({
      image: file,
      caption: caption.trim() || undefined,
    });
  };

  return (
    <div className='mx-auto flex max-w-[452px] flex-col gap-8 px-4 pb-16 pt-6 md:px-0'>
      

      <form
        onSubmit={handleSubmit}
        className='w-full rounded-3xl  bg-white/[0.02] shadow-[0_0_60px_rgba(124,58,237,0.08)]'
      >
        <div className='space-y-6'>
          <div className='space-y-3 w-full'>
            <label
              className='text-sm font-semibold text-white'
              htmlFor='post-image'
            >
              Photo
            </label>
            <label
              htmlFor='post-image'
              className={cn(
                'relative flex mt-1 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-neutral-900 bg-neutral-950 px-6 py-4 text-center transition hover:border-violet-500/70 hover:bg-black/60 border-dashed  ',
                errors.image && 'border-rose-500 ',
                isDragOver && 'border-violet-400/80 bg-black/60'
              )}
              onDragOver={handleDragOver}
              onDragEnter={() => setIsDragOver(true)}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt='Preview'
                  className='w-full rounded-2xl object-cover max-h-[420px]'
                />
              ) : (
                <div className='flex flex-col items-center gap-2 text-white/70'>
                  <span className='flex h-10 w-10 items-center justify-center rounded-md bg-neutral-950 border border-neutral-900 text-white'>
                    <UploadCloud className='size-5' />
                  </span>
                  <div className='text-primary-200'>Click to upload{' '}
                  <span className='text-sm font-semibold text-neutral-600'>
                     or drag and drop
                  </span>
                  </div>
                  <p className='text-sm text-neutral-600 font-semibold'>
                    PNG or JPG (max. 5mb)
                  </p>
                  
                </div>
              )}
              <Input
                id='post-image'
                type='file'
                accept='image/*'
                className='sr-only'
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </label>
            {previewUrl && (
              <div className='flex items-center justify-between text-xs text-white/50'>
                <span className='truncate pr-2' title={file?.name}>
                  {file?.name}
                </span>
                <button
                  type='button'
                  className='flex items-center gap-1 text-rose-300 transition hover:text-rose-200'
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <Trash2 className='size-3' /> Remove
                </button>
              </div>
            )}
            {errors.image && (
              <p className='text-xs text-rose-400'>{errors.image}</p>
            )}
          </div>

          <div className='space-y-0 mb-0'>
            <label
              className='text-sm font-semibold text-white'
              htmlFor='caption'
            >
              Caption
            </label>
            <textarea
              id='caption'
              value={caption}
              onChange={(event) => {
                if (errors.caption)
                  setErrors((prev) => ({ ...prev, caption: undefined }));
                setCaption(event.target.value);
              }}
              rows={5}
              placeholder='Create your caption'
              className={cn(
                'w-full rounded-2xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 ',
                errors.caption &&
                  'border-rose-500/60  focus:border-rose-400 focus:ring-rose-500/30'
              )}
              maxLength={1000}
            />
            <div className='flex items-center justify-between text-xs text-white/40'>
              {errors.caption ? (
                <span className='text-rose-400 mb-2'>{errors.caption}</span>
              ) : (
                <span />
              )}
             
            </div>
          </div>

          <Button
            type='submit'
            className='w-full h-12 rounded-full bg-primary-300 text-sm sm:text-md font-bold text-white shadow-lg transition hover:bg-gradient-custom mt-4 hover:-translate-y-0.5'
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <span className='flex items-center justify-center gap-2 '>
                <Loader2 className='size-4 animate-spin' />
                Please wait uploading your post
              </span>
            ) : (
              'Share'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
