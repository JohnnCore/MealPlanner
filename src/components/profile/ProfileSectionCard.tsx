import type { LucideIcon } from 'lucide-react';

interface ProfileSectionCardProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}

/** Shared shell for every block on the profile page — icon + heading + body. */
export function ProfileSectionCard({ icon: Icon, title, children }: ProfileSectionCardProps) {
  return (
    <section className="rounded-xl border bg-card p-6">
      <h2 className="mb-4 flex items-center gap-2 font-semibold">
        <Icon aria-hidden="true" className="size-5" />
        {title}
      </h2>
      {children}
    </section>
  );
}
