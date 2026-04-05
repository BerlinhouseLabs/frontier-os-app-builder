import { describe, it, expect } from 'vitest';
import { parseFrontmatter, parseManifest, parseState, parseRoadmap } from '../parser.js';

describe('parseFrontmatter', () => {
  it('returns empty for empty string', () => {
    const result = parseFrontmatter('');
    expect(result).toEqual({ frontmatter: {}, body: '' });
  });

  it('returns body only when no frontmatter delimiters', () => {
    const result = parseFrontmatter('Just some text\nwith lines');
    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe('Just some text\nwith lines');
  });

  it('parses basic key-value string pairs', () => {
    const input = '---\nname: My App\nstatus: active\n---\nbody text';
    const result = parseFrontmatter(input);
    expect(result.frontmatter.name).toBe('My App');
    expect(result.frontmatter.status).toBe('active');
    expect(result.body).toBe('body text');
  });

  it('strips quotes from string values', () => {
    const input = '---\nname: "Quoted Value"\nsingle: \'Single Quoted\'\n---\n';
    const result = parseFrontmatter(input);
    expect(result.frontmatter.name).toBe('Quoted Value');
    expect(result.frontmatter.single).toBe('Single Quoted');
  });

  it('parses boolean values', () => {
    const input = '---\nenabled: true\ndisabled: false\n---\n';
    const result = parseFrontmatter(input);
    expect(result.frontmatter.enabled).toBe(true);
    expect(result.frontmatter.disabled).toBe(false);
  });

  it('parses integer values', () => {
    const input = '---\nport: 5173\ncount: 0\n---\n';
    const result = parseFrontmatter(input);
    expect(result.frontmatter.port).toBe(5173);
    expect(result.frontmatter.count).toBe(0);
  });

  it('parses empty values', () => {
    const input = '---\nempty_val:\npipe_val: |\n---\n';
    const result = parseFrontmatter(input);
    // Standard YAML: bare `key:` yields null, `key: |` with no continuation yields empty string
    expect(result.frontmatter.empty_val).toBeNull();
    expect(result.frontmatter.pipe_val).toBe('');
  });

  it('parses empty array', () => {
    const input = '---\nitems: []\n---\n';
    const result = parseFrontmatter(input);
    expect(result.frontmatter.items).toEqual([]);
  });

  it('parses inline array', () => {
    const input = '---\nmodules: [wallet, user, events]\n---\n';
    const result = parseFrontmatter(input);
    expect(result.frontmatter.modules).toEqual(['wallet', 'user', 'events']);
  });

  it('parses inline array with quoted items', () => {
    const input = '---\nitems: ["foo", \'bar\', baz]\n---\n';
    const result = parseFrontmatter(input);
    expect(result.frontmatter.items).toEqual(['foo', 'bar', 'baz']);
  });

  it('parses multiline YAML list with dashes', () => {
    const input = '---\nmodules:\n  - wallet\n  - user\n  - events\n---\n';
    const result = parseFrontmatter(input);
    expect(result.frontmatter.modules).toEqual(['wallet', 'user', 'events']);
  });

  it('parses multiline continuation (indented text)', () => {
    const input = '---\ndescription:\n  This is a long\n  description text\n---\n';
    const result = parseFrontmatter(input);
    // Standard YAML: bare key with indented continuation is a folded string (joined with space)
    expect(result.frontmatter.description).toBe('This is a long description text');
  });

  it('separates body from frontmatter', () => {
    const input = '---\ntitle: Test\n---\n# Hello World\n\nSome content here.';
    const result = parseFrontmatter(input);
    expect(result.frontmatter.title).toBe('Test');
    expect(result.body).toBe('# Hello World\n\nSome content here.');
  });

  it('handles keys with hyphens', () => {
    const input = '---\nnext_action: plan\nsdk-phase: 2\n---\n';
    const result = parseFrontmatter(input);
    expect(result.frontmatter.next_action).toBe('plan');
    expect(result.frontmatter['sdk-phase']).toBe(2);
  });
});

