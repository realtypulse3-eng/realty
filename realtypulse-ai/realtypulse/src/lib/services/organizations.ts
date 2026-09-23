import { createClient } from '@/lib/supabase/server';
import type { OrgRole, Profile } from '@/lib/supabase/types';

export interface CurrentSession {
  userId: string;
  profile: Profile;
  organizationId: string;
  organizationName: string;
  role: OrgRole;
}

/**
 * Resolves the authenticated user's profile + their primary organization
 * and role within it. Returns null if unauthenticated or if the user has
 * not yet completed org setup (shouldn't happen post-signup, but callers
 * should handle it gracefully rather than assume).
 */
export async function getCurrentSession(): Promise<CurrentSession | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) return null;

  const { data: membership } = await supabase
    .from('memberships')
    .select('role, organization_id, organizations ( id, name )')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  const org = Array.isArray(membership.organizations) ? membership.organizations[0] : membership.organizations;

  return {
    userId: user.id,
    profile: profile as Profile,
    organizationId: membership.organization_id as string,
    organizationName: (org as { name?: string } | null)?.name ?? '',
    role: membership.role as OrgRole,
  };
}
