# AI-Ruler

> AI 코딩 에이전트(Claude Code, Cursor, Copilot 등)에 주입할 `ruler/` 규칙 세트를 브라우저에서 조합·편집·다운로드하는 웹 도구.

랜딩 페이지에서 **Frontend / Backend 스택**과 **프레임워크**를 고르고, 빌더에서 룰 파일을 체크박스로 선택, Monaco 에디터로 편집한 뒤, ZIP으로 내려받아 프로젝트 루트의 `ruler/` 디렉토리에 풀면 된다. 편집 내용과 선택 상태는 `localStorage`에 자동 저장되며, 공유 링크로 팀원과 같은 선택 상태를 재현할 수 있다.

---

## 주요 기능

- **스택 + 프레임워크 선택** — Frontend 8종(React / Next.js / Vue 3 / Nuxt 3 / Svelte 5 / SvelteKit / SolidJS / Vanilla), Backend 7종(Express / NestJS / Fastify / Spring Boot / Django / Rails / Go+Gin). 선택한 프레임워크에 맞는 룰셋이 자동 구성.
- **상태 관리 8종 (단일 선택)** — Redux Toolkit / Zustand / Jotai / Recoil / MobX / Pinia / Vuex / Svelte Stores. 프레임워크별 호환 매트릭스로 가능한 옵션만 노출(프레임워크에 따라 0~5개). 동시 선택 불가(자동 배타 처리). SolidJS·Vanilla는 전용 상태 관리 룰을 제공하지 않는다(내장 시그널/모듈 사용 권장).
- **공통 룰셋 내장** — Frontend 공통: base / security / testing / a11y / styling / git + 아키텍처(fsd ↔ atomic 택1). Backend 공통: base / backend / api-design / security / git + database·auth·logging·error-handling·caching(선택). 여기에 선택 프레임워크 전용 룰이 더해진다 (React 계열은 frontend.md·performance.md, 그 외 vue.md / next.md / svelte.md 등 — 예: Next.js App Router, Nuxt useFetch, Pinia setup 문법).
- **3단계 프리셋** — Minimal / Moderate / Strict.
- **AI 툴 부트스트랩 자동 동봉** — 선택한 AI 툴(Claude Code / Cursor / Copilot / 수동)에 맞춰 `ruler/` 를 자동 로드하는 부트스트랩 파일(`CLAUDE.md` · `.cursor/rules/ruler.mdc` 등)이 ZIP에 항상 포함된다. 받아서 루트에 풀면 추가 설정 없이 바로 동작.
- **하네스 엔지니어링 옵션** — Planner→Researcher→Implementer→Reviewer→Security Auditor→QA→Guardian→Reporter 8역할 협업 모델. 켜면 부트스트랩에 협업 규약이 더해지고 `ruler/harness/` 본문이 함께 동봉된다.
- **Markdown 미리보기 + 인라인 편집** — `react-markdown` + `@monaco-editor/react`.
- **사용자 정의 파일 추가** — 팀/프로젝트에 특화된 규칙을 직접 작성.
- **아키텍처 단일 선택 가드** — `fsd.md`와 `atomic.md`는 동시 선택 불가.
- **룰셋 정적 분석 (분석 버튼)** — 모호 표현 / 절대 금지에 근거 누락 / 토큰 예산 초과(>10K) / 빈 섹션 / 짧은 본문을 한 번에 검출.
- **Claude 검증 프롬프트 (검증 프롬프트 버튼)** — 부트스트랩 확인 / 본문 적용 검증 / 위반 인식 테스트의 3-step 프롬프트를 복사 가능한 형태로 제공.
- **공유 URL** — 선택한 파일 목록 + 프레임워크를 쿼리스트링에 담아 팀원에게 공유. `state/x.md` 같은 서브경로 파일도 지원.
- **ZIP 다운로드 (바로 사용 가능한 구조)** — `ai-ruler-{stack}-{framework}-{YYYYMMDD}.zip`. 규칙은 `ruler/` 하위, 툴 부트스트랩은 루트(`CLAUDE.md` 등), 설치 안내 `START-HERE.md` 동봉. 압축을 풀어 프로젝트 루트에 그대로 복사하면 끝.
- **자동 저장** — 편집/선택/사용자 파일 상태를 localStorage에 `{stack}:{framework}` 단위로 분리 저장. 이전 버전 데이터는 1회 자동 마이그레이션.
- **다크 모드** — 헤더의 테마 토글 버튼으로 전환. OS 기본 설정(`prefers-color-scheme`)을 따르며 선택한 테마는 localStorage에 유지. Monaco 에디터도 함께 전환.

