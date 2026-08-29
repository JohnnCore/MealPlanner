import { User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getInitials } from '@/utils/profile';

interface ProfileHeaderCardProps {
  name: string;
  email: string;
  image: string | null;
}

export function ProfileHeaderCard({ name, email, image }: ProfileHeaderCardProps) {
  const initials = getInitials(name, email);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-6 rounded-xl border bg-card p-6">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-amber-400 to-emerald-600 text-xl font-semibold text-white">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatars are arbitrary external URLs, not bundled assets
          <img alt="" className="size-full object-cover" src={image} />
        ) : initials === '?' ? (
          <User aria-hidden="true" className="size-10" />
        ) : (
          initials
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xl font-semibold">{name || 'Unnamed cook'}</p>
        <p className="truncate text-muted-foreground">{email}</p>
      </div>

      <Button disabled title="Photo uploads are coming soon" type="button" variant="secondary">
        Change Photo
      </Button>
    </div>
  );
}
