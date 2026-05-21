import { useEffect, useId, useRef, useState } from 'react';
import { Heading, Stack, Text } from 'null_ong2-design-system';
import { Button } from '@/shared/ui';
import { copyToClipboard } from '@/features/share-url';

interface VerifyPromptsDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

interface VerifyPrompt {
  readonly step: string;
  readonly title: string;
  readonly description: string;
  readonly prompt: string;
  readonly expectation: string;
}

const PROMPTS: readonly VerifyPrompt[] = [
  {
    step: 'Step 1',
    title: '부트스트랩 작동 확인',
    description:
      'CLAUDE.md 또는 부트스트랩 파일이 룰을 컨텍스트에 로드했는지 검증.',
    prompt:
      '.ruler/ 디렉토리의 어떤 파일을 자동으로 읽었는지 알려줘. 읽지 않은 파일이 있다면 그 이유는?',
    expectation:
      'Claude가 실제 읽은 파일 목록을 응답해야 정상. "잘 모르겠다" 또는 일반론이면 부트스트랩이 작동 안 한 것 → CLAUDE.md 또는 .cursorrules 설정 재확인.',
  },
  {
    step: 'Step 2',
    title: '룰 본문 적용 검증',
    description:
      '단순히 부트스트랩만 된 게 아니라 룰 *본문*까지 컨텍스트에 있는지 확인.',
    prompt:
      '이 프로젝트에서 새 컴포넌트를 만들 때 따라야 할 가장 중요한 룰 3개를 .ruler/ 에서 인용해줘.',
    expectation:
      'Claude가 실제 본문을 *인용*하면 OK. 일반적인 React 베스트프랙티스를 답하면 본문은 아직 안 읽음 → on-demand 로드 트리거가 필요.',
  },
  {
    step: 'Step 3',
    title: '위반 인식 테스트',
    description:
      'Claude가 룰을 *알면서* 어기는지, 모르고 정상 코드를 짜는지 구분.',
    prompt:
      '.ruler/ 의 룰을 어기는 가장 흔한 안티패턴 코드 1개를 일부러 짜줘. 어떤 룰을 어겼는지도 함께 명시해.',
    expectation:
      'Claude가 룰을 인용하면서 안티패턴을 보여줘야 정상. 일반 안티패턴(예: "any 타입 사용")만 답하면서 우리 룰을 인용 못 하면 룰셋이 컨텍스트에 없는 것.',
  },
];

export const VerifyPromptsDialog = ({ open, onClose }: VerifyPromptsDialogProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

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

  const handleCopy = async (idx: number, text: string) => {
    try {
      await copyToClipboard(text);
      setCopiedIdx(idx);
      window.setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      window.prompt('프롬프트를 수동으로 복사하세요', text);
    }
  };

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
          <div>
            <Heading id={titleId} as="h2" size="lg">
              Claude 검증 프롬프트
            </Heading>
            <Text size="sm" color="muted" className="mt-1">
              ZIP을 풀고 CLAUDE.md 설정한 후 다음 3개 프롬프트로 룰셋 작동을 검증하세요.
            </Text>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} aria-label="닫기">
            ✕
          </Button>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <Stack spacing="md">
            {PROMPTS.map((p, idx) => (
              <article
                key={p.step}
                className="rounded-card border border-border-base bg-bg-base p-4"
              >
                <Stack spacing="xs">
                  <div className="flex items-baseline gap-2">
                    <Text size="xs" color="muted" weight="semibold">
                      {p.step}
                    </Text>
                    <Text weight="semibold">{p.title}</Text>
                  </div>
                  <Text size="sm" color="muted">
                    {p.description}
                  </Text>
                  <pre className="mt-2 overflow-x-auto rounded-btn bg-bg-muted px-3 py-2 text-sm whitespace-pre-wrap break-words">
                    {p.prompt}
                  </pre>
                  <Text size="xs" color="muted" className="mt-1">
                    <strong>기대 응답:</strong> {p.expectation}
                  </Text>
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => handleCopy(idx, p.prompt)}
                      aria-label={`${p.step} 프롬프트 복사`}
                    >
                      {copiedIdx === idx ? '복사됨 ✓' : '복사'}
                    </Button>
                  </div>
                </Stack>
              </article>
            ))}
          </Stack>
        </div>

        <footer className="flex justify-end border-t border-border-base p-4">
          <Button onClick={onClose}>확인</Button>
        </footer>
      </div>
    </div>
  );
};
