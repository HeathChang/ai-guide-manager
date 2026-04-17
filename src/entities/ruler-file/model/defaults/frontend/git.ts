export const frontendGit = `# Git & PR Workflow

> 브랜치 전략, 커밋 메시지, PR 프로세스 규칙이다.

## 브랜치 전략

| 브랜치 | 용도 | 머지 대상 |
|--------|------|-----------|
| \`main\` / \`master\` | 프로덕션 배포 | — |
| \`develop\` | 개발 통합 | \`main\` |
| \`feature/*\` | 기능 개발 | \`develop\` |
| \`fix/*\` | 버그 수정 | \`develop\` |
| \`hotfix/*\` | 긴급 수정 | \`main\` + \`develop\` |

- 브랜치명은 **소문자 kebab-case**: \`feature/login-redesign\`
- \`main\`, \`develop\`에 직접 push 금지 — 반드시 PR.

## 커밋 메시지 (Conventional Commits)

\`\`\`
<type>: <subject>

[optional body]
\`\`\`

| type | 용도 |
|------|------|
| feat | 새 기능 |
| fix | 버그 수정 |
| refactor | 리팩토링 |
| style | 코드 스타일 |
| test | 테스트 |
| docs | 문서 |
| chore | 빌드/설정/의존성 |

- subject는 **50자 이내**, 마침표 없이.
- body는 **왜(why)** 이 변경이 필요한지 설명.

## PR 규칙

- PR 하나는 **하나의 관심사**만 다룬다.
- PR 설명에 포함:
  - 변경 사항 요약 (무엇을, 왜)
  - 테스트 방법
  - 스크린샷 (UI 변경 시)

## AI 행동 규칙

- 커밋 메시지 작성 시 위 컨벤션을 따른다.
- PR 생성 시 변경 파일 전체를 분석하여 요약한다.
- \`main\` / \`develop\`에 직접 push 금지.
- force push는 사용자 명시 요청 시에만.

## 금지 패턴

- 의미 없는 커밋 (\`wip\`, \`fix\`, \`update\`)
- 하나의 커밋에 여러 관심사 혼합
- PR 설명 없이 리뷰 요청
`;
