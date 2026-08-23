'use client';

import { Shield } from 'lucide-react';

import { ProfileSectionCard } from '@/components/profile/ProfileSectionCard';
import { Button } from '@/components/ui/button';

interface PrivacySecuritySectionProps {
  onChangePassword: () => void;
  onDeleteAccount: () => void;
}

export function PrivacySecuritySection({
  onChangePassword,
  onDeleteAccount,
}: PrivacySecuritySectionProps) {
  return (
    <ProfileSectionCard icon={Shield} title="Privacy & Security">
      <div className="space-y-3">
        <Button
          className="w-full justify-start"
          type="button"
          variant="secondary"
          onClick={onChangePassword}
        >
          Change Password
        </Button>
        <Button
          className="w-full justify-start bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30"
          type="button"
          variant="secondary"
          onClick={onDeleteAccount}
        >
          Delete Account
        </Button>
      </div>
    </ProfileSectionCard>
  );
}
