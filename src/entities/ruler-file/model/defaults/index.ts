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

import { frameworkNext } from './frontend/framework/next';
import { frameworkVue } from './frontend/framework/vue';
import { frameworkNuxt } from './frontend/framework/nuxt';
import { frameworkSvelte } from './frontend/framework/svelte';
import { frameworkSveltekit } from './frontend/framework/sveltekit';
import { frameworkSolid } from './frontend/framework/solid';
import { frameworkVanilla } from './frontend/framework/vanilla';

import { stateReduxToolkit } from './frontend/state/redux-toolkit';
import { stateZustand } from './frontend/state/zustand';
import { stateJotai } from './frontend/state/jotai';
import { stateRecoil } from './frontend/state/recoil';
import { stateMobx } from './frontend/state/mobx';
import { statePinia } from './frontend/state/pinia';
import { stateVuex } from './frontend/state/vuex';
import { stateSvelteStores } from './frontend/state/svelte-stores';

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

import { frameworkNodeExpress } from './backend/framework/node-express';
import { frameworkNodeNestjs } from './backend/framework/node-nestjs';
import { frameworkNodeFastify } from './backend/framework/node-fastify';
import { frameworkSpringBoot } from './backend/framework/spring-boot';
import { frameworkDjango } from './backend/framework/django';
import { frameworkRails } from './backend/framework/rails';
import { frameworkGoGin } from './backend/framework/go-gin';

import { getHarnessFiles } from './harness';

import type {
  AiTool,
  BackendFramework,
  FrontendFramework,
  Stack,
  StateManager,
} from '@/shared/types';
import { DEFAULT_FRAMEWORK, STATE_MANAGERS_BY_FRAMEWORK } from '@/shared/types';

const COMMON_FRONTEND_FILES: readonly RulerFile[] = [
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
];

const REACT_BASE_FILES: readonly RulerFile[] = [
  {
    fileName: 'frontend.md',
    title: '프론트엔드 공통 (React)',
    category: '프레임워크',
    description: 'React 컨벤션, 컴포넌트 설계 원칙, 상태 관리 가이드라인',
    stack: 'frontend',
    defaultSelected: true,
    content: frontendFrontend,
  },
  {
    fileName: 'performance.md',
    title: '성능 (React)',
    category: '성능',
    description: '번들 사이즈, 코드 스플리팅, 이미지 최적화, Core Web Vitals',
    stack: 'frontend',
    defaultSelected: false,
    content: frontendPerformance,
  },
];

const FRONTEND_FRAMEWORK_BUNDLES: Readonly<Record<FrontendFramework, readonly RulerFile[]>> = {
  react: REACT_BASE_FILES,
  next: [
    ...REACT_BASE_FILES,
    {
      fileName: 'next.md',
      title: 'Next.js (App Router)',
      category: '프레임워크',
      description: 'Server/Client Components, Server Actions, 캐싱, next/image · next/link',
      stack: 'frontend',
      defaultSelected: true,
      content: frameworkNext,
    },
  ],
  vue: [
    {
      fileName: 'vue.md',
      title: 'Vue 3',
      category: '프레임워크',
      description: 'Composition API, <script setup>, ref/reactive, defineModel',
      stack: 'frontend',
      defaultSelected: true,
      content: frameworkVue,
    },
  ],
  nuxt: [
    {
      fileName: 'vue.md',
      title: 'Vue 3',
      category: '프레임워크',
      description: 'Composition API, <script setup>, ref/reactive, defineModel',
      stack: 'frontend',
      defaultSelected: true,
      content: frameworkVue,
    },
    {
      fileName: 'nuxt.md',
      title: 'Nuxt 3',
      category: '프레임워크',
      description: '파일 라우팅, useFetch/useAsyncData, server routes, runtimeConfig',
      stack: 'frontend',
      defaultSelected: true,
      content: frameworkNuxt,
    },
  ],
  svelte: [
    {
      fileName: 'svelte.md',
      title: 'Svelte 5',
      category: '프레임워크',
      description: 'Runes ($state, $derived, $effect, $props), snippets, callback props',
      stack: 'frontend',
      defaultSelected: true,
      content: frameworkSvelte,
    },
  ],
  sveltekit: [
    {
      fileName: 'svelte.md',
      title: 'Svelte 5',
      category: '프레임워크',
      description: 'Runes ($state, $derived, $effect, $props), snippets, callback props',
      stack: 'frontend',
      defaultSelected: true,
      content: frameworkSvelte,
    },
    {
      fileName: 'sveltekit.md',
      title: 'SvelteKit',
      category: '프레임워크',
      description: 'load 함수, form actions, hooks, $env, adapter',
      stack: 'frontend',
      defaultSelected: true,
      content: frameworkSveltekit,
    },
  ],
  solid: [
    {
      fileName: 'solid.md',
      title: 'SolidJS',
      category: '프레임워크',
      description: 'createSignal, fine-grained reactivity, props non-destructure, For/Show',
      stack: 'frontend',
      defaultSelected: true,
      content: frameworkSolid,
    },
  ],
  vanilla: [
    {
      fileName: 'vanilla.md',
      title: 'Vanilla TypeScript',
      category: '프레임워크',
      description: '표준 DOM API, Web Components, XSS 방어, 빌드 (Vite)',
      stack: 'frontend',
      defaultSelected: true,
      content: frameworkVanilla,
    },
  ],
};

