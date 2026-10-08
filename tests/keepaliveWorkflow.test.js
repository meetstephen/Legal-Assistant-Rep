import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(new URL('../.github/workflows/supabase-keepalive.yml', import.meta.url), 'utf8');

describe('Supabase external keep-alive workflow', () => {
  it('uses the data-free RPC rather than a protected legal-data table', () => {
    expect(workflow).toContain('/rest/v1/rpc/keep_alive');
    expect(workflow).toContain('--request POST');
    expect(workflow).toContain("--data '{}'");
    expect(workflow).not.toContain('verified_cases');
  });

  it('supports the current publishable key while retaining safe migration fallbacks', () => {
    expect(workflow).toContain('SUPABASE_PUBLISHABLE_KEY');
    expect(workflow).toContain('secrets.SUPABASE_PUBLISHABLE_KEY');
    expect(workflow).toContain('secrets.SUPABASE_ANON_KEY');
    expect(workflow).not.toContain('SERVICE_ROLE');
  });
});

