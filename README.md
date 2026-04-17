# AI-Ruler

> AI 코딩 에이전트(Claude Code, Cursor, Copilot 등)에 주입할 `.ruler/` 규칙 세트를 브라우저에서 조합·편집·다운로드하는 웹 도구.

프론트엔드/백엔드 스택별로 미리 준비된 마크다운 규칙 파일을 체크박스로 선택하고, Monaco 에디터로 편집한 뒤, ZIP으로 내려받아 프로젝트 루트의 `.ruler/` 디렉토리에 그대로 풀면 된다. 편집 내용과 선택 상태는 `localStorage`에 자동 저장되며, 공유 링크로 팀원과 같은 선택 상태를 재현할 수 있다.

---

## 주요 기능

- **스택별 기본 룰셋 제공** — Frontend 10개 / Backend 11개 규칙 파일 내장 (base, fsd, security, testing, a11y, api-design, database, auth, caching 등)
- **3단계 프리셋** — Minimal / Moderate / Strict
- **Markdown 미리보기 + 인라인 편집** — `react-markdown` + `@monaco-editor/react`
- **사용자 정의 파일 추가** — 팀/프로젝트에 특화된 규칙을 직접 작성
- **아키텍처 단일 선택 가드** — `fsd.md`와 `atomic.md`는 동시 선택 불가 (자동 배타 처리)
- **공유 URL** — 선택한 파일 목록을 쿼리스트링에 담아 팀원에게 공유
- **ZIP 다운로드** — `ai-ruler-{stack}-{YYYYMMDD}.zip` 형식
- **자동 저장** — 편집/선택/사용자 파일 상태를 localStorage에 스택별 분리 저장
- **다크 모드** — 헤더의 테마 토글 버튼으로 전환. OS 기본 설정(`prefers-color-scheme`)을 따르며 선택한 테마는 localStorage에 유지. Monaco 에디터도 함께 전환

---

## 다운로드한 규칙 적용 방법

> 메인 화면 오른쪽 위 **"사용 방법"** 버튼을 누르면 동일한 내용을 팝업으로도 볼 수 있다.

### 1. ZIP 파일 압축 해제

다운로드받은 `ai-ruler-{stack}-{YYYYMMDD}.zip`을 압축 해제하면 선택한 규칙 파일들이 나타난다.

### 2. 프로젝트 루트에 `.ruler/` 디렉토리 배치

프로젝트 루트에 `.ruler/` 디렉토리를 만들고, 압축 해제한 파일들을 그 안에 복사한다.

```
프로젝트루트/
├── src/
├── package.json
└── .ruler/          ← 여기에 복사
    ├── base.md
    ├── frontend.md
    └── ...
```

### 3. AI 도구 연동

`.ruler/` 자체는 AI가 자동으로 읽지 않는다. 사용하는 AI 도구의 설정 파일에서 참조하도록 연결한다.

#### Claude Code — `CLAUDE.md`

프로젝트 루트에 `CLAUDE.md` 파일을 생성하고 아래 내용을 추가한다. Claude Code는 대화 시작 시 이 파일을 자동으로 읽는다.

```markdown
# Project Rules

이 프로젝트의 코딩 규칙은 `.ruler/` 디렉토리에 정의되어 있다.
코드를 작성하거나 리뷰하기 전에 반드시 `.ruler/` 의 모든 파일을 읽고 준수할 것.
```

#### Cursor AI — `.cursorrules`

프로젝트 루트에 `.cursorrules` 파일을 생성하고 동일 내용을 추가한다. Cursor는 이 파일을 프로젝트 규칙으로 자동 인식한다.

#### 기타 도구

GitHub Copilot(`.github/copilot-instructions.md`), Windsurf(`.windsurfrules`), Cline(`.clinerules`)도 각 도구의 설정 파일에 동일한 참조 문구를 추가하면 된다.

### 4. `.gitignore` 설정

