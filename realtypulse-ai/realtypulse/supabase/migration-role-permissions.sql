-- =====================================================================
-- Migration: role-based permissions
--
-- Run this once in the Supabase SQL editor if you already ran the
-- original schema.sql on a live project. It tightens write access:
--   - staff:          read-only (was: could create/edit everything)
--   - agent:          create + edit, but cannot delete (was: could delete)
--   - admin / owner:  unchanged — full access
-- Safe to re-run.
-- =====================================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    'leads','clients','properties','deals','tasks','appointments',
    'campaigns','conversations','messages','ai_agents'
  ]
  loop
    execute format('drop policy if exists "%1$s_insert_member" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_insert_member" on public.%1$s for insert with check (public.has_org_role(organization_id, array[''owner'',''admin'',''agent'']::org_role[]));',
      t
    );

    execute format('drop policy if exists "%1$s_update_member" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_update_member" on public.%1$s for update using (public.has_org_role(organization_id, array[''owner'',''admin'',''agent'']::org_role[]));',
      t
    );

    execute format('drop policy if exists "%1$s_delete_admin" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_delete_admin" on public.%1$s for delete using (public.has_org_role(organization_id, array[''owner'',''admin'']::org_role[]));',
      t
    );
  end loop;
end $$;
