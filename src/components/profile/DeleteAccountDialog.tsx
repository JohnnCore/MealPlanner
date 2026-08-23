'use client';

import { signOut } from 'next-auth/react';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDeleteAccount } from '@/hooks/profile/useProfile';

interface DeleteAccountDialogProps {
  email: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ email, open, onOpenChange }: DeleteAccountDialogProps) {
  const deleteAccount = useDeleteAccount();
  const [confirmEmail, setConfirmEmail] = useState('');

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setConfirmEmail('');
      deleteAccount.reset();
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAccount.mutateAsync(confirmEmail.trim());
      // The session now points at a row that no longer exists — end it immediately.
      await signOut({ callbackUrl: '/login' });
    } catch {
      // The global MutationCache toast already reports the failure.
    }
  };

  const canDelete =
    confirmEmail.trim().toLowerCase() === email.toLowerCase() && !deleteAccount.isPending;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes your pantry, recipes, meal plans and shopping lists. It cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="confirm-email">
            Type <span className="font-semibold">{email}</span> to confirm
          </Label>
          <Input
            autoComplete="off"
            id="confirm-email"
            placeholder={email}
            value={confirmEmail}
            onChange={e => setConfirmEmail(e.target.value)}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={!canDelete}
            onClick={event => {
              // Keep the dialog open so a failed delete can be retried or corrected.
              event.preventDefault();
              void handleDelete();
            }}
          >
            {deleteAccount.isPending ? 'Deleting…' : 'Delete Account'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
