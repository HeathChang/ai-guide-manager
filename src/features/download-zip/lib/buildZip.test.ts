import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { assembleZip, resolveZipPath, type ZipEntry } from './buildZip';
import {
  BOOTSTRAP_PATH_BY_TOOL,
  getBootstrapEntry,
  getDefaultFiles,
  getRootEntries,
  getStartHereEntry,
  type ScopedRule,
} from '@/entities/ruler-file';
import { AI_TOOL_LIST } from '@/shared/types';

// agents-md 는 자체 설정 파일이 없고 AGENTS.md 자체가 진입점이라 getBootstrapEntry 대상이 아니다.
const CONFIG_TOOLS = AI_TOOL_LIST.filter((t) => t !== 'agents-md') as Array<
  Exclude<(typeof AI_TOOL_LIST)[number], 'agents-md'>
>;

const SAMPLE_RULES: ScopedRule[] = [
  { fileName: 'base.md', title: '기본 코딩 규칙' },
  { fileName: 'a11y.md', title: '접근성', globs: ['**/*.tsx', '**/*.jsx'] },
  { fileName: 'testing.md', title: '테스트', globs: ['**/*.test.*'] },
];

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
    expect(resolveZipPath({ fileName: 'AGENTS.md', content: '', atRoot: true })).toBe('AGENTS.md');
  });
});

