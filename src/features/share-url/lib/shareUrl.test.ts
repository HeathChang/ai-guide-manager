import { describe, it, expect } from 'vitest';
import {
  SELECTED_QUERY_KEY,
  buildShareUrl,
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

  it('should filter out entries that do not match the .md filename pattern', () => {
    expect(
      parseSelectedFromQuery(
        `?${SELECTED_QUERY_KEY}=base.md,not-markdown.txt,../evil.md,safe.md`,
      ),
    ).toEqual(['base.md', 'safe.md']);
  });

  it('should keep filenames up to 50 characters and reject longer ones', () => {
    const validName = `${'a'.repeat(47)}.md`;
    const tooLongName = `${'a'.repeat(48)}.md`;
    expect(validName.length).toBe(50);
    expect(tooLongName.length).toBe(51);
    expect(
      parseSelectedFromQuery(`?${SELECTED_QUERY_KEY}=${validName},${tooLongName}`),
    ).toEqual([validName]);
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

  it('should produce a round-trippable URL with parseSelectedFromQuery', () => {
    const selected = ['base.md', 'git.md', 'security.md'];
    const url = buildShareUrl({
      origin: 'https://example.com',
      pathname: '/builder/frontend',
      selected,
    });
    const query = url.slice(url.indexOf('?'));
    expect(parseSelectedFromQuery(query)).toEqual(selected);
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
