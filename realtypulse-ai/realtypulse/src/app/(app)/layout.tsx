import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/services/organizations';
import { listNotifications } from '@/lib/services/notifications';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/onboarding');
  }

  const notifications = await listNotifications(session.userId);

  return (
    <div className="flex min-h-screen">
      <Sidebar organizationName={session.organizationName} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar userName={session.profile.full_name ?? session.profile.email} notifications={notifications} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
