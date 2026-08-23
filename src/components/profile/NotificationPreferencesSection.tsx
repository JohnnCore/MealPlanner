'use client';

import { Bell } from 'lucide-react';
import { Controller, type UseFormReturn } from 'react-hook-form';

import { ProfileSectionCard } from '@/components/profile/ProfileSectionCard';
import { Switch } from '@/components/ui/switch';
import type { UpdateProfileFormValues } from '@/lib/schemas/profile';

type ToggleName = 'notifyPush' | 'weeklyDigest' | 'allowSharedLists';

const TOGGLES: Array<{ name: ToggleName; label: string; description: string }> = [
  {
    name: 'notifyPush',
    label: 'Push Notifications',
    description: 'Receive alerts for recipe suggestions',
  },
  {
    name: 'weeklyDigest',
    label: 'Weekly Digest',
    description: 'Get a summary of your meal planning',
  },
  {
    name: 'allowSharedLists',
    label: 'Shared Shopping Lists',
    description: 'Allow others to add items to your lists',
  },
];

export function NotificationPreferencesSection({
  form,
}: {
  form: UseFormReturn<UpdateProfileFormValues>;
}) {
  const { control } = form;

  return (
    <ProfileSectionCard icon={Bell} title="Notification Preferences">
      <div className="space-y-4">
        {TOGGLES.map(({ name, label, description }) => (
          <div key={name} className="flex items-center justify-between gap-4">
            <div>
              <label className="font-medium" htmlFor={`profile-${name}`}>
                {label}
              </label>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Controller
              control={control}
              name={name}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  id={`profile-${name}`}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        ))}
      </div>
    </ProfileSectionCard>
  );
}