---

## 다운로드한 규칙 적용 방법

> 메인 화면 오른쪽 위 **"사용 방법"** 버튼을 누르면 동일한 내용을 팝업으로도 볼 수 있다.
>
> **핵심:** ZIP에는 규칙 본문(`ruler/`)과 선택한 AI 툴의 **부트스트랩 파일이 이미 함께** 들어 있다. 압축을 풀어 그 내용을 프로젝트 루트에 그대로 복사하면 끝난다. `ruler/` 를 직접 만들거나 `CLAUDE.md` 를 손으로 작성할 필요가 없다.

### 1. ZIP 파일 압축 해제

다운로드받은 `ai-ruler-{stack}-{framework}-{YYYYMMDD}.zip`을 풀면 규칙 본문(`ruler/`), 선택한 AI 툴의 부트스트랩 파일, 설치 안내(`START-HERE.md`)가 함께 나타난다.

### 2. 폴더 내용을 프로젝트 루트로 복사

압축 해제된 폴더의 내용을 통째로 프로젝트 루트에 복사한다. 별도 디렉토리 생성·파일 재배치가 필요 없다.

```
프로젝트루트/
├── CLAUDE.md           ← 선택한 툴의 부트스트랩 (자동 생성)
├── START-HERE.md       ← 설치 안내
├── src/
├── package.json
└── ruler/             ← 규칙 본문 (AI가 읽는 실제 룰)
    ├── base.md
    ├── frontend.md         ← React 기본 / 또는 vue.md · next.md · svelte.md ...
    ├── state/
    │   └── zustand.md      ← 선택한 상태 관리 룰 (있을 경우)
    └── ...
```

> 💡 `ruler/` 와 `CLAUDE.md` 는 보이는 그대로 복사하면 된다. 단, **Cursor·Copilot을 선택**했다면 부트스트랩 파일이 `.cursor/`·`.github/` 같은 숨김 폴더에 있으니, Finder에서 `Cmd+Shift+.` 로 표시하거나 터미널 `cp -R . 대상경로/` 로 빠짐없이 복사한다.

### 3. AI 도구 연동 — 추가 작성 불필요

선택한 AI 툴에 맞는 부트스트랩 파일이 ZIP에 이미 포함되어 `ruler/` 를 자동으로 읽도록 연결한다.

| AI 툴 | 자동 생성 파일 | 설명 |
|-------|---------------|------|
| Claude Code | `CLAUDE.md` | 세션 시작 시 자동 로드 |
| Cursor | `.cursor/rules/ruler.mdc` | `alwaysApply` 규칙으로 자동 주입 |
| GitHub Copilot | `.github/copilot-instructions.md` | 레포 전체 지침으로 자동 적용 |
| 직접 설정 / 기타 | `RULER-BOOTSTRAP.md` | 매 세션 복붙용 프롬프트 + 경로 안내 |

Windsurf(`.windsurf/rules.md`) · Cline 등 다른 도구는 `RULER-BOOTSTRAP.md` 의 경로 표를 참고해 각 도구의 설정 파일이 `ruler/` 를 읽도록 연결하면 된다.

### 4. `.gitignore` 설정

`ruler/` 와 부트스트랩 파일(`CLAUDE.md` 등)은 팀이 공유하도록 모두 커밋한다. 규칙은 `ruler/` 한 곳에만 두고 부트스트랩이 그걸 가리키므로 중복이 없다. 개인용 로컬 오버라이드만 ignore 처리한다.

### 5. 동작 확인

AI 에이전트에게 다음과 같이 질문해 연동 여부를 검증한다.

