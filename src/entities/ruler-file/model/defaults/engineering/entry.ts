import type { FileCategory, RulerFile } from '../../types';
import type { Stack } from '@/shared/types';

/**
 * 협업 모델(하네스·루프) 본문 파일 1개의 정의.
 * 일반 코딩 룰과 달리 stack 에 무관한 내용이라, RulerFile 변환 시점에 stack 을 주입한다.
 */
export interface EngineeringEntry {
  readonly fileName: string;
  readonly title: string;
  readonly description: string;
  readonly content: string;
}

/**
 * 협업 모델 본문을 RulerFile 로 변환한다.
 * `isEngineeringDoc` 는 AGENTS.md 규칙 표에서 이 파일들을 제외하는 근거다 —
 * 협업 모델은 규칙 표가 아니라 별도의 "협업 모델" 절에서 소개된다.
 */
export const toEngineeringRuleFile = (
  entry: EngineeringEntry,
  category: FileCategory,
  stack: Stack,
): RulerFile => ({
  fileName: entry.fileName,
  title: entry.title,
  category,
  description: entry.description,
  stack,
  defaultSelected: true,
  content: entry.content,
  isEngineeringDoc: true,
});