const STATE_FILE_BY_KIND: Readonly<Record<StateManager, RulerFile>> = {
  'redux-toolkit': {
    fileName: 'state/redux-toolkit.md',
    title: '상태 관리 — Redux Toolkit',
    category: '상태 관리',
    description: 'createSlice, RTK Query, createEntityAdapter, typed hooks, selector 메모이즈',
    stack: 'frontend',
    defaultSelected: false,
    content: stateReduxToolkit,
    stateManagerKind: 'redux-toolkit',
  },
  zustand: {
    fileName: 'state/zustand.md',
    title: '상태 관리 — Zustand',
    category: '상태 관리',
    description: '도메인별 store, shallow selector, 슬라이스 패턴, persist/devtools',
    stack: 'frontend',
    defaultSelected: false,
    content: stateZustand,
    stateManagerKind: 'zustand',
  },
  jotai: {
    fileName: 'state/jotai.md',
    title: '상태 관리 — Jotai',
    category: '상태 관리',
    description: 'atom/derived/atomFamily, useAtomValue/useSetAtom 분리, Suspense 통합',
    stack: 'frontend',
    defaultSelected: false,
    content: stateJotai,
    stateManagerKind: 'jotai',
  },
  recoil: {
    fileName: 'state/recoil.md',
    title: '상태 관리 — Recoil',
    category: '상태 관리',
    description: 'atom/selector + 마이그레이션 권고. Meta archive 후 maintenance 모드',
    stack: 'frontend',
    defaultSelected: false,
    content: stateRecoil,
    stateManagerKind: 'recoil',
  },
  mobx: {
    fileName: 'state/mobx.md',
    title: '상태 관리 — MobX',
    category: '상태 관리',
    description: 'observable/observer/action/computed, enforceActions, runInAction',
    stack: 'frontend',
    defaultSelected: false,
    content: stateMobx,
    stateManagerKind: 'mobx',
  },
  pinia: {
    fileName: 'state/pinia.md',
    title: '상태 관리 — Pinia',
    category: '상태 관리',
    description: 'defineStore (setup), storeToRefs, $patch, 영속화 플러그인',
    stack: 'frontend',
    defaultSelected: false,
    content: statePinia,
    stateManagerKind: 'pinia',
  },
  vuex: {
    fileName: 'state/vuex.md',
    title: '상태 관리 — Vuex (Legacy)',
    category: '상태 관리',
    description: 'namespaced 모듈, mutations/actions 분리, Pinia 마이그레이션 가이드',
    stack: 'frontend',
    defaultSelected: false,
    content: stateVuex,
    stateManagerKind: 'vuex',
  },
  'svelte-stores': {
    fileName: 'state/svelte-stores.md',
    title: '상태 관리 — Svelte Stores',
    category: '상태 관리',
    description: 'writable/readable/derived, $ 자동 구독, custom store 캡슐화',
    stack: 'frontend',
    defaultSelected: false,
    content: stateSvelteStores,
    stateManagerKind: 'svelte-stores',
  },
};

