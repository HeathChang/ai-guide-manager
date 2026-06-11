import { useId } from 'react';
import { Heading, Stack, Text } from 'null_ong2-design-system';
import { Button, Modal } from '@/shared/ui';

interface UsageGuideDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

interface BootstrapTarget {
  readonly tool: string;
  readonly fileName: string;
  readonly description: string;
}

const BOOTSTRAP_TARGETS: readonly BootstrapTarget[] = [
  { tool: '(항상 동봉)', fileName: 'AGENTS.md', description: '범용 표준 — AGENTS.md 지원 도구 전부가 자동으로 읽음' },
  { tool: 'Claude Code', fileName: 'CLAUDE.md', description: '세션 시작 시 자동 로드' },
  { tool: 'Cursor', fileName: '.cursor/rules/*.mdc', description: '전역 + 경로 스코핑(globs) 규칙 자동 첨부' },
  { tool: 'GitHub Copilot', fileName: '.github/instructions/*.instructions.md', description: '전역 + 경로 스코핑(applyTo)' },
  { tool: '직접 설정 / 기타', fileName: 'RULER-BOOTSTRAP.md', description: '매 세션 복붙용 프롬프트 + 경로 안내' },
];

export const UsageGuideDialog = ({ open, onClose }: UsageGuideDialogProps) => {
  const titleId = useId();

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} size="lg">
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
                  핵심 — ZIP을 풀어 프로젝트 루트에 그대로 복사하면 끝
                </Text>
                <Text size="sm" color="muted">
                  ZIP에는 규칙 본문(<span className="font-mono">ruler/</span>)과 선택한 AI 툴의 <strong>부트스트랩 파일이 이미 함께</strong> 들어 있습니다.
                  예전처럼 <span className="font-mono">ruler/</span> 를 직접 만들거나 <span className="font-mono">CLAUDE.md</span> 를 손으로 작성할 필요가 없습니다.
                </Text>
              </Stack>
            </div>

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
              description="다운로드받은 ai-ruler-{stack}-{framework}-{날짜}.zip 을 풀면 규칙 본문(ruler/), 선택한 AI 툴의 부트스트랩 파일, 설치 안내(START-HERE.md)가 함께 나타납니다."
            />

            <UsageStep
              index={2}
              title="폴더 내용을 프로젝트 루트로 복사"
              description="압축 해제된 폴더의 내용을 통째로 프로젝트 루트에 복사합니다. 별도 디렉토리 생성·파일 재배치가 필요 없습니다. 선택한 프레임워크와 상태 관리 라이브러리에 맞춰 ruler/ 안의 파일 구성이 달라집니다."
            >
              <CodeBlock
                code={`프로젝트루트/
├── CLAUDE.md           ← 선택한 툴의 부트스트랩 (자동 생성)
├── START-HERE.md       ← 설치 안내
├── src/
├── package.json
└── ruler/             ← 규칙 본문 (AI가 읽는 실제 룰)
    ├── base.md
    ├── frontend.md         ← React 기본 / 또는 vue.md · next.md · svelte.md ...
    ├── state/
    │   └── zustand.md      ← 선택한 상태 관리 룰 (있을 경우)
    └── ...`}
              />
              <Text size="sm" color="muted">
                💡 <span className="font-mono">ruler/</span> 와 <span className="font-mono">CLAUDE.md</span> 는 보이는 그대로 복사하면 됩니다. 단, <strong>Cursor·Copilot을 선택</strong>했다면 부트스트랩 파일이 <span className="font-mono">.cursor/</span>·<span className="font-mono">.github/</span> 같은 숨김 폴더에 있으니, Finder에서 <span className="font-mono">Cmd+Shift+.</span> 로 표시하거나 터미널 <span className="font-mono">cp -R . 대상경로/</span> 로 빠짐없이 복사하세요.
              </Text>
            </UsageStep>

            <UsageStep
              index={3}
              title="AI 도구 연동 — 추가 작성 불필요"
              description="선택한 AI 툴에 맞는 부트스트랩 파일이 ZIP에 이미 포함되어 있어, ruler/ 를 자동으로 읽도록 연결합니다. 직접 만들 필요가 없습니다."
            >
              <div className="overflow-hidden rounded-btn border border-border-base">
                {BOOTSTRAP_TARGETS.map((target, idx) => (
                  <div
                    key={target.fileName}
                    className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 p-3 ${idx > 0 ? 'border-t border-border-base' : ''}`}
                  >
                    <Text as="span" size="sm" weight="semibold" className="min-w-[120px]">
                      {target.tool}
                    </Text>
                    <Text as="span" size="xs" color="muted" className="font-mono">
                      {target.fileName}
                    </Text>
                    <Text as="span" size="sm" color="muted">
                      {target.description}
                    </Text>
                  </div>
                ))}
              </div>
              <Text size="sm" color="muted">
                Windsurf · Cline 등 다른 도구는 <span className="font-mono">RULER-BOOTSTRAP.md</span>(직접 설정 옵션)의 경로 표를 참고해 각 도구의 설정 파일이 <span className="font-mono">ruler/</span> 를 읽도록 연결하면 됩니다.
              </Text>
            </UsageStep>

            <UsageStep
              index={4}
              title="Git 공유"
              description="ruler/ 와 부트스트랩 파일(CLAUDE.md 등)은 팀이 공유하도록 모두 커밋합니다. 규칙은 ruler/ 한 곳에만 두고 부트스트랩이 그걸 가리키므로 중복이 없습니다. 개인용 로컬 오버라이드만 .gitignore 처리하세요."
            />

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
              <CodeBlock code={`ruler/ 디렉토리의 어떤 파일을 자동으로 읽었는지 알려줘.\n읽지 않은 파일이 있다면 그 이유는?`} />
              <Text size="sm" color="muted">
                Claude가 실제 파일 목록을 답하면 부트스트랩 성공. 일반론으로 답하면 부트스트랩 파일(CLAUDE.md 등)이 프로젝트 루트에 있는지 재확인하세요.
              </Text>
            </UsageStep>
          </Stack>
        </div>

        <footer className="flex justify-end border-t border-border-base p-6">
          <Button onClick={onClose}>닫기</Button>
        </footer>
    </Modal>
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

interface CodeBlockProps {
  readonly code: string;
}

const CodeBlock = ({ code }: CodeBlockProps) => (
  <pre className="m-0 overflow-x-auto whitespace-pre rounded-btn bg-bg-muted p-3 font-mono text-xs text-text-main">
    <code>{code}</code>
  </pre>
);
