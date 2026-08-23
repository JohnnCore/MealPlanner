'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useChangePassword } from '@/hooks/profile/useProfile';
import { type ChangePasswordFormValues, changePasswordSchema } from '@/lib/schemas/profile';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const changePassword = useChangePassword();
  const [showPasswords, setShowPasswords] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      reset();
      setShowPasswords(false);
      changePassword.reset();
    }
  };

  const onSubmit = async (values: ChangePasswordFormValues) => {
    try {
      await changePassword.mutateAsync(values);
      handleOpenChange(false);
    } catch {
      // The global MutationCache toast already reports the failure.
    }
  };

  const inputType = showPasswords ? 'text' : 'password';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Enter your current password, then choose a new one.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Field>
            <FieldLabel htmlFor="current-password">Current Password</FieldLabel>
            <Input
              autoComplete="current-password"
              id="current-password"
              type={inputType}
              {...register('currentPassword')}
              aria-invalid={!!errors.currentPassword}
            />
            <FieldError errors={[errors.currentPassword]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="new-password">New Password</FieldLabel>
            <Input
              autoComplete="new-password"
              id="new-password"
              type={inputType}
              {...register('newPassword')}
              aria-invalid={!!errors.newPassword}
            />
            <FieldError errors={[errors.newPassword]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="confirm-password">Confirm New Password</FieldLabel>
            <Input
              autoComplete="new-password"
              id="confirm-password"
              type={inputType}
              {...register('confirmPassword')}
              aria-invalid={!!errors.confirmPassword}
            />
            <FieldError errors={[errors.confirmPassword]} />
          </Field>

          <Button
            className="px-0 text-muted-foreground"
            size="sm"
            type="button"
            variant="link"
            onClick={() => setShowPasswords(shown => !shown)}
          >
            {showPasswords ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            {showPasswords ? 'Hide passwords' : 'Show passwords'}
          </Button>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={changePassword.isPending} type="submit">
              {changePassword.isPending ? 'Updating…' : 'Update Password'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