describe('getBootstrapEntry — 툴별 설정 파일 (agents-md 제외)', () => {
  it('툴마다 규약 경로의 부트스트랩을 반환한다', () => {
    for (const tool of CONFIG_TOOLS) {
      const entry = getBootstrapEntry(tool, false);
      expect(entry.fileName).toBe(BOOTSTRAP_PATH_BY_TOOL[tool]);
      expect(entry.content.length).toBeGreaterThan(0);
    }
  });

  it('부트스트랩 본문은 ruler/ 를 가리키며 루트 평탄 경로를 쓰지 않는다', () => {
    for (const tool of CONFIG_TOOLS) {
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

describe('getRootEntries — AGENTS.md 항상 + 경로 스코핑 출력', () => {
  it('어떤 툴이든 AGENTS.md 를 항상 포함하고, 스코프 표에 glob을 반영한다', () => {
    for (const tool of AI_TOOL_LIST) {
      const entries = getRootEntries({ aiTool: tool, includeHarness: false, rules: SAMPLE_RULES });
      const agents = entries.find((e) => e.fileName === 'AGENTS.md');
      expect(agents).toBeDefined();
      expect(agents?.content).toContain('**/*.tsx'); // a11y 스코프
      expect(agents?.content).toContain('항상'); // base는 항상 적용
    }
  });

  it('agents-md 선택 시 AGENTS.md 만 (추가 툴 설정 없음)', () => {
    const names = getRootEntries({ aiTool: 'agents-md', includeHarness: false, rules: SAMPLE_RULES }).map(
      (e) => e.fileName,
    );
    expect(names).toEqual(['AGENTS.md']);
  });

  it('claude-code 는 AGENTS.md + CLAUDE.md', () => {
    const names = getRootEntries({ aiTool: 'claude-code', includeHarness: false, rules: SAMPLE_RULES }).map(
      (e) => e.fileName,
    );
    expect(names).toContain('AGENTS.md');
    expect(names).toContain('CLAUDE.md');
  });

  it('cursor: 스코핑 규칙마다 .cursor/rules/<name>.mdc (globs 배열 + alwaysApply:false)', () => {
    const entries = getRootEntries({ aiTool: 'cursor', includeHarness: false, rules: SAMPLE_RULES });
    const names = entries.map((e) => e.fileName);
    expect(names).toContain('.cursor/rules/ruler.mdc'); // 항상 적용 베이스
    expect(names).toContain('.cursor/rules/a11y.mdc'); // 스코프드
    expect(names).toContain('.cursor/rules/testing.mdc');
    expect(names).not.toContain('.cursor/rules/base.mdc'); // glob 없는 규칙은 베이스가 담당
    const a11y = entries.find((e) => e.fileName === '.cursor/rules/a11y.mdc');
    expect(a11y?.content).toContain('alwaysApply: false');
    expect(a11y?.content).toContain('["**/*.tsx", "**/*.jsx"]');
    expect(a11y?.content).toContain('ruler/a11y.md');
  });

  it('copilot: 스코핑 규칙마다 .github/instructions/<name>.instructions.md (applyTo)', () => {
    const entries = getRootEntries({ aiTool: 'copilot', includeHarness: false, rules: SAMPLE_RULES });
    const names = entries.map((e) => e.fileName);
    expect(names).toContain('.github/copilot-instructions.md');
    expect(names).toContain('.github/instructions/a11y.instructions.md');
    expect(names).not.toContain('.github/instructions/base.instructions.md');
    const a11y = entries.find((e) => e.fileName === '.github/instructions/a11y.instructions.md');
    expect(a11y?.content).toContain('applyTo: "**/*.tsx,**/*.jsx"');
    expect(a11y?.content).toContain('ruler/a11y.md');
  });

  it('harness 포함 시 AGENTS.md 에 8역할 협업 섹션이 들어간다', () => {
    const agents = getRootEntries({ aiTool: 'agents-md', includeHarness: true, rules: SAMPLE_RULES })[0];
    expect(agents.content).toContain('Planner');
    expect(agents.content).toContain('ruler/harness/');
  });
});

describe('getStartHereEntry — 설치 안내 동봉', () => {
  it('START-HERE.md 를 반환하고 AGENTS.md·프레임워크 예시를 반영한다', () => {
    const entry = getStartHereEntry('claude-code', false, 'vue');
    expect(entry.fileName).toBe('START-HERE.md');
    expect(entry.content).toContain('vue.md');
    expect(entry.content).toContain('CLAUDE.md');
    expect(entry.content).toContain('AGENTS.md'); // 항상 동봉되는 범용 진입점
  });

  it('하네스 포함 시 vision 작성 안내를 추가한다', () => {
    const withHarness = getStartHereEntry('cursor', true, 'react');
    expect(withHarness.content).toContain('ruler/vision.md');
    expect(withHarness.content).toContain('.cursor/rules/ruler.mdc');
  });
});

describe('assembleZip — 실제 ZIP 구조 (E2E, getRootEntries 사용)', () => {
  // BuilderPage.handleDownload 와 동일한 방식으로 엔트리를 구성한다.
  const buildEntries = (aiTool: 'claude-code' | 'cursor', includeHarness: boolean): ZipEntry[] => {
    const ruleSpecs: ScopedRule[] = [
      { fileName: 'base.md', title: '기본' },
      { fileName: 'state/zustand.md', title: 'Zustand' },
    ];
    if (includeHarness) {
      ruleSpecs.push(
        { fileName: 'vision.md', title: 'Vision' },
        { fileName: 'harness/agents/01-planner.md', title: 'Planner' },
      );
    }
    const ruleEntries: ZipEntry[] = ruleSpecs.map((r) => ({ fileName: r.fileName, content: `# ${r.fileName}` }));
    const root = getRootEntries({ aiTool, includeHarness, rules: ruleSpecs });
    const startHere = getStartHereEntry(aiTool, includeHarness, 'react', ruleSpecs.map((r) => r.fileName));
    return [
      ...ruleEntries,
      ...root.map((e) => ({ ...e, atRoot: true })),
      { ...startHere, atRoot: true },
    ];
  };

  const pathsOf = async (entries: ZipEntry[]): Promise<string[]> => {
    const bytes = await assembleZip(entries).generateAsync({ type: 'uint8array' });
    const reloaded = await JSZip.loadAsync(bytes);
    return Object.values(reloaded.files)
      .filter((f) => !f.dir)
      .map((f) => f.name)
      .sort();
  };

  it('claude-code 비-하네스: 룰은 ruler/ 하위, AGENTS.md·CLAUDE.md·START-HERE는 루트', async () => {
    const paths = await pathsOf(buildEntries('claude-code', false));
    expect(paths).toContain('ruler/base.md');
    expect(paths).toContain('ruler/state/zustand.md');
    expect(paths).toContain('AGENTS.md');
    expect(paths).toContain('CLAUDE.md');
    expect(paths).toContain('START-HERE.md');
    // 부트스트랩/표준 파일이 ruler/ 안으로 잘못 들어가지 않아야 한다
    expect(paths).not.toContain('ruler/CLAUDE.md');
    expect(paths).not.toContain('ruler/AGENTS.md');
  });

  it('cursor 하네스: harness 본문은 ruler/harness/ 아래, 루트 .md 는 AGENTS.md + START-HERE', async () => {
    const paths = await pathsOf(buildEntries('cursor', true));
    expect(paths).toContain('ruler/vision.md');
    expect(paths).toContain('ruler/harness/agents/01-planner.md');
    expect(paths).toContain('.cursor/rules/ruler.mdc');
    // 샘플 룰엔 glob이 없어 스코프드 .mdc 는 생성되지 않는다
    const rootMd = paths.filter((p) => !p.includes('/') && p.endsWith('.md'));
    expect(rootMd).toEqual(['AGENTS.md', 'START-HERE.md']);
  });

  it('파일 내용이 보존된다', async () => {
    const reloaded = await JSZip.loadAsync(
      await assembleZip(buildEntries('claude-code', false)).generateAsync({ type: 'uint8array' }),
    );
    expect(await reloaded.file('ruler/base.md')?.async('string')).toBe('# base.md');
    expect((await reloaded.file('AGENTS.md')?.async('string')) ?? '').toContain('ruler/');
  });

  it('엔트리가 비면 던진다', () => {
    expect(() => assembleZip([])).toThrow();
  });
});

describe('공유 URL 다운로드 — 규칙은 ruler/ 에, 루트엔 AGENTS.md+부트스트랩 (구조 진단)', () => {
  // 실제 사용자가 보고한 공유 URL의 files= 목록 (state 없이 진입 → includeHarness=false).
  const URL_FILES = [
    'frontend.md', 'performance.md', 'git.md', 'security.md', 'testing.md',
    'a11y.md', 'styling.md', 'fsd.md', 'base.md', 'state/recoil.md',
    'CLAUDE.md', 'vision.md', 'harness/README.md', 'harness/workflow.md',
    'harness/walkthrough.md', 'harness/agents/01-planner.md',
  ];

  it('하네스 파일은 state 없는 공유 진입에서 걸러지고, 남은 규칙은 모두 ruler/ 에 들어간다', async () => {
    // useRulerWorkspace 의 valid-필터를 그대로 재현: includeHarness=false 이면 harness/* 는 files 에 없다.
    const defs = getDefaultFiles('frontend', { framework: 'react' });
    const selected = defs.filter((f) => URL_FILES.includes(f.fileName));
    const ruleEntries: ZipEntry[] = selected.map((f) => ({ fileName: f.fileName, content: `# ${f.fileName}` }));
    const rules: ScopedRule[] = selected.map((f) => ({ fileName: f.fileName, title: f.title, globs: f.globs }));
    const root = getRootEntries({ aiTool: 'claude-code', includeHarness: false, rules });
    const startHere = getStartHereEntry('claude-code', false, 'react', selected.map((f) => f.fileName));
    const entries: ZipEntry[] = [
      ...ruleEntries,
      ...root.map((e) => ({ ...e, atRoot: true })),
      { ...startHere, atRoot: true },
    ];

    const bytes = await assembleZip(entries).generateAsync({ type: 'uint8array' });
    const reloaded = await JSZip.loadAsync(bytes);
    const paths = Object.values(reloaded.files).filter((f) => !f.dir).map((f) => f.name).sort();

    // 규칙 10개가 모두 ruler/ 안에 실재한다 (사라진 게 아님)
    for (const name of ['base.md', 'frontend.md', 'fsd.md', 'git.md', 'security.md', 'testing.md', 'a11y.md', 'styling.md', 'performance.md', 'state/recoil.md']) {
      expect(paths).toContain(`ruler/${name}`);
    }
    // 루트엔 AGENTS.md + CLAUDE.md + START-HERE.md (harness/*·CLAUDE.md 룰은 걸러져 ruler/ 에 없음)
    const rootVisible = paths.filter((p) => !p.includes('/'));
    expect(rootVisible).toEqual(['AGENTS.md', 'CLAUDE.md', 'START-HERE.md']);
    expect(paths.some((p) => p.startsWith('ruler/harness/'))).toBe(false);
    expect(paths).not.toContain('ruler/CLAUDE.md');
  });
});
