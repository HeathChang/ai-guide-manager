import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { assembleZip, resolveZipPath, type ZipEntry } from './buildZip';
import {
  BOOTSTRAP_PATH_BY_TOOL,
  getBootstrapEntry,
  getDefaultFiles,
  getStartHereEntry,
} from '@/entities/ruler-file';
import { AI_TOOL_LIST } from '@/shared/types';

describe('resolveZipPath — 단일 정합 레이아웃', () => {
  it('룰 파일은 ruler/ 하위에 배치한다', () => {
    expect(resolveZipPath({ fileName: 'base.md', content: '' })).toBe('ruler/base.md');
    expect(resolveZipPath({ fileName: 'state/zustand.md', content: '' })).toBe('ruler/state/zustand.md');
    expect(resolveZipPath({ fileName: 'vision.md', content: '' })).toBe('ruler/vision.md');
    expect(resolveZipPath({ fileName: 'harness/agents/01-planner.md', content: '' })).toBe(
      'ruler/harness/agents/01-planner.md',
    );
  });

  it('atRoot 엔트리(툴 부트스트랩 등)는 zip 루트에 그대로 둔다', () => {
    expect(resolveZipPath({ fileName: 'CLAUDE.md', content: '', atRoot: true })).toBe('CLAUDE.md');
    expect(resolveZipPath({ fileName: '.cursor/rules/ruler.mdc', content: '', atRoot: true })).toBe(
      '.cursor/rules/ruler.mdc',
    );
    expect(resolveZipPath({ fileName: 'START-HERE.md', content: '', atRoot: true })).toBe('START-HERE.md');
  });
});

describe('getBootstrapEntry — 부트스트랩 항상 생성', () => {
  it('툴마다 규약 경로의 부트스트랩을 반환한다', () => {
    for (const tool of AI_TOOL_LIST) {
      const entry = getBootstrapEntry(tool, false);
      expect(entry.fileName).toBe(BOOTSTRAP_PATH_BY_TOOL[tool]);
      expect(entry.content.length).toBeGreaterThan(0);
    }
  });

  it('부트스트랩 본문은 ruler/ 를 가리키며 루트 평탄 경로를 쓰지 않는다', () => {
    for (const tool of AI_TOOL_LIST) {
      const lite = getBootstrapEntry(tool, false);
      expect(lite.content).toContain('ruler/');
      const harness = getBootstrapEntry(tool, true);
      expect(harness.content).toContain('ruler/vision.md');
      // 구 레이아웃의 루트 기준 참조(`harness/...` 단독)가 남지 않아야 한다.
      expect(harness.content).not.toMatch(/(^|[^.\w/])harness\/README\.md/);
    }
  });

  it('하네스 여부에 따라 내용이 달라진다 (lite ≠ full)', () => {
    const lite = getBootstrapEntry('claude-code', false);
    const full = getBootstrapEntry('claude-code', true);
    expect(lite.content).not.toBe(full.content);
    expect(full.content).toContain('Planner');
    expect(lite.content).not.toContain('Planner');
  });
});

describe('getStartHereEntry — 설치 안내 동봉', () => {
  it('START-HERE.md 를 반환하고 선택 프레임워크 예시를 반영한다', () => {
    const entry = getStartHereEntry('claude-code', false, 'vue');
    expect(entry.fileName).toBe('START-HERE.md');
    expect(entry.content).toContain('vue.md');
    expect(entry.content).toContain('CLAUDE.md');
  });

  it('하네스 포함 시 vision 작성 안내를 추가한다', () => {
    const withHarness = getStartHereEntry('cursor', true, 'react');
    expect(withHarness.content).toContain('ruler/vision.md');
    expect(withHarness.content).toContain('.cursor/rules/ruler.mdc');
  });
});

