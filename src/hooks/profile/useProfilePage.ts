import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { useUpdateProfile } from '@/hooks/profile/useProfile';
import { type UpdateProfileFormValues, updateProfileSchema } from '@/lib/schemas/profile';
import type { UserProfileDTO } from '@/types/profile';

function toFormValues(profile: UserProfileDTO): UpdateProfileFormValues {
  return {
    name: profile.name ?? '',
    email: profile.email,
    dietType: profile.dietType,
    defaultServings: profile.defaultServings,
    allowLeftovers: profile.allowLeftovers,
    notifyPush: profile.notifyPush,
    weeklyDigest: profile.weeklyDigest,
    allowSharedLists: profile.allowSharedLists,
    allergyIds: profile.allergyIds,
  };
}

export function useProfilePage(initialProfile: UserProfileDTO) {
  const { update: updateSession } = useSession();
  const updateProfile = useUpdateProfile();

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: toFormValues(initialProfile),
  });

  // Live form values the page header mirrors, so edits show before they're saved.
  const [name, email, allergyIds] = useWatch({
    control: form.control,
    name: ['name', 'email', 'allergyIds'],
  });

  const toggleAllergy = (allergyId: string) => {
    const next = allergyIds.includes(allergyId)
      ? allergyIds.filter(id => id !== allergyId)
      : [...allergyIds, allergyId];

    form.setValue('allergyIds', next, { shouldDirty: true });
  };

  async function onSubmit(values: UpdateProfileFormValues) {
    const saved = await updateProfile.mutateAsync(values);

    // Re-baseline the form on the persisted values so isDirty reflects reality.
    // This is the only source of truth for the on-screen fields post-save — there's
    // deliberately no router.refresh() here (see AppProviders.tsx for why a session
    // update alone used to be enough to blow this away).
    form.reset(toFormValues(saved));

    // The sidebar and dashboard read name/email straight off the session; this patches
    // NextAuth's shared context so they pick it up without a remount.
    await updateSession({ name: saved.name, email: saved.email });
  }

  return {
    form,
    /** Wired to <form onSubmit> — swallows the rejected mutation, which the global toast reports. */
    handleSubmit: form.handleSubmit(values => onSubmit(values).catch(() => undefined)),
    handleCancel: () => form.reset(toFormValues(initialProfile)),
    isSaving: updateProfile.isPending,
    /** True only while the form still matches what was last persisted. */
    isSaved: updateProfile.isSuccess && !form.formState.isDirty,
    name,
    email,
    allergyIds,
    toggleAllergy,
    changePasswordOpen,
    setChangePasswordOpen,
    deleteAccountOpen,
    setDeleteAccountOpen,
  };
}
