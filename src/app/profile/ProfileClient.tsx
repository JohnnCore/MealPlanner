'use client';

import type { Allergy } from '@prisma/client';
import { Check, Save } from 'lucide-react';

import { AllergiesSection } from '@/components/profile/AllergiesSection';
import { ChangePasswordDialog } from '@/components/profile/ChangePasswordDialog';
import { DeleteAccountDialog } from '@/components/profile/DeleteAccountDialog';
import { DietaryPreferencesSection } from '@/components/profile/DietaryPreferencesSection';
import { NotificationPreferencesSection } from '@/components/profile/NotificationPreferencesSection';
import { PersonalInfoSection } from '@/components/profile/PersonalInfoSection';
import { PrivacySecuritySection } from '@/components/profile/PrivacySecuritySection';
import { ProfileHeaderCard } from '@/components/profile/ProfileHeaderCard';
import { Button } from '@/components/ui/button';
import { useProfilePage } from '@/hooks/profile/useProfilePage';
import type { UserProfileDTO } from '@/types/profile';

interface ProfileClientProps {
  initialProfile: UserProfileDTO;
  allergies: Allergy[];
}

export function ProfileClient({ initialProfile, allergies }: ProfileClientProps) {
  const {
    form,
    handleSubmit,
    handleCancel,
    isSaving,
    isSaved,
    name,
    email,
    allergyIds,
    toggleAllergy,
    changePasswordOpen,
    setChangePasswordOpen,
    deleteAccountOpen,
    setDeleteAccountOpen,
  } = useProfilePage(initialProfile);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl bg-background p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your preferences and dietary information
        </p>
      </div>

      <ProfileHeaderCard email={email} image={initialProfile.image} name={name} />

      <form className="space-y-6" onSubmit={handleSubmit}>
        <PersonalInfoSection form={form} />
        <DietaryPreferencesSection form={form} />
        <AllergiesSection allergies={allergies} selectedIds={allergyIds} onToggle={toggleAllergy} />
        <NotificationPreferencesSection form={form} />

        <div className="flex justify-end gap-3">
          <Button
            disabled={!form.formState.isDirty || isSaving}
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button disabled={isSaving} type="submit">
            {isSaved ? <Check aria-hidden="true" /> : <Save aria-hidden="true" />}
            {isSaving ? 'Saving…' : isSaved ? 'Saved' : 'Save Changes'}
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <PrivacySecuritySection
          onChangePassword={() => setChangePasswordOpen(true)}
          onDeleteAccount={() => setDeleteAccountOpen(true)}
        />
      </div>

      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
      <DeleteAccountDialog
        email={email}
        open={deleteAccountOpen}
        onOpenChange={setDeleteAccountOpen}
      />
    </main>
  );
}
