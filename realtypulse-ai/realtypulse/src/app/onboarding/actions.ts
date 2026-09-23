'use server';

import { createClient } from '@/lib/supabase/server';
import { ensureOrganization } from '@/lib/auth/actions';
import type { ActionState } from '@/lib/auth/actions';

export async function completeOnboarding(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const organizationName = String(formData.get('organizationName') ?? '').trim();
  if (!organizationName) return { error: 'Please enter your organization name.' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { redirectTo: '/login' };

  try {
    await ensureOrganization(user.id, organizationName);
  } catch (err) {
    console.error('ensureOrganization failed during onboarding:', err);
    return { error: err instanceof Error ? err.message : 'Could not set up your workspace. Please try again.' };
  }

  return { redirectTo: '/dashboard' };
}