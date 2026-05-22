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
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
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
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-card border border-border-base bg-bg-card shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-border-base p-6">
          <Heading id={titleId} as="h2" size="lg">
            다운로드한 규칙 적용 방법
          </Heading>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="닫기">
            ✕
          </Button>
        </header>

        <div className="overflow-y-auto p-6">
          <Stack spacing="lg">
            <div className="rounded-btn border border-border-base bg-bg-base p-4">
              <Stack spacing="xs">
                <Text weight="semibold" size="sm">
                  빌더 화면의 보조 도구
                </Text>
                <Text size="sm" color="muted">
                  · 헤더의 <strong>토큰 진행바</strong> — 선택된 룰셋이 권장 한도(≈ 10K tok) 안에 들어오는지 항상 확인할 수 있습니다.
                </Text>
                <Text size="sm" color="muted">
                  · <strong>분석</strong> 버튼 — 모호 표현·근거 누락·토큰 초과·빈 섹션을 한 번에 검출합니다.
                </Text>
                <Text size="sm" color="muted">
                  · <strong>검증 프롬프트</strong> 버튼 — Claude가 룰을 실제로 따르는지 확인하는 3-step 프롬프트를 복사할 수 있습니다.
                  다운로드 직후에도 자동으로 노출됩니다.
                </Text>
              </Stack>
            </div>

            <UsageStep
              index={1}
              title="ZIP 파일 압축 해제"
              description="다운로드받은 ai-ruler-{stack}-{framework}-{날짜}.zip 을 압축 해제하면 선택한 규칙 파일들이 나타납니다."
            />

            <UsageStep
              index={2}
              title="프로젝트 루트에 .ruler/ 디렉토리 배치"
              description="프로젝트 루트에 .ruler/ 디렉토리를 만들고, 압축 해제한 파일들을 그 안에 복사합니다. 선택한 프레임워크와 상태 관리 라이브러리에 맞춰 파일 구성이 달라집니다."
            >
              <CodeBlock
                code={`프로젝트루트/
├── src/
├── package.json
└── .ruler/          ← 여기에 복사
    ├── base.md
    ├── vue.md             ← 또는 frontend.md / next.md / svelte.md ...
    ├── state/
    │   └── pinia.md       ← 선택한 상태 관리 룰 (있을 경우)
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
              title="검증 프롬프트로 작동 확인"
              description="ZIP만 풀고 끝내지 말고, 빌더 화면의 검증 프롬프트 버튼에서 제공하는 3-step 프롬프트를 그대로 복사해 검증하세요. (다운로드 직후에도 자동 노출)"
            >
              <Stack spacing="xs">
                <Text size="sm" color="muted">
                  · <strong>Step 1</strong> — 부트스트랩이 작동했는지 (Claude가 어떤 파일을 읽었는지)
                </Text>
                <Text size="sm" color="muted">
                  · <strong>Step 2</strong> — 룰 본문까지 컨텍스트에 들어왔는지 (인용 여부)
                </Text>
                <Text size="sm" color="muted">
                  · <strong>Step 3</strong> — Claude가 룰을 인식하면서 어기는지 (위반 인식)
                </Text>
              </Stack>
              <CodeBlock code={`.ruler/ 디렉토리의 어떤 파일을 자동으로 읽었는지 알려줘.\n읽지 않은 파일이 있다면 그 이유는?`} />
              <Text size="sm" color="muted">
                Claude가 실제 파일 목록을 답하면 부트스트랩 성공. 일반론으로 답하면 CLAUDE.md / .cursorrules 설정을 재확인하세요.
              </Text>
            </UsageStep>
          </Stack>
        </div>

        <footer className="flex justify-end border-t border-border-base p-6">
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
        <span className="font-mono font-semibold text-brand">{index}.</span>
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
  <div className="rounded-btn border border-border-base p-4">
    <Stack spacing="xs">
      <div className="flex flex-wrap items-baseline gap-2">
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
  <pre className="m-0 overflow-x-auto whitespace-pre rounded-btn bg-bg-muted p-3 font-mono text-xs text-text-main">
    <code>{code}</code>
  </pre>
);
