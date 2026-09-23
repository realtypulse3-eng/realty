import type { OrgRole } from '@/lib/supabase/types';

export type Capability = 'create' | 'edit' | 'delete' | 'manage_team' | 'manage_org';

// Mirrors the RLS policies in supabase/schema.sql — this only controls
// what the UI shows. The database enforces the real boundary; this just
// keeps the interface from offering buttons a role can't use.
const ROLE_CAPABILITIES: Record<OrgRole, Capability[]> = {
  owner: ['create', 'edit', 'delete', 'manage_team', 'manage_org'],
  admin: ['create', 'edit', 'delete', 'manage_team', 'manage_org'],
  agent: ['create', 'edit'],
  staff: [],
};

export function can(role: OrgRole | undefined | null, capability: Capability): boolean {
  if (!role) return false;
  return ROLE_CAPABILITIES[role].includes(capability);
}