```
ruler/ 디렉토리의 어떤 파일을 자동으로 읽었는지 알려줘.
읽지 않은 파일이 있다면 그 이유는?
```

AI가 실제 파일 목록을 답하면 부트스트랩 성공이다. 일반론으로 답하면 부트스트랩 파일이 프로젝트 루트에 있는지 재확인한다.

---

## 기술 스택

| 영역 | 도구 |
|------|------|
| UI | React 18 + TypeScript 5.6 (strict) |
| 빌드 | Vite 5 |
| 라우팅 | React Router 6 |
| 스타일 | Tailwind CSS 3 + 디자인 토큰 (CSS 변수) |
| 에디터 | @monaco-editor/react |
| Markdown | react-markdown + remark-gfm |
| 아카이빙 | JSZip + FileSaver |
| 테스트 | Vitest + happy-dom |
| 린트 | ESLint 9 (flat config) |
| 아키텍처 | Feature-Sliced Design (FSD) |

---

## 시작하기

### 요구사항

- Node.js 18 이상
- npm 9 이상

### 설치 및 실행

```bash
npm install
npm run dev     # 개발 서버 (Vite)
```

기본 포트는 Vite 기본값인 `http://localhost:5173`.

### 빌드

```bash
npm run build   # tsc -b && vite build → dist/
npm run preview # 빌드 결과물 로컬 서빙
```

---

## 스크립트

| 스크립트 | 역할 |
|---------|------|
| `npm run dev` | 개발 서버 (HMR) |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과물 미리보기 |
| `npm run type-check` | `tsc --noEmit` 타입 체크 |
| `npm run lint` | ESLint (flat config) |
| `npm run test` | Vitest 단일 실행 |
| `npm run test:watch` | Vitest watch 모드 |

커밋 전에는 `type-check`, `lint`, `test` 세 가지를 모두 통과시킨다 ([.ruler/testing.md](.ruler/testing.md)).

---

## 프로젝트 구조 (FSD)

```
src/
├── app/            # 전역 Provider, 라우팅, 전역 스타일
│   ├── App.tsx
│   └── styles/     # design-system.css, globals.css
├── pages/          # 라우트 단위 페이지 (.page.tsx)
│   ├── landing/    # LandingPage.page.tsx — 스택·프레임워크 선택
│   └── builder/    # BuilderPage.page.tsx  — 룰셋 편집기
├── widgets/        # 복합 UI 블록 (.ui.tsx)
│   ├── builder-header/    # 분석/검증 프롬프트/공유/다운로드 버튼 + framework 라벨
│   ├── file-list/
│   ├── file-editor/
│   ├── usage-guide/       # 사용 방법 안내 모달
│   └── verify-prompts/    # Claude 검증 프롬프트 3-step 다이얼로그
├── features/       # 사용자 행동 단위
│   ├── ruler-workspace/  # 워크스페이스 상태 훅 + persistence
│   ├── custom-file/      # 사용자 정의 파일 추가 다이얼로그
│   ├── presets/          # Minimal/Moderate/Strict 프리셋
│   ├── rule-lint/        # 룰셋 정적 분석 (모호 표현/근거/토큰/빈 섹션)
│   ├── download-zip/     # ZIP 생성 + 저장
│   └── share-url/        # 공유 URL 파싱/생성 (framework 포함)
├── entities/       # 도메인 모델
│   └── ruler-file/
│       ├── model/types.ts                  # RulerFile, FileCategory, stateManagerKind
│       └── model/defaults/                 # 내장 규칙 본문 (마크다운을 담은 *.ts)
│           ├── frontend/
│           │   ├── *.ts                    # 공통 (base, frontend, security, a11y, ...)
│           │   ├── framework/              # next / vue / nuxt / svelte / solid / vanilla (react는 frontend.ts)
│           │   └── state/                  # redux-toolkit / zustand / jotai / recoil / ...
│           ├── backend/
│           │   ├── *.ts                    # 공통 (base, backend, api-design, auth, ...)
│           │   └── framework/              # node-express / nestjs / fastify / spring-boot / ...
│           └── harness/                    # 하네스 엔지니어링 8역할 + 부트스트랩(툴별 + 경량)
└── shared/         # 재사용 UI/유틸/타입
    ├── ui/         # Button, Card, Checkbox, Tabs, ThemeToggle, Tooltip
    ├── lib/        # cn, formatDate, storage, theme, useTheme
    └── types/      # Stack, AiTool, Framework, StateManager
```