describe('parseManifest', () => {
  it('parses valid manifest with all fields', () => {
    const manifest = JSON.stringify({
      name: 'Test App',
      description: 'A test app',
      devPort: 3000,
      modules: ['wallet', 'user'],
      permissions: ['wallet.getBalance'],
      milestone: 'v2',
      sdkPhase: 2,
      phases: [
        { number: 1, name: 'Scaffold', status: 'complete' },
        { number: 2, name: 'Features', status: 'in-progress' },
      ],
    });
    const result = parseManifest(manifest);
    expect(result.name).toBe('Test App');
    expect(result.description).toBe('A test app');
    expect(result.devPort).toBe(3000);
    expect(result.modules).toEqual(['wallet', 'user']);
    expect(result.permissions).toEqual(['wallet.getBalance']);
    expect(result.milestone).toBe('v2');
    expect(result.sdkPhase).toBe(2);
    expect(result.phases).toHaveLength(2);
    expect(result.phases![0].status).toBe('complete');
  });

  it('provides defaults for missing fields', () => {
    const result = parseManifest('{}');
    expect(result.name).toBe('');
    expect(result.description).toBe('');
    expect(result.devPort).toBe(5173);
    expect(result.modules).toEqual([]);
    expect(result.permissions).toEqual([]);
    expect(result.milestone).toBe('v1');
    expect(result.sdkPhase).toBeNull();
    expect(result.phases).toEqual([]);
  });

  it('clamps invalid devPort to default', () => {
    expect(parseManifest(JSON.stringify({ devPort: 0 })).devPort).toBe(5173);
    expect(parseManifest(JSON.stringify({ devPort: -1 })).devPort).toBe(5173);
    expect(parseManifest(JSON.stringify({ devPort: 65536 })).devPort).toBe(5173);
    expect(parseManifest(JSON.stringify({ devPort: 'abc' })).devPort).toBe(5173);
  });

  it('normalizes "completed" phase status to "complete"', () => {
    const manifest = JSON.stringify({
      phases: [{ number: 1, name: 'Test', status: 'completed' }],
    });
    const result = parseManifest(manifest);
    expect(result.phases![0].status).toBe('complete');
  });

  it('defaults missing phase status to "not-started"', () => {
    const manifest = JSON.stringify({
      phases: [{ number: 1, name: 'Test' }],
    });
    const result = parseManifest(manifest);
    expect(result.phases![0].status).toBe('not-started');
  });

  it('handles non-array modules gracefully', () => {
    const result = parseManifest(JSON.stringify({ modules: 'wallet' }));
    expect(result.modules).toEqual([]);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseManifest('not json')).toThrow();
  });
});

describe('parseState', () => {
  it('extracts fields from frontmatter', () => {
    const input = '---\nphase: 2\nplan: 1\nstatus: executing\nnext_action: verify\n---\nBody';
    const result = parseState(input);
    expect(result.currentPhase).toBe(2);
    expect(result.currentPlan).toBe(1);
    expect(result.status).toBe('executing');
    expect(result.nextAction).toBe('verify');
  });

  it('extracts progress percentage from body', () => {
    const input = '---\nstatus: active\n---\nProgress: [===>    ] 45%\nOther text';
    const result = parseState(input);
    expect(result.progressPercent).toBe(45);
  });

  it('extracts core value from body', () => {
    const input = '---\nstatus: active\n---\n**Core value:** Fast payments for everyone';
    const result = parseState(input);
    expect(result.coreValue).toBe('Fast payments for everyone');
  });

  it('provides defaults for missing fields', () => {
    const result = parseState('---\n---\nNo fields');
    expect(result.currentPhase).toBe(1);
    expect(result.currentPlan).toBe(0);
    expect(result.status).toBe('unknown');
    expect(result.nextAction).toBe('');
    expect(result.progressPercent).toBe(0);
    expect(result.coreValue).toBe('');
  });

  it('handles content with no frontmatter', () => {
    const result = parseState('Just plain text');
    expect(result.currentPhase).toBe(1);
    expect(result.status).toBe('unknown');
  });
});

describe('parseRoadmap', () => {
  it('parses markdown table rows', () => {
    const input = `
| Phase | Plans | Status | Notes |
|-------|-------|--------|-------|
| 1. Scaffold | 2/3 | in-progress | building |
| 2. Features | 0/2 | not-started | pending |
`;
    const result = parseRoadmap(input);
    expect(result.planCounts[1]).toEqual({ complete: 2, total: 3 });
    expect(result.planCounts[2]).toEqual({ complete: 0, total: 2 });
  });

  it('returns empty planCounts when no table found', () => {
    const result = parseRoadmap('# Roadmap\n\nNo table here.');
    expect(result.planCounts).toEqual({});
  });

  it('skips malformed rows', () => {
    const input = `
| Phase | Plans | Status | Notes |
| not a phase | bad | foo | bar |
| 1. Valid | 3/5 | ok | yes |
`;
    const result = parseRoadmap(input);
    expect(Object.keys(result.planCounts)).toHaveLength(1);
    expect(result.planCounts[1]).toEqual({ complete: 3, total: 5 });
  });

  it('handles multiple phases', () => {
    const input = `
| 1. Phase One | 1/1 | complete | done |
| 2. Phase Two | 2/4 | active | wip |
| 3. Phase Three | 0/3 | pending | waiting |
`;
    const result = parseRoadmap(input);
    expect(Object.keys(result.planCounts)).toHaveLength(3);
    expect(result.planCounts[3]).toEqual({ complete: 0, total: 3 });
  });
});
