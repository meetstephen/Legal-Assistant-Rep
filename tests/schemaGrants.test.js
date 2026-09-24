import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const source = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
const sql = source
  .replace(/--.*$/gm, '')
  .replace(/\s+/g, ' ')
  .toLowerCase();

describe('Supabase Data API grants', () => {
  it('forces every public table to be included in the deny-by-default decision', () => {
    const created = [...source.matchAll(/create table if not exists public\.(\w+)/gi)].map(match => match[1].toLowerCase()).sort();
    const revoke = sql.match(/revoke all on table ([^;]+) from anon, authenticated, service_role/)?.[1] || '';
    const decided = [...revoke.matchAll(/public\.(\w+)/g)].map(match => match[1]).sort();
    expect(decided).toEqual(created);
  });

  it.each(['workspaces', 'profiles', 'verified_cases'])('makes an explicit access decision for public.%s', table => {
    expect(sql).toContain(`revoke all on table public.workspaces, public.profiles, public.verified_cases from anon, authenticated, service_role`);
    expect(sql).toMatch(new RegExp(`grant [^;]+ on table [^;]*public\\.${table}[^;]* to (?:authenticated|service_role)`));
  });

  it('does not expose legal workspace or profile tables to anonymous visitors', () => {
    expect(sql).not.toMatch(/grant [^;]+ on table [^;]*(?:workspaces|profiles)[^;]+ to anon/);
  });

  it('keeps browser privileges least-privilege and server maintenance explicit', () => {
    expect(sql).toContain('grant select, insert, update on table public.workspaces to authenticated');
    expect(sql).toContain('grant select, update on table public.profiles to authenticated');
    expect(sql).not.toMatch(/grant [^;]*delete[^;]*public\.workspaces[^;]*to authenticated/);
    expect(sql).toContain('grant usage, select on sequence public.verified_cases_id_seq to service_role');
  });

  it('exposes only the policy helper as an authenticated RPC-capable function', () => {
    for (const fn of ['touch_updated_at', 'handle_new_user', 'protect_profile_privileges']) {
      expect(sql).toContain(`revoke all on function public.${fn}() from public, anon, authenticated`);
    }
    expect(sql).toContain('grant execute on function public.is_admin() to authenticated, service_role');
  });
});
