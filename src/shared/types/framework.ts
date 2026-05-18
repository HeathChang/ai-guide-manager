export const FRONTEND_FRAMEWORK_LIST = [
  'react',
  'next',
  'vue',
  'nuxt',
  'svelte',
  'sveltekit',
  'solid',
  'vanilla',
] as const;
export type FrontendFramework = (typeof FRONTEND_FRAMEWORK_LIST)[number];

export const BACKEND_FRAMEWORK_LIST = [
  'node-express',
  'node-nestjs',
  'node-fastify',
  'spring-boot',
  'django',
  'rails',
  'go-gin',
] as const;
export type BackendFramework = (typeof BACKEND_FRAMEWORK_LIST)[number];

export type Framework = FrontendFramework | BackendFramework;

export const FRONTEND_FRAMEWORK_LABELS: Readonly<Record<FrontendFramework, string>> = {
  react: 'React',
  next: 'Next.js (App Router)',
  vue: 'Vue 3',
  nuxt: 'Nuxt 3',
  svelte: 'Svelte 5',
  sveltekit: 'SvelteKit',
  solid: 'SolidJS',
  vanilla: 'Vanilla / 기타',
};

export const BACKEND_FRAMEWORK_LABELS: Readonly<Record<BackendFramework, string>> = {
  'node-express': 'Node.js + Express',
  'node-nestjs': 'NestJS',
  'node-fastify': 'Fastify',
  'spring-boot': 'Spring Boot (Java/Kotlin)',
  django: 'Django (Python)',
  rails: 'Ruby on Rails',
  'go-gin': 'Go + Gin',
};

export const isFrontendFramework = (value: string): value is FrontendFramework =>
  (FRONTEND_FRAMEWORK_LIST as readonly string[]).includes(value);

export const isBackendFramework = (value: string): value is BackendFramework =>
  (BACKEND_FRAMEWORK_LIST as readonly string[]).includes(value);

export const DEFAULT_FRAMEWORK: Readonly<{ frontend: FrontendFramework; backend: BackendFramework }> = {
  frontend: 'react',
  backend: 'node-express',
};
