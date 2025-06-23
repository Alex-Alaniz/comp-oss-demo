import { AnimatedGradientBackground } from '@/app/(app)/setup/components/AnimatedGradientBackground';
import { SetupLoadingStep } from '@/app/(app)/setup/components/SetupLoadingStep';
import { getOrganizations } from '@/data/getOrganizations';
import { auth } from '@/utils/auth';
import type { Organization } from '@comp/db/types';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

interface SetupLoadingPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function SetupLoadingPage({ params }: SetupLoadingPageProps) {
  const { orgId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user;

  if (!session || !session.session || !user) {
    return redirect('/auth');
  }

  // Fetch existing organizations
  let organizations: Organization[] = [];

  try {
    const result = await getOrganizations();
    organizations = result.organizations;
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
  }

  return (
    <>
      <AnimatedGradientBackground scale={2} />
      <SetupLoadingStep organizationId={orgId} />
    </>
  );
}
