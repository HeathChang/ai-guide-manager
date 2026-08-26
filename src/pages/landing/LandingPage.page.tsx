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
import type {
  AiTool,
  BackendFramework,
  EngineeringMode,
  FrontendFramework,
  Stack as StackType,
} from '@/shared/types';
import {
  AI_TOOL_LABELS,
  AI_TOOL_LIST,
  BACKEND_FRAMEWORK_LABELS,
  BACKEND_FRAMEWORK_LIST,
  DEFAULT_FRAMEWORK,
  ENGINEERING_MODE_LABELS,
  ENGINEERING_MODE_LIST,
  ENGINEERING_MODE_TOOLTIPS,
  FRONTEND_FRAMEWORK_LABELS,
  FRONTEND_FRAMEWORK_LIST,
  normalizeEngineeringModes,
} from '@/shared/types';
import { UsageGuideDialog } from '@/widgets/usage-guide';

const AI_TOOL_TOOLTIP_TEXT =
  '선택한 툴의 자동 로드 규약에 맞춰 부트스트랩 파일(CLAUDE.md · .cursor/rules/ruler.mdc 등)이 ZIP에 함께 생성됩니다. 받은 뒤 추가 설정 없이 AI가 ruler/ 규칙을 자동으로 읽습니다.';

const FRAMEWORK_TOOLTIP_TEXT =
  '선택한 프레임워크/라이브러리에 맞는 규칙 세트가 자동 구성됩니다. 빌더에서 상태 관리 도구를 추가로 선택할 수 있습니다.';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isUsageDialogOpen, setUsageDialogOpen] = useState(false);
  const [engineeringModes, setEngineeringModes] = useState<readonly EngineeringMode[]>([]);
  const [aiTool, setAiTool] = useState<AiTool>('claude-code');
  const [frontendFramework, setFrontendFramework] = useState<FrontendFramework>(
    DEFAULT_FRAMEWORK.frontend,
  );
  const [backendFramework, setBackendFramework] = useState<BackendFramework>(
    DEFAULT_FRAMEWORK.backend,
  );

  // 세 골격(하네스·루프·그래프)은 서로 직교하므로 중복 선택을 허용한다.
  // 저장은 항상 ENGINEERING_MODE_LIST 순서로 정규화해, 체크한 순서가 결과에 영향을 주지 않게 한다.
  const toggleEngineeringMode = (mode: EngineeringMode) => {
    setEngineeringModes((previous) =>
      normalizeEngineeringModes(
        previous.includes(mode)
          ? previous.filter((selected) => selected !== mode)
          : [...previous, mode],
      ),
    );
  };

  const handleSelect = (stack: StackType) => {
    const framework = stack === 'frontend' ? frontendFramework : backendFramework;
    navigate(`/builder/${stack}`, {
      state: {
        framework,
        engineeringModes,
        aiTool,
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
                <div className="flex flex-col items-center gap-2">
                  <span id="engineering-modes-label" className="text-sm text-text-muted">
                    협업 모델 (선택 사항 · 중복 선택 가능)
                  </span>
                  <div
                    role="group"
                    aria-labelledby="engineering-modes-label"
                    className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
                  >
                    {ENGINEERING_MODE_LIST.map((mode) => (
                      <div key={mode} className="inline-flex items-center gap-2">
                        <Checkbox
                          label={`${ENGINEERING_MODE_LABELS[mode]} 포함`}
                          checked={engineeringModes.includes(mode)}
                          onChange={() => toggleEngineeringMode(mode)}
                        />
                        <Tooltip content={ENGINEERING_MODE_TOOLTIPS[mode]}>
                          <span
                            aria-label={`${ENGINEERING_MODE_LABELS[mode]} 설명`}
                            className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full border-[1.5px] border-text-main text-text-main text-[11px] font-bold leading-none select-none"
                          >
                            ?
                          </span>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                  {engineeringModes.length > 1 && (
                    <Text size="xs" color="muted" align="center">
                      골격을 여러 개 켤수록 자동 로드되는 규칙과 토큰 소비가 함께 늘어납니다.
                    </Text>
                  )}
                </div>
              </div>
            </Box>

            <Box as="section" aria-labelledby="stack-select-heading">
              <Heading as="h2" size="sm" className="sr-only" id="stack-select-heading">
                스택 선택
              </Heading>
              <Grid columns="repeat(auto-fit, minmax(280px, 1fr))" gap="lg">
                <Card className="p-6 md:p-8 hover:border-border-accent hover:shadow-md transition-all">
                  <Stack spacing="sm">
                    <Text as="span" size="4xl" aria-hidden="true">
                      🎨
                    </Text>
                    <Heading as="h3">Frontend</Heading>
                    <Text size="sm" color="muted">
                      React / Vue / Svelte 등 브라우저 기반 UI 규칙 세트
                    </Text>
                    <Flex align="center" gap="2" className="mt-2">
                      <label
                        htmlFor="frontend-framework-select"
                        className="text-sm text-text-muted"
                      >
                        프레임워크
                      </label>
                      <select
                        id="frontend-framework-select"
                        value={frontendFramework}
                        onChange={(event) =>
                          setFrontendFramework(event.target.value as FrontendFramework)
                        }
                        className="flex-1 text-sm rounded-md border border-border-base bg-bg-card text-text-main px-2 py-1 focus:outline-none focus:border-border-accent"
                      >
                        {FRONTEND_FRAMEWORK_LIST.map((framework) => (
                          <option key={framework} value={framework}>
                            {FRONTEND_FRAMEWORK_LABELS[framework]}
                          </option>
                        ))}
                      </select>
                      <Tooltip content={FRAMEWORK_TOOLTIP_TEXT}>
                        <span
                          aria-label="프레임워크 선택 설명"
                          className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full border-[1.5px] border-text-main text-text-main text-[11px] font-bold leading-none select-none"
                        >
                          ?
                        </span>
                      </Tooltip>
                    </Flex>
                    <Button
                      onClick={() => handleSelect('frontend')}
                      aria-label="Frontend 룰셋 시작하기"
                      className="mt-4"
                    >
                      시작하기 →
                    </Button>
                  </Stack>
                </Card>

                <Card className="p-6 md:p-8 hover:border-border-accent hover:shadow-md transition-all">
                  <Stack spacing="sm">
                    <Text as="span" size="4xl" aria-hidden="true">
                      🛠️
                    </Text>
                    <Heading as="h3">Backend</Heading>
                    <Text size="sm" color="muted">
                      API / 데이터베이스 / 서버 운영 중심의 규칙 세트
                    </Text>
                    <Flex align="center" gap="2" className="mt-2">
                      <label
                        htmlFor="backend-framework-select"
                        className="text-sm text-text-muted"
                      >
                        프레임워크
                      </label>
                      <select
                        id="backend-framework-select"
                        value={backendFramework}
                        onChange={(event) =>
                          setBackendFramework(event.target.value as BackendFramework)
                        }
                        className="flex-1 text-sm rounded-md border border-border-base bg-bg-card text-text-main px-2 py-1 focus:outline-none focus:border-border-accent"
                      >
                        {BACKEND_FRAMEWORK_LIST.map((framework) => (
                          <option key={framework} value={framework}>
                            {BACKEND_FRAMEWORK_LABELS[framework]}
                          </option>
                        ))}
                      </select>
                      <Tooltip content={FRAMEWORK_TOOLTIP_TEXT}>
                        <span
                          aria-label="프레임워크 선택 설명"
                          className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full border-[1.5px] border-text-main text-text-main text-[11px] font-bold leading-none select-none"
                        >
                          ?
                        </span>
                      </Tooltip>
                    </Flex>
                    <Button
                      onClick={() => handleSelect('backend')}
                      aria-label="Backend 룰셋 시작하기"
                      className="mt-4"
                    >
                      시작하기 →
                    </Button>
                  </Stack>
                </Card>
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
