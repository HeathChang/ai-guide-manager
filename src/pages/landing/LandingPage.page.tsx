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
import { Button, Card, ThemeToggle } from '@/shared/ui';
import type { Stack as StackType } from '@/shared/types';
import { UsageGuideDialog } from '@/widgets/usage-guide';

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
  const handleSelect = (stack: StackType) => {
    navigate(`/builder/${stack}`);
  };

  return (
    <Flex as="div" direction="column" style={{ minHeight: '100%' }}>
      <Box as="header" paddingY="6" bg="var(--ds-color-neutral-0)" style={{ borderBottom: '1px solid var(--ds-color-neutral-200)' }}>
        <Container maxWidth="xl">
          <Flex align="center" justify="space-between">
            <Flex align="center" gap="3">
              <Box
                width="36px"
                height="36px"
                borderRadius="md"
                bg="var(--ds-color-primary-600)"
                style={{
                  color: 'var(--ds-color-neutral-0)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 'var(--ds-font-weight-bold)',
                }}
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
                style={{
                  fontSize: 'var(--ds-font-size-sm)',
                  color: 'var(--ds-color-neutral-500)',
                }}
              >
                GitHub
              </a>
            </Flex>
          </Flex>
        </Container>
      </Box>

      <Box as="main" paddingY="16" style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
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

            <Box as="section" aria-labelledby="stack-select-heading">
              <Heading as="h2" size="sm" className="sr-only">
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
                        <Flex align="center" gap="1" style={{ marginTop: 'var(--ds-spacing-4)' }}>
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
              style={{ color: 'var(--ds-color-primary-600)', textDecoration: 'underline' }}
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