const COMMON_BACKEND_FILES: readonly RulerFile[] = [
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

const BACKEND_FRAMEWORK_BUNDLES: Readonly<Record<BackendFramework, readonly RulerFile[]>> = {
  'node-express': [
    {
      fileName: 'node-express.md',
      title: 'Node.js + Express',
      category: '프레임워크',
      description: '미들웨어 순서, 검증 미들웨어, asyncHandler, 중앙 에러 핸들러',
      stack: 'backend',
      defaultSelected: true,
      content: frameworkNodeExpress,
    },
  ],
  'node-nestjs': [
    {
      fileName: 'nestjs.md',
      title: 'NestJS',
      category: '프레임워크',
      description: '모듈 구조, DTO + class-validator, 생성자 주입, Guard/Pipe/Interceptor',
      stack: 'backend',
      defaultSelected: true,
      content: frameworkNodeNestjs,
    },
  ],
  'node-fastify': [
    {
      fileName: 'fastify.md',
      title: 'Fastify',
      category: '프레임워크',
      description: '스키마 우선 라우트, TypeBox/zod, plugin 시스템, pino 빌트인',
      stack: 'backend',
      defaultSelected: true,
      content: frameworkNodeFastify,
    },
  ],
  'spring-boot': [
    {
      fileName: 'spring-boot.md',
      title: 'Spring Boot',
      category: '프레임워크',
      description: '도메인 패키지, 생성자 주입, ControllerAdvice, Bean Validation, JPA 안전성',
      stack: 'backend',
      defaultSelected: true,
      content: frameworkSpringBoot,
    },
  ],
  django: [
    {
      fileName: 'django.md',
      title: 'Django',
      category: '프레임워크',
      description: '앱 분리, DRF Serializer, services.py 패턴, ALLOWED_HOSTS, N+1 방지',
      stack: 'backend',
      defaultSelected: true,
      content: frameworkDjango,
    },
  ],
  rails: [
    {
      fileName: 'rails.md',
      title: 'Ruby on Rails',
      category: '프레임워크',
      description: 'Strong Parameters, service 객체, ActiveJob, includes로 N+1, Pundit',
      stack: 'backend',
      defaultSelected: true,
      content: frameworkRails,
    },
  ],
  'go-gin': [
    {
      fileName: 'go-gin.md',
      title: 'Go + Gin',
      category: '프레임워크',
      description: 'internal 패키지, context 전파, error wrap, slog, sqlc 또는 ORM',
      stack: 'backend',
      defaultSelected: true,
      content: frameworkGoGin,
    },
  ],
};

const buildStateFiles = (
  framework: FrontendFramework,
  selected: StateManager | undefined,
): readonly RulerFile[] => {
  const compatible = STATE_MANAGERS_BY_FRAMEWORK[framework];
  return compatible.map((kind) => {
    const base = STATE_FILE_BY_KIND[kind];
    return {
      ...base,
      defaultSelected: selected === kind,
    };
  });
};

export interface GetDefaultFilesOptions {
  readonly framework?: FrontendFramework | BackendFramework;
  readonly stateManager?: StateManager;
  readonly includeHarness?: boolean;
  readonly aiTool?: AiTool;
}

export const getDefaultFiles = (
  stack: Stack,
  options: GetDefaultFilesOptions = {},
): readonly RulerFile[] => {
  if (stack === 'frontend') {
    const framework: FrontendFramework =
      (options.framework as FrontendFramework | undefined) ?? DEFAULT_FRAMEWORK.frontend;
    const files: RulerFile[] = [
      ...COMMON_FRONTEND_FILES,
      ...FRONTEND_FRAMEWORK_BUNDLES[framework],
      ...buildStateFiles(framework, options.stateManager),
    ];
    if (options.includeHarness === true) {
      return [...files, ...getHarnessFiles(stack, options.aiTool)];
    }
    return files;
  }

  const framework: BackendFramework =
    (options.framework as BackendFramework | undefined) ?? DEFAULT_FRAMEWORK.backend;
  const files: RulerFile[] = [
    ...COMMON_BACKEND_FILES,
    ...BACKEND_FRAMEWORK_BUNDLES[framework],
  ];
  if (options.includeHarness === true) {
    return [...files, ...getHarnessFiles(stack, options.aiTool)];
  }
  return files;
};

export const DEFAULT_FRONTEND_FILES: readonly RulerFile[] = getDefaultFiles('frontend');
export const DEFAULT_BACKEND_FILES: readonly RulerFile[] = getDefaultFiles('backend');
