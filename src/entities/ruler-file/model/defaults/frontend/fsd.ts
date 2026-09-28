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
  - 근거: 의존성 그래프가 평탄해지면 어디서 어디로 호출하는지 추적 불가. 변경 영향 범위가 *암묵적 으로* 넓어진다. 레이어는 변경 영향을 *공식적으로* 한 방향에 가두는 장치.
- "일단 여기" 식 파일 배치 금지. 판단 불가 시 **멈추고 질문**한다.
  - 근거: AI가 임의 배치한 파일은 나중에 "이 파일 왜 여기 있지?" 토론 비용 발생. 의문 시 5초 멈추고 묻는 게 5분 토론보다 싸다.

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
  - 근거: barrel을 통하지 않은 import는 슬라이스의 *내부 구현*에 의존하는 것. 슬라이스 내부 파일을 옮기거나 이름 바꾸면 외부가 깨진다. barrel은 슬라이스의 *계약*을 정의.

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

## 적용 범위와 경계

이 문서는 **파일이 어느 레이어에 속하고 무엇을 import 할 수 있는가**만 다룬다. 레이어 안에서 코드를 어떻게 쓰는지는 다루지 않는다.

여기서 다루지 않는 것 → 컴포넌트 내부 구조는 \`frontend.md\`, 클래스·토큰은 \`styling.md\`, 테스트 위치는 \`testing.md\`.

**\`atomic.md\` 와 동시에 사용하지 않는다.** 둘은 같은 질문(파일을 어디 둘 것인가)에 다른 답을 주는 경쟁 아키텍처다. 프로젝트당 하나만 선택한다. 두 문서가 모두 로드돼 있으면 진행하지 말고 유저에게 어느 쪽인지 묻는다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **레이어 규칙 vs 코드 중복 제거** — 레이어 규칙이 이긴다. 중복을 없애려고 역방향 import 를 만들지 마라. 공통 코드는 아래 레이어로 **승격**시켜 해결한다.
- **레이어 규칙 vs 프레임워크 관례** — 프레임워크가 위치를 강제하는 파일(\`app/\` 라우터, \`pages/\` 파일 기반 라우팅)은 프레임워크가 이긴다. 그 파일은 얇게 두고 실제 로직을 FSD 레이어로 위임한다.
- **판단이 갈릴 때** — 더 아래 레이어(\`shared\` 쪽)로 내리는 선택은 되돌리기 어렵다. 확신이 없으면 내리지 말고 유저에게 묻는다.

## 자가 점검

파일을 추가하거나 옮긴 뒤 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] 새 파일이 6개 레이어 중 정확히 하나에 속한다
- [ ] 모든 import 가 \`app → pages → widgets → features → entities → shared\` 방향을 따른다
- [ ] 역방향(\`entities\` → \`features\`)이나 동일 레이어 간(\`feature\` → \`feature\`) 직접 import 가 없다
- [ ] 다른 슬라이스를 \`index.ts\` 경유로만 import 했다 — 내부 경로 직접 참조가 없다
- [ ] 새 슬라이스에 \`index.ts\` 가 있고, 외부에 필요한 것만 export 한다
- [ ] \`shared\` 에 도메인 타입(\`User\`, \`Post\`)이 새로 들어가지 않았다
- [ ] 위치가 애매했던 파일은 "일단 shared" 로 두지 않고 유저에게 물었다
`;
