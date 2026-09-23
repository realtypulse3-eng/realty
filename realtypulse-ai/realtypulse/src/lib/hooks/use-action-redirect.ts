'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Watches an ActionState-shaped object for a `redirectTo` field and
 * navigates there client-side as soon as it appears. Paired with
 * useActionState (./use-action-state.ts) for auth/onboarding flows,
 * where the server action can't reliably redirect() itself because it's
 * invoked as a plain function call rather than a native form submission.
 *
 * router.refresh() is called alongside push() so server components on
 * the destination (e.g. the protected app layout, which reads the auth
 * session) re-run with fresh data instead of serving a cached render.
 */
export function useActionRedirect(redirectTo: string | undefined) {
  const router = useRouter();

  useEffect(() => {
    if (!redirectTo) return;
    router.push(redirectTo);
    router.refresh();
  }, [redirectTo, router]);
}
