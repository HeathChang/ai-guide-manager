import type { RulerFile } from '../types';

import { frontendBase } from './frontend/base';
import { frontendFrontend } from './frontend/frontend';
import { frontendFsd } from './frontend/fsd';
import { frontendAtomic } from './frontend/atomic';
import { frontendGit } from './frontend/git';
import { frontendSecurity } from './frontend/security';
import { frontendTesting } from './frontend/testing';
import { frontendA11y } from './frontend/a11y';
import { frontendStyling } from './frontend/styling';
import { frontendPerformance } from './frontend/performance';

import { backendBase } from './backend/base';
import { backendBackend } from './backend/backend';
import { backendApiDesign } from './backend/api-design';
import { backendDatabase } from './backend/database';
import { backendAuth } from './backend/auth';
import { backendSecurity } from './backend/security';
import { backendGit } from './backend/git';
import { backendTesting } from './backend/testing';
import { backendLogging } from './backend/logging';
import { backendErrorHandling } from './backend/error-handling';
import { backendCaching } from './backend/caching';

export const DEFAULT_FRONTEND_FILES: readonly RulerFile[] = [
  {
    fileName: 'base.md',
    title: '기본 코딩 규칙',
    category: '공통',
    description: '모든 프로젝트에 적용되는 기본 규칙 (코드 스타일, 네이밍, 금지 패턴)',
    stack: 'frontend',
    defaultSelected: true,
    content: frontendBase,
  },
  {
    fileName: 'frontend.md',
    title: '프론트엔드 공통',
    category: '공통',
    description: 'React 컨벤션, 컴포넌트 설계 원칙, 상태 관리 가이드라인',
    stack: 'frontend',
    defaultSelected: true,
    content: frontendFrontend,
  },
  {
    fileName: 'fsd.md',
    title: 'Feature-Sliced Design',
    category: '아키텍처',
    description: 'FSD 레이어 정의, 의존성 방향, Public API 규칙',
    stack: 'frontend',
    defaultSelected: false,
    content: frontendFsd,
    architectureKind: 'fsd',
  },
  {
    fileName: 'atomic.md',
    title: 'Atomic Design',
    category: '아키텍처',
    description: 'atoms → molecules → organisms → templates → pages',
    stack: 'frontend',
    defaultSelected: false,
    content: frontendAtomic,
    architectureKind: 'atomic',
  },
  {
    fileName: 'git.md',
    title: 'Git 워크플로우',
    category: '워크플로우',
    description: '브랜치 전략, Conventional Commits, PR 템플릿',
    stack: 'frontend',
    defaultSelected: true,
    content: frontendGit,
  },
  {
    fileName: 'security.md',
    title: '보안',
    category: '보안',
    description: 'XSS 방지, 입력 검증, 인증 토큰 관리, CSP 설정',
    stack: 'frontend',
    defaultSelected: true,
    content: frontendSecurity,
  },
  {
    fileName: 'testing.md',
    title: '테스트',
    category: '품질',
    description: '테스트 전략, 커버리지 기준, 네이밍, 모킹 규칙',
    stack: 'frontend',
    defaultSelected: false,
    content: frontendTesting,
  },
  {
    fileName: 'a11y.md',
    title: '접근성',
    category: '접근성',
    description: 'WCAG 2.1 AA 준수, 시맨틱 마크업, 키보드 내비게이션, ARIA',
    stack: 'frontend',
    defaultSelected: false,
    content: frontendA11y,
  },
  {
    fileName: 'styling.md',
    title: '스타일링',
    category: '스타일',
    description: 'Tailwind 사용 규칙, 디자인 토큰, 반응형, 다크모드',
    stack: 'frontend',
    defaultSelected: false,
    content: frontendStyling,
  },
  {
    fileName: 'performance.md',
    title: '성능',
    category: '성능',
    description: '번들 사이즈, 코드 스플리팅, 이미지 최적화, Core Web Vitals',
    stack: 'frontend',
    defaultSelected: false,
    content: frontendPerformance,
  },
];

export const DEFAULT_BACKEND_FILES: readonly RulerFile[] = [
  {
    fileName: 'base.md',
    title: '기본 코딩 규칙',
    category: '공통',
    description: '모든 프로젝트에 적용되는 기본 규칙',
    stack: 'backend',
    defaultSelected: true,
    content: backendBase,
  },
  {
    fileName: 'backend.md',
    title: '백엔드 공통',
    category: '공통',
    description: '레이어드 아키텍처 원칙, DTO/Entity 분리, 에러 처리 전략',
    stack: 'backend',
    defaultSelected: true,
    content: backendBackend,
  },
  {
    fileName: 'api-design.md',
    title: 'REST API 설계',
    category: '설계',
    description: 'URL 네이밍, HTTP 메서드, 상태 코드, 버저닝, 페이지네이션',
    stack: 'backend',
    defaultSelected: true,
    content: backendApiDesign,
  },
  {
    fileName: 'database.md',
    title: '데이터베이스',
    category: '데이터',
    description: '정규화, 인덱싱, 마이그레이션, 쿼리 최적화, N+1 방지',
    stack: 'backend',
    defaultSelected: false,
    content: backendDatabase,
  },
  {
    fileName: 'auth.md',
    title: '인증/인가',
    category: '인증/인가',
    description: 'JWT/세션, OAuth2.0, RBAC/ABAC, 토큰 갱신, 보안 헤더',
    stack: 'backend',
    defaultSelected: false,
    content: backendAuth,
  },
  {
    fileName: 'security.md',
    title: '보안',
    category: '보안',
    description: 'SQL Injection, Rate Limiting, CORS, 시크릿 관리, OWASP Top 10',
    stack: 'backend',
    defaultSelected: true,
    content: backendSecurity,
  },
  {
    fileName: 'git.md',
    title: 'Git 워크플로우',
    category: '워크플로우',
    description: '브랜치 전략, Conventional Commits, PR 템플릿',
    stack: 'backend',
    defaultSelected: true,
    content: backendGit,
  },
  {
    fileName: 'testing.md',
    title: '테스트',
    category: '품질',
    description: '테스트 피라미드, 단위/통합/E2E 전략, 픽스처, 커버리지',
    stack: 'backend',
    defaultSelected: false,
    content: backendTesting,
  },
  {
    fileName: 'logging.md',
    title: '로깅',
    category: '운영',
    description: '로깅 레벨, 구조화된 로깅, 추적 ID, 민감 데이터 마스킹',
    stack: 'backend',
    defaultSelected: false,
    content: backendLogging,
  },
  {
    fileName: 'error-handling.md',
    title: '에러 핸들링',
    category: '안정성',
    description: '에러 분류, 글로벌 예외 처리, 재시도 전략, 서킷 브레이커',
    stack: 'backend',
    defaultSelected: false,
    content: backendErrorHandling,
  },
  {
    fileName: 'caching.md',
    title: '캐싱',
    category: '성능',
    description: '로컬/분산 캐싱, TTL 정책, 캐시 무효화, CDN',
    stack: 'backend',
    defaultSelected: false,
    content: backendCaching,
  },
];

export const getDefaultFiles = (stack: 'frontend' | 'backend'): readonly RulerFile[] =>
  stack === 'frontend' ? DEFAULT_FRONTEND_FILES : DEFAULT_BACKEND_FILES;
