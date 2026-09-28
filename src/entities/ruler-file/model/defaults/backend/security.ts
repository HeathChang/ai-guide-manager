export const backendSecurity = `---
title: 보안
stack: backend
category: 보안
extends: [base.md, backend.md]
---

# Backend Security

> \`base.md\`, \`backend.md\`를 상속한다. 백엔드 보안 규칙 (OWASP Top 10 기반).

## 입력 검증

- **모든 외부 입력**은 서버에서 검증한다 (클라이언트 검증은 UX용).
  - 근거: 클라이언트는 공격자 통제 영역 — DevTools / curl / Postman으로 임의 페이로드 가능. 서버 검증이 *유일한* 보안 경계.
- 스키마 검증(Zod, Joi, Pydantic, Bean Validation)을 레이어 경계에서 수행.
- 바이너리/파일 업로드는 **타입·크기·내용** 검증.
  - 근거: \`Content-Type\` 헤더는 위조 가능 — 실제 magic bytes 검사 필수. 크기 한도 없으면 디스크·메모리 고갈 DoS.

## SQL / Injection

- **Prepared statement / Parameter binding** 사용, 문자열 결합 금지.
  - 근거: 문자열 결합은 SQL Injection의 #1 원인. ORM/쿼리빌더가 안전하다고 *raw query 일부만* 결합해도 그 한 줄에서 뚫린다.
- ORM이라도 raw query 작성 시 파라미터 바인딩 확인.
- 동적 테이블/컬럼명은 **허용 목록 기반 치환**.
  - 근거: 컬럼/테이블명은 prepared statement로 바인딩 불가 (식별자). 사용자 입력을 그대로 \`ORDER BY \${col}\` 에 넣으면 즉시 인젝션 — \`{ name: 'display_name', created: 'created_at' }\` 같은 매핑 테이블이 유일 안전 패턴.

## Rate Limiting

- 인증/민감 엔드포인트에 Rate Limit 필수.
  - 근거: 제한이 없으면 비밀번호를 무한히 시도할 수 있다. 아무리 강한 해시를 써도 시도 횟수가 무제한이면 약한 비밀번호는 뚫린다.
- IP + 사용자 ID 조합으로 제한.
- 브루트포스 방어: 실패 N회 시 지수 백오프.

## CORS

- 명시적 origin 허용 목록 — 와일드카드(\`*\`) + 자격증명 동시 사용 금지.
  - 근거: CORS 스펙이 \`Access-Control-Allow-Origin: *\` 와 \`Allow-Credentials: true\` 동시 사용을 금지(브라우저가 거부). 또 \`*\` 는 어느 사이트든 cross-origin 요청 허용 — 자격증명 동반 공격에 노출.
- Preflight 캐시 시간(\`Access-Control-Max-Age\`)을 600초~86400초 범위로 설정.

## 시크릿 관리

- 시크릿은 **환경 변수** 또는 시크릿 매니저(AWS Secrets Manager, Vault)에서.
- 코드·로그·에러 스택에 시크릿 노출 금지.
  - 근거: 로그는 수집기·백업·서드파티 모니터링으로 복제된다. 한 번 찍힌 시크릿은 그 사본 전부에서 지워야 한다.
- 로테이션 주기를 정책화.

## OWASP Top 10 체크

- Broken Access Control — 객체 레벨 권한 체크.
- Cryptographic Failures — 전송/저장 암호화.
- Injection — 스키마 검증 + prepared statement.
- Insecure Design — 위협 모델링.
- SSRF — 아웃바운드 요청 URL 검증.

## AI 행동 규칙

- \`req.body.\` / \`req.params.\` / \`req.query.\` 가 DB 쿼리·파일경로·HTTP fetch URL에 *직접* 들어가는 코드 발견 시 즉시 검증/sanitize 추가.
- 새 엔드포인트 추가 시 — 인증 미들웨어 / 인가 가드 / Rate Limit 세 가지를 *명시적으로* 확인. 누락 시 즉시 추가.
- \`logger.info({ password, token, secret, ... })\` 같은 패턴 발견 시 즉시 redact(\`***\` 마스킹) 권고.
- \`fetch(req.body.url)\` 같이 사용자 입력 URL로 아웃바운드 요청 — **SSRF 위험**. URL 허용 목록 / 내부 IP 차단 필수.
  - 근거: 서버는 내부망에 접근할 수 있다. 공격자가 내부 주소를 넣으면 외부에서 못 닿는 메타데이터 서비스나 관리 API 를 서버를 통해 호출하게 된다.

## 패턴 (DO / DON'T)

### SQL Injection

\`\`\`ts
// DON'T — 문자열 결합
const rows = await db.query(\`SELECT * FROM users WHERE email = '\${email}'\`);

// DO — parameter binding
const rows = await db.query('SELECT id, email FROM users WHERE email = ?', [email]);
\`\`\`

### 동적 컬럼/정렬

\`\`\`ts
// DON'T — 입력을 그대로 ORDER BY에
db.query(\`SELECT * FROM users ORDER BY \${req.query.sort}\`);

// DO — 허용 목록 치환
const ALLOWED_SORT = { name: 'display_name', created: 'created_at' } as const;
const column = ALLOWED_SORT[req.query.sort] ?? 'id';
db.query(\`SELECT id, display_name FROM users ORDER BY \${column}\`);
\`\`\`

### 객체 레벨 권한 (IDOR)

\`\`\`ts
// DON'T — 인증만 하고 소유자 체크 없음
app.get('/orders/:id', auth, async (req, res) => {
  res.json(await orderRepo.findById(req.params.id));
});

// DO — 소유자·권한 검증
app.get('/orders/:id', auth, async (req, res) => {
  const order = await orderRepo.findById(req.params.id);
  authorize(req.user, 'order:read', order);
  res.json(toOrderResponse(order));
});
\`\`\`

### 기타 금지/권장

| DON'T | DO |
|-------|-----|
| 에러 메시지에 DB 스택트레이스 노출 | 코드(\`INTERNAL_ERROR\`)만 + 서버 로그 |
| 시크릿을 Git에 커밋 | 시크릿 매니저 + \`.gitignore\` + 스캐너 |
| CORS \`*\` + credentials | 명시적 origin 목록 |
| 인증 엔드포인트 Rate Limit 미적용 | IP+사용자ID 조합 제한 |

## 적용 범위와 경계

이 문서는 **애플리케이션 코드 레벨의 방어**만 다룬다. 네트워크·인프라 보안(WAF, VPC, 방화벽, 침입 탐지)은 다루지 않는다.

여기서 다루지 않는 것 → 토큰 수명과 인가 모델은 \`auth.md\`, 에러 응답에 무엇을 담을지는 \`error-handling.md\`, 로그 마스킹은 \`logging.md\`, 시크릿을 커밋하지 않는 절차는 \`git.md\`.

**이 문서는 보안 감사를 대체하지 않는다.** 체크리스트를 모두 통과해도 "보안 검토 완료"라고 보고하지 마라. 확인한 항목과 확인하지 못한 항목을 구분해서 말한다.

## 충돌 시 우선순위

전체 순서는 \`base.md\` 의 「충돌 시 우선순위」를 따른다. 이 문서에서 자주 부딪히는 경우만 적는다.

- **보안 vs 개발 편의** — 보안이 이긴다. 로컬에서 편하려고 CORS 를 \`*\` 로 열어두는 코드를 커밋하지 않는다.
- **보안 vs 성능** — 보안이 이긴다. 검증을 건너뛰어 얻는 지연 시간은 측정 가능하지만, 뚫렸을 때의 비용은 측정 불가다.
- **유저의 "일단 검증 빼고 돌려보자" vs 이 문서** — 유저 지시가 이기지만, 그 코드가 커밋·배포되지 않도록 임시임을 명시하고 되돌릴 지점을 남긴다.
- **판단이 갈릴 때** — 더 막는 쪽을 택한다. 막아서 생기는 비용은 되돌릴 수 있지만 뚫려서 생기는 비용은 못 되돌린다.

## 자가 점검

코드를 제출하기 전 확인한다. **하나라도 NO면 제출하지 않는다.**

- [ ] 모든 외부 입력이 스키마 검증을 거친다 — \`req.body\` 를 검증 없이 쓰지 않았다
- [ ] SQL 이 파라미터 바인딩을 쓴다 — 문자열 결합이 없다
- [ ] 동적 테이블·컬럼·정렬 키가 허용 목록으로 치환된다
- [ ] 새 엔드포인트에 인증·인가·Rate Limit 세 가지를 모두 확인했다
- [ ] 객체 레벨 권한을 확인한다 — ID 만 바꾸면 남의 리소스가 보이지 않는다
- [ ] CORS 가 명시적 origin 목록이다 — \`*\` 와 credentials 를 함께 쓰지 않았다
- [ ] 사용자 입력 URL 로 아웃바운드 요청을 보내지 않는다 (SSRF) — 보낸다면 허용 목록과 내부 IP 차단이 있다
- [ ] 시크릿이 코드·로그·에러 응답에 나오지 않는다
- [ ] 파일 업로드에 타입·크기·내용 검증이 있다
`;
