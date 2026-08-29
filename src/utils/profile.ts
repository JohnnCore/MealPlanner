/** Initials shown in the avatar when the user has no uploaded image. */
export function getInitials(name: string | null, email: string): string {
  const source = name?.trim() || email;

  const initials = source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('');

  return initials.toUpperCase() || '?';
}
