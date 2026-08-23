'use client';

import { Mail, User } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import { ProfileSectionCard } from '@/components/profile/ProfileSectionCard';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { UpdateProfileFormValues } from '@/lib/schemas/profile';

export function PersonalInfoSection({ form }: { form: UseFormReturn<UpdateProfileFormValues> }) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <ProfileSectionCard icon={User} title="Personal Information">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="profile-name">Full Name</FieldLabel>
          <Input
            autoComplete="name"
            id="profile-name"
            placeholder="John Doe"
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="profile-email">Email Address</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <Mail aria-hidden="true" size={16} />
            </span>
            <Input
              autoComplete="email"
              className="pl-9"
              id="profile-email"
              placeholder="you@example.com"
              type="email"
              {...register('email')}
              aria-invalid={!!errors.email}
            />
          </div>
          <FieldError errors={[errors.email]} />
        </Field>
      </div>
    </ProfileSectionCard>
  );
}