### 의존성 방향

```
app → pages → widgets → features → entities → shared
```

레이어 건너뛴 import 금지. 슬라이스 외부에서는 반드시 `index.ts` (barrel)을 통해서만 접근한다. 자세한 규칙은 [.ruler/fsd.md](.ruler/fsd.md).

### Import alias

모든 절대 경로 import는 `@/*` → `src/*` 로 통일.

```ts
import { FileListPanel } from '@/widgets/file-list';
import { useRulerWorkspace } from '@/features/ruler-workspace';
import type { RulerFile } from '@/entities/ruler-file';
```

같은 슬라이스 내부의 상대 경로(`./MarkdownEditor.ui` 등)는 그대로 사용한다.

### 컴포넌트 네이밍

| 역할 | 파일명 | 규칙 |
|------|--------|------|
| Page | `{Name}.page.tsx` | 라우트 책임, feature/widget 조합만 |
| Presentational | `{Name}.ui.tsx` | UI 렌더링 + 로컬 UI 상태만, props로 데이터 수신 |
| Container | `{Name}.container.tsx` | 상태·검증·Hook 사용, UI는 `.ui.tsx`에 위임 |

---

## 코딩 규칙

> 이 표는 **이 앱 레포 자체**의 코딩 규칙(루트 `.ruler/`)이다. 사용자가 빌더에서 다운로드하는 산출물과는 별개다.

프로젝트의 모든 코딩 규칙은 [.ruler/](.ruler/) 디렉토리에 마크다운으로 정의되어 있다.

| 파일 | 내용 |
|------|------|
| [.ruler/base.md](.ruler/base.md) | 기본 코딩 규칙 (TypeScript, 네이밍, 에러 처리, 금지 패턴) |
| [.ruler/frontend.md](.ruler/frontend.md) | React 컨벤션, 컴포넌트 분리, 접근성 |
| [.ruler/fsd.md](.ruler/fsd.md) | Feature-Sliced Design 아키텍처 규칙 |
| [.ruler/testing.md](.ruler/testing.md) | 테스트 전략, 커버리지, 네이밍 |
| [.ruler/security.md](.ruler/security.md) | XSS, 시크릿 관리, 인증 토큰 |
| [.ruler/git.md](.ruler/git.md) | 브랜치, 커밋 컨벤션, PR 규칙 |

하네스 엔지니어링 룰셋(8역할 협업 모델)은 [.ruler/harness/](.ruler/harness/) 에 있다:
- 협업 모델 개요 — [.ruler/harness/README.md](.ruler/harness/README.md)
- 핸드오프 규약 — [.ruler/harness/workflow.md](.ruler/harness/workflow.md)
- 역할별 규칙 — [.ruler/harness/agents/](.ruler/harness/agents/) (`01-planner.md` ~ `08-reporter.md`)

AI 도구가 이 규칙을 자동으로 인식하도록 루트 `CLAUDE.md`가 `.ruler/` 참조를 걸어두었다.

---

## 테스트

```bash
npm run test          # 전체 한 번 실행
npm run test:watch    # 변경 감지
```

현재 커버리지: 유틸·테마·Share URL 파싱·룰셋 정적 분석 등 순수 함수 중심으로 **50여 개 테스트**.
- `src/shared/lib/cn.test.ts`, `formatDate.test.ts`, `storage.test.ts`, `theme.test.ts`
- `src/features/share-url/lib/shareUrl.test.ts`
- `src/features/rule-lint/model/lintRules.test.ts`

훅(`useRulerWorkspace`) 통합 테스트와 `.ui.tsx` Storybook은 향후 추가 예정.

---

## 라이선스

MIT
