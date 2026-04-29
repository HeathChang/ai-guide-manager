import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Stack,
  Text,
} from 'null_ong2-design-system';
import { Button, Card, Checkbox, ThemeToggle, Tooltip } from '@/shared/ui';
import type { AiTool, Stack as StackType } from '@/shared/types';
import { AI_TOOL_LIST, AI_TOOL_LABELS } from '@/shared/types';
import { UsageGuideDialog } from '@/widgets/usage-guide';

const HARNESS_TOOLTIP_TEXT =
  '하네스 엔지니어링은 AI 에이전트가 도구 호출, 검증, 재시도 등을 안정적으로 수행하도록 실행 흐름을 설계하는 방법입니다. 포함하면 관련 규칙이 추가되어 AI 실행 시 토큰 소비량이 증가합니다.';

const AI_TOOL_TOOLTIP_TEXT =
  '선택한 툴의 자동 로드 규약에 맞춰 부트스트랩 파일이 함께 생성됩니다. 매 세션 프롬프트 복붙 없이 하네스가 자동 시작됩니다.';

const STACK_OPTIONS: ReadonlyArray<{
  stack: StackType;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    stack: 'frontend',
    title: 'Frontend',
    description: 'React / 브라우저 기반 UI를 개발할 때 사용하는 규칙 세트',
    icon: '🎨',
  },
  {
    stack: 'backend',
    title: 'Backend',
    description: 'API / 데이터베이스 / 서버 운영 중심의 규칙 세트',
    icon: '🛠️',
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [isUsageDialogOpen, setUsageDialogOpen] = useState(false);
  const [isHarnessIncluded, setHarnessIncluded] = useState(false);
  const [aiTool, setAiTool] = useState<AiTool>('claude-code');
  const handleSelect = (stack: StackType) => {
    navigate(`/builder/${stack}`, {
      state: {
        includeHarness: isHarnessIncluded,
        aiTool: isHarnessIncluded ? aiTool : undefined,
      },
    });
  };

  return (
    <Flex as="div" direction="column" className="min-h-full">
      <Box as="header" paddingY="6" className="border-b border-border-base bg-bg-card">
        <Container maxWidth="xl">
          <Flex align="center" justify="space-between">
            <Flex align="center" gap="3">
              <Box
                width="36px"
                height="36px"
                borderRadius="md"
                className="grid place-items-center bg-brand font-bold text-text-inverse"
                aria-hidden="true"
              >
                R
              </Box>
              <Text as="span" size="lg" weight="semibold">
                AI-Ruler
              </Text>
            </Flex>
            <Flex align="center" gap="2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setUsageDialogOpen(true)}
              >
                사용 방법
              </Button>
              <ThemeToggle />
              <a
                href="https://github.com/"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-text-muted"
              >
                GitHub
              </a>
            </Flex>
          </Flex>
        </Container>
      </Box>

      <Box as="main" paddingY="16" className="grid flex-1 place-items-center">
        <Container maxWidth="xl">
          <Stack spacing="2xl">
            <Stack spacing="md" align="center">
              <Heading as="h1" align="center">
                AI 에이전트를 위한 코딩 룰셋 생성기
              </Heading>
              <Text size="lg" color="muted" align="center">
                Cursor, Copilot, Claude 등 AI 코딩 에이전트에 주입할 규칙 세트를 즉시 다운로드하세요.
              </Text>
            </Stack>

            <Box as="section" aria-labelledby="options-heading">
              <Heading as="h2" size="sm" className="sr-only" id="options-heading">
                추가 옵션
              </Heading>
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="inline-flex items-center justify-center gap-2">
                  <Checkbox
                    label="하네스 엔지니어링 포함"
                    checked={isHarnessIncluded}
                    onChange={setHarnessIncluded}
                  />
                  <Tooltip content={HARNESS_TOOLTIP_TEXT}>
                    <span
                      aria-label="하네스 엔지니어링 설명"
                      className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full border-[1.5px] border-text-main text-text-main text-[11px] font-bold leading-none select-none"
                    >
                      ?
                    </span>
                  </Tooltip>
                </div>
                {isHarnessIncluded && (
                  <div className="inline-flex items-center gap-2">
                    <label
                      htmlFor="ai-tool-select"
                      className="text-sm text-text-muted"
                    >
                      사용 중인 AI 툴
                    </label>
                    <select
                      id="ai-tool-select"
                      value={aiTool}
                      onChange={(event) => setAiTool(event.target.value as AiTool)}
                      className="text-sm rounded-md border border-border-base bg-bg-card text-text-main px-2 py-1 focus:outline-none focus:border-border-accent"
                    >
                      {AI_TOOL_LIST.map((tool) => (
                        <option key={tool} value={tool}>
                          {AI_TOOL_LABELS[tool]}
                        </option>
                      ))}
                    </select>
                    <Tooltip content={AI_TOOL_TOOLTIP_TEXT}>
                      <span
                        aria-label="AI 툴 선택 설명"
                        className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full border-[1.5px] border-text-main text-text-main text-[11px] font-bold leading-none select-none"
                      >
                        ?
                      </span>
                    </Tooltip>
                  </div>
                )}
              </div>
            </Box>

            <Box as="section" aria-labelledby="stack-select-heading">
              <Heading as="h2" size="sm" className="sr-only" id="stack-select-heading">
                스택 선택
              </Heading>
              <Grid columns="repeat(auto-fit, minmax(280px, 1fr))" gap="lg">
                {STACK_OPTIONS.map((option) => (
                  <Card
                    key={option.stack}
                    className="p-6 md:p-8 hover:border-border-accent hover:shadow-md transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelect(option.stack)}
                      className="w-full text-left focus-visible:outline-none"
                      aria-label={`${option.title} 룰셋 선택`}
                    >
                      <Stack spacing="sm">
                        <Text as="span" size="4xl" aria-hidden="true">
                          {option.icon}
                        </Text>
                        <Heading as="h3">{option.title}</Heading>
                        <Text size="sm" color="muted">
                          {option.description}
                        </Text>
                        <Flex align="center" gap="1" className="mt-4">
                          <Text
                            as="span"
                            size="sm"
                            weight="medium"
                            color="primary"
                          >
                            시작하기
                          </Text>
                          <Text as="span" color="primary" aria-hidden="true">
                            →
                          </Text>
                        </Flex>
                      </Stack>
                    </button>
                  </Card>
                ))}
              </Grid>
            </Box>
          </Stack>
        </Container>
      </Box>

      <UsageGuideDialog
        open={isUsageDialogOpen}
        onClose={() => setUsageDialogOpen(false)}
      />

      <Box as="footer" paddingY="6">
        <Stack spacing="1" align="center">
          <Text size="xs" color="muted" align="center">
            Licensed under the{' '}
            <a
              href="https://opensource.org/licenses/MIT"
              target="_blank"
              rel="noreferrer"
              className="text-brand underline"
            >
              MIT License
            </a>
          </Text>
        </Stack>
      </Box>
    </Flex>
  );
};

export default LandingPage;
