import { Flex, Stack, Text } from 'null_ong2-design-system';
import { Button } from '@/shared/ui';

interface BuilderIntroProps {
  /** Moderate 프리셋을 즉시 적용하는 CTA. */
  readonly onApplyModerate: () => void;
  /** 안내 닫기(다시 보지 않음). */
  readonly onDismiss: () => void;
}

/**
 * 빌더 첫 진입 시 1회 노출되는 온보딩 배너.
 * "체크박스만 잔뜩 던져진" 첫인상에서 프리셋→분석→다운로드 3스텝 동선을 안내한다.
 */
export const BuilderIntro = ({ onApplyModerate, onDismiss }: BuilderIntroProps) => (
  <section aria-label="시작 안내" className="border-b border-border-base bg-bg-base px-4 py-3">
    <Flex align="center" justify="space-between" gap="3" wrap="wrap">
      <Stack spacing="xs" className="min-w-0">
        <Text weight="semibold" size="sm">
          처음이신가요? 3단계로 끝납니다
        </Text>
        <Text size="sm" color="muted">
          ① <strong>프리셋</strong>으로 시작 → ② <strong>분석</strong>으로 모호 표현·근거·토큰 점검 → ③{' '}
          <strong>다운로드</strong> 후 검증 프롬프트로 확인
        </Text>
      </Stack>
      <Flex align="center" gap="2" className="shrink-0">
        <Button size="sm" onClick={onApplyModerate}>
          Moderate 프리셋 적용
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss} aria-label="시작 안내 닫기">
          ✕
        </Button>
      </Flex>
    </Flex>
  </section>
);
