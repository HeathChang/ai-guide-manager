import { describe, it, expect } from 'vitest';
import {
  FRAMEWORK_QUERY_KEY,
  SELECTED_QUERY_KEY,
  buildShareUrl,
  parseFrameworkFromQuery,
  parseSelectedFromQuery,
} from './shareUrl';

describe('parseSelectedFromQuery', () => {
  it('should return undefined when the query is empty', () => {
    expect(parseSelectedFromQuery('')).toBeUndefined();
  });

  it('should return undefined when the files parameter is missing', () => {
    expect(parseSelectedFromQuery('?other=value')).toBeUndefined();
  });

  it('should return undefined when the files parameter is empty', () => {
    expect(parseSelectedFromQuery(`?${SELECTED_QUERY_KEY}=`)).toBeUndefined();
  });

  it('should parse valid comma-separated .md filenames', () => {
    expect(
      parseSelectedFromQuery(`?${SELECTED_QUERY_KEY}=base.md,frontend.md,fsd.md`),
    ).toEqual(['base.md', 'frontend.md', 'fsd.md']);
  });

  it('should trim whitespace around filenames', () => {
    expect(
      parseSelectedFromQuery(`?${SELECTED_QUERY_KEY}= base.md , frontend.md `),
    ).toEqual(['base.md', 'frontend.md']);
  });

  it('should accept subdirectory paths like state/redux-toolkit.md', () => {
    expect(
      parseSelectedFromQuery(
        `?${SELECTED_QUERY_KEY}=state/zustand.md,harness/README.md,base.md`,
      ),
    ).toEqual(['state/zustand.md', 'harness/README.md', 'base.md']);
  });

  it('should filter out entries that do not match the .md filename pattern', () => {
    expect(
      parseSelectedFromQuery(
        `?${SELECTED_QUERY_KEY}=base.md,not-markdown.txt,../evil.md,safe.md`,
      ),
    ).toEqual(['base.md', 'safe.md']);
  });

  it('should reject path traversal attempts even with valid extension', () => {
    expect(
      parseSelectedFromQuery(
        `?${SELECTED_QUERY_KEY}=harness/..%2F..%2Fevil.md,base.md`,
      ),
    ).toEqual(['base.md']);
  });

  it('should keep filenames up to 80 characters and reject longer ones', () => {
    const validName = `${'a'.repeat(77)}.md`;
    const tooLongName = `${'a'.repeat(78)}.md`;
    expect(validName.length).toBe(80);
    expect(tooLongName.length).toBe(81);
    expect(
      parseSelectedFromQuery(`?${SELECTED_QUERY_KEY}=${validName},${tooLongName}`),
    ).toEqual([validName]);
  });
});

describe('parseFrameworkFromQuery', () => {
  it('should return undefined when missing', () => {
    expect(parseFrameworkFromQuery('')).toBeUndefined();
    expect(parseFrameworkFromQuery('?other=x')).toBeUndefined();
  });

  it('should accept frontend frameworks', () => {
    expect(parseFrameworkFromQuery(`?${FRAMEWORK_QUERY_KEY}=react`)).toBe('react');
    expect(parseFrameworkFromQuery(`?${FRAMEWORK_QUERY_KEY}=vue`)).toBe('vue');
    expect(parseFrameworkFromQuery(`?${FRAMEWORK_QUERY_KEY}=sveltekit`)).toBe('sveltekit');
  });

  it('should accept backend frameworks', () => {
    expect(parseFrameworkFromQuery(`?${FRAMEWORK_QUERY_KEY}=node-express`)).toBe('node-express');
    expect(parseFrameworkFromQuery(`?${FRAMEWORK_QUERY_KEY}=spring-boot`)).toBe('spring-boot');
  });

  it('should reject unknown values', () => {
    expect(parseFrameworkFromQuery(`?${FRAMEWORK_QUERY_KEY}=angular`)).toBeUndefined();
    expect(parseFrameworkFromQuery(`?${FRAMEWORK_QUERY_KEY}=`)).toBeUndefined();
  });
});

describe('buildShareUrl', () => {
  it('should append the selected files as a query parameter', () => {
    const url = buildShareUrl({
      origin: 'https://example.com',
      pathname: '/builder/frontend',
      selected: ['base.md', 'frontend.md'],
    });
    expect(url).toBe(
      `https://example.com/builder/frontend?${SELECTED_QUERY_KEY}=base.md%2Cfrontend.md`,
    );
  });

  it('should include framework parameter when provided', () => {
    const url = buildShareUrl({
      origin: 'https://example.com',
      pathname: '/builder/frontend',
      selected: ['base.md'],
      framework: 'vue',
    });
    expect(url).toContain(`${FRAMEWORK_QUERY_KEY}=vue`);
    expect(url).toContain(`${SELECTED_QUERY_KEY}=base.md`);
  });

  it('should produce a round-trippable URL with parseSelectedFromQuery', () => {
    const selected = ['base.md', 'git.md', 'security.md', 'state/pinia.md'];
    const url = buildShareUrl({
      origin: 'https://example.com',
      pathname: '/builder/frontend',
      selected,
      framework: 'nuxt',
    });
    const query = url.slice(url.indexOf('?'));
    expect(parseSelectedFromQuery(query)).toEqual(selected);
    expect(parseFrameworkFromQuery(query)).toBe('nuxt');
  });

  it('should produce an empty files parameter when nothing is selected', () => {
    const url = buildShareUrl({
      origin: 'https://example.com',
      pathname: '/',
      selected: [],
    });
    expect(url).toBe(`https://example.com/?${SELECTED_QUERY_KEY}=`);
  });
});
