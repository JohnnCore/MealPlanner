'use client';

import type { Allergy } from '@prisma/client';
import { AlertCircle } from 'lucide-react';

import { ProfileSectionCard } from '@/components/profile/ProfileSectionCard';
import { cn } from '@/lib/utils';

interface AllergiesSectionProps {
  allergies: Allergy[];
  selectedIds: string[];
  onToggle: (allergyId: string) => void;
}

export function AllergiesSection({ allergies, selectedIds, onToggle }: AllergiesSectionProps) {
  const selectedNames = allergies.filter(a => selectedIds.includes(a.id)).map(a => a.name);

  return (
    <ProfileSectionCard icon={AlertCircle} title="Allergies & Restrictions">
      {allergies.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No allergens are configured yet. Run <code>npm run db:seed</code> to load the defaults.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {allergies.map(allergy => {
            const selected = selectedIds.includes(allergy.id);
            return (
              <button
                key={allergy.id}
                aria-pressed={selected}
                className={cn(
                  'rounded-lg border-2 px-4 py-3 text-sm transition-colors',
                  selected
                    ? 'border-destructive bg-destructive/10 text-destructive'
                    : 'hover:border-primary/50',
                )}
                type="button"
                onClick={() => onToggle(allergy.id)}
              >
                {allergy.name}
              </button>
            );
          })}
        </div>
      )}

      {selectedNames.length > 0 ? (
        <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          ⚠️ Recipes containing {selectedNames.join(', ')} will be filtered out of your suggestions.
        </p>
      ) : null}
    </ProfileSectionCard>
  );
}
