import { useEffect, useId, useRef } from 'react';
import { Heading, Stack, Text } from 'null_ong2-design-system';
import { Button } from '@/shared/ui';

interface UsageGuideDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

const CLAUDE_SNIPPET = `# Project Rules

이 프로젝트의 코딩 규칙은 \`.ruler/\` 디렉토리에 정의되어 있다.
코드를 작성하거나 리뷰하기 전에 반드시 \`.ruler/\` 의 모든 파일을 읽고 준수할 것.`;

const CURSOR_SNIPPET = `# Project Rules

이 프로젝트의 코딩 규칙은 \`.ruler/\` 디렉토리에 정의되어 있다.
코드를 작성하거나 리뷰하기 전에 반드시 \`.ruler/\` 의 모든 파일을 읽고 준수할 것.`;

const GITIGNORE_SNIPPET = `# AI tool configs (개인 환경 — .ruler/ 는 공유)
CLAUDE.md
.cursorrules`;

export const UsageGuideDialog = ({ open, onClose }: UsageGuideDialogProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    dialogRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 grid place-items-center p-4"
      style={{ zIndex: 'var(--ds-z-modal)', backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-2xl max-h-[85vh] flex flex-col"
        style={{
          backgroundColor: 'var(--ds-color-neutral-0)',
          borderRadius: 'var(--ds-radius-xl)',
          border: '1px solid var(--ds-color-neutral-200)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        }}
      >
        <header
          className="flex items-center justify-between"
          style={{
            padding: 'var(--ds-spacing-lg)',
            borderBottom: '1px solid var(--ds-color-neutral-200)',
          }}
        >
          <Heading id={titleId} as="h2" size="lg">
            다운로드한 규칙 적용 방법
          </Heading>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="닫기">
            ✕
          </Button>
        </header>

        <div
          className="overflow-y-auto"
          style={{ padding: 'var(--ds-spacing-lg)' }}
        >
          <Stack spacing="lg">
            <UsageStep
              index={1}
              title="ZIP 파일 압축 해제"
              description="다운로드받은 ai-ruler-{stack}-{날짜}.zip 을 압축 해제하면 선택한 규칙 파일들이 나타납니다."
            />

            <UsageStep
              index={2}
              title="프로젝트 루트에 .ruler/ 디렉토리 배치"
              description="프로젝트 루트에 .ruler/ 디렉토리를 만들고, 압축 해제한 파일들을 그 안에 복사합니다."
            >
              <CodeBlock
                code={`프로젝트루트/
├── src/
├── package.json
└── .ruler/          ← 여기에 복사
    ├── base.md
    ├── frontend.md
    └── ...`}
              />
            </UsageStep>

            <UsageStep
              index={3}
              title="AI 도구 연동"
              description=".ruler/ 자체는 AI가 자동으로 읽지 않습니다. 사용하는 AI 도구의 설정 파일에서 참조하도록 연결합니다."
            >
              <Stack spacing="md">
                <ToolSection
                  name="Claude Code"
                  fileName="CLAUDE.md"
                  snippet={CLAUDE_SNIPPET}
                  description="프로젝트 루트에 CLAUDE.md 파일을 생성하고 아래 내용을 추가합니다. Claude Code는 대화 시작 시 이 파일을 자동으로 읽습니다."
                />
                <ToolSection
                  name="Cursor AI"
                  fileName=".cursorrules"
                  snippet={CURSOR_SNIPPET}
                  description="프로젝트 루트에 .cursorrules 파일을 생성하고 아래 내용을 추가합니다. Cursor는 이 파일을 프로젝트 규칙으로 자동 인식합니다."
                />
                <Text size="sm" color="muted">
                  GitHub Copilot / Windsurf / Cline 등도 동일 방식으로 각 도구의 설정 파일(<span className="font-mono">.github/copilot-instructions.md</span>, <span className="font-mono">.windsurfrules</span>, <span className="font-mono">.clinerules</span>)에 참조를 추가하면 됩니다.
                </Text>
              </Stack>
            </UsageStep>

            <UsageStep
              index={4}
              title=".gitignore 설정"
              description=".ruler/ 는 팀이 공유하도록 Git에 포함하고, 개별 AI 도구 설정 파일은 개인 환경이므로 ignore 처리합니다."
            >
              <CodeBlock code={GITIGNORE_SNIPPET} />
            </UsageStep>

            <UsageStep
              index={5}
              title="동작 확인"
              description="AI 에이전트에게 다음과 같이 질문해 연동 여부를 검증합니다."
            >
              <CodeBlock code={`.ruler/base.md 파일을 읽고 요약해줘`} />
              <Text size="sm" color="muted">
                AI가 base.md 내용을 정확히 요약하면 연동 성공입니다.
              </Text>
            </UsageStep>
          </Stack>
        </div>

        <footer
          className="flex justify-end"
          style={{
            padding: 'var(--ds-spacing-lg)',
            borderTop: '1px solid var(--ds-color-neutral-200)',
          }}
        >
          <Button onClick={onClose}>닫기</Button>
        </footer>
      </div>
    </div>
  );
};

interface UsageStepProps {
  readonly index: number;
  readonly title: string;
  readonly description: string;
  readonly children?: React.ReactNode;
}

const UsageStep = ({ index, title, description, children }: UsageStepProps) => (
  <section>
    <Stack spacing="sm">
      <div className="flex items-baseline gap-2">
        <span
          className="font-mono font-semibold"
          style={{ color: 'var(--ds-color-primary-600)' }}
        >
          {index}.
        </span>
        <Heading as="h3" size="sm">
          {title}
        </Heading>
      </div>
      <Text size="sm" color="muted">
        {description}
      </Text>
      {children}
    </Stack>
  </section>
);

interface ToolSectionProps {
  readonly name: string;
  readonly fileName: string;
  readonly snippet: string;
  readonly description: string;
}

const ToolSection = ({ name, fileName, snippet, description }: ToolSectionProps) => (
  <div
    style={{
      padding: 'var(--ds-spacing-md)',
      borderRadius: 'var(--ds-radius-md)',
      border: '1px solid var(--ds-color-neutral-200)',
    }}
  >
    <Stack spacing="xs">
      <div className="flex items-baseline gap-2 flex-wrap">
        <Text weight="semibold">{name}</Text>
        <Text as="span" size="xs" color="muted" className="font-mono">
          {fileName}
        </Text>
      </div>
      <Text size="sm" color="muted">
        {description}
      </Text>
      <CodeBlock code={snippet} />
    </Stack>
  </div>
);

interface CodeBlockProps {
  readonly code: string;
}

const CodeBlock = ({ code }: CodeBlockProps) => (
  <pre
    className="font-mono text-xs overflow-x-auto whitespace-pre"
    style={{
      padding: 'var(--ds-spacing-3)',
      backgroundColor: 'var(--ds-color-neutral-100)',
      borderRadius: 'var(--ds-radius-md)',
      color: 'var(--ds-color-neutral-900)',
      margin: 0,
    }}
  >
    <code>{code}</code>
  </pre>
);
