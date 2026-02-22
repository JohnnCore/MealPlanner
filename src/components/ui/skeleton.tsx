import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-accent animate-pulse rounded-md motion-reduce:animate-none', className)}
      {...props}
    />
  );
}

export { Skeleton };