`.ruler/`는 팀이 공유하도록 Git에 포함하고, 개별 AI 도구 설정 파일은 개인 환경이므로 ignore 처리한다.

```gitignore
# AI tool configs (개인 환경 — .ruler/ 는 공유)
CLAUDE.md
.cursorrules
```

### 5. 동작 확인

AI 에이전트에게 다음과 같이 질문해 연동 여부를 검증한다.

```
.ruler/base.md 파일을 읽고 요약해줘
```

AI가 `base.md` 내용을 정확히 요약하면 연동 성공이다.

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
│   ├── landing/    # LandingPage.page.tsx — 스택 선택
│   └── builder/    # BuilderPage.page.tsx  — 룰셋 편집기
├── widgets/        # 복합 UI 블록 (.ui.tsx)
│   ├── builder-header/
│   ├── file-list/
│   ├── file-editor/
│   └── usage-guide/        # 사용 방법 안내 모달
├── features/       # 사용자 행동 단위
│   ├── ruler-workspace/  # 워크스페이스 상태 훅 + persistence
│   ├── custom-file/      # 사용자 정의 파일 추가 다이얼로그
│   ├── presets/          # Minimal/Moderate/Strict 프리셋
│   ├── download-zip/     # ZIP 생성 + 저장
│   └── share-url/        # 공유 URL 파싱/생성
├── entities/       # 도메인 모델
│   └── ruler-file/
│       ├── model/types.ts              # RulerFile, FileCategory
│       └── model/defaults/             # 내장 규칙 본문 (frontend/backend)
└── shared/         # 재사용 UI/유틸/타입
    ├── ui/         # Button, Card, Checkbox, Tabs, ThemeToggle
    ├── lib/        # cn, formatDate, storage, theme, useTheme
    └── types/      # Stack
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

프로젝트의 모든 코딩 규칙은 [.ruler/](.ruler/) 디렉토리에 마크다운으로 정의되어 있다.

| 파일 | 내용 |
|------|------|
| [.ruler/base.md](.ruler/base.md) | 기본 코딩 규칙 (TypeScript, 네이밍, 에러 처리, 금지 패턴) |
| [.ruler/frontend.md](.ruler/frontend.md) | React 컨벤션, 컴포넌트 분리, 접근성 |
| [.ruler/fsd.md](.ruler/fsd.md) | Feature-Sliced Design 아키텍처 규칙 |
| [.ruler/testing.md](.ruler/testing.md) | 테스트 전략, Storybook, 네이밍 |
| [.ruler/security.md](.ruler/security.md) | XSS, 시크릿 관리, 인증 토큰 |
| [.ruler/git-workflow.md](.ruler/git-workflow.md) | 브랜치, 커밋 컨벤션, PR 규칙 |

작업별 프로세스는 [.ruler/prompts/](.ruler/prompts/) 참조:
- 기능 개발 — [feature-dev.md](.ruler/prompts/feature-dev.md)
- 코드 리뷰 — [code-review.md](.ruler/prompts/code-review.md)
- 개발 전 체크리스트 — [pre-flight.md](.ruler/prompts/pre-flight.md)

AI 도구가 이 규칙을 자동으로 인식하도록 루트 `CLAUDE.md`가 참조를 걸어두었다 ([.ruler/README.md](.ruler/README.md) 참조).

---

## 테스트

```bash
npm run test          # 전체 한 번 실행
npm run test:watch    # 변경 감지
```

현재 커버리지: 유틸 · 테마 · Share URL 파싱 등 순수 함수 중심으로 **37개 테스트**.
- `src/shared/lib/cn.test.ts`, `formatDate.test.ts`, `storage.test.ts`, `theme.test.ts`
- `src/features/share-url/lib/shareUrl.test.ts`

훅(`useRulerWorkspace`) 통합 테스트와 `.ui.tsx` Storybook은 향후 추가 예정.

---

## 라이선스

MIT
