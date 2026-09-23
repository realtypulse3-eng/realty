'use client';

import { useActionState } from '@/lib/hooks/use-action-state';
import { useActionRedirect } from '@/lib/hooks/use-action-redirect';
import { completeOnboarding } from './actions';
import type { ActionState } from '@/lib/auth/actions';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/i18n-provider';

const initialState: ActionState = {};

export default function OnboardingPage() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(completeOnboarding, initialState);
  useActionRedirect(state.redirectTo);

  return (
    <AuthShell title={t('auth.signupTitle')} subtitle={t('auth.signupSubtitle')}>
      <form onSubmit={(e) => { e.preventDefault(); formAction(new FormData(e.currentTarget)); }} className="space-y-4">
        <div>
          <Label>{t('auth.organizationName')}</Label>
          <Input type="text" name="organizationName" required autoFocus />
        </div>
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" className="w-full" loading={pending || !!state.redirectTo}>
          {t('auth.createAccountCta')}
        </Button>
      </form>
    </AuthShell>
  );
}
