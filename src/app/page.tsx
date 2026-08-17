import { requireUser } from '@/lib/auth-server';

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">
        You are signed in as <b>{user.name}</b>. More features coming soon.
      </p>
    </main>
  );
}
