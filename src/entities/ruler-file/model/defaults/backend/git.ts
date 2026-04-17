export const backendGit = `# Git & PR Workflow

> 브랜치 전략, 커밋 메시지, PR 프로세스 규칙이다.

## 브랜치 전략

| 브랜치 | 용도 | 머지 대상 |
|--------|------|-----------|
| \`main\` | 프로덕션 배포 | — |
| \`develop\` | 개발 통합 | \`main\` |
| \`feature/*\` | 기능 개발 | \`develop\` |
| \`fix/*\` | 버그 수정 | \`develop\` |
| \`hotfix/*\` | 긴급 수정 | \`main\` + \`develop\` |

- 브랜치명은 **소문자 kebab-case**.
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
| perf | 성능 개선 |
| test | 테스트 |
| docs | 문서 |
| chore | 빌드/설정/의존성 |

- subject **50자 이내**, 마침표 없이.
- body는 **왜(why)**.

## PR 규칙

- PR 하나는 **하나의 관심사**.
- PR 설명 필수: 변경 요약, 테스트 방법, 관련 티켓.
- DB 마이그레이션 포함 시 **롤백 계획 명시**.
- Breaking change는 라벨 + CHANGELOG 업데이트.

## 릴리스

- Semantic Versioning 준수 (MAJOR.MINOR.PATCH).
- 태그는 \`v\` 접두 (\`v1.2.3\`).
- 릴리스 노트에 호환성 영향 명시.

## AI 행동 규칙

- 커밋 메시지 작성 시 컨벤션을 따른다.
- PR 생성 시 변경 범위를 요약하고 DB 변경 여부를 표시.
- force push는 명시 요청 시에만.

## 금지 패턴

- 의미 없는 커밋 (\`wip\`, \`update\`)
- 마이그레이션 + 애플리케이션 동시 PR (단계 분리 권장)
- PR 설명 없이 리뷰 요청
`;