describe('assembleZip — 실제 ZIP 구조 (E2E)', () => {
  // BuilderPage.handleDownload 와 동일한 방식으로 엔트리를 구성한다.
  const buildEntries = (aiTool: 'claude-code' | 'cursor', includeHarness: boolean): ZipEntry[] => {
    const rules: ZipEntry[] = [
      { fileName: 'base.md', content: '# base' },
      { fileName: 'state/zustand.md', content: '# zustand' },
    ];
    if (includeHarness) {
      rules.push(
        { fileName: 'vision.md', content: '# vision' },
        { fileName: 'harness/agents/01-planner.md', content: '# planner' },
      );
    }
    const bootstrap = getBootstrapEntry(aiTool, includeHarness);
    const startHere = getStartHereEntry(aiTool, includeHarness, 'react');
    return [...rules, { ...bootstrap, atRoot: true }, { ...startHere, atRoot: true }];
  };

  const pathsOf = async (entries: ZipEntry[]): Promise<string[]> => {
    const bytes = await assembleZip(entries).generateAsync({ type: 'uint8array' });
    const reloaded = await JSZip.loadAsync(bytes);
    return Object.values(reloaded.files)
      .filter((f) => !f.dir)
      .map((f) => f.name)
      .sort();
  };

  it('claude-code 비-하네스: 룰은 ruler/ 하위, 부트스트랩·안내는 루트', async () => {
    const paths = await pathsOf(buildEntries('claude-code', false));
    expect(paths).toContain('ruler/base.md');
    expect(paths).toContain('ruler/state/zustand.md');
    expect(paths).toContain('CLAUDE.md');
    expect(paths).toContain('START-HERE.md');
    // 부트스트랩이 ruler/ 안으로 잘못 들어가지 않아야 한다
    expect(paths).not.toContain('ruler/CLAUDE.md');
    expect(paths).not.toContain('ruler/START-HERE.md');
  });

  it('cursor 하네스: harness 본문은 ruler/harness/ 아래, .cursor/rules/ruler.mdc 는 루트', async () => {
    const paths = await pathsOf(buildEntries('cursor', true));
    expect(paths).toContain('ruler/vision.md');
    expect(paths).toContain('ruler/harness/agents/01-planner.md');
    expect(paths).toContain('.cursor/rules/ruler.mdc');
    expect(paths).toContain('START-HERE.md');
    // 룰 외 평탄 배치가 없어야 한다(루트에 떨어진 룰 파일 0개 제외 부트스트랩/안내)
    const rootMd = paths.filter((p) => !p.includes('/') && p.endsWith('.md'));
    expect(rootMd).toEqual(['START-HERE.md']);
  });

  it('파일 내용이 보존된다', async () => {
    const entries = buildEntries('claude-code', false);
    const reloaded = await JSZip.loadAsync(await assembleZip(entries).generateAsync({ type: 'uint8array' }));
    expect(await reloaded.file('ruler/base.md')?.async('string')).toBe('# base');
    expect((await reloaded.file('CLAUDE.md')?.async('string')) ?? '').toContain('ruler/');
  });

  it('엔트리가 비면 던진다', () => {
    expect(() => assembleZip([])).toThrow();
  });
});

describe('공유 URL 다운로드 — 규칙은 ruler/ 에, 루트엔 부트스트랩만 (구조 진단)', () => {
  // 실제 사용자가 보고한 공유 URL의 files= 목록 (state 없이 진입 → includeHarness=false).
  const URL_FILES = [
    'frontend.md', 'performance.md', 'git.md', 'security.md', 'testing.md',
    'a11y.md', 'styling.md', 'fsd.md', 'base.md', 'state/recoil.md',
    'CLAUDE.md', 'vision.md', 'harness/README.md', 'harness/workflow.md',
    'harness/walkthrough.md', 'harness/agents/01-planner.md', 'harness/agents/02-researcher.md',
    'harness/agents/03-implementer.md', 'harness/agents/04-reviewer.md', 'harness/agents/05-qa.md',
    'harness/agents/06-security-auditor.md', 'harness/agents/07-guardian.md', 'harness/agents/08-reporter.md',
  ];

  it('하네스 파일은 state 없는 공유 진입에서 걸러지고, 남은 규칙은 모두 ruler/ 에 들어간다', async () => {
    // useRulerWorkspace 의 valid-필터를 그대로 재현: includeHarness=false 이면 harness/* 는 files 에 없다.
    const valid = new Set(getDefaultFiles('frontend', { framework: 'react' }).map((f) => f.fileName));
    const selectedRules = URL_FILES.filter((n) => valid.has(n));
    const ruleEntries: ZipEntry[] = selectedRules.map((fileName) => ({ fileName, content: `# ${fileName}` }));
    const entries: ZipEntry[] = [
      ...ruleEntries,
      { ...getBootstrapEntry('claude-code', false), atRoot: true },
      { ...getStartHereEntry('claude-code', false, 'react', selectedRules), atRoot: true },
    ];

    const bytes = await assembleZip(entries).generateAsync({ type: 'uint8array' });
    const reloaded = await JSZip.loadAsync(bytes);
    const paths = Object.values(reloaded.files).filter((f) => !f.dir).map((f) => f.name).sort();

    // 규칙 10개가 모두 ruler/ 안에 실재한다 (사라진 게 아님)
    for (const name of ['base.md', 'frontend.md', 'fsd.md', 'git.md', 'security.md', 'testing.md', 'a11y.md', 'styling.md', 'performance.md', 'state/recoil.md']) {
      expect(paths).toContain(`ruler/${name}`);
    }
    // zip 루트에는 정확히 2개(CLAUDE.md + START-HERE.md), 나머지는 ruler/ 하위
    const rootVisible = paths.filter((p) => !p.includes('/'));
    expect(rootVisible).toEqual(['CLAUDE.md', 'START-HERE.md']);
    // harness/* 와 CLAUDE.md(룰로 잘못 들어감)는 ruler/ 에 없다
    expect(paths.some((p) => p.startsWith('ruler/harness/'))).toBe(false);
    expect(paths).not.toContain('ruler/CLAUDE.md');
  });
});
