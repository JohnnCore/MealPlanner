import { PantryClient } from '@/app/PantryClient';
import { requireUserId } from '@/lib/auth-server';
import { getPantryItemsByUserId, toPantryItemDTO } from '@/server/pantry/queries';

export default async function DashboardPage() {
  const userId = await requireUserId();
  const items = await getPantryItemsByUserId(userId);

  return <PantryClient initialItems={items.map(toPantryItemDTO)} />;
}
