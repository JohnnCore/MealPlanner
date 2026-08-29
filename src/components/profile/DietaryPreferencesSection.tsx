'use client';

import { Utensils } from 'lucide-react';
import { Controller, type UseFormReturn } from 'react-hook-form';

import { ProfileSectionCard } from '@/components/profile/ProfileSectionCard';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DIET_TYPE_LABELS, DIET_TYPES } from '@/constants/profile';
import { MAX_SERVINGS, MIN_SERVINGS, type UpdateProfileFormValues } from '@/lib/schemas/profile';

export function DietaryPreferencesSection({
  form,
}: {
  form: UseFormReturn<UpdateProfileFormValues>;
}) {
  const {
    control,
    register,
    formState: { errors },
  } = form;

  return (
    <ProfileSectionCard icon={Utensils} title="Dietary Preferences">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="profile-servings">Default Servings</FieldLabel>
          <Input
            id="profile-servings"
            max={MAX_SERVINGS}
            min={MIN_SERVINGS}
            type="number"
            {...register('defaultServings', { valueAsNumber: true })}
            aria-invalid={!!errors.defaultServings}
          />
          <FieldDescription>Number of people you typically cook for</FieldDescription>
          <FieldError errors={[errors.defaultServings]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="profile-diet">Diet Type</FieldLabel>
          <Controller
            control={control}
            name="dietType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full" id="profile-diet">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIET_TYPES.map(diet => (
                    <SelectItem key={diet} value={diet}>
                      {DIET_TYPE_LABELS[diet]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.dietType]} />
        </Field>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 border-t pt-4">
        <div>
          <FieldLabel htmlFor="profile-leftovers">Plan for Leftovers</FieldLabel>
          <p className="text-sm text-muted-foreground">
            Scale recipes up so a meal covers more than one sitting
          </p>
        </div>
        <Controller
          control={control}
          name="allowLeftovers"
          render={({ field }) => (
            <Switch checked={field.value} id="profile-leftovers" onCheckedChange={field.onChange} />
          )}
        />
      </div>
    </ProfileSectionCard>
  );
}
