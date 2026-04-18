export const frontendFsd = `---
title: Feature-Sliced Design
stack: frontend
category: 아키텍처
extends: [base.md, frontend.md]
---

# Feature-Sliced Design (FSD)

> \`base.md\`, \`frontend.md\` 규칙을 상속한다. FSD 아키텍처 규칙이다.

## 기본 원칙

- 모든 코드는 FSD 레이어 중 하나에 속해야 한다.
- 레이어를 건너뛰는 의존성 금지.
- "일단 여기" 식 파일 배치 금지. 판단 불가 시 **멈추고 질문**한다.

## 레이어

| 레이어 | 역할 | 예시 |
|--------|------|------|
| \`app\` | 전역 Provider, 라우팅, 진입점 | \`App.tsx\`, \`providers/\` |
| \`pages\` | 라우트 단위 조립 | \`LoginPage\` |
| \`widgets\` | 큰 UI 블록 | \`Header\`, \`Sidebar\` |
| \`features\` | 사용자 행동 단위 (동사) | \`login\`, \`submitComment\` |
| \`entities\` | 도메인 모델 | \`user\`, \`post\` |
| \`shared\` | 재사용 코드 | 공통 UI, utils, tokens |

## 의존성 방향 (아래 방향만 허용)

\`\`\`
app → pages → widgets → features → entities → shared
\`\`\`

## Public API (barrel export)

각 슬라이스는 \`index.ts\`로 공개 API를 정의한다.

\`\`\`
features/
  login/
    index.ts        ← 외부는 이 파일로만 접근
    ui/
    model/
    api/
    lib/
\`\`\`

- \`index.ts\`에 노출하지 않은 것은 private.
- 슬라이스 내부 파일 직접 import 금지.

## AI 행동 규칙 — 파일 위치 결정

1. 라우트 책임인가? → \`pages\`
2. 사용자 행동 단위인가? → \`features\`
3. 도메인 모델인가? → \`entities\`
4. 재사용 UI / 유틸인가? → \`shared\`
5. 여러 개 조합 큰 블록인가? → \`widgets\`

판단 불가 시 **작성 멈추고 사용자에게 질문**한다.

## 패턴 (DO / DON'T)

### 의존성 방향

\`\`\`ts
// DON'T — entities가 features 참조 (역방향)
// entities/user/model/user.ts
import { loginAction } from '@/features/login';

// DO — features가 entities를 참조
// features/login/model/use-login.ts
import { User } from '@/entities/user';
\`\`\`

### Public API 접근

\`\`\`ts
// DON'T — 슬라이스 내부 파일 직접 import
import { useLogin } from '@/features/login/model/use-login';

// DO — barrel export 경유
import { useLogin } from '@/features/login';
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| feature → feature 직접 참조 | 공통 로직은 entities/shared로 승격 |
| shared → entities 참조 | shared는 도메인 모름, 반대 방향만 허용 |
| 판단 안 될 때 "일단 shared" | 멈추고 질문 |
`;
